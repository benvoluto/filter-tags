"use client"

import * as React from "react"
import { FilterIcon, PencilIcon, XIcon } from "lucide-react"

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
        "group/chip relative inline-flex h-10 max-w-[200px] min-w-0 shrink-0 items-center gap-1 rounded-full border border-amber-200/80 bg-(--chip-bg) pr-1 pl-3 text-sm [--chip-bg:var(--color-amber-50)] dark:border-amber-400/25 dark:[--chip-bg:color-mix(in_oklab,var(--color-amber-400)_10%,var(--background))] shadow-xs transition-colors",
        "hover:border-primary/50 data-editing:border-primary data-editing:ring-3 data-editing:ring-ring/30"
      )}
    >
      <Tooltip>
        <TooltipTrigger
          render={<span />}
          className="flex min-w-0 flex-1 cursor-default items-center gap-1.5"
          onClick={() => setEditing(true)}
        >
          <FilterIcon className="size-3.5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
          <span className="relative flex min-w-0 flex-1 items-center gap-1">
            <span className="truncate font-medium">{chipLabel(filter)}</span>
            <Popover open={editing} onOpenChange={setEditing}>
              <PopoverTrigger
                aria-label="Edit filter"
                onClick={(e) => e.stopPropagation()}
                className={cn(
                  "inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-(--chip-bg) text-muted-foreground hover:bg-amber-100 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none dark:hover:bg-amber-400/15",
                  // Pointer devices: float over the end of the label (fading the text beneath) so the
                  // chip never changes width. Touch devices: always visible, in normal flow.
                  "[@media(hover:hover)]:absolute [@media(hover:hover)]:inset-y-0 [@media(hover:hover)]:right-0 [@media(hover:hover)]:my-auto",
                  "[@media(hover:hover)]:before:pointer-events-none [@media(hover:hover)]:before:absolute [@media(hover:hover)]:before:inset-y-0 [@media(hover:hover)]:before:right-full [@media(hover:hover)]:before:w-4 [@media(hover:hover)]:before:bg-linear-to-l [@media(hover:hover)]:before:from-(--chip-bg) [@media(hover:hover)]:before:to-transparent",
                  "[@media(hover:hover)]:pointer-events-none [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:transition-opacity",
                  "[@media(hover:hover)]:group-hover/chip:pointer-events-auto [@media(hover:hover)]:group-hover/chip:opacity-100",
                  "[@media(hover:hover)]:group-focus-within/chip:pointer-events-auto [@media(hover:hover)]:group-focus-within/chip:opacity-100",
                  "[@media(hover:hover)]:group-data-editing/chip:pointer-events-auto [@media(hover:hover)]:group-data-editing/chip:opacity-100"
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
          </span>
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
