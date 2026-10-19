"use client"

import * as React from "react"

import { FilterChipAndPopover } from "@/vivaa/staff/components/FiltersV2/components/ChipAndPopover"
import { COLUMN_MAP, type ColumnKey } from "@/lib/data"
import { FilterEditor, type FilterDraft } from "./filter-editor"

/**
 * A partial filter (column chosen, criteria pending) is exactly staff's empty filter chip: dashed
 * border, `+` icon, the column name. Staff's flow runs page shows "Run Status", "Version State"…
 * this way before anything is applied.
 */
export function QuickFilter({ column, onAdd }: { column: ColumnKey; onAdd: (draft: FilterDraft) => void }) {
  const [isOpen, setIsOpen] = React.useState(false)
  return (
    <FilterChipAndPopover
      fieldLabel={COLUMN_MAP[column].label}
      selectedValue={undefined}
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      onDelete={undefined}
    >
      <FilterEditor
        column={column}
        onCancel={() => setIsOpen(false)}
        onSubmit={(draft) => {
          onAdd(draft)
          setIsOpen(false)
        }}
      />
    </FilterChipAndPopover>
  )
}

/**
 * "Add filter": the same empty-state chip, opening the editor at the column picker. `isOpen` is
 * lifted so the F shortcut can open it.
 */
export function AddFilter({
  isOpen,
  setIsOpen,
  onAdd,
}: {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  onAdd: (draft: FilterDraft) => void
}) {
  return (
    <FilterChipAndPopover
      fieldLabel="Add filter"
      selectedValue={undefined}
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      onDelete={undefined}
    >
      <FilterEditor
        onCancel={() => setIsOpen(false)}
        onSubmit={(draft) => {
          onAdd(draft)
          setIsOpen(false)
        }}
      />
    </FilterChipAndPopover>
  )
}
