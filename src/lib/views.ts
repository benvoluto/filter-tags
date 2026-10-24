import type { SortRule } from "./sort"

import { COLUMN_MAP } from "./data"
import { filterSummary, type Filter, type MatchMode } from "./filters"

export type ViewFilter = Omit<Filter, "id">

/** A saved combination of filters, the sort, and match mode (search text is not part of a view). */
export type SavedView = {
  id: string
  name: string
  filters: ViewFilter[]
  /** The single sorted column, or null for unsorted. */
  sort: SortRule | null
  matchMode: MatchMode
}

const stripId = (f: Filter): ViewFilter => {
  const copy: Partial<Filter> = { ...f }
  delete copy.id
  return copy as ViewFilter
}

export function makeView(name: string, filters: Filter[], sort: SortRule | null, matchMode: MatchMode): SavedView {
  viewSeq += 1
  return { id: `view${viewSeq}`, name, filters: filters.map(stripId), sort: sort ? { ...sort } : null, matchMode }
}
let viewSeq = 0

/** One line per filter, joined the way the filters combine. */
export function viewFilterSummary(view: Pick<SavedView, "filters" | "matchMode">): string {
  const parts = view.filters.map((f) => filterSummary({ ...f, id: "" }).filter((l) => !l.startsWith("(")).join(" "))
  return parts.join(view.matchMode === "all" ? " · " : " OR ")
}

export function sortSummary(sort: SortRule | null): string {
  if (!sort) return "Unsorted"
  return `Sorted by ${COLUMN_MAP[sort.key].label} ${sort.dir === "asc" ? "↑ ascending" : "↓ descending"}`
}

/** True when the current table state is exactly what the view describes. */
export function viewMatchesState(view: SavedView, filters: Filter[], sort: SortRule | null, matchMode: MatchMode) {
  return (
    view.matchMode === matchMode &&
    JSON.stringify(view.sort) === JSON.stringify(sort) &&
    JSON.stringify(view.filters) === JSON.stringify(filters.map(stripId))
  )
}

/**
 * A short rule-made name, used when the model can't name a view: the first two filters' values
 * ("Failed · Epic"), or the sort if there are no filters.
 */
export function fallbackViewName(filters: ViewFilter[], sort: SortRule | null): string {
  const parts = filters.slice(0, 2).map((f) => {
    if (f.kind === "search") return `“${f.values[0] ?? ""}”`
    const label = COLUMN_MAP[f.column].label
    if (f.comparator === "is" || f.comparator === "equals") return f.values.length > 2 ? label : f.values.join("/")
    if (f.comparator === "is_not") return `Not ${f.values.slice(0, 2).join("/")}`
    return label
  })
  if (!parts.length && sort) parts.push(`By ${COLUMN_MAP[sort.key].label}`)
  const name = parts.join(" · ") || "View"
  return name.length > 30 ? `${name.slice(0, 29)}…` : name
}

/** `name`, or `name 2`, `name 3`… if a view already has it. */
export function uniqueViewName(name: string, views: SavedView[]): string {
  const taken = new Set(views.map((v) => v.name.toLowerCase()))
  if (!taken.has(name.toLowerCase())) return name
  let n = 2
  while (taken.has(`${name} ${n}`.toLowerCase())) n += 1
  return `${name} ${n}`
}
