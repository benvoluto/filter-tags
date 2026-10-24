import { COLUMNS, COLUMN_MAP, ROWS, distinctValues, formatCriterion, type ColumnDef, type ColumnKey } from "./data"
import { COMPARATOR_MAP, comparatorsFor, type Comparator, type Filter } from "./filters"
import type { SortRule } from "./sort"

/*
 * Natural-language → filters, for the "prompt" variant.
 *
 * The model never sees rows. It turns a sentence into the JSON below (its decoding is constrained
 * to this schema, so the shape is always valid), and everything that small models get wrong is
 * done here in code instead: matching typed values to the column's real values, date arithmetic,
 * duration units, and checking each operator is one the column supports.
 *
 * `parseWithRules` is the fallback when the model can't run (no WebGPU) or hasn't loaded yet.
 */

type FilterDraft = Omit<Filter, "id">

const OPERATORS = [
  "is",
  "is_not",
  "contains",
  "not_contains",
  "gt",
  "gte",
  "lt",
  "lte",
  "between",
  "is_empty",
  "is_not_empty",
] as const satisfies readonly Comparator[]

export type ModelOutput = {
  filters: { column: string; operator: string; values: string[] }[]
  sort: { column: string; direction: "asc" | "desc" }
  search: string
}

/** JSON Schema the model's output is constrained to (WebLLM `response_format`). */
export const MODEL_SCHEMA = JSON.stringify({
  type: "object",
  properties: {
    filters: {
      type: "array",
      maxItems: 6,
      items: {
        type: "object",
        properties: {
          column: { type: "string", enum: COLUMNS.map((c) => c.key) },
          operator: { type: "string", enum: OPERATORS },
          values: { type: "array", items: { type: "string" }, maxItems: 9 },
        },
        required: ["column", "operator", "values"],
      },
    },
    sort: {
      type: "object",
      properties: {
        column: { type: "string", enum: ["none", ...COLUMNS.map((c) => c.key)] },
        direction: { type: "string", enum: ["asc", "desc"] },
      },
      required: ["column", "direction"],
    },
    search: { type: "string" },
  },
  required: ["filters", "sort", "search"],
})

/**
 * "Today" for relative dates. The sample data is a fixed 9-day window, so the prototype anchors
 * relative dates to the newest run instead of the real clock (otherwise "last 3 days" finds nothing).
 */
export const DATA_TODAY = ROWS.reduce((max, r) => (r.started > max ? r.started : max), "").slice(0, 10)

const COLUMN_HINTS: Partial<Record<ColumnKey, string>> = {
  owner: 'person who created the run; "created by", "owned by", "mine" → owner',
  started: "when the run started",
  duration: "how long the run took",
  automationRate: "percent of the run that was automated, 0-100",
  errors: "number of errors in the run",
  records: "number of records processed",
  ehr: "electronic health record system",
}

/** The system prompt: columns, their types, and the values of the short columns. */
export function buildSystemPrompt(): string {
  const columns = COLUMNS.map((c) => {
    const values = c.type === "category" || c.key === "owner" ? ` values: ${distinctValues(c.key).join(" | ")}` : ""
    const hint = COLUMN_HINTS[c.key] ? ` (${COLUMN_HINTS[c.key]})` : ""
    return `- ${c.key} [${c.type}] "${c.label}"${hint}${values}`
  }).join("\n")
  return `You turn a request about a table of workflow runs into filters, as JSON.

Columns:
${columns}

Rules:
- Only add filters the request asks for. Use the column's listed values when they fit.
- Several values in one column go in one filter: {"column":"status","operator":"is","values":["Failed","Running"]}.
- "not"/"except"/"excluding" → is_not. "missing"/"no owner"/"unassigned" → is_empty.
- Numbers: gt, gte, lt, lte or between, values as plain numbers. Durations as "90s", "5m" or "1h".
- Dates: values "today", "yesterday", "days_ago:N" or YYYY-MM-DD. "last 3 days" → gte "days_ago:3". "since Oct 10" → gte "2026-10-10". Today is ${DATA_TODAY}.
- sort: "longest", "most errors", "newest" etc. set a column and direction; otherwise column "none".
- search: leftover words that are not a filter (e.g. an ID). Usually "".`
}

