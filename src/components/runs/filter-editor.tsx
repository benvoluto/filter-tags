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
  ListItemIcon,
  Radio,
  ListItemText,
  MenuItem,
  MenuList,
  Stack,
  TextField,
  type SxProps,
  type Theme,
} from "@mui/material"
import { ArrowLeftIcon, PlusIcon, SlidersHorizontalIcon, TrashIcon } from "@phosphor-icons/react"

import { Text, colors } from "common"
import { POPOVER_FIELD_MINIMUM_WIDTH } from "@/vivaa/staff/components/FiltersV2/constants"

import { COLUMNS, COLUMN_MAP, distinctValues, formatCriterion, type ColumnKey } from "@/lib/data"
import {
  COMPARATOR_MAP,
  MAX_CONDITIONS,
  comparatorsFor,
  conditionsOf,
  type Comparator,
  type Filter,
  type Join,
} from "@/lib/filters"
import { useFilterProbe } from "./filter-probe"
import { usePanelMaxHeight, useRepositionPopover } from "./filter-popover"

/*
 * The filter editor: what opens inside staff's filter popover (FilterChipAndPopover, or
 * HeaderFilterPopover for column headers), which supplies the 16px padding and the border/shadow.
 * Styled the way staff's FiltersV2 fields are: small MUI fields at POPOVER_FIELD_MINIMUM_WIDTH,
 * labels as InputLabel (staff's FormField), Phosphor icons at 16px in gray[45], `sx` for layout.
 */

/** Basic panel: staff's popover field width. Advanced: wide enough for a five-part condition row. */
const BASIC_WIDTH = POPOVER_FIELD_MINIMUM_WIDTH
const ADVANCED_WIDTH = "min(48rem, calc(100vw - 64px))"

/**
 * Staff's theme pads `.MuiSelect-select` to 2px 14px, so a small select is ~24px tall. In this panel
 * selects sit beside 32px autocompletes, so they are padded to staff's FILTER_HEIGHT (32px).
 */
const SELECT_SX: SxProps<Theme> = { "& .MuiSelect-select": { paddingY: "6px" } }

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

/** One-line list rows at the panel's 14px (staff's small-field size). */
const OPTION_TEXT = { variant: "body2" as const, noWrap: true }

/** Suggestion dropdowns: short, so they don't run past the panel. */
const LISTBOX_SX: SxProps<Theme> = { maxHeight: 220 }

/** Scrolling value/column lists bleed to the popover edges, ruled top and bottom. */
const LIST_SX: SxProps<Theme> = {
  maxHeight: 260,
  minHeight: 0,
  overflowY: "auto",
  marginX: -2,
  paddingY: 0.5,
  borderTop: `1px solid ${colors.border.light}`,
  borderBottom: `1px solid ${colors.border.light}`,
}

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

