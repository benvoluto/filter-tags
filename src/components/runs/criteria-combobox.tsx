"use client"

import * as React from "react"
import { Autocomplete } from "@base-ui/react/autocomplete"
import { Combobox } from "@base-ui/react/combobox"
import { CheckIcon, ChevronDownIcon, PlusIcon, XIcon } from "lucide-react"

import { COLUMN_MAP, distinctValues, formatCriterion, type ColumnKey } from "@/lib/data"
import { cn } from "@/lib/utils"

const CUSTOM = "__custom__:"

/**
 * Single-line multi-select combobox: picked values accumulate as chips inside the field (scrolling
 * sideways when they overflow), with a dropdown of the column's values. Typed text that matches no
 * value can be used as-is.
 */
export function CriteriaCombobox({
  column,
  values,
  onChange,
  returnsNoRows,
  autoFocus,
  className,
}: {
  column: ColumnKey
  values: string[]
  onChange: (values: string[]) => void
  /** Flags values that would return zero rows (shown in pale amber). */
  returnsNoRows?: (value: string) => boolean
  autoFocus?: boolean
  className?: string
}) {
  const col = COLUMN_MAP[column]
  const options = React.useMemo(() => distinctValues(column), [column])
  const noRows = React.useMemo(
    () => new Set(returnsNoRows ? options.filter((o) => returnsNoRows(o)) : []),
    [options, returnsNoRows]
  )
  const [query, setQuery] = React.useState("")
  const typed = query.trim()
  const known = new Set([...options, ...values].map((v) => v.toLowerCase()))
  const items = typed && !known.has(typed.toLowerCase()) ? [`${CUSTOM}${typed}`, ...options] : options

  const label = (v: string) => (v.startsWith(CUSTOM) ? `Use “${v.slice(CUSTOM.length)}”` : formatCriterion(col, v))

  return (
    <Combobox.Root
      items={items}
      multiple
      value={values}
      onValueChange={(next: string[]) => {
        onChange(next.map((v) => (v.startsWith(CUSTOM) ? v.slice(CUSTOM.length) : v)))
        setQuery("")
      }}
      inputValue={query}
      onInputValueChange={setQuery}
      itemToStringLabel={label}
      // Keep the list open after picking, so several values can be chosen in a row.
      onOpenChange={(open, details) => {
        if (!open && details.reason === "item-press") details.cancel()
      }}
    >
      <Combobox.InputGroup
        className={cn(
          "flex h-8 min-w-0 cursor-text items-center gap-1 rounded-lg border border-input bg-background pr-1 pl-1.5 transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/30",
          className
        )}
      >
        <Combobox.Chips
          aria-label={values.length ? `Selected ${col.label.toLowerCase()} values` : undefined}
          className="flex min-w-0 flex-1 flex-nowrap items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {values.map((v) => (
            <Combobox.Chip
              key={v}
              aria-label={formatCriterion(col, v)}
              aria-description="Press Backspace or Delete to remove"
              className="flex h-6 max-w-40 shrink-0 cursor-default items-center gap-0.5 rounded-full border border-border bg-muted pr-0.5 pl-2 text-xs font-medium outline-none focus-within:border-foreground/30 data-highlighted:border-foreground/30"
            >
              <span className="truncate">{formatCriterion(col, v)}</span>
              <Combobox.ChipRemove
                aria-label={`Remove ${formatCriterion(col, v)}`}
                className="inline-flex size-5 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-foreground/10 hover:text-foreground"
              >
                <XIcon className="size-3" />
              </Combobox.ChipRemove>
            </Combobox.Chip>
          ))}
          <Combobox.Input
            autoFocus={autoFocus}
            placeholder={values.length ? "" : `Select ${col.label.toLowerCase()}…`}
            aria-description={
              values.length
                ? `${values.length} selected. From the start of the input, press Left Arrow to focus the selected items`
                : undefined
            }
            className="h-6 min-w-16 flex-1 bg-transparent px-1 text-[13px] outline-none placeholder:text-muted-foreground"
          />
        </Combobox.Chips>
        <Combobox.Trigger
          aria-label="Show values"
          className="inline-flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <ChevronDownIcon className="size-3.5" />
        </Combobox.Trigger>
      </Combobox.InputGroup>

      <Combobox.Portal>
        <Combobox.Positioner className="z-50 outline-none" sideOffset={4} align="start">
          <Combobox.Popup className="max-h-[min(var(--available-height),16rem)] w-(--anchor-width) min-w-48 max-w-(--available-width) origin-(--transform-origin) overflow-y-auto overscroll-contain rounded-lg bg-popover p-1 text-popover-foreground shadow-lg ring-1 ring-foreground/10 transition-[scale,opacity] data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
            <Combobox.Empty>
              <div className="px-2 py-1.5 text-[13px] text-muted-foreground">No matching values.</div>
            </Combobox.Empty>
            <Combobox.List>
              {(item: string) => {
                const custom = item.startsWith(CUSTOM)
                const empty = noRows.has(item)
                return (
                  <Combobox.Item
                    key={item}
                    value={item}
                    title={empty ? "No rows match this with the current filters" : undefined}
                    className={cn(
                      "flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-[13px] outline-none select-none data-highlighted:bg-muted",
                      empty &&
                        "text-amber-600/70 data-highlighted:bg-amber-50 data-highlighted:text-amber-700/80 dark:text-amber-300/60 dark:data-highlighted:bg-amber-400/10"
                    )}
                  >
                    {custom ? <PlusIcon className="size-3.5 text-muted-foreground" /> : null}
                    <span className="flex-1 truncate">{label(item)}</span>
                    {empty ? <span className="sr-only"> (no matching rows)</span> : null}
                    <Combobox.ItemIndicator>
                      <CheckIcon className="size-3.5" />
                    </Combobox.ItemIndicator>
                  </Combobox.Item>
                )
              }}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  )
}

