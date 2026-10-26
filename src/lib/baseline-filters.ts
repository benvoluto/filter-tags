// ───────────────────────────────────────────────────────────────────────────
// The filter model flow-studio-lite ships on `main` today, reproduced here so the redesign has a
// baseline to be compared against inside the same prototype.
//
// Source of the behaviour (VivaaHealth/flow-studio-lite @ main):
//   • src/ui/filter-popover.tsx — one chip per column, a popover holding a single Autocomplete
//     (or a text / date field); picking a value closes it; ✕ clears it.
//   • src/surfaces/build-indexes.tsx `matches()` and src/surfaces/human-tasks.tsx — every applied
//     chip must match (AND), each by case-insensitive **substring**, and the search box matches
//     when **any** field contains the query.
//
// So: one value per column, no operators, no multi-select, no advanced conditions, no match-any.
// Everything this file cannot express is the argument for the redesigned model in `filters.ts`.
// ───────────────────────────────────────────────────────────────────────────

import { COLUMNS, COLUMN_MAP, ROWS, criterionKey, formatCell, type ColumnKey, type RunRow } from "./data"

/**
 * The columns that get a chip. Six of the twelve: the category and text columns whose values an
 * Autocomplete can list. Run ID belongs to the search box; Duration, Records, Automation and
 * Errors need comparators this model has not got, and a substring match over a raw number would
 * be a filter that lies ("2" matching 2, 12, 204 and 1,250 alike).
 */
export const BASELINE_FILTER_COLUMNS: ColumnKey[] = ["flow", "customer", "status", "trigger", "ehr", "owner"]

/** The applied value per column; a column with no entry, or an empty one, is not filtering. */
export type BaselineFilterValues = Partial<Record<ColumnKey, string>>

/** The values the column's Autocomplete offers, as `FilterPopover`'s `options` prop is given. */
export function baselineOptions(column: ColumnKey): string[] {
  const col = COLUMN_MAP[column]
  const values = new Set<string>()
  for (const row of ROWS) {
    const key = criterionKey(col, row[column])
    if (key !== "") values.add(key)
  }
  return [...values].sort((a, b) => a.localeCompare(b))
}

/** The columns carrying a value, in the chip row's order. */
export function appliedBaselineColumns(values: BaselineFilterValues): ColumnKey[] {
  return BASELINE_FILTER_COLUMNS.filter((key) => (values[key] ?? "") !== "")
}

const includes = (haystack: string, needle: string) => haystack.toLowerCase().includes(needle.toLowerCase())

/**
 * One row against the chips and the search box, the way `main` combines them: every chip must
 * match by substring, and the query must appear in at least one cell.
 *
 * The haystack is the **formatted** cell text, so both variants search the same strings and the
 * only difference on this axis is the one that is real: `main` takes the query as a single
 * substring, where the redesign splits it on whitespace and requires every term.
 */
export function matchBaselineRow({
  row,
  values,
  query,
}: {
  row: RunRow
  values: BaselineFilterValues
  query: string
}): boolean {
  for (const column of BASELINE_FILTER_COLUMNS) {
    const value = values[column] ?? ""
    if (value === "") continue
    if (!includes(criterionKey(COLUMN_MAP[column], row[column]), value)) return false
  }
  const text = query.trim()
  if (text === "") return true
  return COLUMNS.some((col) => includes(formatCell(col, row[col.key]), text))
}

/** "Status: Failed · EHR: Epic", for a saved view's second line. */
export function baselineFilterSummary(values: BaselineFilterValues): string {
  const applied = appliedBaselineColumns(values)
  if (applied.length === 0) return "No filters"
  return applied.map((key) => `${COLUMN_MAP[key].label}: ${values[key]}`).join(" · ")
}
