"use client"

import * as React from "react"
import Chip from "@mui/material/Chip"
import Divider from "@mui/material/Divider"
import Stack from "@mui/material/Stack"
import Tooltip from "@mui/material/Tooltip"
import Typography from "@mui/material/Typography"

import { COLUMN_ICONS, SEARCH_ICON } from "@/lib/column-icons"
import { chipParts, filterSummary, type Filter } from "@/lib/filters"
import { FilterEditor, type FilterDraft } from "./filter-editor"
import { FilterPopover } from "./filter-popover"

/**
 * Segmented filter chip: [icon type] | operator | value | and N more | ×.
 * Stock MUI Chip (variant "filter" in the theme); clicking it opens the editor.
 */
export function FilterChip({
  filter,
  onChange,
  onRemove,
}: {
  filter: Filter
  onChange: (draft: FilterDraft) => void
  onRemove: () => void
}) {
  const [anchor, setAnchor] = React.useState<HTMLElement | null>(null)
  const parts = chipParts(filter)
  const Icon = filter.kind === "search" ? SEARCH_ICON : COLUMN_ICONS[filter.column]
  const summary = [...filterSummary(filter), "Click to edit"].join("\n")

  return (
    <>
      <Tooltip title={summary} placement="bottom">
        <Chip
          variant="filter"
          icon={<Icon />}
          aria-label={`${filterSummary(filter).join(" ")}. Click to edit`}
          onClick={(e) => setAnchor(e.currentTarget)}
          onDelete={onRemove}
          label={
            <Stack direction="row" spacing={1} divider={<Divider orientation="vertical" flexItem />}>
              <Typography variant="subtitle2" noWrap>
                {parts.label}
              </Typography>
              <Typography variant="body2" color="text.secondary" noWrap>
                {parts.operator}
              </Typography>
              {parts.value !== null ? (
                <Typography variant="subtitle2" noWrap>
                  {parts.value}
                </Typography>
              ) : null}
              {parts.more ? (
                <Typography variant="body2" color="text.secondary" noWrap>
                  {parts.more}
                </Typography>
              ) : null}
            </Stack>
          }
        />
      </Tooltip>
      <FilterPopover open={Boolean(anchor)} anchorEl={anchor} onClose={() => setAnchor(null)}>
        <FilterEditor
          initial={filter}
          onCancel={() => setAnchor(null)}
          onSubmit={(draft) => {
            onChange(draft)
            setAnchor(null)
          }}
        />
      </FilterPopover>
    </>
  )
}
