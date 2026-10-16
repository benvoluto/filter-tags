"use client"

import * as React from "react"
import { BookmarkPlusIcon, FilterXIcon, PlusIcon } from "lucide-react"

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
import { filterColumns, matchFilters, matchSearch, newFilterId, type Filter, type MatchMode } from "@/lib/filters"
import { cn } from "@/lib/utils"
import { ColumnHeader, type SortDir, type SortRule } from "./column-header"
import { FilterChip } from "./filter-chip"
import { FilterEditor, type FilterDraft } from "./filter-editor"
import { FilterProbeProvider } from "./filter-probe"
import { dashedPillClass, QuickFilter } from "./quick-filter"
import { SearchBox } from "./search-box"
import { ViewsMenu } from "./views-menu"
import { makeView, viewMatchesState, type SavedView } from "@/lib/views"

/** Partial filters shown next to the search box: column chosen, criteria pending. */
const QUICK_FILTERS: ColumnKey[] = ["customer", "trigger", "duration"]

const SEARCH_INPUT_ID = "runs-search"

const PAGE_SIZE = 17 // 50 rows → 3 pages

// Soft, square-ish status pills in the style of Notable's disposition tags.
const STATUS_STYLES: Record<string, string> = {
  Completed: "bg-green-50 text-green-600 dark:bg-green-400/10 dark:text-green-400",
  Failed: "bg-red-50 text-red-500 dark:bg-red-400/10 dark:text-red-400",
  "Needs Review": "bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300",
  Running: "bg-blue-50 text-blue-600 dark:bg-blue-400/10 dark:text-blue-300",
  Cancelled: "bg-neutral-100 text-neutral-500 dark:bg-white/8 dark:text-neutral-400",
}

/** Columns rendered as underlined entity links, like Notable's "Initiated By" / "Recipient". */
const LINK_COLUMNS = new Set<ColumnKey>(["runId", "customer", "owner"])

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

/** "filters": filters only · "quick": filters + partial (quick) filters · "views": filters, quick filters + saved views */
export type PrototypeVariant = "filters" | "quick" | "views"

