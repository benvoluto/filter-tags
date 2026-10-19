"use client"

import * as React from "react"
import {
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  IconButton,
  InputLabel,
  ListItemText,
  Menu,
  MenuItem,
  MenuList,
  Stack,
  TextField,
  type PopperProps,
  type SxProps,
  type Theme,
} from "@mui/material"
import { ArrowLeftIcon, CaretDownIcon, PlusIcon, SlidersHorizontalIcon, TrashIcon } from "@phosphor-icons/react"

import { Text, colors } from "common"
import { POPOVER_FIELD_MINIMUM_WIDTH } from "@/vivaa/staff/components/FiltersV2/constants"

import { COLUMNS, COLUMN_MAP, distinctValues, formatCriterion, type ColumnKey } from "@/lib/data"
import {
  COMPARATOR_MAP,
  MAX_CONDITIONS,
  comparatorsFor,
  conditionsOf,
  parseOperatorPrefix,
  type Comparator,
  type Filter,
  type Join,
} from "@/lib/filters"
import { useFilterProbe } from "./filter-probe"
import { CriteriaCombobox, withTypedValues } from "./criteria-combobox"
import { usePanelMaxHeight, useRepositionPopover } from "./filter-popover"
import { FIELD_SX, LIST_SX, NO_ROWS, NO_ROWS_COLOR, NO_ROWS_COLUMN, OPTION_TEXT } from "./panel-styles"

/*
 * The filter editor: what opens inside staff's filter popover (FilterChipAndPopover, or
 * HeaderFilterPopover for column headers), which supplies the 16px padding and the border/shadow.
 * Styled the way staff's FiltersV2 fields are: small MUI fields at POPOVER_FIELD_MINIMUM_WIDTH,
 * labels as InputLabel (staff's FormField), Phosphor icons at 16px in gray[45], `sx` for layout.
 */

/** Basic panel: staff's popover field width. Advanced: wide enough for a five-part condition row. */
const BASIC_WIDTH = POPOVER_FIELD_MINIMUM_WIDTH
const ADVANCED_WIDTH = "min(48rem, calc(100vw - 64px))"


/** A row of panel controls: the first child on the left, the rest pushed right. */
const BAR_SX: SxProps<Theme> = {
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap",
  gap: 1,
  flexShrink: 0,
  "& > :first-of-type:not(:last-child)": { marginRight: "auto", minWidth: 0 },
}

/**
 * The panel's column: capped to the space below the anchor (see usePanelMaxHeight), so the list
 * inside scrolls instead of the popover sliding up over the filter row and its own buttons.
 */
function panelStackSx(maxHeight: number | undefined): SxProps<Theme> {
  return { maxHeight, minHeight: 0 }
}

/** Suggestion dropdowns: short, so they don't run past the panel. */
const LISTBOX_SX: SxProps<Theme> = { maxHeight: 220 }



export type FilterDraft = Omit<Filter, "id">

type FilterEditorProps = {
  /** Existing filter when editing a chip. */
  initial?: Filter
  /** Column preselected (column-header / partial-filter entry points). Omit to show the column picker first. */
  column?: ColumnKey
  onSubmit: (draft: FilterDraft) => void
  onCancel: () => void
}

/** One criteria line in the editor. `column` is null until a type is picked. */
type Row = { key: string; join: Join; column: ColumnKey | null; comparator: Comparator; values: string[] }
type ReadyRow = Row & { column: ColumnKey }


let rowSeq = 0
function newRow(partial: Partial<Row> = {}): Row {
  rowSeq += 1
  return { key: `row${rowSeq}`, join: "and", column: null, comparator: "is", values: [], ...partial }
}

function rowComplete(r: Row): r is ReadyRow {
  if (!r.column) return false
  if (COMPARATOR_MAP[r.comparator].arity === "none") return true
  return r.values.filter(Boolean).length > 0
}

function draftFrom(rows: ReadyRow[]): FilterDraft {
  const [first, ...rest] = rows
  return {
    kind: "column",
    column: first.column,
    comparator: first.comparator,
    values: first.values,
    extra: rest.length ? rest.map(({ join, column, comparator, values }) => ({ join, column, comparator, values })) : undefined,
  }
}

