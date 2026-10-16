"use client"

import * as React from "react"
import { CheckIcon, ChevronDownIcon, LayersIcon, PencilIcon } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { sortSummary, viewFilterSummary, type SavedView } from "@/lib/views"
import { cn } from "@/lib/utils"

/**
 * Saved-views selector. Nothing is selected by default; picking a view applies its filters, sorts,
 * and match mode. "Edited" marks a selected view whose filters/sorts have since been changed.
 */
export function ViewsMenu({
  views,
  selectedId,
  edited,
  onSelect,
  onRename,
}: {
  views: SavedView[]
  selectedId: string | null
  edited: boolean
  onSelect: (view: SavedView | null) => void
  onRename: (id: string, name: string) => void
}) {
  const selected = views.find((v) => v.id === selectedId) ?? null
  const [renaming, setRenaming] = React.useState(false)
  const pillRef = React.useRef<HTMLDivElement>(null)

  if (selected && renaming) {
    return (
      <RenameField
        initial={selected.name}
        onDone={(name) => {
          if (name) onRename(selected.id, name)
          setRenaming(false)
        }}
      />
    )
  }

  // One pill: [menu trigger: icon + name] [rename] [menu trigger: chevron]. The rename button sits
  // between two triggers of the same menu (a button can't be nested inside the trigger button).
  const segment =
    "flex h-full items-center outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset"
  return (
    <div
      ref={pillRef}
      className="flex h-8 max-w-[18rem] min-w-0 items-center overflow-hidden rounded-full border border-border bg-background text-[13px] font-medium transition-colors hover:bg-muted has-aria-expanded:bg-muted dark:border-input"
    >
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(segment, "min-w-0 gap-1.5 rounded-l-full pl-3", selected ? "pr-1" : "pr-1.5")}
          aria-label={selected ? `View: ${selected.name}${edited ? " (edited)" : ""}` : "Views"}
        >
          <LayersIcon className="size-3.5 shrink-0 text-muted-foreground" />
          <span className={cn("truncate", !selected && "text-muted-foreground")}>
            {selected ? selected.name : "Views"}
          </span>
          {selected && edited ? (
            <span className="size-1.5 shrink-0 rounded-full bg-amber-500" title="Edited since saved" />
          ) : null}
        </DropdownMenuTrigger>
        {selected ? (
          <button
            type="button"
            aria-label={`Rename ${selected.name}`}
            title="Rename view"
            onClick={() => setRenaming(true)}
            className="inline-flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-background hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <PencilIcon className="size-3" />
          </button>
        ) : null}
        <DropdownMenuTrigger
          className={cn(segment, "shrink-0 rounded-r-full pr-2.5", selected ? "pl-1" : "pl-0")}
          aria-label="Choose a view"
        >
          <ChevronDownIcon className="size-3.5 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent anchor={pillRef} align="start" className="w-[22rem] max-w-[calc(100vw-2rem)]">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Saved views</DropdownMenuLabel>
            {views.length === 0 ? (
              <p className="px-1.5 pt-0.5 pb-2 text-xs text-muted-foreground">
                No saved views yet. Add filters, then choose <span className="font-medium text-foreground">Save view</span>.
              </p>
            ) : (
              views.map((v) => (
                <DropdownMenuItem key={v.id} onClick={() => onSelect(v)} className="items-start gap-2 py-1.5">
                  <CheckIcon className={cn("mt-0.5 size-3.5", v.id === selectedId ? "opacity-100" : "opacity-0")} />
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="text-[13px] font-medium">{v.name}</span>
                    <span className="line-clamp-2 text-xs text-muted-foreground">{viewFilterSummary(v)}</span>
                    <span className="text-[11px] text-muted-foreground/80">
                      {sortSummary(v.sort)}
                      {v.matchMode === "any" ? " · match any filter" : ""}
                    </span>
                  </span>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuGroup>
          {selected ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onSelect(null)} className="text-[13px] text-muted-foreground">
                Deselect view (keep current filters)
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

/** Inline name editor in the selector's place: Enter or blur saves, Esc cancels (empty = no change). */
function RenameField({ initial, onDone }: { initial: string; onDone: (name: string | null) => void }) {
  const [name, setName] = React.useState(initial)
  const done = React.useRef(false)
  const finish = (value: string | null) => {
    if (done.current) return
    done.current = true
    onDone(value?.trim() || null)
  }
  return (
    <div className="flex h-8 w-[14rem] items-center gap-1.5 rounded-full border border-ring bg-background pr-1 pl-3 ring-3 ring-ring/25">
      <LayersIcon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
      <input
        autoFocus
        aria-label="View name"
        value={name}
        maxLength={60}
        onFocus={(e) => e.currentTarget.select()}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => finish(name)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault()
            finish(name)
          } else if (e.key === "Escape") {
            e.preventDefault()
            finish(null)
          }
        }}
        className="h-full min-w-0 flex-1 bg-transparent text-[13px] font-medium outline-none"
      />
      <span className="pr-1.5 text-[10px] text-muted-foreground [@media(hover:none)]:hidden">Enter</span>
    </div>
  )
}
