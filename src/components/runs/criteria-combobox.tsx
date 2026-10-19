"use client"

import * as React from "react"
import {
  Box,
  Checkbox,
  Divider,
  InputAdornment,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Radio,
  Stack,
  TextField,
} from "@mui/material"
import { MagnifyingGlassIcon, PlusIcon } from "@phosphor-icons/react"

import { colors } from "common"
import { COLUMN_MAP, distinctValues, formatCriterion, type ColumnKey } from "@/lib/data"
import { CHECK_ROW_PADDING_LEFT, FIELD_SX, LIST_SX, NO_ROWS, NO_ROWS_COLOR, OPTION_TEXT } from "./panel-styles"

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

/**
 * A row in the list: a value (the column's own, or one you added that isn't in it — `own`), or the
 * "Use “…”" row that adds the text being typed.
 */
type Item = { kind: "value"; value: string; own: boolean } | { kind: "use"; value: string }

/**
 * The criteria step's combo box: type values, pick them from the column's list, or both, in any
 * order. The list is inline in the panel (not a dropdown), so it never covers the panel's buttons.
 *
 * - Typed text is criteria. A comma adds what's before it ("Epic, Cerner"); the text after the
 *   last comma filters the list. Enter adds the filter with the typed entry as typed (an exact
 *   match maps to the column's value). The "Use “…”" row (last) adds the typed text.
 * - What's picked is shown by the list itself (checkboxes; radios for "equals"). Values you added
 *   that aren't in the column's list sit at the top, checked, above a subtle divider; unchecking
 *   one removes it.
 * - ↑ ↓ move a cursor; Space adds the value under it and clears the text, and the cursor stays on
 *   that value. Without arrowing, Space just types a space. After arrowing, Enter adds the value
 *   under the cursor and the filter.
 * - "equals" (`single`): one value; a new one replaces it.
 * - Clicking a value adds it and clears the text (the text was the search).
 * - ← at the start of the field, or Shift+Tab, goes back to the type step (`onBack`, when there is
 *   one — i.e. opened from Add filter).
 * - Operator symbols at the start (> < >= <= = !=) switch the operator (`onOperatorText`).
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
  onOperatorText,
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
  /** Typed operator symbols (> < >= <= = !=) switch the operator; true when the text was one. */
  onOperatorText?: (text: string) => boolean
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
    // Caret at the end: the field can appear mid-typing, when a typed "!=" or "=" switched the
    // operator and carried the rest of the text over.
    const frame = requestAnimationFrame(() => {
      const input = inputRef.current
      if (!input) return
      input.focus()
      input.setSelectionRange(input.value.length, input.value.length)
    })
    return () => cancelAnimationFrame(frame)
  }, [])

  const options = distinctValues(column)
  const lower = values.map((v) => v.toLowerCase())
  // The list filters on the value being typed: the text after the last comma.
  const segment = typed.slice(typed.lastIndexOf(",") + 1).trim()
  const q = segment.toLowerCase()

  /** The rows for these picked values and search text: own values, the column's values, "Use". */
  const buildItems = (picked: string[], query: string): Item[] => {
    const matchesQuery = (v: string) =>
      !query || v.toLowerCase().includes(query) || formatCriterion(col, v).toLowerCase().includes(query)
    const isOption = (v: string) => options.some((o) => o.toLowerCase() === v.toLowerCase())
    const own = picked.filter((v) => !isOption(v) && matchesQuery(v))
    const exact = options.some((o) => o.toLowerCase() === query || formatCriterion(col, o).toLowerCase() === query)
    const alreadyPicked = picked.some((v) => v.toLowerCase() === query)
    return [
      ...own.map((value): Item => ({ kind: "value", value, own: true })),
      ...options.filter(matchesQuery).map((value): Item => ({ kind: "value", value, own: false })),
      ...(query && !exact && !alreadyPicked ? [{ kind: "use" as const, value: segment }] : []),
    ]
  }
  const items = buildItems(values, q)
  /** Rows above the divider (your own values). */
  const ownCount = items.filter((it) => it.kind === "value" && it.own).length
  const active = Math.min(highlight, items.length - 1)

  React.useEffect(() => {
    if (navigated) itemRefs.current[active]?.scrollIntoView({ block: "nearest" })
  }, [active, navigated])

  /**
   * Add (or, in the list, toggle off) a value and clear the typed text. Returns the new values.
   * The cursor stays on the picked value, so you can keep arrowing and picking where you were.
   * Clearing the text unfilters the list, so the cursor follows the value to its row in the full
   * list (an added value moves to the top). If the row goes away — you unchecked one of your own
   * values — the cursor stays at the same place in the list.
   */
  const pick = (value: string, toggle: boolean): string[] => {
    const isPicked = lower.includes(value.toLowerCase())
    const next = toggle && isPicked && !single ? values.filter((v) => v.toLowerCase() !== value.toLowerCase()) : addValues(values, [value], single)
    onChange(next)
    onTypedChange("")
    if (navigated) {
      const after = buildItems(next, "")
      const row = after.findIndex((it) => it.kind === "value" && it.value.toLowerCase() === value.toLowerCase())
      setHighlight(row >= 0 ? row : Math.max(0, Math.min(active, after.length - 1)))
    } else {
      setHighlight(0)
    }
    return next
  }

  const onTextChange = (text: string) => {
    setNavigated(false)
    setHighlight(0)
    if (onOperatorText?.(text)) return
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
        // A bare <ul> carries the browser's 40px left padding; zero it so rows start at the box edge
        // like the type step's MenuList (LIST_SX keeps the vertical padding and the edge bleed).
        sx={[LIST_SX, { listStyle: "none", paddingLeft: 0, paddingRight: 0 }] as never}
      >
        {items.length === 0 && (
          <MenuItem dense disabled component="li">
            <ListItemText primary="No matching values" slotProps={{ primary: OPTION_TEXT }} />
          </MenuItem>
        )}
        {items.map((item, i) => {
          const id = `${listId}-${i}`
          // A subtle rule between your own values (top) and the column's values.
          const divider =
            i === ownCount && ownCount > 0 ? (
              <Divider key="own-divider" component="li" role="separator" sx={{ marginY: 0.5, borderColor: colors.border.light }} />
            ) : null
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
          if (item.kind === "use") {
            return (
              <React.Fragment key={`use:${item.value}`}>
                {divider}
                <MenuItem {...common} role="option" aria-selected={false}>
                  <ListItemIcon>
                    <PlusIcon size={16} />
                  </ListItemIcon>
                  <ListItemText primary={`Use “${item.value}”`} slotProps={{ primary: OPTION_TEXT }} />
                </MenuItem>
              </React.Fragment>
            )
          }
          const checked = lower.includes(item.value.toLowerCase())
          const empty = !item.own && (returnsNoRows?.(item.value) ?? false)
          return (
            <React.Fragment key={`${item.own ? "own" : "value"}:${item.value}`}>
              {divider}
              <MenuItem
                {...common}
                role="option"
                aria-selected={checked}
                title={empty ? NO_ROWS : undefined}
                sx={{ paddingLeft: CHECK_ROW_PADDING_LEFT }}
              >
                <ListItemIcon>
                  {single ? (
                    <Radio size="small" checked={checked} tabIndex={-1} />
                  ) : (
                    <Checkbox size="small" checked={checked} tabIndex={-1} />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={formatCriterion(col, item.value)}
                  slotProps={{ primary: { ...OPTION_TEXT, color: empty ? NO_ROWS_COLOR : undefined } }}
                />
              </MenuItem>
            </React.Fragment>
          )
        })}
      </Box>
    </Stack>
  )
}
