"use client"

import * as React from "react"

import { RunsTable, type PrototypeVariant } from "@/components/runs/runs-table"
import { cn } from "@/lib/utils"

const VARIANTS: { value: PrototypeVariant; label: string }[] = [
  { value: "filters", label: "Filters only" },
  { value: "views", label: "Filters and views" },
]

/** Page chrome with a selector to switch between prototype variants. */
export function PrototypeShell() {
  const [variant, setVariant] = React.useState<PrototypeVariant>("filters")

  return (
    <main className="flex w-full flex-1 flex-col">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border px-4 py-3 sm:px-6">
        <h1 className="text-lg font-semibold tracking-tight">Flow Runs</h1>
        <div
          role="radiogroup"
          aria-label="Prototype variant"
          className="inline-flex h-7 items-center rounded-full border border-border bg-muted/60 p-0.5"
        >
          {VARIANTS.map((v) => {
            const active = v.value === variant
            return (
              <button
                key={v.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setVariant(v.value)}
                className={cn(
                  "h-full rounded-full px-2.5 text-xs font-medium transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                  active ? "bg-background text-foreground shadow-xs ring-1 ring-border" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {v.label}
              </button>
            )
          })}
        </div>
      </header>
      <div className="flex flex-1 flex-col px-4 py-4 sm:px-6">
        <RunsTable variant={variant} />
      </div>
    </main>
  )
}
