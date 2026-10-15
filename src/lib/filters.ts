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
  /** When set, the filter reads "if <when> then <column comparator values>". */
  when?: Condition
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

export function matchFilter(row: RunRow, f: Filter): boolean {
  if (f.kind === "search") return matchSearch(row, f.values[0] ?? "")
  if (f.when && !matchCondition(row, f.when)) return true
  return matchCondition(row, f)
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

/** Short, single-line text for the chip (CSS truncates it further). */
export function chipLabel(f: Filter): string {
  if (f.kind === "search") return `Search: “${f.values[0] ?? ""}”`
  const main = describeCondition(f, false)
  return f.when ? `If ${describeCondition(f.when, false)} → ${main}` : main
}

/** Full criteria summary for the chip tooltip, one clause per line. */
export function filterSummary(f: Filter): string[] {
  if (f.kind === "search") return [`Rows containing “${f.values[0] ?? ""}” in any column`]
  const main = describeCondition(f, true)
  return f.when ? [`If ${describeCondition(f.when, true)}`, `then ${main}`] : [main]
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
  return complete(f) && (!f.when || complete(f.when))
}

let counter = 0
export function newFilterId() {
  counter += 1
  return `f${Date.now().toString(36)}${counter}`
}