export function RunsTable({ variant = "filters" }: { variant?: PrototypeVariant }) {
  const [query, setQuery] = React.useState("")
  const [filters, setFilters] = React.useState<Filter[]>([])
  const [sort, setSort] = React.useState<SortRule[]>([
    { key: "status", dir: "asc" },
    { key: "started", dir: "desc" },
  ])
  const [page, setPage] = React.useState(0)
  const [hoveredCol, setHoveredCol] = React.useState<ColumnKey | null>(null)
  const [addOpen, setAddOpen] = React.useState(false)
  const [matchMode, setMatchMode] = React.useState<MatchMode>("all")
  const [views, setViews] = React.useState<SavedView[]>([])
  const [selectedViewId, setSelectedViewId] = React.useState<string | null>(null)
  const toolbarRef = React.useRef<HTMLDivElement>(null)
  const leftRef = React.useRef<HTMLDivElement>(null)
  const rightRef = React.useRef<HTMLDivElement>(null)
  const stackActions = useStackedActions(toolbarRef, leftRef, rightRef)

  // Single-key shortcuts, active only when nothing on the page has focus:
  //   F → open Add filter · S → focus search · C → clear all filters
  const openedByShortcut = React.useRef(false)
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey || e.shiftKey || e.isComposing) return
      const el = document.activeElement
      if (el && el !== document.body) return
      const key = e.key.toLowerCase()
      if (key === "f") {
        e.preventDefault()
        openedByShortcut.current = true
        setAddOpen(true)
      } else if (key === "s") {
        e.preventDefault()
        document.getElementById(SEARCH_INPUT_ID)?.focus()
      } else if (key === "c") {
        e.preventDefault()
        setFilters((fs) => (fs.length ? [] : fs))
        setPage(0)
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [])

  const rows = React.useMemo(() => {
    // The search box always narrows results; the match mode only governs how filters combine.
    const visible = ROWS.filter((r) => matchFilters(r, filters, matchMode) && matchSearch(r, query))
    return [...visible].sort((a, b) => compareRows(a, b, sort))
  }, [filters, matchMode, query, sort])

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

  const filteredColumns = new Set(filters.flatMap(filterColumns))
  // A partial filter disappears once its column has a filter (and returns when that filter is
  // removed); all of them hide once more than three filters are applied. Not shown in "filters only".
  const quickFilters =
    variant === "filters" || filters.length > 3 ? [] : QUICK_FILTERS.filter((key) => !filteredColumns.has(key))

  // Saved views (views variant only)
  const showViews = variant === "views"
  const selectedView = views.find((v) => v.id === selectedViewId) ?? null
  const viewEdited = selectedView ? !viewMatchesState(selectedView, filters, sort, matchMode) : false
  const canSaveView = showViews && filters.length > 0 && (!selectedView || viewEdited)
  const applyView = (view: SavedView | null) => {
    setSelectedViewId(view?.id ?? null)
    if (!view) return
    setFilters(view.filters.map((f) => ({ ...f, id: newFilterId() })))
    setSort(view.sort)
    setMatchMode(view.matchMode)
    setPage(0)
  }
  const saveView = () => {
    const view = makeView(`View ${views.length + 1}`, filters, sort, matchMode)
    setViews((vs) => [...vs, view])
    setSelectedViewId(view.id)
  }
  const start = rows.length ? currentPage * PAGE_SIZE + 1 : 0
  const end = currentPage * PAGE_SIZE + pageRows.length

  return (
    <FilterProbeProvider filters={filters} matchMode={matchMode} query={query}>
      <div className="flex flex-col gap-3">
        {/* Toolbar: [search · partial filters · chips · add filter] ···· [clear filters · match all] */}
        <div ref={toolbarRef} className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div ref={leftRef} className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            {showViews ? (
              <ViewsMenu
                views={views}
                selectedId={selectedViewId}
                edited={viewEdited}
                onSelect={applyView}
                onRename={(id, name) => setViews((vs) => vs.map((v) => (v.id === id ? { ...v, name } : v)))}
              />
            ) : null}
            <SearchBox
              value={query}
              onChange={(v) => {
                setQuery(v)
                setPage(0)
              }}
              resultCount={rows.length}
              onSaveAsFilter={saveSearchAsFilter}
              inputId={SEARCH_INPUT_ID}
              className="w-full sm:w-[18rem] lg:w-[22rem]"
            />

            {quickFilters.length ? (
              <div role="group" aria-label="Quick filters" className="flex flex-wrap items-center gap-2">
                {quickFilters.map((key) => (
                  <QuickFilter key={key} column={key} onAdd={addFilter} />
                ))}
              </div>
            ) : null}

            {filters.map((f) => (
              <FilterChip
                key={f.id}
                filter={f}
                onChange={(d) => updateFilter(f.id, d)}
                onRemove={() => removeFilter(f.id)}
              />
            ))}

            <Popover
              open={addOpen}
              onOpenChange={(open) => {
                setAddOpen(open)
                if (open) openedByShortcut.current = false
              }}
            >
              <PopoverTrigger
                render={
                  <Button
                    variant="outline"
                    className={dashedPillClass}
                  />
                }
              >
                <PlusIcon className="size-3.5 text-muted-foreground" />
                Add filter
                <kbd className="ml-0.5 hidden h-4 min-w-4 items-center justify-center rounded border border-border bg-muted px-1 font-sans text-[10px] font-medium text-muted-foreground [@media(hover:hover)]:inline-flex">
                  F
                </kbd>
              </PopoverTrigger>
              <PopoverContent
                align="start"
                sideOffset={6}
                className="w-auto max-w-[calc(100vw-2rem)] p-3"
                // When opened with F, don't hand focus back to the button on close, so the page returns
                // to the "nothing focused" state and the shortcuts keep working back to back.
                finalFocus={() => !openedByShortcut.current}
              >
                <FilterEditor
                  onCancel={() => setAddOpen(false)}
                  onSubmit={(draft) => {
                    addFilter(draft)
                    setAddOpen(false)
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Actions stay at the right edge: one row (Clear · Match) while the filters fit on one
              line, stacked (Match above Clear) once they wrap. Below sm they sit in a row underneath.
              In the views variant, Save view sits at the far right. */}
          <div ref={rightRef} className="flex shrink-0 items-start justify-end gap-2">
            <div
              className={cn(
                "flex items-center justify-end gap-2 whitespace-nowrap",
                // The views variant keeps its compact actions on one line; filters-only stacks them.
                stackActions && !showViews && "sm:flex-col-reverse sm:items-end"
              )}
            >
              {filters.length > 0 && showViews ? (
                <Button
                  data-toolbar-action
                  variant="ghost"
                  size="icon"
                  aria-label="Clear filters"
                  title="Clear filters"
                  className="rounded-full text-muted-foreground hover:text-foreground [&_svg:not([class*='size-'])]:size-3.5"
                  onClick={() => setFilters([])}
                >
                  <FilterXIcon />
                </Button>
              ) : filters.length > 0 ? (
                <Button
                  data-toolbar-action
                  variant="ghost"
                  className="h-8 gap-1.5 rounded-full px-2 text-xs font-normal text-muted-foreground hover:text-foreground [&_svg:not([class*='size-'])]:size-3.5"
                  onClick={() => setFilters([])}
                >
                  <FilterXIcon />
                  Clear filters
                  <kbd className="ml-0.5 hidden h-4 min-w-4 items-center justify-center rounded border border-border bg-muted px-1 font-sans text-[10px] font-medium text-muted-foreground [@media(hover:hover)]:inline-flex">
                    C
                  </kbd>
                </Button>
              ) : null}

              <MatchAllToggle
                label={showViews ? "Match all" : "Match all filters"}
                checked={matchMode === "all"}
                onChange={(all) => {
                  setMatchMode(all ? "all" : "any")
                  setPage(0)
                }}
              />
            </div>

            {canSaveView ? (
              <Button
                data-toolbar-action
                onClick={saveView}
                className="h-8 gap-1.5 rounded-full px-3 text-xs whitespace-nowrap [&_svg:not([class*='size-'])]:size-3.5"
                title={selectedView ? `Save as a new view (${selectedView.name} has been edited)` : undefined}
              >
                <BookmarkPlusIcon />
                Save view
              </Button>
            ) : null}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-md border border-border bg-card">
          <div className="relative w-full overflow-x-auto">
            <table className="w-full border-separate border-spacing-0 text-[13px]" onMouseLeave={() => setHoveredCol(null)}>
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
                            "h-10 border-b border-border bg-card px-3 whitespace-nowrap text-foreground/90 transition-colors group-last/row:border-b-0 group-hover/row:bg-muted/70",
                            col.align === "right" && "text-right tabular-nums",
                            hovered && "bg-muted/50 group-hover/row:bg-muted",
                            i === 0 && "sticky left-0 z-[1] tabular-nums shadow-[1px_0_0_var(--border)] md:static md:shadow-none",
                            isEmptyValue(value) && "text-muted-foreground"
                          )}
                        >
                          {col.key === "status" ? (
                            <span
                              className={cn(
                                "inline-flex h-5 items-center rounded-[4px] px-1.5 text-[11px] font-semibold",
                                STATUS_STYLES[value as string]
                              )}
                            >
                              {value as string}
                            </span>
                          ) : col.key === "errors" && (value as number) > 0 ? (
                            <span className="font-semibold text-red-500">{formatCell(col, value)}</span>
                          ) : LINK_COLUMNS.has(col.key) && !isEmptyValue(value) ? (
                            <a
                              href="#"
                              onClick={(e) => e.preventDefault()}
                              className="underline decoration-foreground/40 underline-offset-[3px] hover:decoration-foreground"
                            >
                              {formatCell(col, value)}
                            </a>
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
          <p className="text-[13px] text-muted-foreground">
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
    </FilterProbeProvider>
  )
}