/** Short text for a criteria line, e.g. "Status equals Failed, Running" (empty if no type yet). */
function rowText(row: Row): string {
  if (!row.column) return ""
  const col = COLUMN_MAP[row.column]
  const cmp = COMPARATOR_MAP[row.comparator]
  const vals = row.values.filter(Boolean).map((v) => formatCriterion(col, v))
  return [col.label, cmp.label, vals.join(cmp.arity === "two" ? " and " : ", ")].filter(Boolean).join(" ")
}

/** "is any of" and "equals" pick from the column's list (the criteria combo box). */
function isListPick(arity: string) {
  return arity === "multi" || arity === "single"
}

/**
 * The values a row keeps when its operator changes: all of them within the same kind of input;
 * "is any of" ↔ "equals" carry the selection (one value for equals); otherwise none.
 */
function carriedValues(row: Row, comparator: Comparator): string[] {
  const from = COMPARATOR_MAP[row.comparator].arity
  const to = COMPARATOR_MAP[comparator].arity
  if (from === to) return row.values
  if (isListPick(from) && isListPick(to)) return to === "single" ? row.values.slice(0, 1) : row.values
  return []
}

export function FilterEditor(props: FilterEditorProps) {
  if (props.initial?.kind === "search") {
    return <SearchFilterEditor initial={props.initial} onSubmit={props.onSubmit} onCancel={props.onCancel} />
  }
  return <ColumnFilterEditor {...props} />
}