const NO_ROWS = "No rows match this with the current filters"
const NO_ROWS_COLUMN = "Every value here would return no rows with the current filters"

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
  const changeColumn = (i: number, column: ColumnKey) => updateRow(i, { column, comparator: "is", values: [] })
  const changeComparator = (i: number, comparator: Comparator) =>
    setRows((rs) =>
      rs.map((r, j) => {
        if (j !== i) return r
        const from = COMPARATOR_MAP[r.comparator].arity
        const to = COMPARATOR_MAP[comparator].arity
        if (from === to) return { ...r, comparator }
        // "is any of" ↔ "equals" pick from the same list: carry the selection over (one value for equals).
        const listPicks = (a: string) => a === "multi" || a === "single"
        if (listPicks(from) && listPicks(to)) return { ...r, comparator, values: to === "single" ? r.values.slice(0, 1) : r.values }
        return { ...r, comparator, values: [] }
      })
    )

  const active = advanced ? rows : rows.slice(0, 1)
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
    if (!advanced) setAdvanced(true)
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

  // ── Basic, step 1: pick the column (MenuList: arrows, type-ahead, Space/Enter to choose) ──
  const row = rows[0]
  if (!row.column) {
    const columnIsEmpty = columnReturnsNoRowsFor(0)
    return (
      <Box ref={panelRef} sx={{ width: BASIC_WIDTH }}>
        <Stack spacing={1} sx={panelStackSx(maxHeight)}>
          <InputLabel sx={{ flexShrink: 0 }}>Filter by</InputLabel>
          <MenuList autoFocusItem aria-label="Columns" sx={LIST_SX}>
            {COLUMNS.map((c) => {
              const empty = columnIsEmpty?.(c.key) ?? false
              return (
                <MenuItem key={c.key} dense onClick={() => changeColumn(0, c.key)} title={empty ? NO_ROWS_COLUMN : undefined}>
                  <ListItemText primary={c.label} slotProps={{ primary: { ...OPTION_TEXT, color: empty ? "warning" : undefined } }} />
                </MenuItem>
              )
            })}
          </MenuList>
          <Box sx={BAR_SX}>
            {advancedButton}
            <Button variant="outlined" size="small" onClick={onCancel}>
              Cancel
            </Button>
          </Box>
        </Stack>
      </Box>
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
        submit([row])
      }}
      // Enter anywhere in the panel adds the filter (buttons keep their own Enter behaviour).
      onKeyDown={(e: React.KeyboardEvent) => {
        const target = e.target as HTMLElement
        if (e.key === "Enter" && (arity === "multi" || arity === "single") && !target.closest("button")) {
          e.preventDefault()
          submit([row])
        }
      }}
    >
      <Stack spacing={1.5} sx={panelStackSx(maxHeight)}>
        <Box sx={BAR_SX}>
          <Stack direction="row" alignItems="center" spacing={0.75} sx={{ minWidth: 0 }}>
            {!fixedColumn && !initial ? (
              <IconButton size="small" aria-label="Choose a different column" onClick={() => updateRow(0, { column: null, comparator: "is", values: [] })}>
                <ArrowLeftIcon size={16} />
              </IconButton>
            ) : null}
            <InputLabel sx={{ overflow: "hidden", textOverflow: "ellipsis" }}>{COLUMN_MAP[column].label} filter</InputLabel>
          </Stack>
          <ComparatorSelect column={column} value={row.comparator} onChange={(c) => changeComparator(0, c)} />
        </Box>

        {arity === "multi" || arity === "single" ? (
          <ValueList
            single={arity === "single"}
            column={column}
            values={row.values}
            onChange={(values) => updateRow(0, { values })}
            onCommit={() => submit([row])}
            returnsNoRows={returnsNoRowsFor(0)}
          />
        ) : (
          <CriteriaInput column={column} comparator={row.comparator} values={row.values} onChange={(values) => updateRow(0, { values })} autoFocus />
        )}

        {actions}
      </Stack>
    </Box>
  )
}

/** Basic multi-select: a MenuList of checkable values. Space toggles, Enter adds the filter. */
function ValueList({
  single = false,
  column,
  values,
  onChange,
  onCommit,
  returnsNoRows,
}: {
  /** "equals": exactly one value — radios, and picking one replaces the last. */
  single?: boolean
  column: ColumnKey
  values: string[]
  onChange: (values: string[]) => void
  onCommit: () => void
  returnsNoRows?: (value: string) => boolean
}) {
  const col = COLUMN_MAP[column]
  const options = React.useMemo(() => distinctValues(column), [column])
  const lower = values.map((v) => v.toLowerCase())
  const toggle = (v: string) => {
    if (single) return onChange([v])
    const idx = lower.indexOf(v.toLowerCase())
    onChange(idx >= 0 ? values.filter((_, i) => i !== idx) : [...values, v])
  }
  return (
    <MenuList
      autoFocusItem
      aria-label={`${col.label} values`}
      sx={LIST_SX}
      // Enter on a value submits the whole filter instead of toggling it.
      onKeyDownCapture={(e) => {
        if (e.key === "Enter") {
          e.preventDefault()
          e.stopPropagation()
          onCommit()
        }
      }}
    >
      {options.map((o) => {
        const checked = lower.includes(o.toLowerCase())
        const empty = returnsNoRows?.(o) ?? false
        return (
          <MenuItem key={o} dense role={single ? "menuitemradio" : "menuitemcheckbox"} aria-checked={checked} onClick={() => toggle(o)} title={empty ? NO_ROWS : undefined}>
            <ListItemIcon>
              {single ? <Radio size="small" checked={checked} tabIndex={-1} /> : <Checkbox size="small" checked={checked} tabIndex={-1} />}
            </ListItemIcon>
            <ListItemText primary={formatCriterion(col, o)} slotProps={{ primary: { ...OPTION_TEXT, color: empty ? "warning" : undefined } }} />
            {empty ? <NoRowsHint /> : null}
          </MenuItem>
        )
      })}
    </MenuList>
  )
}

