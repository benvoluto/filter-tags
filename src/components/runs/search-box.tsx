"use client"

import * as React from "react"
import { Button, IconButton, Stack, Tooltip } from "@mui/material"
import { BookmarkSimpleIcon, XIcon } from "@phosphor-icons/react"

import { colors } from "common"
import { TextSearch, type TextSearchHandle } from "@/vivaa/staff/components/FiltersV2/TextSearch"
import { FILTER_HEIGHT } from "@/vivaa/staff/components/FiltersV2/constants"

export const SEARCH_PLACEHOLDER = "Search or prompt to sort and filter"

/**
 * Staff's `TextSearch`, unmodified: 32px pill, magnifying glass, 250ms debounce, Enter applies
 * immediately (and, as in staff, it takes focus on load). The prototype's additions sit beside it
 * once there is a query: clear, and "Save as filter", which turns the search into a chip.
 */
export function SearchBox({
  value,
  onChange,
  resultCount,
  onSaveAsFilter,
  ref,
}: {
  value: string
  onChange: (value: string) => void
  resultCount: number
  onSaveAsFilter: () => void
  ref?: React.Ref<TextSearchHandle>
}) {
  const hasValue = value.trim() !== ""
  return (
    <Stack direction="row" alignItems="center" gap={0.5}>
      <TextSearch
        ref={ref}
        initialValue={value}
        setValue={(next) => onChange(next ?? "")}
        placeholder={SEARCH_PLACEHOLDER}
        width={280}
      />
      {hasValue && (
        <Tooltip title="Clear search">
          <IconButton
            size="small"
            aria-label="Clear search"
            onClick={() => {
              if (ref && typeof ref === "object") ref.current?.clear()
              else onChange("")
            }}
          >
            <XIcon size={16} color={colors.extended.gray["45"]} />
          </IconButton>
        </Tooltip>
      )}
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
