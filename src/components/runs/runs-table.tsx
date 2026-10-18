"use client"

import * as React from "react"
import Button from "@mui/material/Button"
import Chip, { type ChipProps } from "@mui/material/Chip"
import FormControlLabel from "@mui/material/FormControlLabel"
import IconButton from "@mui/material/IconButton"
import Link from "@mui/material/Link"
import Pagination from "@mui/material/Pagination"
import Stack from "@mui/material/Stack"
import Switch from "@mui/material/Switch"
import Table from "@mui/material/Table"
import TableBody from "@mui/material/TableBody"
import TableCell from "@mui/material/TableCell"
import TableContainer from "@mui/material/TableContainer"
import TableHead from "@mui/material/TableHead"
import TableRow from "@mui/material/TableRow"
import Toolbar from "@mui/material/Toolbar"
import Typography from "@mui/material/Typography"
import AddIcon from "@mui/icons-material/Add"
import BookmarkAddOutlinedIcon from "@mui/icons-material/BookmarkAddOutlined"
import FilterAltOffOutlinedIcon from "@mui/icons-material/FilterAltOffOutlined"

import { COLUMNS, ROWS, formatCell, isEmptyValue, type ColumnKey, type RunRow } from "@/lib/data"
import { filterColumns, matchFilters, matchSearch, newFilterId, type Filter, type MatchMode } from "@/lib/filters"
import type { SortDir, SortRule } from "@/lib/sort"
import { makeView, viewMatchesState, type SavedView } from "@/lib/views"
import { ColumnHeader } from "./column-header"
import { FilterChip } from "./filter-chip"
import { FilterEditor, type FilterDraft } from "./filter-editor"
import { FilterPopover } from "./filter-popover"
import { FilterProbeProvider } from "./filter-probe"
import { QuickFilter } from "./quick-filter"
import { SearchBox } from "./search-box"
import { ViewsMenu } from "./views-menu"

const PAGE_SIZE = 17 // 50 rows → 3 pages

/** Partial filters shown next to the search box: column chosen, criteria pending. */
const QUICK_FILTERS: ColumnKey[] = ["customer", "trigger", "duration"]

const STATUS_COLOR: Record<string, ChipProps["color"]> = {
  Completed: "success",
  Failed: "error",
  "Needs Review": "warning",
  Running: "info",
  Cancelled: "default",
}

/** Columns rendered as underlined entity links, like Notable's "Initiated By" / "Recipient". */
const LINK_COLUMNS = new Set<ColumnKey>(["runId", "customer", "owner"])

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

/** "filters": filters only · "quick": + partial (quick) filters · "views": + quick filters and saved views */
export type PrototypeVariant = "filters" | "quick" | "views"

