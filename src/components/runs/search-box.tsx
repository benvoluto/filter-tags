"use client"

import * as React from "react"
import Button from "@mui/material/Button"
import IconButton from "@mui/material/IconButton"
import InputAdornment from "@mui/material/InputAdornment"
import TextField from "@mui/material/TextField"
import BookmarkAddOutlinedIcon from "@mui/icons-material/BookmarkAddOutlined"
import ClearIcon from "@mui/icons-material/Clear"
import SearchIcon from "@mui/icons-material/Search"

/**
 * Search field (stock TextField; width and pill shape come from the theme's `type="search"` variant).
 * It grows to up to four lines while focused. Clear and "Save as filter" appear once there's text.
 */
export function SearchBox({
  value,
  onChange,
  resultCount,
  onSaveAsFilter,
  inputRef,
}: {
  value: string
  onChange: (v: string) => void
  resultCount: number
  onSaveAsFilter: () => void
  inputRef?: React.Ref<HTMLTextAreaElement>
}) {
  const [focused, setFocused] = React.useState(false)
  const hasValue = value.trim() !== ""
  return (
    <TextField
      type="search"
      multiline
      maxRows={focused ? 4 : 1}
      value={value}
      placeholder="Search or prompt to sort and filter"
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onChange={(e) => onChange(e.target.value.replace(/\n/g, " "))}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault()
          if (e.metaKey || e.ctrlKey) onSaveAsFilter()
        }
        if (e.key === "Escape") {
          if (hasValue) onChange("")
          else (e.target as HTMLElement).blur()
        }
      }}
      inputRef={inputRef}
      slotProps={{
        htmlInput: { "aria-label": "Search or prompt to sort and filter" },
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
          endAdornment: hasValue ? (
            <InputAdornment position="end">
              <IconButton aria-label="Clear search" onClick={() => onChange("")}>
                <ClearIcon />
              </IconButton>
              {resultCount > 0 ? (
                <Button variant="outlined" startIcon={<BookmarkAddOutlinedIcon />} onClick={onSaveAsFilter} title="Save as filter (⌘↵)">
                  Save as filter
                </Button>
              ) : null}
            </InputAdornment>
          ) : undefined,
        },
      }}
    />
  )
}
