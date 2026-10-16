import type { SortRule } from "@/components/runs/column-header"

import { COLUMN_MAP } from "./data"
import { filterSummary, type Filter, type MatchMode } from "./filters"

export type ViewFilter = Omit<Filter, "id">

/** A saved combination of filters, sorts, and match mode (search text is not part of a view). */
export type SavedView = {
  id: string
  name: string
  filters: ViewFilter[]
  sort: SortRule[]
  matchMode: MatchMode
}

const stripId = (f: Filter): ViewFilter => {
  const copy: Partial<Filter> = { ...f }
  delete copy.id
  return copy as ViewFilter
}

export function makeView(name: string, filters: Filter[], sort: SortRule[], matchMode: MatchMode): SavedView {
  viewSeq += 1
  return { id: `view${viewSeq}`, name, filters: filters.map(stripId), sort: [...sort], matchMode }
}
let viewSeq = 0

/** One line per filter, joined the way the filters combine. */
export function viewFilterSummary(view: Pick<SavedView, "filters" | "matchMode">): string {
  const parts = view.filters.map((f) => filterSummary({ ...f, id: "" }).filter((l) => !l.startsWith("(")).join(" "))
  return parts.join(view.matchMode === "all" ? " · " : " OR ")
}

export function sortSummary(sort: SortRule[]): string {
  if (!sort.length) return "Unsorted"
  return `Sorted by ${sort.map((s) => `${COLUMN_MAP[s.key].label} ${s.dir === "asc" ? "↑" : "↓"}`).join(", ")}`
}

/** True when the current table state is exactly what the view describes. */
export function viewMatchesState(view: SavedView, filters: Filter[], sort: SortRule[], matchMode: MatchMode) {
  return (
    view.matchMode === matchMode &&
    JSON.stringify(view.sort) === JSON.stringify(sort) &&
    JSON.stringify(view.filters) === JSON.stringify(filters.map(stripId))
  )
}
