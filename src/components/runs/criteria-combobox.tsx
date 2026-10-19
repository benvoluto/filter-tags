"use client"

import * as React from "react"
import {
  Box,
  Checkbox,
  Chip,
  InputAdornment,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Radio,
  Stack,
  TextField,
} from "@mui/material"
import { MagnifyingGlassIcon, PlusIcon, XIcon } from "@phosphor-icons/react"

import { Text, colors } from "common"
import { COLUMN_MAP, distinctValues, formatCriterion, type ColumnKey } from "@/lib/data"
import { FIELD_SX, LIST_SX, NO_ROWS, OPTION_TEXT } from "./panel-styles"

/** Trailing "0 rows" on a value that would empty the table (the row's tooltip says why). */
export function NoRowsHint() {
  return (
    <Text variant="caption" color="warning" component="span" sx={{ marginLeft: 1, flexShrink: 0 }}>
      0 rows
    </Text>
  )
}

/**
 * A typed value as a criterion: the column's own value when the text matches one exactly (by raw
 * value or display text, so "1m 00s" means 60), otherwise the text as typed.
 */
function resolveTyped(column: ColumnKey, text: string): string {
  const col = COLUMN_MAP[column]
  const lower = text.toLowerCase()
  return distinctValues(column).find((o) => o.toLowerCase() === lower || formatCriterion(col, o).toLowerCase() === lower) ?? text
}

/** Comma-separated typed text → criteria values (empty segments dropped). */
function typedValues(column: ColumnKey, text: string): string[] {
  return text
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => resolveTyped(column, t))
}

/** Add values without duplicates (case-insensitive); `single` keeps only the last. */
function addValues(values: string[], added: string[], single: boolean): string[] {
  if (!added.length) return values
  if (single) return [added[added.length - 1]]
  const next = [...values]
  for (const v of added) if (!next.some((x) => x.toLowerCase() === v.toLowerCase())) next.push(v)
  return next
}

/**
 * The criteria the editor should submit: the picked values plus whatever is still typed in the
 * field. A typed value is never silently dropped — the Add filter button includes it too.
 */
export function withTypedValues(values: string[], typed: string, column: ColumnKey, single: boolean): string[] {
  return addValues(values, typedValues(column, typed), single)
}

type Item = { kind: "custom"; value: string } | { kind: "option"; value: string }

/**
 * The criteria step's combo box: type values, pick them from the column's list, or both, in any
 * order. The list is inline in the panel (not a dropdown), so it never covers the panel's buttons.
 *
 * - Typed text is criteria. A comma turns what's before it into a value chip ("Epic, Cerner");
 *   the text after the last comma filters the list. Enter adds the filter with the typed entry as
 *   typed (an exact match maps to the column's value). A "Use “…”" row adds it as a chip.
 * - ↑ ↓ highlight a value; Space adds it and clears the text. Without arrowing, Space just types a
 *   space. After arrowing, Enter adds the highlighted value and the filter.
 * - "is any of": values show as chips (✕, or Backspace in an empty field, removes the last).
 *   "equals" (`single`): one value, shown by its radio; a new one replaces it.
 * - Clicking a value adds it and clears the text (the text was the search).
 * - ← at the start of the field, or Shift+Tab, goes back to the type step (`onBack`, when there is
 *   one — i.e. opened from Add filter).
 */
