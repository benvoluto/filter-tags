"use client"

import * as React from "react"
import { Box, Tooltip } from "@mui/material"

import { FilterChipAndPopover } from "@/vivaa/staff/components/FiltersV2/components/ChipAndPopover"
import { chipParts, filterSummary, type Filter } from "@/lib/filters"
import { FilterEditor, type FilterDraft } from "./filter-editor"

/** Widest the value excerpt may get before it ellipsizes (the spec's ~200px chip budget). */
const VALUE_MAX_WIDTH = 200

/**
 * An applied filter: staff's `FilterChipAndPopover` (solid border, bold column label, the value in
 * its blue box, ✕ to remove), opening the filter editor in the same popover.
 *
 * Additions on top of staff, none of which touch the synced component:
 * - The value box carries the operator when it isn't plain "is" (e.g. "is not Failed",
 *   "> 5m"), and "+ 2 more" for advanced filters.
 * - Long values ellipsize at {@link VALUE_MAX_WIDTH} (staff's chip grows without limit).
 * - A tooltip with the full criteria, hidden while the editor is open.
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
  const [isOpen, setIsOpen] = React.useState(false)
  const [isTooltipOpen, setIsTooltipOpen] = React.useState(false)
  const parts = chipParts(filter)
  const summary = filterSummary(filter).join("\n")

  return (
    <Tooltip
      title={<Box sx={{ whiteSpace: "pre-line" }}>{summary}</Box>}
      open={isTooltipOpen && !isOpen}
      onOpen={() => setIsTooltipOpen(true)}
      onClose={() => setIsTooltipOpen(false)}
      placement="bottom-start"
    >
      <Box component="span" sx={{ display: "inline-flex", maxWidth: "100%" }}>
        <FilterChipAndPopover
          fieldLabel={parts.label}
          selectedValue={
            <Box
              component="span"
              sx={{
                display: "inline-block",
                maxWidth: VALUE_MAX_WIDTH,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                verticalAlign: "bottom",
              }}
            >
              {chipValueText(filter, parts)}
            </Box>
          }
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          onDelete={onRemove}
        >
          <FilterEditor
            initial={filter}
            onCancel={() => setIsOpen(false)}
            onSubmit={(draft) => {
              onChange(draft)
              setIsOpen(false)
            }}
          />
        </FilterChipAndPopover>
      </Box>
    </Tooltip>
  )
}

/** "Completed, Failed" for plain equality (staff's own format); otherwise the operator leads. */
function chipValueText(filter: Filter, parts: ReturnType<typeof chipParts>): string {
  const plain = filter.kind === "search" || parts.operator === "is" || parts.operator === "is any of"
  return [plain ? null : parts.operator, parts.value, parts.more].filter(Boolean).join(" ")
}
