"use client"

// ───────────────────────────────────────────────────────────────────────────
// ADAPTED (not synced) from VivaaHealth/vivaa @ c0500cf3b15f
// Source: web/staff/src/components/FiltersV2/TextSearch.tsx
//
// Upstream's debounce (250ms), Enter-to-apply, upstream-value sync and `clear()` handle are kept
// as they are, and so is the 32px pill. The whole list of edits:
//   • No `autoFocus`. Staff focuses the field on page load; with the theme's focus ring that drew it
//     ~40px tall beside 32px chips, and it swallowed the F / S / C shortcuts.
//   • Text at the filter chip's 13px (MUI Chip's 0.8125rem) instead of 14px, so the row reads as
//     one size; and the <input> sized to the pill (upstream's inherits the theme's 1.6875em input
//     height and overflows the 32px root at 36.6px).
//   • A clear button inside the field once there's text, and "Save as filter" beside it
//     (prototype features).
// ───────────────────────────────────────────────────────────────────────────

import * as React from "react"
import { Button, IconButton, InputAdornment, Stack, TextField, Tooltip } from "@mui/material"
import { BookmarkSimpleIcon, MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react"

import { colors, isTruthy } from "common"
import { FILTER_HEIGHT } from "@/vivaa/staff/components/FiltersV2/constants"

export const SEARCH_PLACEHOLDER = "Search"

/** MUI Chip's label size; the filter chips beside the search use it. */
const FILTER_ROW_FONT_SIZE = "0.8125rem"

type EditMode = "Editing" | "Idle"

export interface SearchBoxHandle {
  /** Clears the field and the upstream value, dropping any pending debounced update. */
  clear: () => void
}

export function SearchBox(props: {
  ref?: React.Ref<SearchBoxHandle>
  value: string
  onChange: (value: string) => void
  resultCount: number
  onSaveAsFilter: () => void
  width?: number
}) {
  const { ref, value: initialValue, onChange, resultCount, onSaveAsFilter, width = 220 } = props
  const setValue = (next: string | null) => onChange(next ?? "")
  const lastInitialValueRef = React.useRef(initialValue)
  const [fieldValue, setFieldValue] = React.useState(initialValue)
  const id = React.useId()
  const editModeRef = React.useRef<EditMode>("Idle")
  const updateUpstreamValueTimeoutIdRef = React.useRef<NodeJS.Timeout | undefined>(undefined)
  const editModeIdleTimeoutIdRef = React.useRef<NodeJS.Timeout | undefined>(undefined)

  React.useEffect(() => {
    // Upstream changed while we're not editing (e.g. Clear filters, a saved view): follow it.
    if (editModeRef.current === "Idle" && initialValue !== lastInitialValueRef.current) {
      setFieldValue(initialValue)
      lastInitialValueRef.current = initialValue
    }
  }, [initialValue])

  const clear = () => {
    clearTimeout(updateUpstreamValueTimeoutIdRef.current)
    updateUpstreamValueTimeoutIdRef.current = undefined
    clearTimeout(editModeIdleTimeoutIdRef.current)
    editModeRef.current = "Idle"
    lastInitialValueRef.current = ""
    setFieldValue("")
    setValue(null)
  }
  React.useImperativeHandle(ref, () => ({ clear }))

  const updateUpstreamValue = (newValue: string) => {
    setValue(newValue || null)
    if (isTruthy(editModeIdleTimeoutIdRef.current)) {
      clearTimeout(editModeIdleTimeoutIdRef.current)
    }
    editModeIdleTimeoutIdRef.current = setTimeout(() => {
      // Defer setting to Idle to allow upstream value to settle.
      editModeRef.current = "Idle"
    }, 0)
  }

  const hasValue = fieldValue.trim() !== ""
  return (
    <Stack direction="row" alignItems="center" gap={1}>
      <TextField
        id={id}
        placeholder={SEARCH_PLACEHOLDER}
        aria-label={SEARCH_PLACEHOLDER}
        value={fieldValue}
        onChange={(event) => {
          editModeRef.current = "Editing"
          const newValue = event.target.value
          setFieldValue(newValue)
          if (isTruthy(updateUpstreamValueTimeoutIdRef.current)) {
            clearTimeout(updateUpstreamValueTimeoutIdRef.current)
          }
          updateUpstreamValueTimeoutIdRef.current = setTimeout(() => {
            updateUpstreamValue(newValue)
          }, 250)
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            if (isTruthy(updateUpstreamValueTimeoutIdRef.current)) {
              clearTimeout(updateUpstreamValueTimeoutIdRef.current)
              updateUpstreamValueTimeoutIdRef.current = undefined
            }
            updateUpstreamValue(fieldValue)
          }
          if (event.key === "Escape" && hasValue) clear()
        }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <MagnifyingGlassIcon size={16} color={colors.extended.gray["45"]} />
              </InputAdornment>
            ),
            endAdornment: hasValue ? (
              <InputAdornment position="end">
                <Tooltip title="Clear search">
                  <IconButton size="small" edge="end" aria-label="Clear search" onClick={clear} sx={{ padding: "4px" }}>
                    <XIcon size={14} color={colors.extended.gray["45"]} />
                  </IconButton>
                </Tooltip>
              </InputAdornment>
            ) : undefined,
            sx: {
              width,
              height: FILTER_HEIGHT,
              borderRadius: 4,
              fontSize: FILTER_ROW_FONT_SIZE,
            },
          },
          htmlInput: {
            style: { paddingLeft: 0, paddingRight: hasValue ? 0 : "12px", paddingTop: 0, paddingBottom: 0, height: "100%" },
          },
        }}
      />
      {hasValue && resultCount > 0 && (
        <Button
          variant="outlined"
          size="small"
          startIcon={<BookmarkSimpleIcon size={16} />}
          onClick={onSaveAsFilter}
          sx={{ height: FILTER_HEIGHT, whiteSpace: "nowrap" }}
        >
          Save as filter
        </Button>
      )}
    </Stack>
  )
}