const TOOLBAR_GAP = 8 // gap-2

/**
 * True when the toolbar's left items would wrap if the right-hand actions sat in a single row.
 * Measuring against the *row* width of the actions (not their current width) avoids flip-flopping
 * between layouts when stacking them frees up just enough room to unwrap.
 */
function useStackedActions(
  toolbarRef: React.RefObject<HTMLDivElement | null>,
  leftRef: React.RefObject<HTMLDivElement | null>,
  rightRef: React.RefObject<HTMLDivElement | null>
) {
  const [stacked, setStacked] = React.useState(false)
  React.useLayoutEffect(() => {
    const toolbar = toolbarRef.current
    const left = leftRef.current
    const right = rightRef.current
    if (!toolbar || !left || !right) return
    const rowWidth = (kids: Element[]) => {
      const widths = kids.reduce((w, k) => w + k.getBoundingClientRect().width, 0)
      return widths + TOOLBAR_GAP * Math.max(0, kids.length - 1)
    }
    // Measure the individual actions (they keep their width whether stacked or not).
    const actions = Array.from(right.querySelectorAll("[data-toolbar-action]"))
    const measure = () => {
      const available = toolbar.clientWidth - rowWidth(actions) - TOOLBAR_GAP
      setStacked(rowWidth(Array.from(left.children)) > available + 0.5)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(toolbar)
    for (const el of [...Array.from(left.children), ...actions]) ro.observe(el)
    return () => ro.disconnect()
  })
  return stacked
}

/** Small switch: on = rows must match every filter (AND), off = any filter (OR). */
function MatchAllToggle({
  label = "Match all filters",
  checked,
  onChange,
  className,
}: {
  label?: string
  checked: boolean
  onChange: (checked: boolean) => void
  className?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      data-toolbar-action
      aria-checked={checked}
      title={checked ? "Rows must match every filter" : "Rows may match any filter"}
      onClick={() => onChange(!checked)}
      className={cn(
        "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        className
      )}
    >
      <span
        aria-hidden
        className={cn(
          "relative inline-flex h-3 w-5 shrink-0 rounded-full transition-colors",
          checked ? "bg-foreground" : "bg-input"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 size-2 rounded-full bg-background shadow-xs transition-transform",
            checked && "translate-x-2"
          )}
        />
      </span>
      {label}
    </button>
  )
}
