import type { ColumnKey } from "./data"

export type SortDir = "asc" | "desc"
/** The table's single sort: one column, ascending or descending. */
export type SortRule = { key: ColumnKey; dir: SortDir }