function ColumnFilterEditor({ initial, column: fixedColumn, onSubmit, onCancel }: FilterEditorProps) {
  const [rows, setRows] = React.useState<Row[]>(() =>
    initial ? conditionsOf(initial).map((c) => newRow(c)) : [newRow({ column: fixedColumn ?? null })]
  )
  const [advanced, setAdvanced] = React.useState(Boolean(initial?.extra?.length))
  const [confirmBasic, setConfirmBasic] = React.useState(false)
  const probe = useFilterProbe()
  const reposition = useRepositionPopover()
  const panelRef = React.useRef<HTMLElement>(null)
  const maxHeight = usePanelMaxHeight(panelRef)
  // The panel changes size between steps / modes / row counts: keep it on screen.
  const firstColumn = rows[0]?.column
  React.useLayoutEffect(() => reposition(), [reposition, advanced, rows.length, firstColumn])

  const updateRow = (i: number, patch: Partial<Row>) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)))
  const changeColumn = (i: number, column: ColumnKey) => {
    updateRow(i, { column, comparator: "is", values: [] })
    if (i === 0) setTyped("")
  }

  // Basic step 2: text still typed in the criteria field counts as criteria (see CriteriaCombobox).
  const [typed, setTyped] = React.useState("")
  /** The column the type step should highlight when you come back to it. */
  const [lastColumn, setLastColumn] = React.useState<ColumnKey | null>(null)
  const canGoBack = !fixedColumn && !initial
  const goBack = () => {
    setLastColumn(rows[0]?.column ?? null)
    updateRow(0, { column: null, comparator: "is", values: [] })
    setTyped("")
  }
  /** The basic row as it would be submitted: picked values plus the typed entry. */
  const basicRow = (() => {
    const first = rows[0]
    if (!first?.column) return first
    const arity = COMPARATOR_MAP[first.comparator].arity
    if (arity !== "multi" && arity !== "single") return first
    return { ...first, values: withTypedValues(first.values, typed, first.column, arity === "single") }
  })()
  const changeComparator = (i: number, comparator: Comparator) =>
    setRows((rs) => rs.map((r, j) => (j === i ? { ...r, comparator, values: carriedValues(r, comparator) } : r)))

  /**
   * Basic step 2: an operator symbol typed at the start of the criteria field (> < >= <= = !=)
   * switches the operator; the text after it becomes the value, in whichever input the new
   * operator uses. Returns true when the text was taken as an operator.
   */
  const applyTypedOperator = (text: string): boolean => {
    const current = rows[0]
    if (!current?.column) return false
    const parsed = parseOperatorPrefix(text, COLUMN_MAP[current.column], current.comparator)
    if (!parsed) return false
    const { comparator, rest } = parsed
    const to = COMPARATOR_MAP[comparator].arity
    if (isListPick(to)) {
      updateRow(0, { comparator, values: carriedValues(current, comparator) })
      setTyped(rest)
    } else {
      updateRow(0, { comparator, values: to !== "none" && rest ? [rest] : [] })
      setTyped("")
    }
    return true
  }

  const active = advanced ? rows : [basicRow]
  const canSubmit = active.every(rowComplete)
  const submit = (list: Row[]) => {
    if (list.every(rowComplete)) onSubmit(draftFrom(list))
  }

  /** Zero-row check for a value in row i, given the other (complete) rows, filters, and search. */
  const returnsNoRowsFor = (i: number) => {
    if (!probe) return undefined
    return (value: string) => {
      const candidate = active.map((r, j) => (j === i ? { ...r, values: [value] } : r)).filter(rowComplete)
      return candidate.length > 0 && !probe(draftFrom(candidate), initial?.id)
    }
  }
  /** Zero-row check for a whole column in row i ("<column> is not empty" leaves nothing). */
  const columnReturnsNoRowsFor = (i: number) => {
    if (!probe) return undefined
    return (column: ColumnKey) => {
      const candidate = active
        .map((r, j) => (j === i ? { ...r, column, comparator: "is_not_empty" as const, values: [] } : r))
        .filter(rowComplete)
      return !probe(draftFrom(candidate), initial?.id)
    }
  }

  const toBasic = () => {
    setRows((rs) => rs.slice(0, 1))
    setAdvanced(false)
    setConfirmBasic(false)
  }
  const toggleAdvanced = () => {
    if (!advanced) {
      // Carry anything typed in the basic criteria field into the first advanced line.
      setRows((rs) => [basicRow, ...rs.slice(1)])
      setTyped("")
      setAdvanced(true)
    }
    else if (rows.length > 1) setConfirmBasic(true)
    else toBasic()
  }

  const advancedButton = (
    <Button variant="text" size="small" startIcon={<SlidersHorizontalIcon size={16} />} onClick={toggleAdvanced}>
      {advanced ? "Basic filter" : "Advanced filter"}
    </Button>
  )
  const actions = (
    <Box sx={BAR_SX}>
      {advancedButton}
      <Button variant="outlined" size="small" onClick={onCancel}>
        Cancel
      </Button>
      <Button variant="contained" size="small" type="submit" disabled={!canSubmit}>
        {initial ? "Save filter" : "Add filter"}
      </Button>
    </Box>
  )

  // ── Advanced: up to 10 criteria lines joined with and/or ─────────────────────────────────
  if (advanced) {
    const joins = new Set(rows.slice(1).map((r) => r.join))
    return (
      <Box
        component="form"
        ref={panelRef}
        sx={{ width: ADVANCED_WIDTH }}
        onSubmit={(e: React.FormEvent) => {
          e.preventDefault()
          submit(rows)
        }}
      >
        <Stack spacing={1.5} sx={panelStackSx(maxHeight)}>
          <Box sx={BAR_SX}>
            <InputLabel>Advanced filter</InputLabel>
            <Text variant="caption" color={colors.content.dark}>
              {rows.length} of {MAX_CONDITIONS} conditions
            </Text>
          </Box>

          <Stack spacing={1} sx={{ minHeight: 0, overflowY: "auto", paddingTop: 0.5 }}>
            {rows.map((row, i) => (
              <ConditionRow
                key={row.key}
                index={i}
                row={row}
                onJoin={(join) => updateRow(i, { join })}
                onColumn={(c) => changeColumn(i, c)}
                onComparator={(c) => changeComparator(i, c)}
                onValues={(values) => updateRow(i, { values })}
                onRemove={rows.length > 1 ? () => setRows((rs) => rs.filter((_, j) => j !== i)) : undefined}
                returnsNoRows={returnsNoRowsFor(i)}
                columnReturnsNoRows={columnReturnsNoRowsFor(i)}
              />
            ))}
          </Stack>

          <Box sx={BAR_SX}>
            <Button
              variant="text"
              size="small"
              startIcon={<PlusIcon size={16} />}
              disabled={rows.length >= MAX_CONDITIONS}
              onClick={() => setRows((rs) => [...rs, newRow({ join: rs[rs.length - 1]?.join ?? "and" })])}
            >
              Add condition
            </Button>
            {joins.size > 1 ? (
              <Text variant="caption" color={colors.content.dark}>
                AND conditions are evaluated before OR.
              </Text>
            ) : null}
          </Box>

          {actions}
        </Stack>

        <Dialog open={confirmBasic} onClose={() => setConfirmBasic(false)} role="alertdialog" aria-labelledby="confirm-basic-title">
          <DialogTitle id="confirm-basic-title">Switch to a basic filter?</DialogTitle>
          <DialogContent>
            <DialogContentText>
              A basic filter has a single type–operator–criteria line. Only the first line
              {rowText(rows[0]) ? ` (${rowText(rows[0])})` : ""} will be kept; the other {rows.length - 1}{" "}
              {rows.length - 1 === 1 ? "line" : "lines"} will be removed.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button variant="outlined" autoFocus onClick={() => setConfirmBasic(false)}>
              Keep advanced
            </Button>
            <Button variant="contained" color="error" onClick={toBasic}>
              Keep first line only
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    )
  }

  // ── Basic, step 1: pick the column (see ColumnPicker) ──
  const row = rows[0]
  if (!row.column) {
    return (
      <ColumnPicker
        panelRef={panelRef}
        maxHeight={maxHeight}
        lastColumn={lastColumn}
        columnIsEmpty={columnReturnsNoRowsFor(0)}
        onPick={(column) => changeColumn(0, column)}
        footer={
          <Box sx={BAR_SX}>
            {advancedButton}
            <Button variant="outlined" size="small" onClick={onCancel}>
              Cancel
            </Button>
          </Box>
        }
      />
    )
  }

  // ── Basic, step 2: operator + criteria ──────────────────────────────────────────────────
  const column = row.column
  const arity = COMPARATOR_MAP[row.comparator].arity
  return (
    <Box
      component="form"
      ref={panelRef}
      sx={{ width: BASIC_WIDTH }}
      onSubmit={(e: React.FormEvent) => {
        e.preventDefault()
        submit([basicRow])
      }}
      // Enter anywhere in the panel adds the filter (buttons keep their own Enter behaviour).
      onKeyDown={(e: React.KeyboardEvent) => {
        const target = e.target as HTMLElement
        if (e.key === "Enter" && (arity === "multi" || arity === "single") && !target.closest("button")) {
          e.preventDefault()
          submit([basicRow])
        }
      }}
    >
      <Stack spacing={1.5} sx={panelStackSx(maxHeight)}>
        <Box sx={BAR_SX}>
          <Stack direction="row" alignItems="center" spacing={0.75} sx={{ minWidth: 0 }}>
            {canGoBack ? (
              <IconButton size="small" aria-label="Choose a different column" onClick={goBack}>
                <ArrowLeftIcon size={16} />
              </IconButton>
            ) : null}
            <InputLabel sx={{ overflow: "hidden", textOverflow: "ellipsis" }}>{COLUMN_MAP[column].label} filter</InputLabel>
            {initial ? (
              <ChangeTypeMenu column={column} columnIsEmpty={columnReturnsNoRowsFor(0)} onChange={(c) => changeColumn(0, c)} />
            ) : null}
          </Stack>
          <ComparatorSelect column={column} value={row.comparator} onChange={(c) => changeComparator(0, c)} />
        </Box>

        {arity === "multi" || arity === "single" ? (
          <CriteriaCombobox
            key={column}
            single={arity === "single"}
            column={column}
            values={row.values}
            onChange={(values) => updateRow(0, { values })}
            typed={typed}
            onTypedChange={setTyped}
            onCommit={(values) => submit([{ ...row, values }])}
            onBack={canGoBack ? goBack : undefined}
            onOperatorText={applyTypedOperator}
            returnsNoRows={returnsNoRowsFor(0)}
          />
        ) : (
          <CriteriaInput
            column={column}
            comparator={row.comparator}
            values={row.values}
            onChange={(values) => updateRow(0, { values })}
            onOperatorText={applyTypedOperator}
            autoFocus
          />
        )}

        {actions}
      </Stack>
    </Box>
  )
}

