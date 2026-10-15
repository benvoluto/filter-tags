"use client"

import * as React from "react"
import { BookmarkPlusIcon, SearchIcon, XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * Search input that grows vertically as text wraps. The field sits in a fixed-height
 * slot and is absolutely positioned, so growth overlaps the table instead of pushing it.
 */
export function SearchBox({
  value,
  onChange,
  resultCount,
  onSaveAsFilter,
  className,
}: {
  value: string
  onChange: (v: string) => void
  resultCount: number
  onSaveAsFilter: () => void
  className?: string
}) {
  const ref = React.useRef<HTMLTextAreaElement>(null)
  const [focused, setFocused] = React.useState(false)
  const hasValue = value.trim() !== ""
  const showSave = hasValue && resultCount > 0

  React.useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = "0px"
    el.style.height = `${el.scrollHeight}px`
  }, [value, focused])

  return (
    <div className={cn("relative h-10 min-w-0", className)}>
      <div
        className={cn(
          "absolute inset-x-0 top-0 z-30 flex items-start gap-1 rounded-2xl border border-input bg-card py-1 pr-1 pl-3 shadow-xs transition-shadow",
          focused && "border-ring shadow-lg ring-3 ring-ring/30"
        )}
      >
        <SearchIcon className="mt-2 size-4 shrink-0 text-muted-foreground" aria-hidden />
        <textarea
          ref={ref}
          rows={1}
          value={value}
          aria-label="Search or prompt to sort and filter"
          placeholder="Search or prompt to sort and filter"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={(e) => onChange(e.target.value.replace(/\n/g, " "))}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              if (e.metaKey || e.ctrlKey) onSaveAsFilter()
            }
            if (e.key === "Escape" && hasValue) onChange("")
          }}
          className={cn(
            "min-h-8 flex-1 resize-none overflow-hidden bg-transparent px-1 py-1.5 text-sm leading-5 outline-none placeholder:text-muted-foreground",
            // Collapse to a single truncated-looking line when not focused.
            !focused && "max-h-8"
          )}
        />
        {hasValue ? (
          <div className="flex shrink-0 items-center gap-1">
            <Button variant="ghost" size="icon-sm" aria-label="Clear search" onClick={() => onChange("")}>
              <XIcon />
            </Button>
            {showSave ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={onSaveAsFilter}
                className="whitespace-nowrap"
                title="Save as filter (⌘↵)"
              >
                <BookmarkPlusIcon />
                <span className="hidden sm:inline">Save as filter</span>
                <span className="sm:hidden">Save</span>
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}
