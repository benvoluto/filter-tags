"use client"

import * as React from "react"
import { ArrowLeftIcon, PlusIcon, SlidersHorizontalIcon, Trash2Icon, XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { COLUMN_ICONS } from "@/lib/column-icons"
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
import { cn } from "@/lib/utils"
import { CriteriaCombobox, ValueField } from "./criteria-combobox"
import { useFilterProbe } from "./filter-probe"

export type FilterDraft = Omit<Filter, "id">

type FilterEditorProps = {
  /** Existing filter when editing a chip. */
  initial?: Filter
  /** Column preselected (column-header / partial-filter entry points). Omit to show the column picker first. */
  column?: ColumnKey
  onSubmit: (draft: FilterDraft) => void
  onCancel: () => void
}

/** One criteria item in the editor. `column` is null until a type is picked. */
type Row = { key: string; join: Join; column: ColumnKey | null; comparator: Comparator; values: string[] }
type ReadyRow = Row & { column: ColumnKey }

let rowSeq = 0
function newRow(partial: Partial<Row> = {}): Row {
  rowSeq += 1
  return { key: `row${rowSeq}`, join: "and", column: null, comparator: "is", values: [], ...partial }
}

function rowComplete(r: Row): r is ReadyRow {
  if (!r.column) return false
  const arity = COMPARATOR_MAP[r.comparator].arity
  if (arity === "none") return true
  return r.values.filter(Boolean).length > 0
}

/** Build a filter draft from editor rows (first row = the filter itself, the rest = `extra`). */
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

/**
 * Keyboard helper for cmdk inputs: Space picks the highlighted item when the query is empty or
 * the user has arrowed to an item (otherwise it types a space, so "Run ID" can still be typed).
 */
function useSpaceToSelect(query: string) {
  const navigated = React.useRef(false)
  React.useEffect(() => {
    navigated.current = false
  }, [query])
  return (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") navigated.current = true
    if (e.key !== " " || (query !== "" && !navigated.current)) return
    const item = highlightedItem(e.currentTarget)
    if (!item) return
    e.preventDefault()
    item.click()
  }
}

function highlightedItem(input: HTMLElement) {
  return input.closest("[cmdk-root]")?.querySelector<HTMLElement>('[cmdk-item][data-selected="true"]') ?? null
}

function KeyboardHint({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-1 text-[11px] text-muted-foreground [@media(hover:none)]:hidden [&_kbd]:rounded [&_kbd]:border [&_kbd]:border-border [&_kbd]:bg-muted [&_kbd]:px-1 [&_kbd]:font-sans [&_kbd]:text-[10px] [&_kbd]:font-medium">
      {children}
    </p>
  )
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
  const [columnQuery, setColumnQuery] = React.useState("")
  const [confirmBasic, setConfirmBasic] = React.useState(false)
  const probe = useFilterProbe()
  const columnKeyDown = useSpaceToSelect(columnQuery)

  const updateRow = (i: number, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)))
  const changeColumn = (i: number, column: ColumnKey) => updateRow(i, { column, comparator: "is", values: [] })
  const changeComparator = (i: number, comparator: Comparator) =>
    setRows((rs) =>
      rs.map((r, j) => {
        if (j !== i) return r
        // Keep values only when the shape of the input stays the same.
        const same = COMPARATOR_MAP[comparator].arity === COMPARATOR_MAP[r.comparator].arity
        return { ...r, comparator, values: same ? r.values : [] }
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

  const toBasic = () => {
    setRows((rs) => rs.slice(0, 1))
    setAdvanced(false)
    setConfirmBasic(false)
  }
  const toggleAdvanced = () => {
    if (!advanced) setAdvanced(true)
    // Leaving advanced with several lines would drop all but the first: confirm first.
    else if (rows.length > 1) setConfirmBasic(true)
    else toBasic()
  }

  const advancedButton = (
    <Button
      type="button"
      variant={advanced ? "secondary" : "outline"}
      size="sm"
      onClick={toggleAdvanced}
    >
      <SlidersHorizontalIcon />
      {advanced ? "Basic filter" : "Advanced filter"}
    </Button>
  )

  const footer = (
    <div className="flex flex-wrap items-center gap-2 pt-1">
      {advancedButton}
      <div className="ml-auto flex gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={!canSubmit}>
          {initial ? "Save filter" : "Add filter"}
        </Button>
      </div>
    </div>
  )

  // ── Advanced: up to 10 criteria items joined with and/or ─────────────────────────────────────
  if (advanced) {
    const joins = new Set(rows.slice(1).map((r) => r.join))
    return (
      <form
        className="flex w-[44rem] max-w-full flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault()
          submit(rows)
        }}
      >
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-[13px] font-semibold">
            <SlidersHorizontalIcon className="size-3.5 text-muted-foreground" aria-hidden />
            Advanced filter
          </span>
          <span className="ml-auto text-xs text-muted-foreground tabular-nums">
            {rows.length} of {MAX_CONDITIONS} conditions
          </span>
        </div>

        <div className="-mx-1 flex max-h-[min(60vh,28rem)] flex-col gap-2 overflow-y-auto px-1 py-0.5">
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
              autoFocus={i === rows.length - 1 && i > 0}
            />
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={rows.length >= MAX_CONDITIONS}
            onClick={() => setRows((rs) => [...rs, newRow({ join: rs[rs.length - 1]?.join ?? "and" })])}
          >
            <PlusIcon />
            Add condition
          </Button>
          {joins.size > 1 ? (
            <p className="text-[11px] text-muted-foreground">AND conditions are evaluated before OR.</p>
          ) : null}
        </div>

        {footer}

        <Dialog open={confirmBasic} onOpenChange={setConfirmBasic}>
          <DialogContent role="alertdialog" showCloseButton={false} className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Switch to a basic filter?</DialogTitle>
              <DialogDescription>
                A basic filter has a single type–operator–criteria line. Only the first line
                {rowText(rows[0]) ? <> (<span className="font-medium text-foreground">{rowText(rows[0])}</span>)</> : null} will
                be kept; the other {rows.length - 1} {rows.length - 1 === 1 ? "line" : "lines"} will be removed.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button type="button" variant="outline" autoFocus onClick={() => setConfirmBasic(false)}>
                Keep advanced
              </Button>
              <Button type="button" variant="destructive" onClick={toBasic}>
                Keep first line only
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </form>
    )
  }

  // ── Basic, step 1: pick the filter type (column) ──────────────────────────────────────────────
  const row = rows[0]
  if (!row.column) {
    return (
      <div className="flex w-[22rem] max-w-full flex-col gap-2">
        <Command className="rounded-[0.2em]! border border-border bg-background p-0">
          <CommandInput
            placeholder="Select or type a column…"
            autoFocus
            value={columnQuery}
            onValueChange={setColumnQuery}
            onKeyDown={columnKeyDown}
          />
          <CommandList className="max-h-64">
            <CommandEmpty>No matching columns.</CommandEmpty>
            <CommandGroup>
              {COLUMNS.map((c) => {
                const Icon = COLUMN_ICONS[c.key]
                return (
                  <CommandItem key={c.key} value={c.label} onSelect={() => changeColumn(0, c.key)}>
                    <Icon className="text-muted-foreground" />
                    <span className="flex-1">{c.label}</span>
                    <span className="text-xs text-muted-foreground">{c.type}</span>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
        <KeyboardHint>
          <kbd>↑</kbd>
          <kbd>↓</kbd> choose · <kbd>Space</kbd> select · <kbd>Esc</kbd> cancel
        </KeyboardHint>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {advancedButton}
          <Button variant="ghost" size="sm" className="ml-auto" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  // ── Basic, step 2: operator + criteria list ───────────────────────────────────────────────────
  const column = row.column
  const col = COLUMN_MAP[column]
  const Icon = COLUMN_ICONS[column]
  return (
    <form
      className="flex w-[22rem] max-w-full flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault()
        submit([row])
      }}
    >
      <div className="flex items-center gap-2">
        {!fixedColumn && !initial ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Choose a different column"
            onClick={() => updateRow(0, { column: null, comparator: "is", values: [] })}
          >
            <ArrowLeftIcon />
          </Button>
        ) : null}
        <span className="flex min-w-0 items-center gap-1.5 text-[13px] font-semibold">
          <Icon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
          <span className="truncate">{col.label} filter</span>
        </span>
        <ComparatorSelect
          column={column}
          value={row.comparator}
          onChange={(c) => changeComparator(0, c)}
          className="ml-auto"
        />
      </div>

      <CriteriaInput
        column={column}
        comparator={row.comparator}
        values={row.values}
        onChange={(values) => updateRow(0, { values })}
        onCommit={(values) => {
          const next = { ...row, values }
          if (rowComplete(next)) submit([next])
          else updateRow(0, { values })
        }}
        returnsNoRows={returnsNoRowsFor(0)}
        autoFocus
      />

      {COMPARATOR_MAP[row.comparator].arity === "multi" ? (
        <KeyboardHint>
          <kbd>↑</kbd>
          <kbd>↓</kbd> choose · <kbd>Space</kbd> add · <kbd>Enter</kbd> {initial ? "save" : "add"} filter ·{" "}
          <kbd>Esc</kbd> cancel
        </KeyboardHint>
      ) : null}

      {footer}
    </form>
  )
}

/** Short text for a criteria line, e.g. "Status equals Failed, Running" (empty if no type yet). */
function rowText(row: Row): string {
  if (!row.column) return ""
  const col = COLUMN_MAP[row.column]
  const cmp = COMPARATOR_MAP[row.comparator]
  const vals = row.values.filter(Boolean).map((v) => formatCriterion(col, v))
  return [col.label, cmp.label, vals.join(cmp.arity === "two" ? " and " : ", ")].filter(Boolean).join(" ")
}

/** One advanced criteria item: [Where | and/or] [type] [operator] [criteria] [delete]. */
function ConditionRow({
  index,
  row,
  onJoin,
  onColumn,
  onComparator,
  onValues,
  onRemove,
  returnsNoRows,
  autoFocus,
}: {
  index: number
  row: Row
  onJoin: (join: Join) => void
  onColumn: (column: ColumnKey) => void
  onComparator: (comparator: Comparator) => void
  onValues: (values: string[]) => void
  onRemove?: () => void
  returnsNoRows?: (value: string) => boolean
  autoFocus?: boolean
}) {
  return (
    <div role="group" aria-label={`Condition ${index + 1}`} className="flex flex-wrap items-center gap-2">
      <div className="w-16 shrink-0">
        {index === 0 ? (
          <span className="pl-2 text-xs font-medium text-muted-foreground">Where</span>
        ) : (
          <JoinSelect value={row.join} onChange={onJoin} />
        )}
      </div>
      <ColumnSelect value={row.column} onChange={onColumn} autoFocus={autoFocus} className="w-36 shrink-0" />
      {row.column ? (
        <ComparatorSelect
          column={row.column}
          value={row.comparator}
          onChange={onComparator}
          className="w-36 min-w-0 shrink-0"
        />
      ) : (
        <button
          type="button"
          disabled
          aria-label="Operator (pick a type first)"
          className="flex h-7 w-36 shrink-0 items-center rounded-[min(var(--radius-md),10px)] border border-input px-2.5 text-sm text-muted-foreground opacity-50"
        >
          Operator
        </button>
      )}
      <div className="min-w-48 flex-1">
        {row.column ? (
          <CriteriaInput
            column={row.column}
            comparator={row.comparator}
            values={row.values}
            onChange={onValues}
            returnsNoRows={returnsNoRows}
            variant="combobox"
          />
        ) : (
          <div className="flex h-8 items-center rounded-lg border border-dashed border-input px-2.5 text-[13px] text-muted-foreground">
            Pick a type first
          </div>
        )}
      </div>
      {onRemove ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Remove condition ${index + 1}`}
          onClick={onRemove}
          className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2Icon />
        </Button>
      ) : (
        <span className="w-7 shrink-0" aria-hidden />
      )}
    </div>
  )
}

const JOIN_ITEMS = [
  { value: "and", label: "and" },
  { value: "or", label: "or" },
]

function JoinSelect({ value, onChange }: { value: Join; onChange: (join: Join) => void }) {
  return (
    <Select items={JOIN_ITEMS} value={value} onValueChange={(v) => v && onChange(v as Join)}>
      <SelectTrigger size="sm" className="w-full" aria-label="And / or">
        <SelectValue />
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false} align="start">
        {JOIN_ITEMS.map((i) => (
          <SelectItem key={i.value} value={i.value}>
            {i.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

const COLUMN_ITEMS = COLUMNS.map((c) => ({ value: c.key, label: c.label }))

function ColumnSelect({
  value,
  onChange,
  autoFocus,
  className,
}: {
  value: ColumnKey | null
  onChange: (column: ColumnKey) => void
  autoFocus?: boolean
  className?: string
}) {
  const Icon = value ? COLUMN_ICONS[value] : null
  return (
    <Select items={COLUMN_ITEMS} value={value} onValueChange={(v) => v && onChange(v as ColumnKey)}>
      <SelectTrigger size="sm" className={cn("min-w-0", className)} aria-label="Filter type" autoFocus={autoFocus}>
        {Icon ? <Icon className="size-3.5 text-muted-foreground" /> : null}
        <SelectValue placeholder="Type…" className="flex-1 text-left" />
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false} align="start">
        {COLUMNS.map((c) => {
          const ItemIcon = COLUMN_ICONS[c.key]
          return (
            <SelectItem key={c.key} value={c.key}>
              <ItemIcon className="text-muted-foreground" />
              {c.label}
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
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
    <form
      className="flex w-[22rem] max-w-full flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault()
        if (text.trim()) onSubmit({ ...initial, values: [text.trim()] })
      }}
    >
      <span className="text-sm font-semibold">Search text</span>
      <Input value={text} onChange={(e) => setText(e.target.value)} autoFocus />
      <p className="text-xs text-muted-foreground">Matches rows containing every word, in any column.</p>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={!text.trim()}>
          Save filter
        </Button>
      </div>
    </form>
  )
}

function ComparatorSelect({
  column,
  value,
  onChange,
  className,
}: {
  column: ColumnKey
  value: Comparator
  onChange: (v: Comparator) => void
  className?: string
}) {
  const items = comparatorsFor(COLUMN_MAP[column]).map((c) => ({ value: c.value as string, label: c.label }))
  return (
    <Select items={items} value={value} onValueChange={(v) => v && onChange(v as Comparator)}>
      <SelectTrigger size="sm" className={cn("min-w-32", className)} aria-label="Operator">
        <SelectValue />
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false} align="end">
        {items.map((i) => (
          <SelectItem key={i.value} value={i.value}>
            {i.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

/** Renders the right criteria entry for a comparator: multi-value combobox, one or two inputs, or nothing. */
function CriteriaInput({
  column,
  comparator,
  values,
  onChange,
  onCommit,
  returnsNoRows,
  autoFocus,
  compact,
  variant = "list",
}: {
  column: ColumnKey
  comparator: Comparator
  values: string[]
  onChange: (v: string[]) => void
  /** Enter in the criteria list: submit the filter with these values. */
  onCommit?: (v: string[]) => void
  /** "list": scrolling multi-select (basic). "combobox": single-line chip combobox (advanced). */
  variant?: "list" | "combobox"
  /** Flags criteria that would return zero rows (shown in pale amber). */
  returnsNoRows?: (value: string) => boolean
  autoFocus?: boolean
  compact?: boolean
}) {
  const arity = COMPARATOR_MAP[comparator].arity
  if (arity === "none") {
    return variant === "combobox" ? (
      <div className="flex h-8 items-center px-1 text-xs text-muted-foreground">No value needed</div>
    ) : (
      <p className="px-1 text-xs text-muted-foreground">No value needed.</p>
    )
  }
  if (arity === "multi" && variant === "combobox") {
    return (
      <CriteriaCombobox
        column={column}
        values={values}
        onChange={onChange}
        returnsNoRows={returnsNoRows}
        autoFocus={autoFocus}
      />
    )
  }
  if (arity === "multi") {
    return (
      <ValuePicker
        column={column}
        values={values}
        onChange={onChange}
        onCommit={onCommit ?? onChange}
        returnsNoRows={returnsNoRows}
        autoFocus={autoFocus}
        compact={compact}
        allowCustom
      />
    )
  }
  // Single-value operators (>, <, between): free entry plus a dropdown of the column's existing values.
  const field = (i: number, placeholder?: string) => (
    <ValueField
      column={column}
      value={values[i] ?? ""}
      placeholder={placeholder}
      autoFocus={autoFocus && i === 0}
      onChange={(v) => {
        const next = [...values]
        next[i] = v
        onChange(next)
      }}
      className="flex-1"
    />
  )
  if (arity === "one") return field(0)
  return (
    <div className="flex items-center gap-2">
      {field(0, "From")}
      <span className="text-xs text-muted-foreground">and</span>
      {field(1, "To")}
    </div>
  )
}

/** Multi-select combobox: picked values accumulate as removable criteria chips above the input. */
function ValuePicker({
  column,
  values,
  onChange,
  onCommit,
  returnsNoRows,
  autoFocus,
  compact,
  allowCustom,
}: {
  column: ColumnKey
  values: string[]
  onChange: (v: string[]) => void
  onCommit: (v: string[]) => void
  returnsNoRows?: (value: string) => boolean
  autoFocus?: boolean
  compact?: boolean
  allowCustom?: boolean
}) {
  const col = COLUMN_MAP[column]
  const [query, setQuery] = React.useState("")
  const options = React.useMemo(() => distinctValues(column), [column])
  const noRows = React.useMemo(
    () => new Set(returnsNoRows ? options.filter((o) => returnsNoRows(o)) : []),
    [options, returnsNoRows]
  )
  const lower = values.map((v) => v.toLowerCase())
  const typed = query.trim()
  const showCustom =
    allowCustom && typed !== "" && !options.some((o) => o.toLowerCase() === typed.toLowerCase()) && !lower.includes(typed.toLowerCase())

  const spaceToSelect = useSpaceToSelect(query)

  const toggle = (v: string) => {
    const idx = lower.indexOf(v.toLowerCase())
    onChange(idx >= 0 ? values.filter((_, i) => i !== idx) : [...values, v])
  }

  return (
    <div className="flex flex-col gap-2">
      {values.length ? (
        <div className="flex max-h-24 flex-wrap gap-1.5 overflow-y-auto px-0.5 py-0.5">
          {values.map((v) => (
            <span
              key={v}
              className="inline-flex h-6 max-w-full items-center gap-0.5 rounded-full border border-border bg-muted pr-0.5 pl-2.5 text-xs font-medium text-foreground"
            >
              <span className="truncate">{formatCriterion(col, v)}</span>
              <button
                type="button"
                className="inline-flex size-5 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-foreground/10 hover:text-foreground"
                aria-label={`Remove ${formatCriterion(col, v)}`}
                onClick={() => toggle(v)}
              >
                <XIcon className="size-3" />
              </button>
            </span>
          ))}
        </div>
      ) : null}
      <Command className="rounded-[0.2em]! border border-border bg-background p-0" loop>
        <CommandInput
          placeholder={values.length ? "Add another value…" : `Select or type ${col.label.toLowerCase()}…`}
          value={query}
          onValueChange={setQuery}
          autoFocus={autoFocus}
          onKeyDown={(e) => {
            // Backspace on an empty input removes the last chip, like a token field.
            if (e.key === "Backspace" && query === "" && values.length) onChange(values.slice(0, -1))
            // Enter submits the whole filter (preventDefault stops cmdk toggling the item). If the
            // user typed a query, the highlighted match is included rather than silently dropped.
            if (e.key === "Enter" && !e.nativeEvent.isComposing) {
              e.preventDefault()
              const raw = typed ? highlightedItem(e.currentTarget)?.dataset.raw : undefined
              onCommit(raw && !lower.includes(raw.toLowerCase()) ? [...values, raw] : values)
              return
            }
            spaceToSelect(e)
          }}
        />
        <CommandList className={compact ? "max-h-32" : "max-h-44"}>
          <CommandEmpty>No matching values.</CommandEmpty>
          <CommandGroup>
            {showCustom ? (
              <CommandItem
                value={`__custom__${typed}`}
                data-raw={typed}
                forceMount
                onSelect={() => {
                  toggle(typed)
                  setQuery("")
                }}
              >
                <PlusIcon />
                Use “{typed}”
              </CommandItem>
            ) : null}
            {options.map((o) => {
              const empty = noRows.has(o)
              return (
                <CommandItem
                  key={o}
                  value={`${formatCriterion(col, o)} ${o}`}
                  data-raw={o}
                  data-checked={lower.includes(o.toLowerCase())}
                  title={empty ? "No rows match this with the current filters" : undefined}
                  className={cn(
                    empty &&
                      "text-amber-600/70 data-selected:bg-amber-50 data-selected:text-amber-700/80 dark:text-amber-300/60 dark:data-selected:bg-amber-400/10 dark:data-selected:text-amber-300/80"
                  )}
                  onSelect={() => {
                    toggle(o)
                    setQuery("")
                  }}
                >
                  {formatCriterion(col, o)}
                  {empty ? <span className="sr-only"> (no matching rows)</span> : null}
                </CommandItem>
              )
            })}
          </CommandGroup>
        </CommandList>
      </Command>
    </div>
  )
}