/**
 * Basic step 1: pick the filter type (column). Arrows and type-ahead move through the list (MUI
 * MenuList); Space or Enter picks the focused type. Coming back from the criteria step (← or
 * Shift+Tab) starts on the type you left.
 */
function ColumnPicker({
  panelRef,
  maxHeight,
  lastColumn,
  columnIsEmpty,
  onPick,
  footer,
}: {
  panelRef: React.RefObject<HTMLElement | null>
  maxHeight: number | undefined
  lastColumn: ColumnKey | null
  columnIsEmpty?: (column: ColumnKey) => boolean
  onPick: (column: ColumnKey) => void
  footer: React.ReactNode
}) {
  const listRef = React.useRef<HTMLUListElement>(null)
  // Focus the starting type once the popover has opened: MUI's popover focus trap can move focus to
  // its paper after MenuList's own autoFocusItem has run, which leaves arrows and Space dead.
  React.useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const list = listRef.current
      if (!list || list.contains(document.activeElement)) return
      list.querySelector<HTMLElement>('[role="menuitem"].Mui-selected, [role="menuitem"]')?.focus()
    })
    return () => cancelAnimationFrame(frame)
  }, [])
  return (
    <Box ref={panelRef} sx={{ width: BASIC_WIDTH }}>
      <Stack spacing={1} sx={panelStackSx(maxHeight)}>
        <InputLabel sx={{ flexShrink: 0 }}>Filter by</InputLabel>
        <MenuList ref={listRef} autoFocusItem aria-label="Columns" sx={LIST_SX}>
          {COLUMNS.map((c) => {
            const empty = columnIsEmpty?.(c.key) ?? false
            return (
              <MenuItem
                key={c.key}
                dense
                // MenuList focuses the selected item: the type you came back from.
                selected={c.key === lastColumn}
                onClick={() => onPick(c.key)}
                // Pick on Space key-down: immediate, no page scroll, and independent of MUI's
                // key-up click and MenuList's type-ahead.
                onKeyDown={(e) => {
                  if (e.key === " ") {
                    e.preventDefault()
                    e.stopPropagation()
                    onPick(c.key)
                  }
                }}
                title={empty ? NO_ROWS_COLUMN : undefined}
              >
                <ListItemText primary={c.label} slotProps={{ primary: { ...OPTION_TEXT, color: empty ? NO_ROWS_COLOR : undefined } }} />
              </MenuItem>
            )
          })}
        </MenuList>
        {footer}
      </Stack>
    </Box>
  )
}

