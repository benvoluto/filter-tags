import type { SortRule } from "./sort"

import { baselineFilterSummary, type BaselineFilterValues } from "./baseline-filters"
import { COLUMN_MAP } from "./data"
import { sortSummary } from "./views"

/**
 * A saved view over the baseline filter row.
 *
 * Two differences from {@link import("./views").SavedView}, both following from what the baseline
 * model has:
 *   • No match mode. Every chip is AND-ed on `main`; there is nothing to save.
 *   • **Search text is part of the view.** In the redesign a query can be promoted to a filter
 *     chip, so a view can hold it as a filter and leaving search out costs nothing. Here there is
 *     no such promotion: a view that dropped the query could not express "failed Epic runs
 *     mentioning Cedar Ridge" at all.
 */
export type BaselineView = {
  id: string
  name: string
  values: BaselineFilterValues
  /** The single sorted column, or null for unsorted. */
  sort: SortRule | null
  query: string
}

let viewSeq = 0

export function makeBaselineView({
  name,
  values,
  sort,
  query,
}: {
  name: string
  values: BaselineFilterValues
  sort: SortRule | null
  query: string
}): BaselineView {
  viewSeq += 1
  return { id: `baseline-view${viewSeq}`, name, values: { ...values }, sort: sort ? { ...sort } : null, query }
}

/** The menu's second line: what is filtered, how it is sorted, and the query if there is one. */
export function describeBaselineView(view: BaselineView): string {
  const lines = [baselineFilterSummary(view.values), sortSummary(view.sort)]
  if (view.query.trim() !== "") lines.push(`Search: “${view.query.trim()}”`)
  return lines.join("\n")
}

/** Compare only the columns that carry a value, so {} and { flow: "" } are the same state. */
const appliedEntries = (values: BaselineFilterValues) =>
  Object.keys(COLUMN_MAP)
    .filter((key) => (values[key as keyof BaselineFilterValues] ?? "") !== "")
    .map((key) => `${key}=${values[key as keyof BaselineFilterValues]}`)
    .sort()
    .join("|")

/** True when the table is in exactly the state the view describes. */
export function baselineViewMatchesState(
  view: BaselineView,
  { values, sort, query }: { values: BaselineFilterValues; sort: SortRule | null; query: string }
) {
  return (
    appliedEntries(view.values) === appliedEntries(values) &&
    JSON.stringify(view.sort) === JSON.stringify(sort) &&
    view.query.trim() === query.trim()
  )
}
