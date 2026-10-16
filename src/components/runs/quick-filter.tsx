"use client"

import * as React from "react"
import { PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { COLUMN_ICONS } from "@/lib/column-icons"
import { COLUMN_MAP, type ColumnKey } from "@/lib/data"
import { FilterEditor, type FilterDraft } from "./filter-editor"

/** Dashed "partial filter" pill style, shared with the Add filter button. */
export const dashedPillClass =
  "h-8 gap-1 rounded-full border-dashed border-input bg-background px-3 text-[13px] text-foreground/85 hover:border-foreground/30 hover:bg-muted aria-expanded:border-foreground/30 aria-expanded:bg-muted dark:bg-background"

/**
 * A partial filter: a column already chosen, criteria not yet set. Clicking it opens the
 * filter editor preset to that column (same as the column-header filter entry point).
 */
export function QuickFilter({ column, onAdd }: { column: ColumnKey; onAdd: (draft: FilterDraft) => void }) {
  const [open, setOpen] = React.useState(false)
  const Icon = COLUMN_ICONS[column]
  const label = COLUMN_MAP[column].label

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={<Button variant="outline" className={dashedPillClass} />} aria-label={`Filter by ${label}`}>
        <PlusIcon className="size-3.5 text-muted-foreground" />
        <Icon className="size-3.5 text-muted-foreground" />
        {label}
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={6} className="w-auto max-w-[calc(100vw-2rem)] p-3">
        <FilterEditor
          column={column}
          onCancel={() => setOpen(false)}
          onSubmit={(draft) => {
            onAdd(draft)
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
