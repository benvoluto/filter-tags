"use client"

import * as React from "react"
import { Button, CircularProgress, FormControlLabel, IconButton, Link, Stack, Switch, Tooltip } from "@mui/material"
import { type GridColDef, type GridSortModel } from "@mui/x-data-grid"
import { BookmarkSimpleIcon, FunnelSimpleXIcon } from "@phosphor-icons/react"

import { NoRecordsOverlay, NotableDataGrid, Tag, type TagColor, Text, colors, useTableState } from "common"
import { FilterBar } from "@/vivaa/staff/components/Layout/FilterBar"
import { FILTER_HEIGHT } from "@/vivaa/staff/components/FiltersV2/constants"
import type { SearchBoxHandle } from "./search-box"
import { COLUMNS, COLUMN_MAP, ROWS, formatCell, isEmptyValue, type ColumnKey, type RunRow } from "@/lib/data"
import { filterColumns, matchFilters, matchSearch, newFilterId, type Filter, type MatchMode } from "@/lib/filters"
import type { SortRule } from "@/lib/sort"
import type { PrototypeVariant } from "@/lib/variants"
import { suggestViewName } from "@/lib/filter-model"
import {
  fallbackViewName,
  makeView,
  sortSummary,
  uniqueViewName,
  viewFilterSummary,
  viewMatchesState,
  type SavedView,
} from "@/lib/views"
import { ColumnHeader } from "./column-header"
import { FilterChip } from "./filter-chip"
import { FilterEditor, type FilterDraft } from "./filter-editor"
import { HeaderFilterPopover } from "./filter-popover"
import { FilterProbeProvider } from "./filter-probe"
import { AddFilter, QuickFilter } from "./quick-filter"
import { PROMPT_PLACEHOLDER, PromptBox, type AppliedPrompt } from "./prompt-box"
import { SEARCH_PLACEHOLDER, SearchBox } from "./search-box"
import { InlineViewsMenu, ViewsMenu } from "./views-menu"

/** Partial filters shown next to the search box: column chosen, criteria pending. */
const QUICK_FILTERS: ColumnKey[] = ["customer", "trigger", "duration"]

/** Status → staff `Tag` colour, following FLOW_RUN_TAG_PROPS (web/staff/…/Flows/Runs/Run/Status.tsx). */
const STATUS_TAG_COLOR: Record<string, TagColor> = {
  Completed: "success",
  Failed: "error",
  "Needs Review": "warning",
  Running: "primary",
  Cancelled: "error",
}

/** Columns rendered as entity links (the theme's MuiDataGrid cell link style: ink, blue on hover). */
const LINK_COLUMNS = new Set<ColumnKey>(["runId", "customer", "owner"])

/** Page sizes the MIT grid allows (staff offers 250 and 500 too; the MIT grid caps pages at 100). */
const PAGE_SIZE_OPTIONS = [5, 25, 50, 100]

const DEFAULT_SORT: GridSortModel = [{ field: "started", sort: "desc" }]

function toSortRule(sortModel: GridSortModel): SortRule | null {
  const [first] = sortModel
  return first?.sort ? { key: first.field as ColumnKey, dir: first.sort } : null
}

function toSortModel(sort: SortRule | null): GridSortModel {
  return sort ? [{ field: sort.key, sort: sort.dir }] : []
}

function compareRows(a: RunRow, b: RunRow, sort: SortRule | null) {
  if (!sort) return 0
  const av = a[sort.key]
  const bv = b[sort.key]
  // Empty values always sink to the bottom regardless of direction.
  if (isEmptyValue(av) && isEmptyValue(bv)) return 0
  if (isEmptyValue(av)) return 1
  if (isEmptyValue(bv)) return -1
  const cmp = typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv))
  return sort.dir === "asc" ? cmp : -cmp
}

export type { PrototypeVariant } from "@/lib/variants"

/** Lets the grid's empty overlay (a slot component) reach the page's reset. */
const ResetContext = React.createContext<(() => void) | null>(null)

function RunsNoRowsOverlay() {
  const reset = React.useContext(ResetContext)
  return (
    <NoRecordsOverlay
      customMessage={{
        title: "No runs match these filters",
        action: reset ? (
          <Button variant="outlined" onClick={reset}>
            Clear search and filters
          </Button>
        ) : undefined,
      }}
    />
  )
}

