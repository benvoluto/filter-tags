"use client"

import * as React from "react"
import IconButton from "@mui/material/IconButton"
import Stack from "@mui/material/Stack"
import TableCell from "@mui/material/TableCell"
import TableSortLabel from "@mui/material/TableSortLabel"
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined"

import type { ColumnDef } from "@/lib/data"
import type { SortDir } from "@/lib/sort"
import { FilterEditor, type FilterDraft } from "./filter-editor"
import { FilterPopover } from "./filter-popover"

/**
 * Header cell: TableSortLabel (click cycles ascending → descending → off) and a filter button.
 * The theme reveals the filter button on hover; a filtered column keeps it visible (color="primary").
 */
export function ColumnHeader({
  column,
  sortDir,
  filtered,
  onSort,
  onAddFilter,
}: {
  column: ColumnDef
  sortDir?: SortDir
  filtered: boolean
  onSort: (dir: SortDir | null) => void
  onAddFilter: (draft: FilterDraft) => void
}) {
  const [cell, setCell] = React.useState<HTMLTableCellElement | null>(null)
  const [open, setOpen] = React.useState(false)
  return (
    <TableCell ref={setCell} align={column.align ?? "left"} sortDirection={sortDir ?? false}>
      <Stack direction="row" spacing={0.5}>
        <TableSortLabel
          active={Boolean(sortDir)}
          direction={sortDir ?? "asc"}
          onClick={() => onSort(!sortDir ? "asc" : sortDir === "asc" ? "desc" : null)}
          title="Click to sort (ascending, descending, off)"
        >
          {column.label}
        </TableSortLabel>
        <IconButton aria-label={`Filter by ${column.label}`} color={filtered ? "primary" : "default"} onClick={() => setOpen(true)}>
          <FilterAltOutlinedIcon />
        </IconButton>
      </Stack>
      <FilterPopover open={open} anchorEl={cell} onClose={() => setOpen(false)}>
        <FilterEditor
          column={column.key}
          onCancel={() => setOpen(false)}
          onSubmit={(draft) => {
            onAddFilter(draft)
            setOpen(false)
          }}
        />
      </FilterPopover>
    </TableCell>
  )
}