export function CriteriaCombobox({
  single = false,
  column,
  values,
  onChange,
  typed,
  onTypedChange,
  onCommit,
  onBack,
  returnsNoRows,
}: {
  single?: boolean
  column: ColumnKey
  values: string[]
  onChange: (values: string[]) => void
  /** Text in the field, owned by the editor so the Add filter button can include it. */
  typed: string
  onTypedChange: (text: string) => void
  /** Add the filter with these values. */
  onCommit: (values: string[]) => void
  /** Return to the type (column) step. Omitted when the column was fixed by the entry point. */
  onBack?: () => void
  returnsNoRows?: (value: string) => boolean
}) {
  const col = COLUMN_MAP[column]
  const listId = React.useId()
  const [highlight, setHighlight] = React.useState(0)
  /** You've arrowed (or hovered) to a row: Space/Enter act on it and its highlight shows. */
  const [navigated, setNavigated] = React.useState(false)
  const itemRefs = React.useRef<(HTMLLIElement | null)[]>([])
  const inputRef = React.useRef<HTMLInputElement>(null)

  // Focus the field once the popover has opened. `autoFocus` alone loses: MUI's popover focus trap
  // moves focus to its paper after the content mounts.
  React.useEffect(() => {
    const frame = requestAnimationFrame(() => inputRef.current?.focus())
    return () => cancelAnimationFrame(frame)
  }, [])

  const options = distinctValues(column)
  const lower = values.map((v) => v.toLowerCase())
  // The list filters on the value being typed: the text after the last comma.
  const segment = typed.slice(typed.lastIndexOf(",") + 1).trim()
  const q = segment.toLowerCase()
  const matches = q
    ? options.filter((o) => o.toLowerCase().includes(q) || formatCriterion(col, o).toLowerCase().includes(q))
    : options
  const exact = options.some((o) => o.toLowerCase() === q || formatCriterion(col, o).toLowerCase() === q)
  // Matches first, so ↓ reaches the column's values; "Use “…”" (the typed text) is the last row.
  const items: Item[] = [
    ...matches.map((value): Item => ({ kind: "option", value })),
    ...(segment && !exact && !lower.includes(q) ? [{ kind: "custom" as const, value: segment }] : []),
  ]
  const active = Math.min(highlight, items.length - 1)

  React.useEffect(() => {
    if (navigated) itemRefs.current[active]?.scrollIntoView({ block: "nearest" })
  }, [active, navigated])

  /**
   * Add (or, in the list, toggle off) a value and clear the typed text. Returns the new values.
   * The cursor stays on the picked value, so you can keep arrowing and picking where you were.
   * Clearing the text unfilters the list, so the cursor follows the value to its row in the full
   * list (the "Use “…”" row goes away; its value becomes a chip, and the cursor resets).
   */
  const pick = (value: string, toggle: boolean): string[] => {
    const isPicked = lower.includes(value.toLowerCase())
    const next = toggle && isPicked && !single ? values.filter((v) => v.toLowerCase() !== value.toLowerCase()) : addValues(values, [value], single)
    onChange(next)
    onTypedChange("")
    const row = options.findIndex((o) => o.toLowerCase() === value.toLowerCase())
    if (row >= 0 && navigated) {
      setHighlight(row)
    } else {
      setHighlight(0)
      setNavigated(false)
    }
    return next
  }

  const onTextChange = (text: string) => {
    setNavigated(false)
    setHighlight(0)
    // A comma completes the values before it (typed or pasted); the rest stays in the field.
    const lastComma = text.lastIndexOf(",")
    if (lastComma >= 0) {
      const done = typedValues(column, text.slice(0, lastComma))
      if (done.length) onChange(addValues(values, done, single))
      onTypedChange(text.slice(lastComma + 1).trimStart())
      return
    }
    onTypedChange(text)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing) return
    if (onBack) {
      // The handler sits on TextField's wrapper div, so read the caret from the input itself.
      const input = e.target as HTMLInputElement
      const caretAtStart = input.selectionStart === 0 && input.selectionEnd === 0
      if ((e.key === "ArrowLeft" && caretAtStart && !e.shiftKey) || (e.key === "Tab" && e.shiftKey)) {
        e.preventDefault()
        onBack()
        return
      }
    }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault()
      if (!items.length) return
      const step = e.key === "ArrowDown" ? 1 : -1
      // The first ↓ lands on the first row; after that it moves.
      const next = navigated ? (active + step + items.length) % items.length : step > 0 ? 0 : items.length - 1
      setNavigated(true)
      setHighlight(next)
      return
    }
    if (e.key === " ") {
      // Space picks only a row you've arrowed (or hovered) to; otherwise it types a space — except
      // at the start of an empty field (e.g. the space in ", "), where it's ignored.
      if (navigated && items[active]) {
        e.preventDefault()
        pick(items[active].value, true)
        return
      }
      if (typed === "") {
        e.preventDefault()
        return
      }
    }
    if (e.key === "Backspace" && typed === "" && values.length && !single) {
      onChange(values.slice(0, -1))
      return
    }
    if (e.key === "Enter") {
      // Handled here, not by the panel's form, so the typed entry is part of the filter.
      e.preventDefault()
      e.stopPropagation()
      if (navigated && items[active]) {
        onCommit(addValues(values, [items[active].value], single))
        return
      }
      onCommit(withTypedValues(values, typed, column, single))
    }
  }

  return (
    <Stack spacing={1} sx={{ minHeight: 0 }}>
      {!single && values.length > 0 && (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, maxHeight: 72, overflowY: "auto", flexShrink: 0 }}>
          {values.map((v) => (
            <Chip
              key={v}
              size="small"
              label={formatCriterion(col, v)}
              onDelete={() => onChange(values.filter((x) => x !== v))}
              deleteIcon={<XIcon size={12} aria-label={`Remove ${formatCriterion(col, v)}`} />}
              sx={{ maxWidth: "100%" }}
            />
          ))}
        </Box>
      )}
      <TextField
        size="small"
        fullWidth
        inputRef={inputRef}
        value={typed}
        onChange={(e) => onTextChange(e.target.value)}
        onKeyDown={onKeyDown}
        sx={[FIELD_SX, { flexShrink: 0 }] as never}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <MagnifyingGlassIcon size={16} color={colors.extended.gray["45"]} />
              </InputAdornment>
            ),
          },
          htmlInput: {
            role: "combobox",
            "aria-label": `${col.label} values`,
            "aria-autocomplete": "list",
            "aria-expanded": true,
            "aria-controls": listId,
            "aria-activedescendant": navigated && items[active] ? `${listId}-${active}` : undefined,
          },
        }}
      />
      <Box
        component="ul"
        id={listId}
        role="listbox"
        aria-label={`${col.label} values`}
        aria-multiselectable={!single}
        sx={{ ...LIST_SX, margin: 0, marginX: -2, listStyle: "none" } as object}
      >
        {items.length === 0 && (
          <MenuItem dense disabled component="li">
            <ListItemText primary="No matching values" slotProps={{ primary: OPTION_TEXT }} />
          </MenuItem>
        )}
        {items.map((item, i) => {
          const id = `${listId}-${i}`
          const ref = (el: HTMLLIElement | null) => {
            itemRefs.current[i] = el
          }
          // Keep focus in the field: rows are pointer targets, not tab stops. The highlight only
          // shows once you've arrowed (or hovered), so it never looks like a pending choice.
          const common = {
            id,
            ref,
            component: "li" as const,
            dense: true,
            tabIndex: -1,
            selected: navigated && i === active,
            onMouseDown: (e: React.MouseEvent) => e.preventDefault(),
            onMouseMove: () => {
              if (i !== active || !navigated) {
                setNavigated(true)
                setHighlight(i)
              }
            },
            onClick: () => pick(item.value, true),
          }
          if (item.kind === "custom") {
            return (
              <MenuItem key={`custom:${item.value}`} {...common} role="option" aria-selected={false}>
                <ListItemIcon>
                  <PlusIcon size={16} />
                </ListItemIcon>
                <ListItemText primary={`Use “${item.value}”`} slotProps={{ primary: OPTION_TEXT }} />
              </MenuItem>
            )
          }
          const checked = lower.includes(item.value.toLowerCase())
          const empty = returnsNoRows?.(item.value) ?? false
          return (
            <MenuItem key={item.value} {...common} role="option" aria-selected={checked} title={empty ? NO_ROWS : undefined}>
              <ListItemIcon>
                {single ? (
                  <Radio size="small" checked={checked} tabIndex={-1} />
                ) : (
                  <Checkbox size="small" checked={checked} tabIndex={-1} />
                )}
              </ListItemIcon>
              <ListItemText
                primary={formatCriterion(col, item.value)}
                slotProps={{ primary: { ...OPTION_TEXT, color: empty ? "warning" : undefined } }}
              />
              {empty ? <NoRowsHint /> : null}
            </MenuItem>
          )
        })}
      </Box>
    </Stack>
  )
}