/** Worked examples, sent as prior turns: small models follow examples better than rules. */
export const FEW_SHOT: { user: string; output: ModelOutput }[] = [
  {
    user: "failed or cancelled epic runs with more than 3 errors, worst first",
    output: {
      filters: [
        { column: "status", operator: "is", values: ["Failed", "Cancelled"] },
        { column: "ehr", operator: "is", values: ["Epic"] },
        { column: "errors", operator: "gt", values: ["3"] },
      ],
      sort: { column: "errors", direction: "desc" },
      search: "",
    },
  },
  {
    user: "runs created by priya in the last 2 days that took over 5 minutes",
    output: {
      filters: [
        { column: "owner", operator: "is", values: ["Priya Shah"] },
        { column: "started", operator: "gte", values: ["days_ago:2"] },
        { column: "duration", operator: "gt", values: ["5m"] },
      ],
      sort: { column: "none", direction: "desc" },
      search: "",
    },
  },
]

// ─── Grounding: model output → filters the table understands ──────────────────────────────────

export type PromptResult = {
  filters: FilterDraft[]
  sort: SortRule | null
  /** Things the parser changed or dropped, shown to the user so a wrong reading is visible. */
  notes: string[]
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9%]+/g, " ").trim()

/** Same word, allowing for tense/plurals: "failing" ~ "failed", "cancelled" ~ "canceled". */
function wordsMatch(a: string, b: string) {
  if (a === b) return true
  if (a.length < 4 || b.length < 4) return false
  return a.slice(0, 4) === b.slice(0, 4) && Math.abs(a.length - b.length) <= 3
}

/**
 * The column values a typed value refers to. Exact match first, then values containing it
 * ("riverbend" → "Riverbend Health"), then word-level matches ("priya" → "Priya Shah").
 */
export function matchColumnValues(key: ColumnKey, raw: string): string[] {
  const q = norm(raw)
  if (!q) return []
  const values = distinctValues(key)
  const exact = values.filter((v) => norm(v) === q)
  if (exact.length) return exact
  const contained = values.filter((v) => norm(v).includes(q) || q.includes(norm(v)))
  if (contained.length) return contained
  const qWords = q.split(" ")
  return values.filter((v) => {
    const vWords = norm(v).split(" ")
    return qWords.every((w) => vWords.some((vw) => wordsMatch(w, vw)))
  })
}

function parseNumber(raw: string): number | null {
  const m = raw.trim().toLowerCase().replace(/,/g, "").match(/^(-?\d+(?:\.\d+)?)\s*(k)?%?$/)
  if (!m) return null
  return Number(m[1]) * (m[2] ? 1000 : 1)
}

/** "90s", "5m", "5 min", "1h", "1.5 hours", or a bare number of seconds. */
export function parseDuration(raw: string): number | null {
  const m = raw.trim().toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(s|sec|secs|seconds?|m|min|mins|minutes?|h|hr|hrs|hours?)?$/)
  if (!m) return null
  const n = Number(m[1])
  const unit = m[2]?.[0]
  return Math.round(unit === "h" ? n * 3600 : unit === "m" ? n * 60 : n)
}

function shiftDays(iso: string, days: number) {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

/** "today", "yesterday", "days_ago:N", "N days ago", or a date → YYYY-MM-DD. */
export function parseDateValue(raw: string): string | null {
  const v = raw.trim().toLowerCase()
  if (v === "today") return DATA_TODAY
  if (v === "yesterday") return shiftDays(DATA_TODAY, -1)
  const ago = v.match(/^(?:days_ago:\s*(\d+)|(\d+)\s*days?\s*ago)$/)
  if (ago) return shiftDays(DATA_TODAY, -Number(ago[1] ?? ago[2]))
  if (/^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10)
  // "Oct 10", "October 10, 2026": assume the data's year when none is given.
  const parsed = new Date(/\d{4}/.test(v) ? `${raw} UTC` : `${raw} ${DATA_TODAY.slice(0, 4)} UTC`)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10)
}

