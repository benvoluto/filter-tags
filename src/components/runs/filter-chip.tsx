"use client"

import * as React from "react"
import { PencilIcon, XIcon } from "lucide-react"

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { COLUMN_ICONS, SEARCH_ICON } from "@/lib/column-icons"
import { chipParts, filterSummary, type Filter } from "@/lib/filters"
import { cn } from "@/lib/utils"
import { FilterEditor, type FilterDraft } from "./filter-editor"

/**
 * Segmented filter chip: [icon label] [operator] [value] [and N more] [×].
 * Grows with its content up to ~25% of the viewport (never narrower than 18rem on small
 * screens, never wider than its container); the value segment truncates first.
 */
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
  const summary = filterSummary(filter)
  const parts = chipParts(filter)
  const Icon = filter.kind === "search" ? SEARCH_ICON : COLUMN_ICONS[filter.column]

  const editButton = (
    <PopoverTrigger
      aria-label="Edit filter"
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-(--chip-bg) text-muted-foreground hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        // Pointer devices: float over the end of the value (fading the text beneath) so the
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
  )

  return (
    <div
      ref={chipRef}
      data-editing={editing || undefined}
      className={cn(
        "group/chip relative inline-flex h-8 max-w-[min(100%,max(25vw,18rem))] min-w-0 shrink-0 items-stretch overflow-hidden rounded-full border border-border bg-(--chip-bg) text-[13px] shadow-xs transition-colors [--chip-bg:var(--background)]",
        "hover:border-foreground/20 hover:[--chip-bg:var(--muted)] data-editing:border-foreground/30 data-editing:ring-3 data-editing:ring-ring/25 data-editing:[--chip-bg:var(--muted)]"
      )}
    >
      <Popover open={editing} onOpenChange={setEditing}>
        <Tooltip>
          <TooltipTrigger
            render={<span />}
            className="flex min-w-0 flex-1 cursor-pointer items-stretch divide-x divide-border"
            onClick={() => setEditing(true)}
          >
            {/* Type: icon + column label */}
            <span className="flex shrink-0 items-center gap-1.5 pr-2 pl-2.5 font-medium text-foreground">
              <Icon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
              <span className="whitespace-nowrap">{parts.label}</span>
            </span>

            {/* Operator */}
            <span className="flex shrink-0 items-center px-2 whitespace-nowrap text-muted-foreground">
              {parts.operator}
            </span>

            {/* Value (truncates first) + hover edit button */}
            {parts.value !== null ? (
              <span className="relative flex min-w-0 flex-1 items-center gap-1.5 px-2">
                <span className="truncate font-medium">{parts.value}</span>
                {parts.more ? null : editButton}
              </span>
            ) : null}

            {/* Advanced filters: "and 2 more" */}
            {parts.more ? (
              <span className="relative flex shrink-0 items-center px-2 whitespace-nowrap text-muted-foreground">
                {parts.more}
                {editButton}
              </span>
            ) : null}

            {parts.value === null && !parts.more ? (
              <span className="relative flex w-6 items-center">{editButton}</span>
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

        <PopoverContent anchor={chipRef} align="start" sideOffset={6} className="w-auto max-w-[calc(100vw-2rem)] p-3">
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
        className="inline-flex w-8 shrink-0 items-center justify-center border-l border-border text-muted-foreground hover:bg-destructive/10 hover:text-destructive focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none focus-visible:ring-inset"
      >
        <XIcon className="size-3.5" />
      </button>
    </div>
  )
}