/**
 * Editing a filter: a ▾ beside the type label to switch the filter to another type. Switching resets
 * the criteria (operator back to "is any of", no values) and shows the new type's values — the
 * combo box remounts per column, so focus lands in its field.
 */
function ChangeTypeMenu({
  column,
  columnIsEmpty,
  onChange,
}: {
  column: ColumnKey
  columnIsEmpty?: (column: ColumnKey) => boolean
  onChange: (column: ColumnKey) => void
}) {
  const [anchor, setAnchor] = React.useState<HTMLElement | null>(null)
  return (
    <>
      <IconButton
        size="small"
        aria-label="Change filter type"
        aria-haspopup="menu"
        aria-expanded={Boolean(anchor)}
        onClick={(e) => setAnchor(e.currentTarget)}
        sx={{ padding: "4px", marginLeft: "-2px" }}
      >
        <CaretDownIcon size={14} />
      </IconButton>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        // Focus goes to the new type's criteria field, not back to this button.
        disableRestoreFocus
        slotProps={{ list: { dense: true, "aria-label": "Filter type" } }}
      >
        {COLUMNS.map((c) => {
          const empty = c.key !== column && (columnIsEmpty?.(c.key) ?? false)
          return (
            <MenuItem
              key={c.key}
              dense
              selected={c.key === column}
              title={empty ? NO_ROWS_COLUMN : undefined}
              onClick={() => {
                setAnchor(null)
                if (c.key !== column) onChange(c.key)
              }}
            >
              <ListItemText primary={c.label} slotProps={{ primary: { ...OPTION_TEXT, color: empty ? NO_ROWS_COLOR : undefined } }} />
            </MenuItem>
          )
        })}
      </Menu>
    </>
  )
}