function parseTypedValue(col: ColumnDef, raw: string): string | null {
  switch (col.type) {
    case "number":
    case "percent": {
      const n = parseNumber(raw)
      return n === null ? null : String(n)
    }
    case "duration": {
      const n = parseDuration(raw)
      return n === null ? null : String(n)
    }
    case "date":
      return parseDateValue(raw)
    default:
      return raw.trim() || null
  }
}

/** One model filter → a table filter, or null (with a note saying why) if it can't be used. */
function groundFilter(raw: ModelOutput["filters"][number], notes: string[]): FilterDraft | null {
  const col = COLUMN_MAP[raw.column as ColumnKey]
  if (!col) return null
  let comparator = raw.operator as Comparator
  const allowed = new Set(comparatorsFor(col).map((c) => c.value))
  // Text operators on an ordered column (or vice versa) mean the model picked the wrong family.
  if (!allowed.has(comparator)) {
    if (comparator === "contains") comparator = "is"
    else if (comparator === "not_contains") comparator = "is_not"
    else {
      notes.push(`Ignored “${col.label} ${COMPARATOR_MAP[comparator]?.label ?? comparator}”, which that column doesn't support`)
      return null
    }
  }
  const arity = COMPARATOR_MAP[comparator].arity
  if (arity === "none") return { kind: "column", column: col.key, comparator, values: [] }

  const rawValues = raw.values.map((v) => v.trim()).filter(Boolean)
  if (!rawValues.length) return null

  if (col.type === "category" || col.type === "text") {
    if (comparator === "contains" || comparator === "not_contains") {
      // On a category, "contains riverbend" means the value it names: "is Riverbend Health".
      const hits = col.type === "category" ? rawValues.map((v) => matchColumnValues(col.key, v)) : []
      if (!hits.length || hits.some((h) => !h.length)) return { kind: "column", column: col.key, comparator, values: rawValues }
      comparator = comparator === "contains" ? "is" : "is_not"
    }
    // is / is_not: map each typed value to the column's real values.
    const matched = new Set<string>()
    const unmatched: string[] = []
    for (const v of rawValues) {
      const hits = matchColumnValues(col.key, v)
      if (hits.length) hits.forEach((h) => matched.add(h))
      else unmatched.push(v)
    }
    if (unmatched.length) {
      notes.push(`No ${col.label.toLowerCase()} matches ${unmatched.map((v) => `“${v}”`).join(", ")}`)
    }
    if (!matched.size) {
      // Nothing matched: fall back to a text match so the user sees the term and can fix it.
      return { kind: "column", column: col.key, comparator: comparator === "is_not" ? "not_contains" : "contains", values: unmatched }
    }
    return { kind: "column", column: col.key, comparator, values: [...matched] }
  }

  // Ordered columns: parse the values; "is" on a number is an exact match.
  const values = rawValues.map((v) => parseTypedValue(col, v))
  if (values.some((v) => v === null)) {
    notes.push(`Couldn't read ${rawValues.map((v) => `“${v}”`).join(", ")} as ${col.label.toLowerCase()}`)
    return null
  }
  const parsed = values as string[]
  if (arity === "one") return { kind: "column", column: col.key, comparator, values: parsed.slice(0, 1) }
  if (arity === "two") {
    const [a, b] = parsed
    return { kind: "column", column: col.key, comparator, values: b === undefined ? [a] : [a, b] }
  }
  return { kind: "column", column: col.key, comparator, values: parsed }
}

/** Filters on the same column with the same operator collapse into one (values unioned). */
function mergeFilters(filters: FilterDraft[]): FilterDraft[] {
  const out: FilterDraft[] = []
  for (const f of filters) {
    const same = out.find((o) => o.kind === "column" && o.column === f.column && o.comparator === f.comparator)
    if (same && COMPARATOR_MAP[f.comparator].arity === "multi") {
      same.values = [...new Set([...same.values, ...f.values])]
    } else {
      out.push(f)
    }
  }
  return out
}

