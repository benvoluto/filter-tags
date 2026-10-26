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

/** The views menu's second line: what is filtered, how it is sorted, and the match mode. */
export function describeView(view: SavedView): string {
  return `${viewFilterSummary(view)}\n${sortSummary(view.sort)}${view.matchMode === "any" ? " · match any filter" : ""}`
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