export function RunsTable({ variant = "filters" }: { variant?: PrototypeVariant }) {
  const [query, setQuery] = React.useState("")
  const [filters, setFilters] = React.useState<Filter[]>([])
  const [matchMode, setMatchMode] = React.useState<MatchMode>("all")
  const [isAddOpen, setIsAddOpen] = React.useState(false)
  const [headerFilter, setHeaderFilter] = React.useState<{ column: ColumnKey; anchor: Element } | null>(null)
  const [views, setViews] = React.useState<SavedView[]>([])
  const [selectedViewId, setSelectedViewId] = React.useState<string | null>(null)
  const searchRef = React.useRef<SearchBoxHandle>(null)

  // Staff's table state hook: page + page size + sort model, in the grid's own shapes.
  const { pagination, sort: sortState, paginationModel, goToFirstPage } = useTableState({
    defaultPageSize: 25,
    defaultSortModel: DEFAULT_SORT,
  })
  const sort = toSortRule(sortState.sortModel)
  const setSort = (rule: SortRule | null) => sortState.setSortModel(toSortModel(rule))

  // Single-key shortcuts, only when nothing on the page has focus: F add filter · S search · C clear.
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey || e.shiftKey || e.isComposing) return
      const el = document.activeElement
      if (el && el !== document.body) return
      const key = e.key.toLowerCase()
      if (key === "f") {
        e.preventDefault()
        setIsAddOpen(true)
      } else if (key === "s") {
        e.preventDefault()
        // TextSearch puts its aria-label on the TextField root, so find the input by placeholder.
        const placeholder = variant === "prompt" ? PROMPT_PLACEHOLDER : SEARCH_PLACEHOLDER
        document.querySelector<HTMLElement>(`[placeholder="${placeholder}"]`)?.focus()
      } else if (key === "c") {
        e.preventDefault()
        setFilters((fs) => (fs.length ? [] : fs))
        // Prompt variant: clearing every filter also clears the selected view.
        if (variant === "prompt") setSelectedViewId(null)
        goToFirstPage()
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [goToFirstPage, variant])

  const rows = React.useMemo(() => {
    const rule = toSortRule(sortState.sortModel)
    const visible = ROWS.filter((r) => matchFilters(r, filters, matchMode) && matchSearch(r, query))
    return [...visible].sort((a, b) => compareRows(a, b, rule))
  }, [filters, matchMode, query, sortState.sortModel])

  // The grid runs in server mode (as on every staff page): it is handed one page and the total.
  const { page, pageSize } = paginationModel
  const pageRows = rows.slice(page * pageSize, (page + 1) * pageSize)

  const addFilter = (draft: FilterDraft) => {
    setFilters((fs) => [...fs, { ...draft, id: newFilterId() }])
    goToFirstPage()
  }
  const updateFilter = (id: string, draft: FilterDraft) => {
    setFilters((fs) => fs.map((f) => (f.id === id ? { ...draft, id } : f)))
    goToFirstPage()
  }
  const removeFilter = (id: string) => {
    const remaining = filters.filter((f) => f.id !== id)
    setFilters(remaining)
    if (!remaining.length && variant === "prompt") setSelectedViewId(null)
    goToFirstPage()
  }
  /** Prompt variant: clearing every filter also clears the selected view. */
  const clearFilters = () => {
    setFilters([])
    if (variant === "prompt") setSelectedViewId(null)
    goToFirstPage()
  }
  const saveSearchAsFilter = () => {
    const text = query.trim()
    if (!text) return
    addFilter({ kind: "search", column: "runId", comparator: "contains", values: [text] })
    searchRef.current?.clear()
  }
  /**
   * A prompt adds its filters, replacing any existing filter on the same columns (a refinement like
   * "only Epic" replaces the EHR filter, and leaves the others), and sets the sort if it names one.
   */
  const applyPrompt = (applied: AppliedPrompt) => {
    const { result } = applied
    if (!result.filters.length && !result.sort) return
    const replaced = new Set(result.filters.filter((f) => f.kind === "column").map((f) => f.column))
    setFilters((fs) => [
      ...fs.filter((f) => !filterColumns(f).some((c) => replaced.has(c))),
      ...result.filters.map((f) => ({ ...f, id: newFilterId() })),
    ])
    if (result.sort) setSort(result.sort)
    goToFirstPage()
  }
  const resetAll = () => {
    clearFilters()
    searchRef.current?.clear()
  }

  const filteredColumns = new Set(filters.flatMap(filterColumns))
  // Partial filters: hidden in "filters only", once their column is filtered, or past three filters.
  const quickFilters = variant === "filters" || variant === "prompt" || filters.length > 3 ? [] : QUICK_FILTERS.filter((k) => !filteredColumns.has(k))

  // Saved views (views and prompt variants)
  const showViews = variant === "views"
  const hasViews = showViews || variant === "prompt"
  const selectedView = views.find((v) => v.id === selectedViewId) ?? null
  const viewEdited = selectedView ? !viewMatchesState(selectedView, filters, sort, matchMode) : false
  const canSaveView = hasViews && filters.length > 0 && (!selectedView || viewEdited)
  const [isNamingView, setIsNamingView] = React.useState(false)
  const applyView = (view: SavedView | null) => {
    setSelectedViewId(view?.id ?? null)
    if (!view) return
    setFilters(view.filters.map((f) => ({ ...f, id: newFilterId() })))
    setSort(view.sort)
    setMatchMode(view.matchMode)
    goToFirstPage()
  }
  /**
   * Views variant: "View N". Prompt variant: a very short name from the on-device model (from a
   * summary of the filters and sort), or a rule-made one if the model isn't available.
   */
  const saveView = async () => {
    let name = `View ${views.length + 1}`
    if (variant === "prompt") {
      setIsNamingView(true)
      const draft = makeView("", filters, sort, matchMode)
      const summary = [viewFilterSummary(draft), draft.sort ? sortSummary(draft.sort) : ""].filter(Boolean).join(" · ")
      name = (await suggestViewName(summary)) ?? fallbackViewName(draft.filters, draft.sort)
      setIsNamingView(false)
    }
    const view = makeView(uniqueViewName(name, views), filters, sort, matchMode)
    setViews((vs) => [...vs, view])
    setSelectedViewId(view.id)
  }

  const hasFilters = filters.length > 0

  /** Partial filters, applied chips and Add filter: the filters line. */
  const filterControls = (
    <>
      {quickFilters.map((key) => (
        <QuickFilter key={key} column={key} onAdd={addFilter} />
      ))}
      {filters.map((f) => (
        <FilterChip key={f.id} filter={f} onChange={(d) => updateFilter(f.id, d)} onRemove={() => removeFilter(f.id)} />
      ))}
      <AddFilter isOpen={isAddOpen} setIsOpen={setIsAddOpen} onAdd={addFilter} />
    </>
  )

  /** Save view: on the search line beside the views menu, or (prompt variant) ending the filters line. */
  const saveViewButton = canSaveView ? (
    <Button
      variant="contained"
      startIcon={isNamingView ? <CircularProgress size={14} color="inherit" /> : <BookmarkSimpleIcon size={16} />}
      disabled={isNamingView}
      onClick={() => void saveView()}
      sx={{ whiteSpace: "nowrap" }}
      title={selectedView ? `Save as a new view (${selectedView.name} has been edited)` : undefined}
    >
      Save view
    </Button>
  ) : null

  /**
   * Clear filters and Match all (prompt variant: Clear filters and Save view): they act on the
   * filters, so they end the filters line — which only exists once a filter is applied.
   */
  const filterActions = (
    <Stack direction="row" alignItems="center" gap={1} sx={{ minHeight: FILTER_HEIGHT }}>
      {showViews ? (
        <Tooltip title="Clear filters">
          <IconButton aria-label="Clear filters" onClick={clearFilters}>
            <FunnelSimpleXIcon size={16} />
          </IconButton>
        </Tooltip>
      ) : (
        <Button variant="text" startIcon={<FunnelSimpleXIcon size={16} />} onClick={clearFilters}>
          Clear filters
        </Button>
      )}
      {/* The prompt variant has no Match all switch; its filters always all apply. */}
      {variant !== "prompt" && (
        <Tooltip title={matchMode === "all" ? "Rows must match every filter" : "Rows may match any filter"}>
          <FormControlLabel
            sx={{ marginLeft: 0, marginRight: 0, gap: 0.5, whiteSpace: "nowrap" }}
            label={<Text variant="body2">{showViews ? "Match all" : "Match all filters"}</Text>}
            control={
              <Switch
                size="small"
                checked={matchMode === "all"}
                onChange={(_, all) => {
                  setMatchMode(all ? "all" : "any")
                  goToFirstPage()
                }}
              />
            }
          />
        </Tooltip>
      )}
      {variant === "prompt" && saveViewButton}
    </Stack>
  )


  const onRenameView = (id: string, name: string) => setViews((vs) => vs.map((v) => (v.id === id ? { ...v, name } : v)))
  const viewsMenu = (
    <ViewsMenu
      views={views}
      selectedId={selectedViewId}
      edited={viewEdited}
      onSelect={applyView}
      onRename={onRenameView}
    />
  )

  const columns: GridColDef<RunRow>[] = COLUMNS.map((col) => ({
    field: col.key,
    headerName: col.label,
    flex: 1,
    minWidth: (col.minWidth ?? 120) + 24,
    align: col.align ?? "left",
    headerAlign: col.align ?? "left",
    renderHeader: () => (
      <ColumnHeader
        column={col}
        isFiltered={filteredColumns.has(col.key)}
        onOpenFilter={(anchor) => setHeaderFilter({ column: col.key, anchor })}
      />
    ),
    renderCell: ({ row }) => <RunCell column={col.key} row={row} />,
  }))

  return (
    <FilterProbeProvider filters={filters} matchMode={matchMode} query={query}>
      <ResetContext.Provider value={filters.length || query ? resetAll : null}>
        <Stack gap={2}>
          {/*
            Staff's filter row: FilterBar on the left, actions on the right, wrapping. With no filters
            it is one line. Once a filter is applied, search gets its own line and the filters (partial
            filters, chips, Add filter, Clear, Match all) a line of their own beneath it. The search
            sits at the same place in the tree in both layouts, so it never remounts mid-typing.
          */}
          {variant === "prompt" ? (
            <Stack gap={1}>
              <PromptBox
                onApply={applyPrompt}
                onAddFilter={addFilter}
                views={views}
                onOpenView={applyView}
                pristine={!hasFilters && !selectedViewId}
                viewsMenu={
                  <InlineViewsMenu
                    views={views}
                    selectedId={selectedViewId}
                    edited={viewEdited}
                    onSelect={applyView}
                    onRename={onRenameView}
                  />
                }
              />
              {hasFilters && (
                <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
                  <FilterBar>{filterControls}</FilterBar>
                  {filterActions}
                </Stack>
              )}
            </Stack>
          ) : (
            <Stack gap={1}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
                <FilterBar>
                  {showViews && viewsMenu}
                  <SearchBox
                    ref={searchRef}
                    value={query}
                    onChange={(next) => {
                      setQuery(next)
                      goToFirstPage()
                    }}
                    resultCount={rows.length}
                    onSaveAsFilter={saveSearchAsFilter}
                  />
                  {!hasFilters && filterControls}
                </FilterBar>
                {hasFilters && saveViewButton}
              </Stack>
              {hasFilters && (
                <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
                  <FilterBar>{filterControls}</FilterBar>
                  {filterActions}
                </Stack>
              )}
            </Stack>
          )}

          <NotableDataGrid<RunRow>
            data={pageRows}
            isPending={false}
            columns={columns}
            getRowId={(row) => row.runId}
            rowCount={rows.length}
            pagination={pagination}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            sort={{
              sortModel: sortState.sortModel,
              setSortModel: (model) => {
                sortState.setSortModel(model)
                goToFirstPage()
              },
            }}
            slots={{ noRowsOverlay: RunsNoRowsOverlay }}
            height="calc(100vh - 210px)"
          />

          <Text variant="caption" color={colors.content.dark}>
            {rows.length} runs{rows.length !== ROWS.length ? ` (filtered from ${ROWS.length})` : ""}
          </Text>
        </Stack>

        <HeaderFilterPopover anchorElement={headerFilter?.anchor ?? null} onClose={() => setHeaderFilter(null)}>
          {headerFilter && (
            <FilterEditor
              key={headerFilter.column}
              column={headerFilter.column}
              onCancel={() => setHeaderFilter(null)}
              onSubmit={(draft) => {
                addFilter(draft)
                setHeaderFilter(null)
              }}
            />
          )}
        </HeaderFilterPopover>
      </ResetContext.Provider>
    </FilterProbeProvider>
  )
}

/** One cell: staff `Tag` for status, entity links, error counts in the error colour, — for empty. */
function RunCell({ column, row }: { column: ColumnKey; row: RunRow }) {
  const col = COLUMN_MAP[column]
  const value = row[column]
  if (isEmptyValue(value)) {
    return (
      <Text variant="body2" color={colors.content.dark} component="span">
        —
      </Text>
    )
  }
  if (column === "status") {
    return <Tag color={STATUS_TAG_COLOR[value as string] ?? "default"}>{value as string}</Tag>
  }
  if (column === "errors" && (value as number) > 0) {
    return (
      <Text variant="body2" color="error" bold component="span">
        {formatCell(col, value)}
      </Text>
    )
  }
  if (LINK_COLUMNS.has(column)) {
    return (
      <Link href="#" underline="hover" onClick={(e) => e.preventDefault()}>
        {formatCell(col, value)}
      </Link>
    )
  }
  return (
    <Text variant="body2" component="span">
      {formatCell(col, value)}
    </Text>
  )
}