/** Criteria entry for a comparator: chip combobox (multi), one or two value fields, or nothing. */
function CriteriaInput({
  column,
  comparator,
  values,
  onChange,
  returnsNoRows,
  onOperatorText,
  autoFocus,
}: {
  column: ColumnKey
  comparator: Comparator
  values: string[]
  onChange: (values: string[]) => void
  returnsNoRows?: (value: string) => boolean
  /** Basic filter: typed operator symbols switch the operator (see applyTypedOperator). */
  onOperatorText?: (text: string) => boolean
  autoFocus?: boolean
}) {
  const col = COLUMN_MAP[column]
  const arity = COMPARATOR_MAP[comparator].arity
  if (arity === "none") {
    return (
      <Text variant="caption" color={colors.content.dark}>
        No value needed
      </Text>
    )
  }
  if (arity === "multi") {
    return <ValuesCombobox column={column} values={values} onChange={onChange} returnsNoRows={returnsNoRows} />
  }
  const unit = col.type === "duration" ? " (sec)" : col.type === "percent" ? " (%)" : col.type === "date" ? " (YYYY-MM-DD)" : ""
  const field = (i: number, label: string) => (
    <ValueField
      column={column}
      label={`${label}${unit}`}
      value={values[i] ?? ""}
      autoFocus={autoFocus && i === 0}
      onOperatorText={i === 0 ? onOperatorText : undefined}
      inlineSuggestions={Boolean(onOperatorText)}
      onChange={(v) => {
        const next = [...values]
        next[i] = v
        onChange(next)
      }}
    />
  )
  if (arity === "one" || arity === "single") return field(0, "Value")
  return (
    <Stack direction="row" spacing={1}>
      {field(0, "From")}
      {field(1, "To")}
    </Stack>
  )
}

/** Multi-select Autocomplete: picks accumulate as chips; typed values not in the list are allowed. */
function ValuesCombobox({
  column,
  values,
  onChange,
  returnsNoRows,
}: {
  column: ColumnKey
  values: string[]
  onChange: (values: string[]) => void
  returnsNoRows?: (value: string) => boolean
}) {
  const col = COLUMN_MAP[column]
  const options = React.useMemo(() => distinctValues(column), [column])
  return (
    <Autocomplete<string, true, false, true>
      multiple
      freeSolo
      fullWidth
      size="small"
      disableCloseOnSelect
      limitTags={2}
      slotProps={{ listbox: { sx: LISTBOX_SX } }}
      options={options}
      value={values}
      onChange={(_, next) => onChange(next)}
      getOptionLabel={(v) => formatCriterion(col, v)}
      // Autocomplete options are plain <li> elements carrying MUI's option props (the documented pattern).
      renderOption={({ key, ...props }, option, { selected }) => {
        const empty = returnsNoRows?.(option) ?? false
        return (
          <li key={key} {...props} title={empty ? NO_ROWS : undefined}>
            <Checkbox size="small" checked={selected} tabIndex={-1} />
            <ListItemText primary={formatCriterion(col, option)} slotProps={{ primary: { ...OPTION_TEXT, color: empty ? NO_ROWS_COLOR : undefined } }} />
          </li>
        )
      }}
      renderInput={(params) => <TextField {...params} size="small" sx={FIELD_SX} placeholder={values.length ? "" : `Select ${col.label.toLowerCase()}…`} />}
    />
  )
}

