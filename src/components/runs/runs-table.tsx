"use client"

import * as React from "react"
import { FilterXIcon, ListFilterIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { COLUMNS, ROWS, formatCell, isEmptyValue, type ColumnKey, type RunRow } from "@/lib/data"
import { matchFilter, matchSearch, newFilterId, type Filter } from "@/lib/filters"
import { cn } from "@/lib/utils"
import { ColumnHeader, type SortDir, type SortRule } from "./column-header"
import { FilterChip } from "./filter-chip"
import { FilterEditor, type FilterDraft } from "./filter-editor"
import { SearchBox } from "./search-box"

const PAGE_SIZE = 17 // 50 rows → 3 pages

const STATUS_STYLES: Record<string, string> = {
  Completed: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
  Failed: "bg-destructive/12 text-destructive",
  "Needs Review": "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  Running: "bg-primary/12 text-primary",
  Cancelled: "bg-muted-foreground/12 text-muted-foreground",
}

function compareRows(a: RunRow, b: RunRow, rules: SortRule[]) {
  for (const { key, dir } of rules) {
    const av = a[key]
    const bv = b[key]
    // Empty values always sink to the bottom regardless of direction.
    if (isEmptyValue(av) && isEmptyValue(bv)) continue
    if (isEmptyValue(av)) return 1
    if (isEmptyValue(bv)) return -1
    const cmp =
      typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv))
    if (cmp !== 0) return dir === "asc" ? cmp : -cmp
  }
  return 0
}

