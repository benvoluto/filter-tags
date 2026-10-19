import { type SxProps, type Theme } from "@mui/material"

import { colors } from "common"
import { FILTER_HEIGHT } from "@/vivaa/staff/components/FiltersV2/constants"

/** Shared by the filter editor and its criteria combo box. */

/** One-line list rows at the panel's 14px (staff's small-field size). */
export const OPTION_TEXT = { variant: "body2" as const, noWrap: true }

/**
 * Scrolling value/column lists bleed to the popover's edges (-16px, its padding), ruled top and
 * bottom, so rows highlight edge to edge like a menu. `&&` because the lists sit in a MUI Stack,
 * whose spacing rule (`> :not(style) ~ :not(style) { margin: 0 }`) otherwise wins and leaves the
 * list inset — which is what pushed the rows in.
 */
export const LIST_SX: SxProps<Theme> = {
  maxHeight: 260,
  minHeight: 0,
  overflowY: "auto",
  "&&": { marginLeft: -2, marginRight: -2 },
  paddingY: 0.5,
  borderTop: `1px solid ${colors.border.light}`,
  borderBottom: `1px solid ${colors.border.light}`,
}

export const NO_ROWS = "No rows match this with the current filters"
export const NO_ROWS_COLUMN = "Every value here would return no rows with the current filters"

/**
 * Every field in the filter panel is staff's FILTER_HEIGHT (32px): selects, text fields and
 * autocompletes alike. Staff's theme gives them three different heights (`MuiSelect` pads the select
 * to 2px → 24px; `MuiAutocomplete` sets its own input height → 39px; small inputs → 32px), which
 * reads as a broken row when they sit side by side. `&&` doubles the root class so these beat the
 * theme's slot overrides without `!important`. Multi-value autocompletes may still grow when their
 * chips wrap (min-height, not height).
 */
export const FIELD_SX: SxProps<Theme> = {
  "&& .MuiInputBase-root": { minHeight: FILTER_HEIGHT, paddingTop: 0, paddingBottom: 0 },
  "&& .MuiInputBase-root:not(.MuiAutocomplete-inputRoot)": { height: FILTER_HEIGHT },
  // MUI's small autocomplete pads root 6px / input 2.5px, and staff's theme sets its input to
  // 1.5625em; these selectors are one class/element more specific than both.
  "&& .MuiAutocomplete-inputRoot.MuiInputBase-sizeSmall": { paddingTop: "3px", paddingBottom: "3px" },
  "&& .MuiAutocomplete-inputRoot input.MuiAutocomplete-input": { paddingTop: 0, paddingBottom: 0, height: "20px" },
  "&& .MuiInputBase-input": { paddingTop: 0, paddingBottom: 0, height: "20px", lineHeight: "20px" },
  "&& .MuiSelect-select": { paddingTop: 0, paddingBottom: 0, minHeight: 0, lineHeight: "20px" },
}

/**
 * Left padding for list rows that start with a checkbox or radio, so the box itself (not its 4px
 * touch padding and 2.5px icon inset) lines up with the field and label above (16px from the edge).
 */
export const CHECK_ROW_PADDING_LEFT = "10px"
