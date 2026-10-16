import {
  COLUMNS,
  COLUMN_MAP,
  criterionKey,
  formatCell,
  formatCriterion,
  isEmptyValue,
  type ColumnDef,
  type ColumnKey,
  type RunRow,
} from "./data"

export type Comparator =
  | "is"
  | "is_not"
  | "contains"
  | "not_contains"
  | "gt"
  | "lt"
  | "between"
  | "is_empty"
  | "is_not_empty"

export type Condition = {
  column: ColumnKey
  comparator: Comparator
  values: string[]
}

export type Filter = {
  id: string
  /** "search" filters match the text against every column. */
  kind: "column" | "search"
  column: ColumnKey
  comparator: Comparator
  values: string[]
  /**
   * Advanced filters: conditions 2–10, each joined to the previous one with and/or. The filter's
   * own column/comparator/values are the first condition. AND binds tighter than OR.
   */
  extra?: JoinedCondition[]
}

export type Join = "and" | "or"
export type JoinedCondition = Condition & { join: Join }

export const MAX_CONDITIONS = 10

/** All conditions of a column filter, first one included (its join is ignored). */
export function conditionsOf(f: Omit<Filter, "id">): JoinedCondition[] {
  const first: JoinedCondition = { column: f.column, comparator: f.comparator, values: f.values, join: "and" }
  return [first, ...(f.extra ?? [])]
}

/** Columns referenced by a filter (used to mark headers and hide partial filters). */
export function filterColumns(f: Filter): ColumnKey[] {
  return f.kind === "search" ? [] : conditionsOf(f).map((c) => c.column)
}

export const COMPARATORS: { value: Comparator; label: string; short: string; arity: "multi" | "one" | "two" | "none" }[] = [
  { value: "is", label: "equals", short: "is", arity: "multi" },
  { value: "is_not", label: "is not", short: "is not", arity: "multi" },
  { value: "contains", label: "contains", short: "contains", arity: "multi" },
  { value: "not_contains", label: "does not contain", short: "excludes", arity: "multi" },
  { value: "gt", label: "greater than", short: ">", arity: "one" },
  { value: "lt", label: "less than", short: "<", arity: "one" },
  { value: "between", label: "between", short: "between", arity: "two" },
  { value: "is_empty", label: "is empty", short: "is empty", arity: "none" },
  { value: "is_not_empty", label: "is not null", short: "is not empty", arity: "none" },
]

export const COMPARATOR_MAP = Object.fromEntries(COMPARATORS.map((c) => [c.value, c])) as Record<
  Comparator,
  (typeof COMPARATORS)[number]
>

export function isOrderable(col: ColumnDef) {
  return col.type !== "text" && col.type !== "category"
}

export function comparatorsFor(col: ColumnDef) {
  return COMPARATORS.filter((c) => {
    if (c.value === "gt" || c.value === "lt" || c.value === "between") return isOrderable(col)
    if (c.value === "contains" || c.value === "not_contains") return !isOrderable(col)
    return true
  })
}

function toComparable(col: ColumnDef, v: string): number {
  if (col.type === "date") return new Date(`${v.slice(0, 10)}T00:00:00Z`).getTime()
  return Number(v)
}

export function matchCondition(row: RunRow, cond: Condition): boolean {
  const col = COLUMN_MAP[cond.column]
  const raw = row[cond.column]
  const key = criterionKey(col, raw).toLowerCase()
  const values = cond.values.map((v) => v.toLowerCase())
  switch (cond.comparator) {
    case "is_empty":
      return isEmptyValue(raw)
    case "is_not_empty":
      return !isEmptyValue(raw)
    case "is":
      return values.length === 0 || values.includes(key)
    case "is_not":
      return !values.includes(key)
    case "contains": {
      const text = `${key} ${formatCell(col, raw).toLowerCase()}`
      return values.length === 0 || values.some((v) => text.includes(v))
    }
    case "not_contains": {
      const text = `${key} ${formatCell(col, raw).toLowerCase()}`
      return !values.some((v) => text.includes(v))
    }
    case "gt":
    case "lt":
    case "between": {
      if (isEmptyValue(raw)) return false
      const n = toComparable(col, String(raw))
      const [a, b] = cond.values.map((v) => toComparable(col, v))
      if (cond.comparator === "gt") return Number.isNaN(a) || n > a
      if (cond.comparator === "lt") return Number.isNaN(a) || n < a
      // Dates compare by day, so make the upper bound inclusive of the whole day.
      const upper = col.type === "date" && !Number.isNaN(b) ? b + 86_400_000 - 1 : b
      return (Number.isNaN(a) || n >= a) && (Number.isNaN(upper) || n <= upper)
    }
  }
}

export function matchSearch(row: RunRow, query: string): boolean {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean)
  if (!terms.length) return true
  const haystack = COLUMNS.map((c) => formatCell(c, row[c.key])).join(" ").toLowerCase()
  return terms.every((t) => haystack.includes(t))
}

