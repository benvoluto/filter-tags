"use client"

import * as React from "react"
import { PencilIcon, SearchIcon, XIcon } from "lucide-react"

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { chipLabel, criteriaCount, filterSummary, type Filter } from "@/lib/filters"
import { cn } from "@/lib/utils"
import { FilterEditor, type FilterDraft } from "./filter-editor"

export function FilterChip({
  filter,
  onChange,
  onRemove,
}: {
  filter: Filter
  onChange: (draft: FilterDraft) => void
  onRemove: () => void
}) {
  const [editing, setEditing] = React.useState(false)
  const chipRef = React.useRef<HTMLDivElement>(null)
  const count = criteriaCount(filter)
  const summary = filterSummary(filter)

  return (
    <div
      ref={chipRef}
      data-editing={editing || undefined}
      className={cn(
        "group/chip relative inline-flex h-10 max-w-[200px] min-w-0 shrink-0 items-center gap-1 rounded-full border border-border bg-card pr-1 pl-3 text-sm shadow-xs transition-colors",
        "hover:border-primary/50 data-editing:border-primary data-editing:ring-3 data-editing:ring-ring/30"
      )}
    >
      <Tooltip>
        <TooltipTrigger
          render={<span />}
          className="flex min-w-0 flex-1 cursor-default items-center gap-1.5"
          onClick={() => setEditing(true)}
        >
          {filter.kind === "search" ? <SearchIcon className="size-3.5 shrink-0 text-muted-foreground" /> : null}
          <span className="truncate font-medium">{chipLabel(filter)}</span>
          {count > 1 ? (
            <span className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground tabular-nums">
              {count}
            </span>
          ) : null}
        </TooltipTrigger>
        <TooltipContent side="bottom" className="flex-col items-start gap-0.5 text-left">
          {summary.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
          <span className="mt-1 block opacity-60">Click to edit</span>
        </TooltipContent>
      </Tooltip>

      <Popover open={editing} onOpenChange={setEditing}>
        <PopoverTrigger
          aria-label="Edit filter"
          className={cn(
            "inline-flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
            // Edit only shows on hover for pointer devices; touch devices always show it.
            "[@media(hover:hover)]:hidden [@media(hover:hover)]:group-hover/chip:inline-flex [@media(hover:hover)]:group-focus-within/chip:inline-flex [@media(hover:hover)]:group-data-editing/chip:inline-flex"
          )}
        >
          <PencilIcon className="size-3.5" />
        </PopoverTrigger>
        <PopoverContent anchor={chipRef} align="start" sideOffset={6} className="w-[22rem] max-w-[calc(100vw-2rem)] p-3">
          <FilterEditor
            initial={filter}
            onCancel={() => setEditing(false)}
            onSubmit={(draft) => {
              onChange(draft)
              setEditing(false)
            }}
          />
        </PopoverContent>
      </Popover>

      <button
        type="button"
        aria-label="Remove filter"
        onClick={onRemove}
        className="inline-flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        <XIcon className="size-3.5" />
      </button>
    </div>
  )
}
