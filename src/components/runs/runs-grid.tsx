"use client"

// ───────────────────────────────────────────────────────────────────────────
// What every variant's table has in common: the grid's shape, its cells, its sorting and its empty
// state. Only the filter row differs between variants, so only the filter row is written twice —
// the alternative is a second 50-row table that drifts from this one and makes the comparison
// about the table instead of about the filters.
// ───────────────────────────────────────────────────────────────────────────

import * as React from "react"
import { Button, Link } from "@mui/material"
import { type GridSortModel } from "@mui/x-data-grid"

import { NoRecordsOverlay, Tag, type TagColor, Text, colors } from "common"
import { COLUMN_MAP, formatCell, isEmptyValue, type ColumnKey, type RunRow } from "@/lib/data"
import type { SortRule } from "@/lib/sort"

/** Status → staff `Tag` colour, following FLOW_RUN_TAG_PROPS (web/staff/…/Flows/Runs/Run/Status.tsx). */
const STATUS_TAG_COLOR: Record<string, TagColor> = {
  Completed: "success",
  Failed: "error",
  "Needs Review": "warning",
  Running: "primary",
  Cancelled: "error",
}

/** Columns rendered as entity links (the theme's MuiDataGrid cell link style: ink, blue on hover). */
const LINK_COLUMNS = new Set<ColumnKey>(["runId", "customer", "owner"])

/** Page sizes the MIT grid allows (staff offers 250 and 500 too; the MIT grid caps pages at 100). */
export const PAGE_SIZE_OPTIONS = [5, 25, 50, 100]

export const DEFAULT_SORT: GridSortModel = [{ field: "started", sort: "desc" }]

export function toSortRule(sortModel: GridSortModel): SortRule | null {
  const [first] = sortModel
  return first?.sort ? { key: first.field as ColumnKey, dir: first.sort } : null
}

export function toSortModel(sort: SortRule | null): GridSortModel {
  return sort ? [{ field: sort.key, sort: sort.dir }] : []
}

export function compareRows(a: RunRow, b: RunRow, sort: SortRule | null) {
  if (!sort) return 0
  const av = a[sort.key]
  const bv = b[sort.key]
  // Empty values always sink to the bottom regardless of direction.
  if (isEmptyValue(av) && isEmptyValue(bv)) return 0
  if (isEmptyValue(av)) return 1
  if (isEmptyValue(bv)) return -1
  const cmp = typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv))
  return sort.dir === "asc" ? cmp : -cmp
}

/** Lets the grid's empty overlay (a slot component) reach the page's reset. */
export const ResetContext = React.createContext<(() => void) | null>(null)

export function RunsNoRowsOverlay() {
  const reset = React.useContext(ResetContext)
  return (
    <NoRecordsOverlay
      customMessage={{
        title: "No runs match these filters",
        action: reset ? (
          <Button variant="outlined" onClick={reset}>
            Clear search and filters
          </Button>
        ) : undefined,
      }}
    />
  )
}

/** One cell: staff `Tag` for status, entity links, error counts in the error colour, — for empty. */
export function RunCell({ column, row }: { column: ColumnKey; row: RunRow }) {
  const col = COLUMN_MAP[column]
  const value = row[column]
  if (isEmptyValue(value)) {
    return (
      <Text variant="body2" color={colors.content.dark} component="span">
        —
      </Text>
    )
  }
  if (column === "status") {
    return <Tag color={STATUS_TAG_COLOR[value as string] ?? "default"}>{value as string}</Tag>
  }
  if (column === "errors" && (value as number) > 0) {
    return (
      <Text variant="body2" color="error" bold component="span">
        {formatCell(col, value)}
      </Text>
    )
  }
  if (LINK_COLUMNS.has(column)) {
    return (
      <Link href="#" underline="hover" onClick={(e) => e.preventDefault()}>
        {formatCell(col, value)}
      </Link>
    )
  }
  return (
    <Text variant="body2" component="span">
      {formatCell(col, value)}
    </Text>
  )
}
