"use client"

import * as React from "react"
import { ArrowLeftIcon, PlusIcon, SlidersHorizontalIcon, XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { COLUMNS, COLUMN_MAP, distinctValues, formatCriterion, type ColumnKey } from "@/lib/data"
import {
  COMPARATOR_MAP,
  comparatorsFor,
  isFilterComplete,
  type Comparator,
  type Condition,
  type Filter,
} from "@/lib/filters"
import { cn } from "@/lib/utils"

export type FilterDraft = Omit<Filter, "id">

type FilterEditorProps = {
  /** Existing filter when editing a chip. */
  initial?: Filter
  /** Column preselected (column-header entry point). Omit to show the column picker first. */
  column?: ColumnKey
  onSubmit: (draft: FilterDraft) => void
  onCancel: () => void
}

const IF_THEN = "if_then"

export function FilterEditor({ initial, column: fixedColumn, onSubmit, onCancel }: FilterEditorProps) {
  const [column, setColumn] = React.useState<ColumnKey | null>(initial?.column ?? fixedColumn ?? null)
  const [comparator, setComparator] = React.useState<Comparator>(initial?.comparator ?? "is")
  const [values, setValues] = React.useState<string[]>(initial?.values ?? [])
  const [when, setWhen] = React.useState<Condition | undefined>(initial?.when)
  const [advanced, setAdvanced] = React.useState(
    Boolean(initial && (initial.comparator !== "is" || initial.when))
  )

  if (initial?.kind === "search") {
    return <SearchFilterEditor initial={initial} onSubmit={onSubmit} onCancel={onCancel} />
  }

  if (!column) {
    return (
      <div className="flex flex-col gap-2">
        <Command className="rounded-[0.2em]! border border-border bg-background p-0">
          <CommandInput placeholder="Select or type a column…" autoFocus />
          <CommandList className="max-h-64">
            <CommandEmpty>No matching columns.</CommandEmpty>
            <CommandGroup>
              {COLUMNS.map((c) => (
                <CommandItem key={c.key} value={c.label} onSelect={() => setColumn(c.key)}>
                  <span className="flex-1">{c.label}</span>
                  <span className="text-xs text-muted-foreground">{c.type}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  const col = COLUMN_MAP[column]
  const draft: FilterDraft = { kind: "column", column, comparator, values, when }
  const canSubmit = isFilterComplete(draft)

  const changeComparator = (next: string) => {
    if (next === IF_THEN) {
      const other = COLUMNS.find((c) => c.key !== column && c.type === "category")!
      setWhen({ column: other.key, comparator: "is", values: [] })
      return
    }
    const nextCmp = next as Comparator
    // Keep values only when the shape of the input stays the same.
    if (COMPARATOR_MAP[nextCmp].arity !== COMPARATOR_MAP[comparator].arity) setValues([])
    setComparator(nextCmp)
  }

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault()
        if (canSubmit) onSubmit(draft)
      }}
    >
      <div className="flex items-center gap-2">
        {!fixedColumn && !initial ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Choose a different column"
            onClick={() => {
              setColumn(null)
              setValues([])
              setWhen(undefined)
            }}
          >
            <ArrowLeftIcon />
          </Button>
        ) : null}
        <span className="text-sm font-semibold">{col.label}</span>
        {advanced ? (
          <ComparatorSelect
            column={column}
            value={when ? IF_THEN : comparator}
            allowIfThen
            onChange={changeComparator}
            className="ml-auto"
          />
        ) : (
          <span className="ml-auto text-xs text-muted-foreground">equals</span>
        )}
      </div>

      {when ? (
        <ConditionRow
          condition={when}
          excludeColumn={column}
          onChange={setWhen}
          onRemove={() => setWhen(undefined)}
        />
      ) : null}

      {when ? (
        <div className="flex items-center gap-2">
          <span className="w-10 shrink-0 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Then</span>
          <span className="text-sm font-medium">{col.label}</span>
          <ComparatorSelect column={column} value={comparator} onChange={changeComparator} className="ml-auto" />
        </div>
      ) : null}

      <CriteriaInput column={column} comparator={comparator} values={values} onChange={setValues} autoFocus />

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <Button
          type="button"
          variant={advanced ? "secondary" : "outline"}
          size="sm"
          onClick={() => {
            if (advanced) {
              setComparator("is")
              setWhen(undefined)
              if (COMPARATOR_MAP[comparator].arity !== "multi") setValues([])
            }
            setAdvanced(!advanced)
          }}
        >
          <SlidersHorizontalIcon />
          {advanced ? "Basic filter" : "Advanced filter"}
        </Button>
        <div className="ml-auto flex gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={!canSubmit}>
            {initial ? "Save filter" : "Add filter"}
          </Button>
        </div>
      </div>
    </form>
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
      className="flex flex-col gap-3"
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
  allowIfThen,
  className,
}: {
  column: ColumnKey
  value: string
  onChange: (v: string) => void
  allowIfThen?: boolean
  className?: string
}) {
  const items = [
    ...comparatorsFor(COLUMN_MAP[column]).map((c) => ({ value: c.value as string, label: c.label })),
    ...(allowIfThen ? [{ value: IF_THEN, label: "if / then…" }] : []),
  ]
  return (
    <Select items={items} value={value} onValueChange={(v) => v && onChange(v)}>
      <SelectTrigger size="sm" className={cn("min-w-32", className)} aria-label="Comparator">
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

function ConditionRow({
  condition,
  excludeColumn,
  onChange,
  onRemove,
}: {
  condition: Condition
  excludeColumn: ColumnKey
  onChange: (c: Condition) => void
  onRemove: () => void
}) {
  const columnItems = COLUMNS.filter((c) => c.key !== excludeColumn).map((c) => ({ value: c.key, label: c.label }))
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-dashed border-primary/40 bg-accent/40 p-2.5">
      <div className="flex items-center gap-1.5">
        <span className="w-8 shrink-0 text-xs font-semibold tracking-wide text-muted-foreground uppercase">If</span>
        <Select
          items={columnItems}
          value={condition.column}
          onValueChange={(v) => v && onChange({ column: v as ColumnKey, comparator: "is", values: [] })}
        >
          <SelectTrigger size="sm" className="min-w-0 flex-1" aria-label="Condition column">
            <SelectValue />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false} align="start">
            {columnItems.map((i) => (
              <SelectItem key={i.value} value={i.value}>
                {i.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <ComparatorSelect
          column={condition.column}
          className="w-28 min-w-0 shrink-0"
          value={condition.comparator}
          onChange={(v) => {
            const cmp = v as Comparator
            const sameShape = COMPARATOR_MAP[cmp].arity === COMPARATOR_MAP[condition.comparator].arity
            onChange({ ...condition, comparator: cmp, values: sameShape ? condition.values : [] })
          }}
        />
        <Button type="button" variant="ghost" size="icon-xs" aria-label="Remove condition" onClick={onRemove}>
          <XIcon />
        </Button>
      </div>
      <CriteriaInput
        column={condition.column}
        comparator={condition.comparator}
        values={condition.values}
        onChange={(values) => onChange({ ...condition, values })}
        compact
      />
    </div>
  )
}

/** Renders the right criteria entry for a comparator: multi-value combobox, one or two inputs, or nothing. */
function CriteriaInput({
  column,
  comparator,
  values,
  onChange,
  autoFocus,
  compact,
}: {
  column: ColumnKey
  comparator: Comparator
  values: string[]
  onChange: (v: string[]) => void
  autoFocus?: boolean
  compact?: boolean
}) {
  const col = COLUMN_MAP[column]
  const arity = COMPARATOR_MAP[comparator].arity
  if (arity === "none") {
    return <p className="px-1 text-xs text-muted-foreground">No value needed.</p>
  }
  if (arity === "multi") {
    return (
      <ValuePicker
        column={column}
        values={values}
        onChange={onChange}
        autoFocus={autoFocus}
        compact={compact}
        allowCustom
      />
    )
  }
  const inputType = col.type === "date" ? "date" : "number"
  const unit = col.type === "duration" ? "sec" : col.type === "percent" ? "%" : null
  const field = (i: number, placeholder: string) => (
    <div className="relative flex-1">
      <Input
        type={inputType}
        value={values[i] ?? ""}
        placeholder={placeholder}
        autoFocus={autoFocus && i === 0}
        onChange={(e) => {
          const next = [...values]
          next[i] = e.target.value
          onChange(next)
        }}
        className={cn(unit && "pr-10")}
      />
      {unit ? (
        <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted-foreground">
          {unit}
        </span>
      ) : null}
    </div>
  )
  if (arity === "one") return field(0, "Value")
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
  autoFocus,
  compact,
  allowCustom,
}: {
  column: ColumnKey
  values: string[]
  onChange: (v: string[]) => void
  autoFocus?: boolean
  compact?: boolean
  allowCustom?: boolean
}) {
  const col = COLUMN_MAP[column]
  const [query, setQuery] = React.useState("")
  const options = React.useMemo(() => distinctValues(column), [column])
  const lower = values.map((v) => v.toLowerCase())
  const typed = query.trim()
  const showCustom =
    allowCustom && typed !== "" && !options.some((o) => o.toLowerCase() === typed.toLowerCase()) && !lower.includes(typed.toLowerCase())

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
              className="inline-flex h-6 max-w-full items-center gap-0.5 rounded-full bg-primary/12 pr-0.5 pl-2.5 text-xs font-medium text-primary"
            >
              <span className="truncate">{formatCriterion(col, v)}</span>
              <button
                type="button"
                className="inline-flex size-5 shrink-0 items-center justify-center rounded-full hover:bg-primary/15"
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
          }}
        />
        <CommandList className={compact ? "max-h-32" : "max-h-44"}>
          <CommandEmpty>No matching values.</CommandEmpty>
          <CommandGroup>
            {showCustom ? (
              <CommandItem
                value={`__custom__${typed}`}
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
            {options.map((o) => (
              <CommandItem
                key={o}
                value={`${formatCriterion(col, o)} ${o}`}
                data-checked={lower.includes(o.toLowerCase())}
                onSelect={() => {
                  toggle(o)
                  setQuery("")
                }}
              >
                {formatCriterion(col, o)}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </div>
  )
}