export function matchFilter(row: RunRow, f: Omit<Filter, "id">): boolean {
  if (f.kind === "search") return matchSearch(row, f.values[0] ?? "")
  // Standard precedence: split on OR into groups of AND-ed conditions; any group may match.
  const groups: Condition[][] = [[]]
  conditionsOf(f).forEach((c, i) => {
    if (i > 0 && c.join === "or") groups.push([])
    groups[groups.length - 1].push(c)
  })
  return groups.some((group) => group.every((c) => matchCondition(row, c)))
}

export type MatchMode = "all" | "any"

/** Combine filters with AND ("all") or OR ("any"). No filters always matches. */
export function matchFilters(row: RunRow, filters: Omit<Filter, "id">[], mode: MatchMode): boolean {
  if (!filters.length) return true
  return mode === "all" ? filters.every((f) => matchFilter(row, f)) : filters.some((f) => matchFilter(row, f))
}

function describeCondition(c: Condition, full: boolean): string {
  const col = COLUMN_MAP[c.column]
  const cmp = COMPARATOR_MAP[c.comparator]
  const vals = c.values.map((v) => formatCriterion(col, v))
  if (cmp.arity === "none") return `${col.label} ${cmp.label}`
  if (cmp.arity === "two") return `${col.label} between ${vals[0] ?? "…"} and ${vals[1] ?? "…"}`
  if (cmp.arity === "one") return `${col.label} ${cmp.short} ${vals[0] ?? "…"}`
  if (c.comparator === "is") {
    if (full && vals.length > 1) return `${col.label} is any of: ${vals.join(", ")}`
    return `${col.label}: ${vals.join(", ")}`
  }
  if (full && vals.length > 1) return `${col.label} ${cmp.label} any of: ${vals.join(", ")}`
  return `${col.label} ${cmp.short} ${vals.join(", ")}`
}

export type ChipParts = {
  /** Column label (or "Search"). */
  label: string
  /** Operator phrase, e.g. "is", "is any of", "after". */
  operator: string
  /** Value excerpt; null when the comparator takes no value. */
  value: string | null
  /** Advanced filters: summary of the extra conditions, e.g. "and 2 more". */
  more?: string
}

function operatorPhrase(c: Condition): string {
  const col = COLUMN_MAP[c.column]
  const many = c.values.length > 1
  switch (c.comparator) {
    case "is":
      return many ? "is any of" : "is"
    case "is_not":
      return many ? "is none of" : "is not"
    case "contains":
      return many ? "contains any of" : "contains"
    case "not_contains":
      return "excludes"
    case "gt":
      return col.type === "date" ? "after" : "greater than"
    case "lt":
      return col.type === "date" ? "before" : "less than"
    case "between":
      return "between"
    case "is_empty":
      return "is empty"
    case "is_not_empty":
      return "is not empty"
  }
}

function valueExcerpt(c: Condition): string | null {
  const col = COLUMN_MAP[c.column]
  const arity = COMPARATOR_MAP[c.comparator].arity
  const vals = c.values.map((v) => formatCriterion(col, v))
  if (arity === "none") return null
  if (arity === "two") return `${vals[0] || "…"} – ${vals[1] || "…"}`
  return vals.join(", ") || "…"
}

/** Structured pieces for the segmented chip: [icon label] [operator] [value] [condition]. */
export function chipParts(f: Filter): ChipParts {
  if (f.kind === "search") return { label: "Search", operator: "contains", value: `“${f.values[0] ?? ""}”` }
  return {
    label: COLUMN_MAP[f.column].label,
    operator: operatorPhrase(f),
    value: valueExcerpt(f),
    more: moreLabel(f.extra),
  }
}

function moreLabel(extra: JoinedCondition[] | undefined): string | undefined {
  if (!extra?.length) return undefined
  const joins = new Set(extra.map((c) => c.join))
  const lead = joins.size === 1 ? [...joins][0] : "+"
  return `${lead} ${extra.length} more`
}

/** Full criteria summary for the chip tooltip, one clause per line. */
export function filterSummary(f: Filter): string[] {
  if (f.kind === "search") return [`Rows containing “${f.values[0] ?? ""}” in any column`]
  const lines = conditionsOf(f).map((c, i) => (i === 0 ? "" : `${c.join.toUpperCase()} `) + describeCondition(c, true))
  const joins = new Set((f.extra ?? []).map((c) => c.join))
  if (joins.size > 1) lines.push("(AND is evaluated before OR)")
  return lines
}

export function criteriaCount(f: Filter): number {
  return COMPARATOR_MAP[f.comparator].arity === "multi" ? f.values.length : 0
}

export function isFilterComplete(f: Omit<Filter, "id">): boolean {
  const complete = (c: Condition) => {
    const arity = COMPARATOR_MAP[c.comparator].arity
    if (arity === "none") return true
    if (arity === "two") return c.values.filter(Boolean).length >= 1
    return c.values.filter(Boolean).length > 0
  }
  return conditionsOf(f).every(complete)
}

let counter = 0
export function newFilterId() {
  counter += 1
  return `f${Date.now().toString(36)}${counter}`
}