/** Model output → filters + sort, with every value checked against the data. */
export function groundModelOutput(output: ModelOutput): PromptResult {
  const notes: string[] = []
  const filters = mergeFilters(output.filters.map((f) => groundFilter(f, notes)).filter((f): f is FilterDraft => f !== null))
  const search = output.search?.trim()
  if (search) filters.push({ kind: "search", column: "runId", comparator: "contains", values: [search] })
  const sortCol = COLUMN_MAP[output.sort?.column as ColumnKey]
  const sort = sortCol ? { key: sortCol.key, dir: output.sort.direction === "asc" ? ("asc" as const) : ("desc" as const) } : null
  return { filters, sort, notes }
}

// ─── Rule-based fallback ──────────────────────────────────────────────────────────────────────

/** Alternative words for status values. */
const STATUS_SYNONYMS: Record<string, string[]> = {
  Failed: ["failed", "failing", "failures", "fail"],
  Completed: ["completed", "complete", "succeeded", "successful", "done"],
  Running: ["running", "in progress", "active"],
  Cancelled: ["cancelled", "canceled"],
  "Needs Review": ["needs review", "review"],
}

const NUMBER_COLUMNS: [RegExp, ColumnKey][] = [
  [/^errors?/, "errors"],
  [/^records?/, "records"],
  [/^(%|percent|automat)/, "automationRate"],
  [/^(s|sec|secs|seconds?|m|min|mins|minutes?|h|hrs?|hours?)\b/, "duration"],
]

const COMPARE_WORDS: [RegExp, Comparator][] = [
  [/^(more than|over|greater than|above|longer than)$/, "gt"],
  [/^at least$/, "gte"],
  [/^(less than|fewer than|under|below|shorter than)$/, "lt"],
  [/^at most$/, "lte"],
]

/**
 * A deliberately simple parser for when the model isn't available: column values named in the
 * text, "more than N errors" style comparisons, a few relative dates and sort words. Anything it
 * doesn't recognise is left out rather than guessed.
 */