/**
 * Single-value field for operators like "greater than" / "between": type any value, or pick one of
 * the column's existing values from the dropdown. The field holds the raw value (date as
 * YYYY-MM-DD, duration in seconds); the list shows formatted labels and matches either form.
 */
export function ValueField({
  column,
  value,
  onChange,
  placeholder,
  autoFocus,
  className,
}: {
  column: ColumnKey
  value: string
  onChange: (value: string) => void
  placeholder?: string
  autoFocus?: boolean
  className?: string
}) {
  const col = COLUMN_MAP[column]
  const options = React.useMemo(() => distinctValues(column), [column])
  const unit = col.type === "duration" ? "sec" : col.type === "percent" ? "%" : null
  const numeric = col.type === "number" || col.type === "duration" || col.type === "percent"

  return (
    <Autocomplete.Root
      items={options}
      value={value}
      onValueChange={(v) => onChange(v)}
      openOnInputClick
      filter={(item: string, query: string) => {
        const q = query.trim().toLowerCase()
        return !q || item.toLowerCase().includes(q) || formatCriterion(col, item).toLowerCase().includes(q)
      }}
    >
      <Autocomplete.InputGroup
        className={cn(
          "relative flex h-8 min-w-0 items-center rounded-lg border border-input bg-background pr-1 transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/30",
          className
        )}
      >
        <Autocomplete.Input
          autoFocus={autoFocus}
          placeholder={placeholder ?? (col.type === "date" ? "YYYY-MM-DD" : "Value")}
          inputMode={numeric ? "decimal" : undefined}
          className="h-full min-w-0 flex-1 bg-transparent pl-2.5 text-[13px] outline-none placeholder:text-muted-foreground"
        />
        {unit ? <span className="pointer-events-none px-1 text-xs text-muted-foreground">{unit}</span> : null}
        <Autocomplete.Trigger
          aria-label="Show existing values"
          className="inline-flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <ChevronDownIcon className="size-3.5" />
        </Autocomplete.Trigger>
      </Autocomplete.InputGroup>

      <Autocomplete.Portal>
        <Autocomplete.Positioner className="z-50 outline-none" sideOffset={4} align="start">
          <Autocomplete.Popup className="max-h-[min(var(--available-height),16rem)] w-(--anchor-width) min-w-40 max-w-(--available-width) origin-(--transform-origin) overflow-y-auto overscroll-contain rounded-lg bg-popover p-1 text-popover-foreground shadow-lg ring-1 ring-foreground/10 transition-[scale,opacity] data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
            <Autocomplete.Empty>
              <div className="px-2 py-1.5 text-[13px] text-muted-foreground">No existing values match.</div>
            </Autocomplete.Empty>
            <Autocomplete.List>
              {(item: string) => {
                const label = formatCriterion(col, item)
                return (
                  <Autocomplete.Item
                    key={item}
                    value={item}
                    className="flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-[13px] outline-none select-none data-highlighted:bg-muted"
                  >
                    <span className="flex-1 truncate">{label}</span>
                    {label !== item ? (
                      <span className="text-[11px] text-muted-foreground tabular-nums">{item}</span>
                    ) : null}
                  </Autocomplete.Item>
                )
              }}
            </Autocomplete.List>
          </Autocomplete.Popup>
        </Autocomplete.Positioner>
      </Autocomplete.Portal>
    </Autocomplete.Root>
  )
}
