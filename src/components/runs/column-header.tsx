"use client"

import * as React from "react"
import { IconButton, Stack, Tooltip } from "@mui/material"
import { gridClasses } from "@mui/x-data-grid"
import { FunnelSimpleIcon } from "@phosphor-icons/react"

import { colors } from "common"
import type { ColumnDef } from "@/lib/data"

/**
 * `renderHeader` content for a NotableDataGrid column: the title (with the grid's own
 * `columnHeaderTitle` class, so NotableDataGrid's bold blue[5] header style applies unchanged) and
 * a filter button. Sorting stays the grid's own: click the header, arrow on hover.
 *
 * The button is revealed on header hover or keyboard focus and stays visible (primary) while the
 * column is filtered. Its click must not reach the header, which would sort.
 */
export function ColumnHeader({
  column,
  isFiltered,
  onOpenFilter,
}: {
  column: ColumnDef
  isFiltered: boolean
  onOpenFilter: (headerElement: Element) => void
}) {
  return (
    <Stack direction="row" alignItems="center" gap={0.25} sx={{ minWidth: 0 }}>
      <span className={gridClasses.columnHeaderTitle}>{column.label}</span>
      <Tooltip title={`Filter by ${column.label}`}>
        <IconButton
          size="small"
          aria-label={`Filter by ${column.label}`}
          color={isFiltered ? "primary" : "default"}
          onClick={(event) => {
            event.stopPropagation()
            const header = event.currentTarget.closest(`.${gridClasses.columnHeader}`)
            onOpenFilter(header ?? event.currentTarget)
          }}
          onKeyDown={(event) => event.stopPropagation()}
          sx={{
            padding: "4px",
            opacity: isFiltered ? 1 : 0,
            transition: "opacity .15s",
            color: isFiltered ? undefined : colors.extended.gray["45"],
            [`.${gridClasses.columnHeader}:hover &, &:focus-visible`]: { opacity: 1 },
          }}
        >
          <FunnelSimpleIcon size={14} weight={isFiltered ? "bold" : "regular"} />
        </IconButton>
      </Tooltip>
    </Stack>
  )
}