export function parseWithRules(text: string): PromptResult {
  const symbols = text.replace(/n['’]t\b/gi, " not").replace(/>=/g, " at least ").replace(/<=/g, " at most ").replace(/>/g, " more than ").replace(/</g, " less than ")
  const t = ` ${norm(symbols)} `
  const lower = ` ${text.toLowerCase()} `
  const filters: FilterDraft[] = []
  const negated = (phrase: string) => new RegExp(`(not|except|excluding|without|no) (\\w+ )?${phrase}`).test(t)

  // Status words
  const statuses = Object.entries(STATUS_SYNONYMS).filter(([, words]) => words.some((w) => t.includes(` ${w} `)))
  if (statuses.length) {
    const neg = statuses.filter(([, words]) => words.some((w) => negated(w))).map(([s]) => s)
    const pos = statuses.map(([s]) => s).filter((s) => !neg.includes(s))
    if (pos.length) filters.push({ kind: "column", column: "status", comparator: "is", values: pos })
    if (neg.length) filters.push({ kind: "column", column: "status", comparator: "is_not", values: neg })
  }

  // Category / owner values named in the text. Customers and owners also by their first word
  // ("riverbend", "priya"), which is distinctive for those two columns.
  for (const col of COLUMNS) {
    if (col.key === "status" || (col.type !== "category" && col.key !== "owner")) continue
    const byFirstWord = col.key === "owner" || col.key === "customer"
    const named = (v: string) => (byFirstWord && !t.includes(` ${norm(v)} `) ? norm(v).split(" ")[0] : norm(v))
    const hits = distinctValues(col.key).filter((v) => t.includes(` ${named(v)} `))
    if (hits.length) {
      const neg = hits.filter((v) => negated(named(v)))
      const pos = hits.filter((v) => !neg.includes(v))
      if (pos.length) filters.push({ kind: "column", column: col.key, comparator: "is", values: pos })
      if (neg.length) filters.push({ kind: "column", column: col.key, comparator: "is_not", values: neg })
    }
  }
  if (/\b(no owner|unassigned|without an owner)\b/.test(lower)) {
    filters.push({ kind: "column", column: "owner", comparator: "is_empty", values: [] })
  }

  // "more than 3 errors", "under 5 minutes", "at least 90%"
  const cmp = /(more than|over|greater than|above|longer than|at least|at most|less than|fewer than|under|below|shorter than) (\d+(?:\.\d+)?) ?(\S+)?/g
  for (const m of t.matchAll(cmp)) {
    const comparator = COMPARE_WORDS.find(([re]) => re.test(m[1]))?.[1]
    const unit = m[3] ?? ""
    const column = NUMBER_COLUMNS.find(([re]) => re.test(unit))?.[1]
    if (!comparator || !column) continue
    const value = column === "duration" ? parseDuration(`${m[2]}${unit}`) : Number(m[2])
    if (value === null) continue
    filters.push({ kind: "column", column, comparator, values: [String(value)] })
  }

  // Relative dates
  const lastN = t.match(/ (?:last|past) (\d+) days? /)
  if (lastN) filters.push({ kind: "column", column: "started", comparator: "gte", values: [shiftDays(DATA_TODAY, -Number(lastN[1]))] })
  else if (t.includes(" today ")) filters.push({ kind: "column", column: "started", comparator: "gte", values: [DATA_TODAY] })
  else if (t.includes(" since yesterday ")) filters.push({ kind: "column", column: "started", comparator: "gte", values: [shiftDays(DATA_TODAY, -1)] })
  else if (t.includes(" yesterday ")) {
    const y = shiftDays(DATA_TODAY, -1)
    filters.push({ kind: "column", column: "started", comparator: "between", values: [y, y] })
  } else if (/ (this|past|last) week /.test(t)) {
    filters.push({ kind: "column", column: "started", comparator: "gte", values: [shiftDays(DATA_TODAY, -6)] })
  }

  // Sort words
  let sort: SortRule | null = null
  if (/\b(longest|slowest)\b/.test(lower)) sort = { key: "duration", dir: "desc" }
  else if (/\b(shortest|fastest|quickest)\b/.test(lower)) sort = { key: "duration", dir: "asc" }
  else if (/\b(most errors|worst)\b/.test(lower)) sort = { key: "errors", dir: "desc" }
  else if (/\b(most records|biggest|largest)\b/.test(lower)) sort = { key: "records", dir: "desc" }
  else if (/\b(oldest|earliest)\b/.test(lower)) sort = { key: "started", dir: "asc" }
  else if (/\b(newest|latest|most recent)\b/.test(lower)) sort = { key: "started", dir: "desc" }

  // A bare run ID is a search.
  const runId = text.match(/\bRUN-?\d+\b/i)
  if (runId) filters.push({ kind: "search", column: "runId", comparator: "contains", values: [runId[0]] })

  const notes = filters.length || sort ? [] : ["Nothing recognisable as a filter"]
  return { filters: mergeFilters(filters), sort, notes }
}

/** A one-line reading of what was applied, e.g. "Status is Failed · Errors > 3 · sorted by Errors ↓". */
export function describeResult(result: PromptResult): string {
  const parts = result.filters.map((f) => {
    if (f.kind === "search") return `contains “${f.values[0]}”`
    const col = COLUMN_MAP[f.column]
    const cmp = COMPARATOR_MAP[f.comparator]
    const vals = f.values.map((v) => formatCriterion(col, v))
    if (cmp.arity === "none") return `${col.label} ${cmp.label}`
    if (cmp.arity === "two") return `${col.label} between ${vals[0]} and ${vals[1] ?? "…"}`
    return `${col.label} ${cmp.short} ${vals.join(", ")}`
  })
  if (result.sort) parts.push(`sorted by ${COLUMN_MAP[result.sort.key].label} ${result.sort.dir === "asc" ? "↑" : "↓"}`)
  return parts.join(" · ")
}
