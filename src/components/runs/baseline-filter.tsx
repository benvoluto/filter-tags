"use client"

// ───────────────────────────────────────────────────────────────────────────
// PORTED from VivaaHealth/flow-studio-lite @ main — src/ui/filter-popover.tsx.
//
// That component is the whole of today's filtering: a chip, and a popover holding one
// Autocomplete (or a plain text / date field). It is reproduced here so the "Views only" variant
// is a real baseline rather than a described one.
//
// Two mechanical differences, both so the comparison is about filtering and not about chrome:
//   • The chip is the synced staff `FilterChipAndPopover` instead of flow-studio-lite's local
//     `FilterChip` + `Popover` pair. Upstream is the same component (`FiltersV2/ChipAndPopover`),
//     and using it keeps every variant in this prototype drawing the identical chip.
//   • The heading reads "Flow" rather than "Flow Filter". The word adds nothing inside a panel
//     that opened from a chip saying Flow, and the redesigned editor beside it does not say it.
// The behaviour — one value, picking it closes the popover, ✕ clears — is unchanged.
// ───────────────────────────────────────────────────────────────────────────

import * as React from "react"
import { Autocomplete, Stack, TextField } from "@mui/material"

import { Text } from "common"
import { FilterChipAndPopover } from "@/vivaa/staff/components/FiltersV2/components/ChipAndPopover"
import { FILTER_HEIGHT, POPOVER_FIELD_MINIMUM_WIDTH } from "@/vivaa/staff/components/FiltersV2/constants"
import { baselineOptions } from "@/lib/baseline-filters"
import { COLUMN_MAP, type ColumnKey } from "@/lib/data"

/**
 * One column's filter: dashed chip with a `+` while empty, solid with the value in its blue box
 * once set. The popover holds a single Autocomplete over the column's distinct values; choosing
 * one applies it and closes. There is no confirm step and nothing to accumulate.
 */
export function BaselineFilter({
  column,
  value,
  onChange,
}: {
  column: ColumnKey
  value: string
  onChange: (value: string) => void
}) {
  const [isOpen, setIsOpen] = React.useState(false)
  const label = COLUMN_MAP[column].label
  const options = React.useMemo(() => baselineOptions(column), [column])

  return (
    <FilterChipAndPopover
      fieldLabel={label}
      selectedValue={value === "" ? undefined : value}
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      onDelete={value === "" ? undefined : () => onChange("")}
    >
      <Stack gap={1} sx={{ minWidth: POPOVER_FIELD_MINIMUM_WIDTH }}>
        <Text variant="body2" bold>
          {label}
        </Text>
        <Autocomplete
          options={options}
          value={value === "" ? null : value}
          onChange={(_, next) => {
            onChange(next ?? "")
            setIsOpen(false)
          }}
          renderInput={(params) => <TextField {...params} autoFocus placeholder={`Any ${label.toLowerCase()}`} />}
          slotProps={{ paper: { sx: { marginTop: 0.5 } } }}
          sx={{ [`& .MuiOutlinedInput-root`]: { height: FILTER_HEIGHT, paddingY: 0 } }}
        />
      </Stack>
    </FilterChipAndPopover>
  )
}
