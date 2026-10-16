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
  inputId,
  className,
}: {
  value: string
  onChange: (v: string) => void
  resultCount: number
  onSaveAsFilter: () => void
  inputId?: string
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
    <div className={cn("relative h-8 min-w-0", className)}>
      <div
        className={cn(
          "absolute inset-x-0 top-0 z-30 flex items-start gap-1 rounded-[16px] border border-input bg-background pr-0.5 pl-3 transition-shadow",
          focused && "border-foreground/30 shadow-lg ring-3 ring-ring/20"
        )}
      >
        <SearchIcon className="mt-[8px] size-3.5 shrink-0 text-muted-foreground" aria-hidden />
        <textarea
          ref={ref}
          id={inputId}
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
            // Esc clears the text; Esc on an empty field leaves it, so page shortcuts work again.
            if (e.key === "Escape") {
              if (hasValue) onChange("")
              else e.currentTarget.blur()
            }
          }}
          className={cn(
            "min-h-[30px] flex-1 resize-none overflow-hidden bg-transparent px-1 py-[5px] text-[13px] leading-5 outline-none placeholder:text-muted-foreground",
            // Collapse to a single truncated-looking line when not focused.
            !focused && "max-h-[30px]"
          )}
        />
        {!hasValue && !focused ? (
          <kbd
            aria-hidden
            className="pointer-events-none mt-[7px] mr-2 hidden h-4 min-w-4 shrink-0 items-center justify-center rounded border border-border bg-muted px-1 font-sans text-[10px] font-medium text-muted-foreground [@media(hover:hover)]:inline-flex"
          >
            S
          </kbd>
        ) : null}
        {hasValue ? (
          <div className="flex h-[30px] shrink-0 items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon-xs"
              className="rounded-full"
              aria-label="Clear search"
              onClick={() => onChange("")}
            >
              <XIcon />
            </Button>
            {showSave ? (
              <Button
                variant="secondary"
                size="xs"
                onClick={onSaveAsFilter}
                className="rounded-full px-2.5 whitespace-nowrap"
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