export function RunsTable({ variant = "filters" }: { variant?: PrototypeVariant }) {
  const [query, setQuery] = React.useState("")
  const [filters, setFilters] = React.useState<Filter[]>([])
  const [sort, setSort] = React.useState<SortRule | null>({ key: "started", dir: "desc" })
  const [matchMode, setMatchMode] = React.useState<MatchMode>("all")
  const [page, setPage] = React.useState(1)
  const [addAnchor, setAddAnchor] = React.useState<HTMLButtonElement | null>(null)
  const [addOpen, setAddOpen] = React.useState(false)
  const [views, setViews] = React.useState<SavedView[]>([])
  const [selectedViewId, setSelectedViewId] = React.useState<string | null>(null)
  const searchRef = React.useRef<HTMLTextAreaElement>(null)
  const toolbarRef = React.useRef<HTMLDivElement>(null)
  const leftRef = React.useRef<HTMLDivElement>(null)
  const rightRef = React.useRef<HTMLDivElement>(null)
  const stackActions = useStackedActions(toolbarRef, leftRef, rightRef)

  // Single-key shortcuts, only when nothing on the page has focus: F add filter · S search · C clear.
  // (MUI popovers restore focus to whatever was focused when they opened — the body, for F.)
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey || e.shiftKey || e.isComposing) return
      const el = document.activeElement
      if (el && el !== document.body) return
      const key = e.key.toLowerCase()
      if (key === "f") {
        e.preventDefault()
        setAddOpen(true)
      } else if (key === "s") {
        e.preventDefault()
        searchRef.current?.focus()
      } else if (key === "c") {
        e.preventDefault()
        setFilters((fs) => (fs.length ? [] : fs))
        setPage(1)
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [])

  const rows = React.useMemo(() => {
    const visible = ROWS.filter((r) => matchFilters(r, filters, matchMode) && matchSearch(r, query))
    return [...visible].sort((a, b) => compareRows(a, b, sort))
  }, [filters, matchMode, query, sort])

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const pageRows = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const addFilter = (draft: FilterDraft) => {
    setFilters((fs) => [...fs, { ...draft, id: newFilterId() }])
    setPage(1)
  }
  const updateFilter = (id: string, draft: FilterDraft) => {
    setFilters((fs) => fs.map((f) => (f.id === id ? { ...draft, id } : f)))
    setPage(1)
  }
  const removeFilter = (id: string) => setFilters((fs) => fs.filter((f) => f.id !== id))
  const saveSearchAsFilter = () => {
    const text = query.trim()
    if (!text) return
    addFilter({ kind: "search", column: "runId", comparator: "contains", values: [text] })
    setQuery("")
  }
  const applySort = (key: ColumnKey, dir: SortDir | null) => setSort(dir ? { key, dir } : null)

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
    setPage(1)
  }
  const saveView = () => {
    const view = makeView(`View ${views.length + 1}`, filters, sort, matchMode)
    setViews((vs) => [...vs, view])
    setSelectedViewId(view.id)
  }

  const start = rows.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0
  const end = (currentPage - 1) * PAGE_SIZE + pageRows.length

  return (
    <FilterProbeProvider filters={filters} matchMode={matchMode} query={query}>
      <Stack spacing={1.5}>
        {/* [views · search · partial filters · chips · Add filter] ··· [Clear · Match all · Save view] */}
        <Toolbar variant="filters" ref={toolbarRef}>
          <Stack ref={leftRef} direction="row" spacing={1} useFlexGap>
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
                setPage(1)
              }}
              resultCount={rows.length}
              onSaveAsFilter={saveSearchAsFilter}
              inputRef={searchRef}
            />
            {quickFilters.map((key) => (
              <QuickFilter key={key} column={key} onAdd={addFilter} />
            ))}
            {filters.map((f) => (
              <FilterChip key={f.id} filter={f} onChange={(d) => updateFilter(f.id, d)} onRemove={() => removeFilter(f.id)} />
            ))}
            <Button variant="dashed" startIcon={<AddIcon />} ref={setAddAnchor} onClick={() => setAddOpen(true)}>
              Add filter
            </Button>
            <FilterPopover open={addOpen && Boolean(addAnchor)} anchorEl={addAnchor} onClose={() => setAddOpen(false)}>
              <FilterEditor
                onCancel={() => setAddOpen(false)}
                onSubmit={(draft) => {
                  addFilter(draft)
                  setAddOpen(false)
                }}
              />
            </FilterPopover>
          </Stack>

          <Stack ref={rightRef} direction="row" spacing={1}>
            <Stack direction={stackActions && !showViews ? "column-reverse" : "row"} spacing={1}>
              {filters.length > 0 && showViews ? (
                <IconButton data-toolbar-action aria-label="Clear filters" title="Clear filters" onClick={() => setFilters([])}>
                  <FilterAltOffOutlinedIcon />
                </IconButton>
              ) : filters.length > 0 ? (
                <Button data-toolbar-action variant="text" startIcon={<FilterAltOffOutlinedIcon />} onClick={() => setFilters([])}>
                  Clear filters
                </Button>
              ) : null}
              <FormControlLabel
                data-toolbar-action
                label={showViews ? "Match all" : "Match all filters"}
                title={matchMode === "all" ? "Rows must match every filter" : "Rows may match any filter"}
                control={
                  <Switch
                    checked={matchMode === "all"}
                    onChange={(_, all) => {
                      setMatchMode(all ? "all" : "any")
                      setPage(1)
                    }}
                  />
                }
              />
            </Stack>
            {canSaveView ? (
              <Button
                data-toolbar-action
                variant="contained"
                startIcon={<BookmarkAddOutlinedIcon />}
                onClick={saveView}
                title={selectedView ? `Save as a new view (${selectedView.name} has been edited)` : undefined}
              >
                Save view
              </Button>
            ) : null}
          </Stack>
        </Toolbar>

        <TableContainer>
          <Table aria-label="Flow runs">
            <TableHead>
              <TableRow>
                {COLUMNS.map((col) => (
                  <ColumnHeader
                    key={col.key}
                    column={col}
                    sortDir={sort?.key === col.key ? sort.dir : undefined}
                    filtered={filteredColumns.has(col.key)}
                    onSort={(dir) => applySort(col.key, dir)}
                    onAddFilter={addFilter}
                  />
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {pageRows.map((row) => (
                <TableRow key={row.runId} hover>
                  {COLUMNS.map((col) => {
                    const value = row[col.key]
                    return (
                      <TableCell key={col.key} align={col.align ?? "left"}>
                        {isEmptyValue(value) ? (
                          <Typography variant="body2" color="text.secondary">
                            —
                          </Typography>
                        ) : col.key === "status" ? (
                          <Chip variant="soft" size="small" color={STATUS_COLOR[value as string]} label={value as string} />
                        ) : col.key === "errors" && (value as number) > 0 ? (
                          <Typography variant="subtitle2" color="error">
                            {formatCell(col, value)}
                          </Typography>
                        ) : LINK_COLUMNS.has(col.key) ? (
                          <Link href="#" onClick={(e) => e.preventDefault()}>
                            {formatCell(col, value)}
                          </Link>
                        ) : (
                          formatCell(col, value)
                        )}
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))}
              {pageRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={COLUMNS.length} align="center">
                    <Typography variant="body2" color="text.secondary">
                      No runs match these filters.
                    </Typography>
                    {filters.length || query ? (
                      <Button
                        variant="text"
                        onClick={() => {
                          setFilters([])
                          setQuery("")
                        }}
                      >
                        Reset
                      </Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </TableContainer>

        <Toolbar variant="panelBar">
          <Typography variant="body2" color="text.secondary">
            {rows.length ? `Showing ${start}–${end} of ` : ""}
            {rows.length} runs{rows.length !== ROWS.length ? ` (filtered from ${ROWS.length})` : ""}
          </Typography>
          <Pagination count={pageCount} page={currentPage} onChange={(_, p) => setPage(p)} />
        </Toolbar>
      </Stack>
    </FilterProbeProvider>
  )
}

const TOOLBAR_GAP = 8

/**
 * True when the toolbar's left items would wrap if the right-hand actions sat in a single row.
 * Measures the individual actions (their width doesn't change when stacked) to avoid flip-flopping.
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
    const rowWidth = (kids: Element[]) =>
      kids.reduce((w, k) => w + k.getBoundingClientRect().width, 0) + TOOLBAR_GAP * Math.max(0, kids.length - 1)
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