/** Trailing "0 rows" on a value that would empty the table (the row's tooltip says why). */
function NoRowsHint() {
  return (
    <Text variant="caption" color="warning" component="span" sx={{ marginLeft: 1, flexShrink: 0 }}>
      0 rows
    </Text>
  )
}

/** Criteria entry for a comparator: chip combobox (multi), one or two value fields, or nothing. */
function CriteriaInput({
  column,
  comparator,
  values,
  onChange,
  returnsNoRows,
  autoFocus,
}: {
  column: ColumnKey
  comparator: Comparator
  values: string[]
  onChange: (values: string[]) => void
  returnsNoRows?: (value: string) => boolean
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
            <ListItemText primary={formatCriterion(col, option)} slotProps={{ primary: { ...OPTION_TEXT, color: empty ? "warning" : undefined } }} />
            {empty ? <NoRowsHint /> : null}
          </li>
        )
      }}
      renderInput={(params) => <TextField {...params} size="small" placeholder={values.length ? "" : `Select ${col.label.toLowerCase()}…`} />}
    />
  )
}

/** Single value for >, <, between: type any value or pick one of the column's existing values. */
function ValueField({
  column,
  label,
  value,
  onChange,
  autoFocus,
}: {
  column: ColumnKey
  label: string
  value: string
  onChange: (value: string) => void
  autoFocus?: boolean
}) {
  const col = COLUMN_MAP[column]
  const options = React.useMemo(() => distinctValues(column), [column])
  return (
    <Autocomplete<string, false, false, true>
      freeSolo
      fullWidth
      size="small"
      // Suggestions open when you type, click the field or press ↓ — not on focus, where they
      // dropped over the panel's buttons the moment a > / < / between operator was picked.
      slotProps={{ listbox: { sx: LISTBOX_SX } }}
      options={options}
      inputValue={value}
      onInputChange={(_, v) => onChange(v)}
      filterOptions={(opts, { inputValue }) => {
        const q = inputValue.trim().toLowerCase()
        return q ? opts.filter((o) => o.toLowerCase().includes(q) || formatCriterion(col, o).toLowerCase().includes(q)) : opts
      }}
      renderOption={({ key, ...props }, option) => (
        <li key={key} {...props}>
          <ListItemText primary={formatCriterion(col, option)} slotProps={{ primary: OPTION_TEXT }} />
        </li>
      )}
      renderInput={(params) => <TextField {...params} size="small" placeholder={label} slotProps={{ htmlInput: { ...params.inputProps, "aria-label": label } }} autoFocus={autoFocus} />}
    />
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
          <TextField select fullWidth size="small" sx={SELECT_SX} value={row.join} onChange={(e) => onJoin(e.target.value as Join)} slotProps={{ htmlInput: { "aria-label": "And / or" } }}>
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
          sx={SELECT_SX}
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
                <ListItemText primary={c.label} slotProps={{ primary: { ...OPTION_TEXT, color: empty ? "warning" : undefined } }} />
              </MenuItem>
            )
          })}
        </TextField>
      </Grid>
      <Grid size={{ xs: 10, sm: 5 }}>
        {row.column ? (
          <ComparatorSelect column={row.column} value={row.comparator} onChange={onComparator} fullWidth />
        ) : (
          <TextField select fullWidth size="small" sx={SELECT_SX} disabled value="" slotProps={{ select: { displayEmpty: true, renderValue: () => "Operator" } }}>
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
      sx={SELECT_SX}
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
          <TextField id="search-filter-text" size="small" value={text} onChange={(e) => setText(e.target.value)} autoFocus fullWidth helperText="Matches rows containing every word, in any column." />
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