export function RunsTable() {
  const [query, setQuery] = React.useState("")
  const [filters, setFilters] = React.useState<Filter[]>([])
  const [sort, setSort] = React.useState<SortRule[]>([
    { key: "status", dir: "asc" },
    { key: "started", dir: "desc" },
  ])
  const [page, setPage] = React.useState(0)
  const [hoveredCol, setHoveredCol] = React.useState<ColumnKey | null>(null)
  const [addOpen, setAddOpen] = React.useState(false)

  const rows = React.useMemo(() => {
    const visible = ROWS.filter((r) => filters.every((f) => matchFilter(r, f)) && matchSearch(r, query))
    return [...visible].sort((a, b) => compareRows(a, b, sort))
  }, [filters, query, sort])

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount - 1)
  const pageRows = rows.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE)

  const addFilter = (draft: FilterDraft) => {
    setFilters((fs) => [...fs, { ...draft, id: newFilterId() }])
    setPage(0)
  }
  const updateFilter = (id: string, draft: FilterDraft) => {
    setFilters((fs) => fs.map((f) => (f.id === id ? { ...draft, id } : f)))
    setPage(0)
  }
  const removeFilter = (id: string) => setFilters((fs) => fs.filter((f) => f.id !== id))

  const saveSearchAsFilter = () => {
    const text = query.trim()
    if (!text) return
    addFilter({ kind: "search", column: "runId", comparator: "contains", values: [text] })
    setQuery("")
  }

  const applySort = (key: ColumnKey, dir: SortDir | null, additive: boolean) => {
    setSort((rules) => {
      if (!additive) return dir ? [{ key, dir }] : []
      const rest = rules.filter((r) => r.key !== key)
      if (!dir) return rest
      const idx = rules.findIndex((r) => r.key === key)
      if (idx === -1) return [...rules, { key, dir }]
      return rules.map((r) => (r.key === key ? { key, dir } : r))
    })
  }

  const filteredColumns = new Set(filters.filter((f) => f.kind === "column").map((f) => f.column))
  const start = rows.length ? currentPage * PAGE_SIZE + 1 : 0
  const end = currentPage * PAGE_SIZE + pageRows.length

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar: search · filter chips · add filter · clear filters */}
      <div className="flex flex-wrap items-center gap-2">
        <SearchBox
          value={query}
          onChange={(v) => {
            setQuery(v)
            setPage(0)
          }}
          resultCount={rows.length}
          onSaveAsFilter={saveSearchAsFilter}
          className="w-full sm:w-[22rem] lg:w-[26rem]"
        />

        {filters.map((f) => (
          <FilterChip
            key={f.id}
            filter={f}
            onChange={(d) => updateFilter(f.id, d)}
            onRemove={() => removeFilter(f.id)}
          />
        ))}

        <Popover open={addOpen} onOpenChange={setAddOpen}>
          <PopoverTrigger render={<Button variant="outline" className="h-10 rounded-full px-3.5 shadow-xs" />}>
            <ListFilterIcon />
            Add filter
          </PopoverTrigger>
          <PopoverContent align="start" sideOffset={6} className="w-[22rem] max-w-[calc(100vw-2rem)] p-3">
            <FilterEditor
              onCancel={() => setAddOpen(false)}
              onSubmit={(draft) => {
                addFilter(draft)
                setAddOpen(false)
              }}
            />
          </PopoverContent>
        </Popover>

        {filters.length > 2 ? (
          <Button
            variant="ghost"
            className="h-10 rounded-full px-3.5 text-muted-foreground"
            onClick={() => setFilters([])}
          >
            <FilterXIcon />
            Clear filters
          </Button>
        ) : null}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-[var(--radius)] border border-border bg-card shadow-md">
        <div className="relative w-full overflow-x-auto">
          <table className="w-full border-separate border-spacing-0 text-sm" onMouseLeave={() => setHoveredCol(null)}>
            <thead>
              <tr>
                {COLUMNS.map((col, i) => {
                  const sortIndex = sort.findIndex((s) => s.key === col.key)
                  return (
                    <ColumnHeader
                      key={col.key}
                      column={col}
                      sortIndex={sortIndex}
                      sortDir={sortIndex >= 0 ? sort[sortIndex].dir : undefined}
                      multiSort={sort.length > 1}
                      filtered={filteredColumns.has(col.key)}
                      hovered={hoveredCol === col.key}
                      onSort={(dir, additive) => applySort(col.key, dir, additive)}
                      onAddFilter={addFilter}
                      thProps={{
                        onMouseEnter: () => setHoveredCol(col.key),
                        className: cn(i === 0 && "left-0 z-20 shadow-[1px_0_0_var(--border)] md:static md:shadow-none"),
                      }}
                    />
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row) => (
                <tr key={row.runId} className="group/row">
                  {COLUMNS.map((col, i) => {
                    const value = row[col.key]
                    const hovered = hoveredCol === col.key
                    return (
                      <td
                        key={col.key}
                        onMouseEnter={() => setHoveredCol(col.key)}
                        className={cn(
                          "h-11 border-b border-border/70 bg-card px-3.5 whitespace-nowrap transition-colors group-last/row:border-b-0 group-hover/row:bg-sky-50/60 dark:group-hover/row:bg-sky-400/5",
                          col.align === "right" && "text-right tabular-nums",
                          hovered && "bg-sky-50 group-hover/row:bg-sky-100/70 dark:bg-sky-400/8 dark:group-hover/row:bg-sky-400/15",
                          i === 0 && "sticky left-0 z-[1] text-xs font-medium tabular-nums shadow-[1px_0_0_var(--border)] md:static md:shadow-none",
                          isEmptyValue(value) && "text-muted-foreground"
                        )}
                      >
                        {col.key === "status" ? (
                          <span
                            className={cn(
                              "inline-flex h-6 items-center rounded-full px-2.5 text-xs font-semibold",
                              STATUS_STYLES[value as string]
                            )}
                          >
                            {value as string}
                          </span>
                        ) : col.key === "errors" && (value as number) > 0 ? (
                          <span className="font-semibold text-destructive">{formatCell(col, value)}</span>
                        ) : (
                          formatCell(col, value)
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={COLUMNS.length} className="h-40 bg-card text-center text-muted-foreground">
                    No runs match these filters.
                    {filters.length || query ? (
                      <Button
                        variant="link"
                        onClick={() => {
                          setFilters([])
                          setQuery("")
                        }}
                      >
                        Reset
                      </Button>
                    ) : null}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
        <p className="text-sm text-muted-foreground">
          {rows.length ? (
            <>
              Showing <span className="font-medium text-foreground">{start}–{end}</span> of{" "}
            </>
          ) : null}
          <span className="font-medium text-foreground">{rows.length}</span> runs
          {rows.length !== ROWS.length ? <> (filtered from {ROWS.length})</> : null}
        </p>
        <Pagination className="mx-0 w-auto">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                aria-disabled={currentPage === 0}
                className={cn(currentPage === 0 && "pointer-events-none opacity-50")}
                onClick={(e) => {
                  e.preventDefault()
                  setPage(Math.max(0, currentPage - 1))
                }}
              />
            </PaginationItem>
            {Array.from({ length: pageCount }, (_, i) => (
              <PaginationItem key={i}>
                <PaginationLink
                  href="#"
                  isActive={i === currentPage}
                  onClick={(e) => {
                    e.preventDefault()
                    setPage(i)
                  }}
                >
                  {i + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                href="#"
                aria-disabled={currentPage >= pageCount - 1}
                className={cn(currentPage >= pageCount - 1 && "pointer-events-none opacity-50")}
                onClick={(e) => {
                  e.preventDefault()
                  setPage(Math.min(pageCount - 1, currentPage + 1))
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  )
}
