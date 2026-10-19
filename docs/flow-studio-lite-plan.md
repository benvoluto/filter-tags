# Plan: the filter redesign as a feedback branch in flow-studio-lite

**Goal.** Put this filter redesign on the real *Flow → Production runs / Test runs* page in
[`VivaaHealth/flow-studio-lite`](https://github.com/VivaaHealth/flow-studio-lite), on a branch with a
Vercel preview, switchable against today's filter row, so people can react to it in context rather
than in a standalone table.

## 1. Where it lands, and what is there today

| | Staff app (production) | flow-studio-lite today | This branch |
|---|---|---|---|
| Page | `web/staff/src/scenes/Agents/Details/Flow/RunsTable.tsx` | `RunsTab` in `src/surfaces/flow-detail.tsx` | same `RunsTab`, behind a flag |
| Filter row | `FilterBar` of `DateRangeFilter`, `AutocompleteFilter` × 3–4 (Run Status, Version State, Version #, Batch ID), `TextSearch` "Search by Entity ID" | `ListPageHead` with four **inert** chips (Date Range, Run Status, Version State, Version #) + a search that does nothing | search (own line once a filter is applied) · then partial filters · applied chips · Add filter · Clear · Match all (· Views) |
| Stats | `FlowStatsBar`, recomputed from the filters | `Tiles` from cohort totals | `Tiles`, recomputed from the filtered rows |
| Table | `NotableDataGrid` (DataGridPro), checkbox selection, row → run page | `NotableTable` (MUI `<Table>`) | `NotableDataGrid` (theirs, Pro) with header filter buttons |

The redesign answers the gap flow-studio-lite's own README names ("the list-page filter chips are still
bordered pills that filter nothing"), on the page upstream calls `RunsTable`.

## 2. Principles

1. **Extend flow-studio-lite's existing ports, don't add a second copy.** It already has staff's chip
   (`ui/controls.tsx` `FilterChip` ← `ChipAndPopover`), search (`SearchField` ← `TextSearch`), popover
   (`ui/filter-popover.tsx`) and grid (`ui/notable-data-grid.tsx` ← `DataGrid.tsx`). This prototype is now
   built on the same upstream files, so the port is mostly re-pointing imports.
2. **Off by default, one click to compare.** A status-bar variant tile, exactly like *Flow Home*
   (`flow-landing` / `S.flowLanding` / `?flowhome=1|0`). Off = today's page untouched.
3. **Follow its AGENTS.md:** `Text` not `Typography`, Phosphor only, `theme/tokens.ts` (`ICON`, `RADIUS`),
   `══` banners with the argument in the header, no new dependencies, `pnpm typecheck`, browser-verify,
   a story for each new primitive, no churn logs, fictional data only.
4. **Design what can be built.** Mark which fields/operators the FlowRun API supports today (§7) so
   feedback separates "UI direction" from "needs backend".

## 3. Phase 0 — finish here first (filter-tags, `staff-parity` branch)

So the port is a copy, not a rewrite:

- [ ] **Fix the known filter-component issues** (list to be supplied) here, where iteration is cheap.
- [ ] **Generalize the filter model.** `lib/filters.ts` is bound to `RunRow`/`COLUMN_MAP`. Introduce a
      `FilterColumn<R>` spec (`key`, `label`, `type`, `get(row)`, `format`, `options?`, `comparators?`)
      and make `matchFilters`, `chipParts`, `filterSummary`, the probe and the editor generic over it.
- [ ] **Split for porting:** `filter-editor.tsx` (≈700 lines) into basic panel / advanced panel /
      criteria inputs; one hook `useTableFilters(columns, rows)` that owns filters, search, match mode,
      views and returns `{ visibleRows, chips, …handlers }`.
- [ ] **Unit tests** for `matchCondition` / AND-before-OR / search (flow-studio-lite runs these as
      `node scripts/test-*.mjs`; write them so they move unchanged).
- [ ] Decide the variant(s) to show reviewers (filters only / + quick filters / + views) — see §8.

## 4. Phase 1 — branch and switch

Branch `ben/table-filters` off `main` (repo convention is `<name>/<topic>`).

- `src/data/variants.ts`: `BASELINE.tableFilters = false`; add
  `{ id: 'table-filters', label: 'Filters', hint: 'Redesigned run filters: chips, column filters, advanced.', knobs: { tableFilters: true } }`.
- `state.ts` (`S.tableFilters` from `CONFIG`), `shell.ts` setter (pattern: `setFlowLanding`),
  `variants.ts` `liveKnobs()`.
- `url.ts`: write `tablefilters=1|0` unconditionally (the "URL is the lockup" rule), parse on boot.
- If more than one variant is shown: a **Flags › Filters** row (*Filters only · Quick filters · Views*),
  `?filtersvariant=`.

## 5. Phase 2 — data

`data/flow-runs.ts` produces display strings (`cr`, `st`, `en`) for one page at a time; filters need
typed rows across the set.

- Add `flowRunRows(flow, which, limit = 500)`: the newest `limit` runs of the cohort as typed rows —
  `id`, `n`, `created: Date`, `startedAt`, `endedAt`, `state` (`FlowRunState`: Pending, Queued, Running,
  Completed, Failed, Canceled), `version`, `versionState`, `entityId`, `batchId?`, `startedByEmail`.
  Deterministic, derived from the same seed so the existing failed/completed proportions hold.
- Keep the shared-totals rule: unfiltered, tiles show cohort totals (thousands); filtered, they read
  "of the latest 500 runs". State that window in a caption rather than pretending the fixture is complete.
- `RunsTab` off-path keeps calling `flowRunPage` (no change when the flag is off).

## 6. Phase 3 — components (target file map)

| New / changed in flow-studio-lite | From here | Notes |
|---|---|---|
| `src/ui/filter-popover.tsx` — add `FilterChipPopover` (controlled `open`, any editor as children) | `FilterChipAndPopover` usage in `filter-chip.tsx` / `quick-filter.tsx` | Keep the existing `FilterPopover` (Human tasks uses it). Same paper `sx`. |
| `src/ui/controls.tsx` `FilterChip` — optional `tooltip` | `filter-chip.tsx` | Value ellipsis (240px) already exists there. |
| `src/ui/notable-data-grid.tsx` — add `sortModel`, `onSortModelChange`, `paginationModel`, `onPaginationModelChange` to `Passthrough` | `runs-table.tsx` | Needed to reset to page 1 on filter change and for views to set sort. Client-side pagination stays. |
| `src/components/table-filters/filter-model.ts` | `lib/filters.ts` (generic) | Pure; covered by `scripts/test-table-filters.mjs`. |
| `src/components/table-filters/use-table-filters.ts` | Phase 0 hook | |
| `src/components/table-filters/filter-editor*.tsx` | `filter-editor.tsx` (split) | `Text`/`InputLabel`, `ICON.*` sizes. |
| `src/components/table-filters/column-header.tsx` | `column-header.tsx` | `renderHeader`, `gridClasses.columnHeaderTitle`, hover reveal. |
| `src/components/table-filters/saved-views.tsx` | `views-menu.tsx` | Only if Views is shown. |
| `src/surfaces/flow-detail.tsx` `RunsTab` | `runs-table.tsx` | `S.tableFilters ? <RunsTabFiltered/> : <today's RunsTab/>`. |

Porting checklist:

- **React 18** there (19 here): `SearchBox`'s `ref` prop → `forwardRef` / `useImperativeHandle`.
- **No Next**: drop `client-only-shell.tsx`, `extensionAlias`, `"use client"`.
- **Pro grid + licence** are already configured; use their `NotableDataGrid`, not the MIT adaptation here.
- **Theme deltas reviewers will notice** vs this prototype: flow-studio-lite's replica theme has 14px/34px
  menu items, ripple-less small checkboxes, dark Figma tooltips, 13px table cells. The filters will
  inherit those — correct for that repo; don't restyle locally.
- `ListPageHead`: render the new row through its `custom` + `search` slots so tiles → filters → table
  order is preserved.

## 7. Capability map (staff FlowRun API, `useFlowTable.ts`)

| Redesign capability | API today | In the branch |
|---|---|---|
| Run status is any of | `state[]` | ✅ |
| Version # is any of | `version[]` | ✅ |
| Version state is any of | `flowDefinitionState[]` | ✅ |
| Created between / after / before | `createdAfter`, `createdBefore` (day precision) | ✅ |
| Batch is | `groupId` (single) | ✅ single value |
| Entity ID equals | `entityId` (exact UUID) | ✅ — the search box *is* this field today |
| Started by | `startedByEmail` (not exposed in staff UI) | ✅ new filter |
| `is not`, `contains`, empty / not-empty | — | 🟡 shown, labelled "needs API" |
| Advanced AND/OR groups, Match any | — | 🟡 shown, labelled "needs API" |
| Free-text search across columns | — (UUID only) | 🟡 or scope search to Entity ID |
| Column sort | `orderBy: 'created'` only; staff columns are `sortable: false` | 🟡 sort on Created only, or label |
| Saved views | — | 🟡 local only |

Recommendation: ship the full design with 🟡 items visibly marked in the dev panel / tooltips, so
feedback can say "worth building the API for" explicitly.

## 8. Phase 4 — feedback loop

- **Doc:** `docs/table-filters-exploration.md` (pattern: `docs/flow-landing-exploration.md`): what it is,
  how to toggle, the questions below. A short section in `AGENTS.md`; one line in README's status bar
  section.
- **Story:** `src/storybook/components/TableFilters.stories.tsx` — chip states (empty / applied /
  long / advanced), editor basic / advanced, header button.
- **Verify:** `pnpm typecheck`; `node scripts/test-table-filters.mjs`; browser pass (flag off unchanged,
  flag on: add/edit/remove, header filter, advanced, quick filters, empty state, test-runs tab).
- **Share:** draft PR "Explore: redesigned run filters (feedback)"; `scripts/preview-url.sh` for the
  preview; links with state, e.g. `/flows/<slug>/production-runs?tablefilters=1`.
- **Collect:** reviewers comment with the Vercel toolbar on the preview; threads can be pulled and
  triaged from here. Questions to ask:
  1. Chips: is "Label [value]" enough, or do people need the operator segmented out?
  2. Partial filters: do suggested dashed chips help, or read as applied filters?
  3. Column-header filter vs Add filter: is one entry point enough?
  4. Advanced (AND/OR): needed on runs, or only on bigger indexes (Human tasks, Flows)?
  5. Match all / any: understood? worth the space?
  6. Saved views: per user, or shared with the team?
- **Next pages** once direction settles: Human tasks (ten `FilterPopover`s today), Flows index, Feeds.

## 9. Risks and open questions

- The filter issues still to fix (Phase 0) — they should not ship into the comparison.
- Fixture window (500 newest) vs cohort totals: needs the caption to stay honest.
- The theme deltas in §6 may read as "the redesign changed the look"; mention them in the PR.
- Upstream drift: the prototype is synced to vivaa @ `a6cb2997cc4b`; re-run `pnpm sync:vivaa` before
  porting.

## 10. Rough size

| Phase | Effort |
|---|---|
| 0 — fixes, generic model, split, tests (here) | 1–1.5 days |
| 1–2 — flag, URL, typed fixture rows | 0.5 day |
| 3 — components + RunsTab | 1–1.5 days |
| 4 — docs, story, verify, preview, PR | 0.5 day |
