"use client"

import * as React from "react"
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon, FilterIcon, XIcon } from "lucide-react"

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
  "inline-flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-all hover:bg-background hover:text-foreground hover:shadow-xs focus-visible:opacity-100 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none data-popup-open:bg-background data-popup-open:text-primary data-popup-open:opacity-100"

/** Revealed on hover for pointer devices; always visible on touch. */
const revealOnHover = "[@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover/col:opacity-100"

export function ColumnHeader({
  column,
  sortIndex,
  sortDir,
  multiSort,
  filtered,
  hovered,
  onSort,
  onAddFilter,
  thProps,
}: {
  column: ColumnDef
  sortIndex: number
  sortDir?: SortDir
  multiSort: boolean
  filtered: boolean
  hovered: boolean
  onSort: (dir: SortDir | null, additive: boolean) => void
  onAddFilter: (draft: FilterDraft) => void
  thProps: React.ComponentProps<"th">
}) {
  const thRef = React.useRef<HTMLTableCellElement>(null)
  const [filterOpen, setFilterOpen] = React.useState(false)
  const right = column.align === "right"

  const cycle = (e: React.MouseEvent) => {
    const next: SortDir | null = !sortDir ? "asc" : sortDir === "asc" ? "desc" : null
    onSort(next, e.shiftKey)
  }

  return (
    <th
      ref={thRef}
      {...thProps}
      aria-sort={sortDir === "asc" ? "ascending" : sortDir === "desc" ? "descending" : undefined}
      style={{ minWidth: column.minWidth }}
      className={cn(
        "group/col sticky top-0 z-10 h-12 border-b border-border bg-muted/70 px-2 text-left align-middle font-semibold whitespace-nowrap text-secondary-foreground backdrop-blur transition-colors first:rounded-tl-[calc(var(--radius)-2px)] last:rounded-tr-[calc(var(--radius)-2px)]",
        (hovered || filterOpen) && "bg-sky-100/70 text-foreground dark:bg-sky-400/15",
        thProps.className
      )}
    >
      <div className={cn("flex items-center gap-0.5", right && "flex-row-reverse")}>
        <button
          type="button"
          onClick={cycle}
          title="Click to sort, Shift+click to add to sort"
          className={cn(
            "inline-flex min-w-0 items-center gap-1 rounded-lg px-1.5 py-1 text-sm hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
            right && "flex-row-reverse"
          )}
        >
          <span className="truncate">{column.label}</span>
          {sortDir ? (
            <span className="inline-flex items-center text-primary">
              {sortDir === "asc" ? <ArrowUpIcon className="size-3.5" /> : <ArrowDownIcon className="size-3.5" />}
              {multiSort ? <sup className="text-[10px] font-bold">{sortIndex + 1}</sup> : null}
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
                <DropdownMenuItem onClick={() => onSort("asc", false)}>
                  <ArrowUpIcon /> Ascending
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSort("desc", false)}>
                  <ArrowDownIcon /> Descending
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onSort(sortDir === "asc" ? "desc" : "asc", true)}>
                <ArrowUpDownIcon /> {sortDir ? "Flip in multi-sort" : "Add to sort"}
              </DropdownMenuItem>
              {sortDir ? (
                <DropdownMenuItem onClick={() => onSort(null, true)}>
                  <XIcon /> Remove sort
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>

          <Popover open={filterOpen} onOpenChange={setFilterOpen}>
            <PopoverTrigger
              aria-label={`Filter by ${column.label}`}
              className={cn(iconButton, filtered ? "text-primary" : revealOnHover)}
            >
              <FilterIcon className={cn("size-3.5", filtered && "fill-primary/25")} />
            </PopoverTrigger>
            <PopoverContent
              anchor={thRef}
              align="start"
              sideOffset={2}
              className="w-[22rem] max-w-[calc(100vw-2rem)] p-3 font-normal"
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
