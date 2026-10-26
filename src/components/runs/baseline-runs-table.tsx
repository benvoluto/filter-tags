"use client"

// ───────────────────────────────────────────────────────────────────────────
// "Views only": flow-studio-lite's filter row exactly as `main` ships it, plus saved views.
//
// The point of the variant is to be the control case. Everything the redesign added is absent —
// no Add filter, no operators, no multi-select, no advanced conditions, no match-all toggle, no
// column-header filter button, no save-search-as-filter, no keyboard shortcuts. What is left is
// one single-value chip per column and a search box, which is the whole of today's filtering, and
// the one thing layered on top is the saved-views bar the other variants carry.
//
// So the question this variant asks is narrow and answerable: how far do saved views get you
// *without* a richer filter model? A view can hold a combination somebody would otherwise rebuild
// by hand every morning, and it costs no new filtering concepts to learn.
// ───────────────────────────────────────────────────────────────────────────

import * as React from "react"
import { Button, Stack } from "@mui/material"
import { type GridColDef } from "@mui/x-data-grid"
import { BookmarkSimpleIcon } from "@phosphor-icons/react"

import { NotableDataGrid, Text, colors, useTableState } from "common"
import { FilterBar } from "@/vivaa/staff/components/Layout/FilterBar"
import {
  BASELINE_FILTER_COLUMNS,
  appliedBaselineColumns,
  matchBaselineRow,
  type BaselineFilterValues,
} from "@/lib/baseline-filters"
import {
  baselineViewMatchesState,
  describeBaselineView,
  makeBaselineView,
  type BaselineView,
} from "@/lib/baseline-views"
import { COLUMNS, ROWS, type RunRow } from "@/lib/data"
import { BaselineFilter } from "./baseline-filter"
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
import { SearchBox, type SearchBoxHandle } from "./search-box"
import { ViewsMenu, type ViewSummary } from "./views-menu"

export function BaselineRunsTable() {
  const [query, setQuery] = React.useState("")
  const [values, setValues] = React.useState<BaselineFilterValues>({})
  const [views, setViews] = React.useState<BaselineView[]>([])
  const [selectedViewId, setSelectedViewId] = React.useState<string | null>(null)
  const searchRef = React.useRef<SearchBoxHandle>(null)

  const { pagination, sort: sortState, paginationModel, goToFirstPage } = useTableState({
    defaultPageSize: 25,
    defaultSortModel: DEFAULT_SORT,
  })
  const sort = toSortRule(sortState.sortModel)

  const rows = React.useMemo(() => {
    const rule = toSortRule(sortState.sortModel)
    const visible = ROWS.filter((row) => matchBaselineRow({ row, values, query }))
    return [...visible].sort((a, b) => compareRows(a, b, rule))
  }, [values, query, sortState.sortModel])

  // The grid runs in server mode (as on every staff page): it is handed one page and the total.
  const { page, pageSize } = paginationModel
  const pageRows = rows.slice(page * pageSize, (page + 1) * pageSize)

  const setFilterValue = (column: (typeof BASELINE_FILTER_COLUMNS)[number], value: string) => {
    setValues((prev) => ({ ...prev, [column]: value }))
    goToFirstPage()
  }

  const resetAll = () => {
    setValues({})
    searchRef.current?.clear()
    goToFirstPage()
  }

  const applied = appliedBaselineColumns(values)
  const hasState = applied.length > 0 || query.trim() !== ""

  const selectedView = views.find((v) => v.id === selectedViewId) ?? null
  const viewEdited = selectedView ? !baselineViewMatchesState(selectedView, { values, sort, query }) : false
  /* A view here can be nothing but a search, so a query alone is worth saving — unlike the
     redesign, where search is excluded because it can be promoted to a filter chip instead. */
  const canSaveView = hasState && (!selectedView || viewEdited)

  const applyView = (view: BaselineView | null) => {
    setSelectedViewId(view?.id ?? null)
    if (!view) return
    setValues({ ...view.values })
    sortState.setSortModel(toSortModel(view.sort))
    setQuery(view.query)
    goToFirstPage()
  }

  const saveView = () => {
    const view = makeBaselineView({ name: `View ${views.length + 1}`, values, sort, query })
    setViews((vs) => [...vs, view])
    setSelectedViewId(view.id)
  }

  const menuViews: (BaselineView & ViewSummary)[] = views.map((v) => ({ ...v, description: describeBaselineView(v) }))

  const columns: GridColDef<RunRow>[] = COLUMNS.map((col) => ({
    field: col.key,
    headerName: col.label,
    flex: 1,
    minWidth: (col.minWidth ?? 120) + 24,
    align: col.align ?? "left",
    headerAlign: col.align ?? "left",
    renderCell: ({ row }) => <RunCell column={col.key} row={row} />,
  }))

  return (
    <ResetContext.Provider value={hasState ? resetAll : null}>
      <Stack gap={2}>
        {/*
          `main`'s filter row: every chip is always present, in column order, and the search box
          follows them. There is no second line, because nothing here accumulates — a column holds
          one value or none, so the row's width is fixed by the number of columns. The views menu
          and Save view are the variant's only additions, and they sit at the right so the chips
          read as the page's own and the views bar as the layer above them.
        */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
          <FilterBar>
            {BASELINE_FILTER_COLUMNS.map((column) => (
              <BaselineFilter
                key={column}
                column={column}
                value={values[column] ?? ""}
                onChange={(value) => setFilterValue(column, value)}
              />
            ))}
            <SearchBox
              ref={searchRef}
              value={query}
              onChange={(next) => {
                setQuery(next)
                goToFirstPage()
              }}
              resultCount={rows.length}
              /* No "Save as filter": this model cannot turn a query into a chip. Saving the view
                 is what keeps the search, which is why the view carries `query`. */
              onSaveAsFilter={undefined}
            />
          </FilterBar>
          <Stack direction="row" alignItems="center" gap={1}>
            <ViewsMenu
              views={menuViews}
              selectedId={selectedViewId}
              edited={viewEdited}
              onSelect={applyView}
              onRename={(id, name) => setViews((vs) => vs.map((v) => (v.id === id ? { ...v, name } : v)))}
            />
            {canSaveView && (
              <Button
                variant="contained"
                startIcon={<BookmarkSimpleIcon size={16} />}
                onClick={saveView}
                title={selectedView ? `Save as a new view (${selectedView.name} has been edited)` : undefined}
              >
                Save view
              </Button>
            )}
          </Stack>
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
    </ResetContext.Provider>
  )
}
