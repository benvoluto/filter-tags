"use client"

import * as React from "react"
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon, CheckIcon, FilterIcon, XIcon } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { ColumnDef } from "@/lib/data"
import { cn } from "@/lib/utils"
import { FilterEditor, type FilterDraft } from "./filter-editor"

export type SortDir = "asc" | "desc"
export type SortRule = { key: ColumnDef["key"]; dir: SortDir }

const iconButton =
  "inline-flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-all hover:bg-background hover:text-foreground hover:shadow-xs focus-visible:opacity-100 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none data-popup-open:bg-background data-popup-open:text-foreground data-popup-open:opacity-100"

/** Revealed on hover for pointer devices; always visible on touch. */
const revealOnHover = "[@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover/col:opacity-100"

export function ColumnHeader({
  column,
  sortDir,
  filtered,
  hovered,
  onSort,
  onAddFilter,
  thProps,
}: {
  column: ColumnDef
  /** Set when this column is the table's (single) sorted column. */
  sortDir?: SortDir
  filtered: boolean
  hovered: boolean
  /** Sort the table by this column; null clears the sort. */
  onSort: (dir: SortDir | null) => void
  onAddFilter: (draft: FilterDraft) => void
  thProps: React.ComponentProps<"th">
}) {
  const thRef = React.useRef<HTMLTableCellElement>(null)
  const [filterOpen, setFilterOpen] = React.useState(false)
  const right = column.align === "right"

  // Click cycles ascending → descending → unsorted.
  const cycle = () => onSort(!sortDir ? "asc" : sortDir === "asc" ? "desc" : null)

  return (
    <th
      ref={thRef}
      {...thProps}
      aria-sort={sortDir === "asc" ? "ascending" : sortDir === "desc" ? "descending" : undefined}
      style={{ minWidth: column.minWidth }}
      className={cn(
        "group/col sticky top-0 z-10 h-10 border-b border-border bg-neutral-50 px-1.5 text-left align-middle font-semibold whitespace-nowrap text-foreground backdrop-blur transition-colors dark:bg-muted",
        (hovered || filterOpen) && "bg-neutral-100 dark:bg-accent",
        thProps.className
      )}
    >
      <div className={cn("flex items-center gap-0.5", right && "flex-row-reverse")}>
        <button
          type="button"
          onClick={cycle}
          title="Click to sort (ascending, descending, off)"
          className={cn(
            "inline-flex min-w-0 items-center gap-1 rounded-md px-1.5 py-1 text-[13px] hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
            right && "flex-row-reverse"
          )}
        >
          <span className="truncate">{column.label}</span>
          {sortDir ? (
            <span className="inline-flex items-center text-muted-foreground">
              {sortDir === "asc" ? <ArrowUpIcon className="size-3.5" /> : <ArrowDownIcon className="size-3.5" />}
            </span>
          ) : null}
        </button>

        <div className={cn("flex items-center", right ? "mr-auto" : "ml-auto")}>
          <DropdownMenu>
            <DropdownMenuTrigger aria-label={`Sort ${column.label}`} className={cn(iconButton, revealOnHover)}>
              <ArrowUpDownIcon className="size-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align={right ? "end" : "start"} className="w-48">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Sort {column.label}</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => onSort("asc")}>
                  <ArrowUpIcon /> Ascending
                  {sortDir === "asc" ? <CheckIcon className="ml-auto" /> : null}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSort("desc")}>
                  <ArrowDownIcon /> Descending
                  {sortDir === "desc" ? <CheckIcon className="ml-auto" /> : null}
                </DropdownMenuItem>
              </DropdownMenuGroup>
              {sortDir ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onSort(null)}>
                    <XIcon /> Clear sort
                  </DropdownMenuItem>
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>

          <Popover open={filterOpen} onOpenChange={setFilterOpen}>
            <PopoverTrigger
              aria-label={`Filter by ${column.label}`}
              className={cn(iconButton, filtered ? "text-foreground" : revealOnHover)}
            >
              <FilterIcon className={cn("size-3.5", filtered && "fill-foreground/20")} />
            </PopoverTrigger>
            <PopoverContent
              anchor={thRef}
              align="start"
              sideOffset={2}
              className="w-auto max-w-[calc(100vw-2rem)] p-3 font-normal"
            >
              <FilterEditor
                column={column.key}
                onCancel={() => setFilterOpen(false)}
                onSubmit={(draft) => {
                  onAddFilter(draft)
                  setFilterOpen(false)
                }}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </th>
  )
}
