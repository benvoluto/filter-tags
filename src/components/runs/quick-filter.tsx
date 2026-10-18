"use client"

import * as React from "react"
import Button from "@mui/material/Button"
import AddIcon from "@mui/icons-material/Add"

import { COLUMN_ICONS } from "@/lib/column-icons"
import { COLUMN_MAP, type ColumnKey } from "@/lib/data"
import { FilterEditor, type FilterDraft } from "./filter-editor"
import { FilterPopover } from "./filter-popover"

/** A partial filter: column chosen, criteria pending. Dashed button (theme variant) + editor popover. */
export function QuickFilter({ column, onAdd }: { column: ColumnKey; onAdd: (draft: FilterDraft) => void }) {
  const [anchor, setAnchor] = React.useState<HTMLElement | null>(null)
  const Icon = COLUMN_ICONS[column]
  const label = COLUMN_MAP[column].label
  return (
    <>
      <Button variant="dashed" startIcon={<AddIcon />} endIcon={<Icon />} aria-label={`Filter by ${label}`} onClick={(e) => setAnchor(e.currentTarget)}>
        {label}
      </Button>
      <FilterPopover open={Boolean(anchor)} anchorEl={anchor} onClose={() => setAnchor(null)}>
        <FilterEditor
          column={column}
          onCancel={() => setAnchor(null)}
          onSubmit={(draft) => {
            onAdd(draft)
            setAnchor(null)
          }}
        />
      </FilterPopover>
    </>
  )
}