/** Single value for >, <, between: type any value or pick one of the column's existing values. */
function ValueField({
  column,
  label,
  value,
  onChange,
  onOperatorText,
  inlineSuggestions = false,
  autoFocus,
}: {
  column: ColumnKey
  label: string
  value: string
  onChange: (value: string) => void
  onOperatorText?: (text: string) => boolean
  /** Basic panel: suggestions in the panel's flow, so they push the buttons down, not cover them. */
  inlineSuggestions?: boolean
  autoFocus?: boolean
}) {
  const col = COLUMN_MAP[column]
  const options = React.useMemo(() => distinctValues(column), [column])
  const rootRef = React.useRef<HTMLDivElement>(null)
  // Inline suggestions stay open on blur. Otherwise pressing a panel button blurs the field, the
  // list collapses, the button moves up before the mouse is released, and the click never lands.
  const [suggestionsOpen, setSuggestionsOpen] = React.useState(false)
  // Focus with the caret at the end — this field can appear mid-typing, when a typed ">" or "<="
  // switched the operator and carried the rest of the text over.
  React.useEffect(() => {
    if (!autoFocus) return
    const frame = requestAnimationFrame(() => {
      const input = rootRef.current?.querySelector("input")
      if (!input) return
      input.focus()
      input.setSelectionRange(input.value.length, input.value.length)
    })
    return () => cancelAnimationFrame(frame)
  }, [autoFocus])
  return (
    <Autocomplete<string, false, false, true>
      ref={rootRef}
      freeSolo
      fullWidth
      size="small"
      // Suggestions open when you type, click the field or press ↓ — not on focus. Nothing is
      // pre-highlighted (staff's theme turns autoHighlight on), so Enter uses what you typed unless
      // you arrowed to a suggestion.
      autoHighlight={false}
      slots={inlineSuggestions ? { popper: InlineSuggestions } : undefined}
      {...(inlineSuggestions
        ? {
            open: suggestionsOpen,
            onOpen: () => setSuggestionsOpen(true),
            onClose: (_: React.SyntheticEvent, reason: string) => {
              if (reason !== "blur") setSuggestionsOpen(false)
            },
          }
        : {})}
      slotProps={{ listbox: { sx: LISTBOX_SX } }}
      options={options}
      inputValue={value}
      onInputChange={(_, v, reason) => {
        if (reason === "input" && onOperatorText?.(v)) return
        onChange(v)
      }}
      filterOptions={(opts, { inputValue }) => {
        const q = inputValue.trim().toLowerCase()
        return q ? opts.filter((o) => o.toLowerCase().includes(q) || formatCriterion(col, o).toLowerCase().includes(q)) : opts
      }}
      renderOption={({ key, ...props }, option) => (
        <li key={key} {...props}>
          <ListItemText primary={formatCriterion(col, option)} slotProps={{ primary: OPTION_TEXT }} />
        </li>
      )}
      renderInput={(params) => <TextField {...params} size="small" sx={FIELD_SX} placeholder={label} slotProps={{ htmlInput: { ...params.inputProps, "aria-label": label } }} />}
    />
  )
}

/**
 * An Autocomplete "popper" that renders its suggestions in the panel's flow (below the field)
 * instead of floating over the panel — where they covered the Cancel / Add filter buttons.
 */
function InlineSuggestions(props: PopperProps) {
  const { open, children, className, role, id } = props
  if (!open) return null
  return (
    <Box className={className} role={role} id={id} sx={{ position: "static", width: "100%", marginTop: 0.5 }}>
      {typeof children === "function" ? null : children}
    </Box>
  )
}

