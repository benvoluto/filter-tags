"use client"

import * as React from "react"
import { Button, FormControlLabel, IconButton, Stack, Switch, Tooltip } from "@mui/material"
import { type GridColDef } from "@mui/x-data-grid"
import { BookmarkSimpleIcon, FunnelSimpleXIcon } from "@phosphor-icons/react"

import { NotableDataGrid, Text, colors, useTableState } from "common"
import { FilterBar } from "@/vivaa/staff/components/Layout/FilterBar"
import { FILTER_HEIGHT } from "@/vivaa/staff/components/FiltersV2/constants"
import type { SearchBoxHandle } from "./search-box"
import { COLUMNS, ROWS, type ColumnKey, type RunRow } from "@/lib/data"
import { filterColumns, matchFilters, matchSearch, newFilterId, type Filter, type MatchMode } from "@/lib/filters"
import type { SortRule } from "@/lib/sort"
import { describeView, makeView, viewMatchesState, type SavedView } from "@/lib/views"
import { ColumnHeader } from "./column-header"
import {
  DEFAULT_SORT,
  PAGE_SIZE_OPTIONS,
  ResetContext,
  RunCell,
  RunsNoRowsOverlay,
  compareRows,
  toSortModel,
  toSortRule,
} from "./runs-grid"
import { FilterChip } from "./filter-chip"
import { FilterEditor, type FilterDraft } from "./filter-editor"
import { HeaderFilterPopover } from "./filter-popover"
import { FilterProbeProvider } from "./filter-probe"
import { AddFilter, QuickFilter } from "./quick-filter"
import { SEARCH_PLACEHOLDER, SearchBox } from "./search-box"
import { ViewsMenu } from "./views-menu"

/** Partial filters shown next to the search box: column chosen, criteria pending. */
const QUICK_FILTERS: ColumnKey[] = ["customer", "trigger", "duration"]

/**
 * The three redesign variants. "baseline" is today's filter row and lives in its own component
 * ({@link import("./baseline-runs-table").BaselineRunsTable}), because sharing this one would mean
 * threading a flag through every control the baseline does not have.
 */
export type RedesignVariant = "filters" | "quick" | "views"

export function RunsTable({ variant = "filters" }: { variant?: RedesignVariant }) {
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
        document.querySelector<HTMLInputElement>(`input[placeholder="${SEARCH_PLACEHOLDER}"]`)?.focus()
      } else if (key === "c") {
        e.preventDefault()
        setFilters((fs) => (fs.length ? [] : fs))
        goToFirstPage()
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [goToFirstPage])

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
    setFilters((fs) => fs.filter((f) => f.id !== id))
    goToFirstPage()
  }
  const clearFilters = () => {
    setFilters([])
    goToFirstPage()
  }
  const saveSearchAsFilter = () => {
    const text = query.trim()
    if (!text) return
    addFilter({ kind: "search", column: "runId", comparator: "contains", values: [text] })
    searchRef.current?.clear()
  }
  const resetAll = () => {
    clearFilters()
    searchRef.current?.clear()
  }

  const filteredColumns = new Set(filters.flatMap(filterColumns))
  // Partial filters: hidden in "filters only", once their column is filtered, or past three filters.
  const quickFilters = variant === "filters" || filters.length > 3 ? [] : QUICK_FILTERS.filter((k) => !filteredColumns.has(k))

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
    goToFirstPage()
  }
  const saveView = () => {
    const view = makeView(`View ${views.length + 1}`, filters, sort, matchMode)
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

  /**
   * Clear filters and Match all: they act on the filters, so they end the filters line — which only
   * exists once a filter is applied. With no filters there is nothing to clear or match.
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
    </Stack>
  )

  /** Save view belongs with the views menu, on the search line. */
  const saveViewButton = canSaveView ? (
    <Button
      variant="contained"
      startIcon={<BookmarkSimpleIcon size={16} />}
      onClick={saveView}
      title={selectedView ? `Save as a new view (${selectedView.name} has been edited)` : undefined}
    >
      Save view
    </Button>
  ) : null

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
          <Stack gap={1}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
              <FilterBar>
                {showViews && (
                  <ViewsMenu
                    views={views.map((v) => ({ ...v, description: describeView(v) }))}
                    selectedId={selectedViewId}
                    edited={viewEdited}
                    onSelect={applyView}
                    onRename={(id, name) => setViews((vs) => vs.map((v) => (v.id === id ? { ...v, name } : v)))}
                  />
                )}
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