/** One advanced criteria line: [Where | and/or] [type] [operator] [criteria] [delete]. */
function ConditionRow({
  index,
  row,
  onJoin,
  onColumn,
  onComparator,
  onValues,
  onRemove,
  returnsNoRows,
  columnReturnsNoRows,
}: {
  index: number
  row: Row
  onJoin: (join: Join) => void
  onColumn: (column: ColumnKey) => void
  onComparator: (comparator: Comparator) => void
  onValues: (values: string[]) => void
  onRemove?: () => void
  returnsNoRows?: (value: string) => boolean
  columnReturnsNoRows?: (column: ColumnKey) => boolean
}) {
  return (
    <Grid container columns={24} spacing={1} role="group" aria-label={`Condition ${index + 1}`}>
      <Grid size={{ xs: 6, sm: 3 }}>
        {index === 0 ? (
          <Text variant="body2" color={colors.content.dark} sx={{ lineHeight: "32px" }}>
            Where
          </Text>
        ) : (
          <TextField select fullWidth size="small" sx={FIELD_SX} value={row.join} onChange={(e) => onJoin(e.target.value as Join)} slotProps={{ htmlInput: { "aria-label": "And / or" } }}>
            <MenuItem value="and">and</MenuItem>
            <MenuItem value="or">or</MenuItem>
          </TextField>
        )}
      </Grid>
      <Grid size={{ xs: 18, sm: 5 }}>
        <TextField
          select
          fullWidth
          size="small"
          sx={FIELD_SX}
          value={row.column ?? ""}
          onChange={(e) => onColumn(e.target.value as ColumnKey)}
          slotProps={{
            htmlInput: { "aria-label": "Filter type" },
            select: { displayEmpty: true, renderValue: (v) => (v ? COLUMN_MAP[v as ColumnKey].label : "Type…") },
          }}
        >
          {COLUMNS.map((c) => {
            const empty = columnReturnsNoRows?.(c.key) ?? false
            return (
              <MenuItem key={c.key} value={c.key} title={empty ? NO_ROWS_COLUMN : undefined}>
                <ListItemText primary={c.label} slotProps={{ primary: { ...OPTION_TEXT, color: empty ? NO_ROWS_COLOR : undefined } }} />
              </MenuItem>
            )
          })}
        </TextField>
      </Grid>
      <Grid size={{ xs: 10, sm: 5 }}>
        {row.column ? (
          <ComparatorSelect column={row.column} value={row.comparator} onChange={onComparator} fullWidth />
        ) : (
          <TextField select fullWidth size="small" sx={FIELD_SX} disabled value="" slotProps={{ select: { displayEmpty: true, renderValue: () => "Operator" } }}>
            <MenuItem value="">Operator</MenuItem>
          </TextField>
        )}
      </Grid>
      <Grid size={{ xs: 12, sm: 10 }}>
        {row.column ? (
          <CriteriaInput column={row.column} comparator={row.comparator} values={row.values} onChange={onValues} returnsNoRows={returnsNoRows} />
        ) : (
          <Text variant="body2" color={colors.content.dark} sx={{ lineHeight: "32px" }}>
            Pick a type first
          </Text>
        )}
      </Grid>
      <Grid size={{ xs: 2, sm: 1 }}>
        {onRemove ? (
          <IconButton size="small" aria-label={`Remove condition ${index + 1}`} onClick={onRemove}>
            <TrashIcon size={16} />
          </IconButton>
        ) : null}
      </Grid>
    </Grid>
  )
}

function ComparatorSelect({
  column,
  value,
  onChange,
  fullWidth,
}: {
  column: ColumnKey
  value: Comparator
  onChange: (v: Comparator) => void
  fullWidth?: boolean
}) {
  return (
    <TextField
      select
      size="small"
      sx={FIELD_SX}
      fullWidth={fullWidth}
      value={value}
      onChange={(e) => onChange(e.target.value as Comparator)}
      slotProps={{ htmlInput: { "aria-label": "Operator" } }}
    >
      {comparatorsFor(COLUMN_MAP[column]).map((c) => (
        <MenuItem key={c.value} value={c.value}>
          {c.label}
        </MenuItem>
      ))}
    </TextField>
  )
}

function SearchFilterEditor({
  initial,
  onSubmit,
  onCancel,
}: {
  initial: Filter
  onSubmit: (d: FilterDraft) => void
  onCancel: () => void
}) {
  const [text, setText] = React.useState(initial.values[0] ?? "")
  return (
    <Box
      component="form"
      sx={{ width: BASIC_WIDTH }}
      onSubmit={(e: React.FormEvent) => {
        e.preventDefault()
        if (text.trim()) onSubmit({ ...initial, values: [text.trim()] })
      }}
    >
      <Stack spacing={1.5}>
        <Stack spacing={0.5}>
          <InputLabel htmlFor="search-filter-text">Search text</InputLabel>
          <TextField id="search-filter-text" size="small" sx={FIELD_SX} value={text} onChange={(e) => setText(e.target.value)} autoFocus fullWidth helperText="Matches rows containing every word, in any column." />
        </Stack>
        <Box sx={BAR_SX}>
          <span />
          <Button variant="outlined" size="small" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="contained" size="small" type="submit" disabled={!text.trim()}>
            Save filter
          </Button>
        </Box>
      </Stack>
    </Box>
  )
}
