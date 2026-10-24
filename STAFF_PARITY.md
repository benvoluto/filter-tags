# Staff-app parity: what this prototype is built from

This branch rebuilds the filter prototype on the **vivaa staff app's own code**, so the only differences
from production are the filter redesign itself. Everything under `src/vivaa/` is upstream code, laid out
in upstream's own directory structure (`src/vivaa/common/…` = `web/common/src/…`,
`src/vivaa/staff/…` = `web/staff/src/…`).

`pnpm sync:vivaa` re-fetches every synced file from `VivaaHealth/vivaa` (`scripts/sync-manifest.json`);
each file opens with a provenance header (source path, commit, fetch date). Last synced against vivaa
`main` @ `a6cb2997cc4b` (2026-10-19).

## Synced byte-for-byte (do not edit — re-sync)

| What | Upstream |
|---|---|
| Theme: `muiTheme`, `ThemeProvider`, palette, type scale, box shadows, breakpoints, z-index, MUI augmentation | `web/common/src/theme/**`, `web/common/src/styled.ts` |
| Fonts: Inter Regular / SemiBold / Italic (local files — so `bold` renders at 600, as in staff) | `web/common/src/styles/fonts.css` + `fonts/` |
| `Text`, `Title`, `Tag`, `Span`, `mergeSxProps`, `isDefined` | `web/common/src/components/{Typography,Tag,Span,Mui}`, `utils/isDefined.ts` |
| `NoRecordsOverlay` | `web/common/src/components/Tables/NoRecords.tsx` (one import-path rewrite) |
| **`FilterChipAndPopover`** — the filter chip + popover | `web/staff/src/components/FiltersV2/components/ChipAndPopover.tsx` |
| `FILTER_HEIGHT`, `POPOVER_FIELD_MINIMUM_WIDTH` | `web/staff/src/components/FiltersV2/constants.ts` |
| `FilterBar` | `web/staff/src/components/Layout/FilterBar.tsx` |

Two mechanical rewrites, both recorded in the manifest and in the file header:
`muiTheme.ts` imports `gridClasses` from `@mui/x-data-grid` (MIT, identical class names) instead of
`@mui/x-data-grid-pro`, and `NoRecords.tsx`'s `../../utils/types` → `../../utils/isDefined.js`.

## Adapted (local, edits listed in each file's header)

- **`NotableDataGrid`** (`web/common/src/components/Tables/DataGrid.tsx`). This repo is public and carries
  no MUI X Pro licence, so it renders the MIT `DataGrid`. Same DOM and class names, so all of upstream's
  styling is unchanged. Edits: the import; Pro-only props dropped (pinning, tree data,
  `checkboxSelectionVisibleOnly`); `pagination` typed `true | undefined`.
- `useTableState`, `usePersistedColumns`, `utils` — reduced to what the grid needs (no localStorage /
  zod / `vivaa-api`). Same types and return shapes.
- **Search box** (`src/components/runs/search-box.tsx`, from `web/staff/src/components/FiltersV2/TextSearch.tsx`).
  Upstream's debounce, Enter, upstream-sync and `clear()` logic and its 32px pill are kept. Edits: no
  focus on page load (with the focus ring it looked ~40px tall beside 32px chips, and it blocked the
  F / S / C shortcuts); text at the chips' 13px instead of 14px, with the input sized to the pill
  (upstream's overflows to 36.6px); a clear button inside the field. Note production itself shows
  14px search beside 13px chips — the 13px here is a deliberate fix, one line to revert.
- `src/vivaa/common/index.ts` — a local barrel standing in for the `common` package, so synced staff files
  keep their `from 'common'` imports (tsconfig maps `common` here).

## Built for the redesign, in staff's conventions

`src/components/runs/*` uses stock MUI with `sx`, `Text`, Phosphor icons (`…Icon` names), the staff
`colors`, and `FILTER_HEIGHT` / `POPOVER_FIELD_MINIMUM_WIDTH`. Each control is staff's component where one
exists:

| Redesign control | Built on |
|---|---|
| Applied filter chip | `FilterChipAndPopover`, unmodified: bold column, then the operator in regular weight and secondary ink ("is" for a single value, "is any of" for several, "equals", "is not", "greater than"…), then the value in its blue box (ellipsized at 200px; "+ 2 more" for advanced filters). Operators with no value ("is empty") go in the box so the chip still reads as applied. A tooltip shows the full criteria. |
| Partial ("quick") filter, **Add filter** | `FilterChipAndPopover`'s empty state (dashed, `+`) — how staff shows *Run Status*, *Version State*… before a value is applied. |
| Search | Adapted `TextSearch` (above), placeholder "Search", 220px (staff's width on the runs and tasks pages). **Save as filter** sits beside it once there's a query. |
| Filter row | Staff's flow-runs layout: `Stack` row (space-between, wrap, gap 1) → `FilterBar` left, actions right. With no filters it is one line. Once a filter is applied, search moves to its own line (with the views menu and Save view) and the filters — partial filters, chips, Add filter, Clear filters, Match all — get a line beneath it. Clear filters and Match all only appear while a filter is applied. |
| Table | `NotableDataGrid`, server-mode pagination/sorting (as every staff list page): the page is handed one page of rows and the total. Status is staff's `Tag` with `FLOW_RUN_TAG_PROPS` colours; links get the theme's grid-cell link style. |
| Column filter button | `renderHeader` with the grid's own `columnHeaderTitle` class (so the bold blue[5] header style applies), revealed on hover; popover styles copied from `FilterChipAndPopover`. Sort is the grid's native header click. |
| Filter editor | The panel inside the staff popover: `InputLabel` headings (staff `FormField`), small buttons, no column icons, and every field at staff's 32px `FILTER_HEIGHT` (the theme otherwise renders selects at 24px and autocompletes at 39px side by side). The panel is capped to the space below its chip, so its list scrolls instead of the popover sliding up over the filter row. Lists run edge to edge; rows, checkboxes, the field and labels share one left edge. Values and types that would leave no rows with the current filters are pale grey (staff's `content.disabled`, gray 65), with a tooltip saying why. **Type step:** arrows / type-ahead, Space or Enter picks. **Criteria step** (`criteria-combobox.tsx`): one inline combo box (no placeholder) — type values, pick them, or both in any order; a comma adds the typed text as a value; what's picked is shown by the list's checkboxes (radios for equals) — values you add that aren't in the column's list sit at the top, checked, above a subtle divider; ↓/↑ move a cursor and Space adds the highlighted value (clearing the text, cursor stays put); Enter adds the filter with your typed entry as typed (exact matches map to the column's value) — or the highlighted value if you arrowed; the Add filter button includes text still in the field; ← at the start of the field or Shift+Tab returns to the type step. Value suggestions for >, <, between open on type/click, not focus, render inside the panel (so they push the buttons down rather than cover them), and nothing is pre-highlighted, so Enter uses the typed value. **Editing a filter:** a ▾ beside the type label switches it to another type, resetting the criteria and showing the new type's values. |
| Operators | **is any of** (default; pick several values) and **equals** (pick exactly one — radios), then is not, contains, does not contain, greater than, greater than or equal to, less than, less than or equal to, between, is empty, is not null, as each column type allows. In a basic filter, typing `>` `<` `>=` `<=` `=` `!=` at the start of the criteria field switches the operator (the rest becomes the value; `=` right after `>`/`<` makes it ≥/≤; comparison symbols only apply to numbers, durations, percentages and dates). Switching between *is any of* and *equals* keeps the selection (the first value, for equals). |
| Empty state | `NoRecordsOverlay` with a custom title and a reset action. |

## "Prompt" variant (natural-language filters, on-device model)

The fourth variant swaps search and Add filter for one large field (`prompt-box.tsx`). A sentence
becomes ordinary filter chips and, if it names one, a sort. Underneath, underlined links (status,
customer, created by → Owner, date started) sit on the empty field's second line, under the
placeholder, and open the same filter editor as the quick filters; they disappear once the user types.

- **Model:** Qwen2.5 1.5B Instruct via WebLLM (`@mlc-ai/web-llm`), WebGPU, in a web worker
  (`lib/llm.worker.ts`, `lib/filter-model.ts`). Loading starts with the page, in every variant:
  about 1 GB from Hugging Face on the first visit, then loaded from the browser's Cache Storage. The f32 build is used on GPUs without `shader-f16`.
- **The model never sees rows.** Its output is constrained to a JSON schema (column, operator,
  values; sort; leftover search text). `lib/prompt-filters.ts` then grounds it in code: values are
  matched to the column's real values ("riverbend" → Riverbend Health, "failing" → Failed), date
  tokens (`days_ago:3`, "yesterday") and duration units are resolved, operators a column can't use
  are dropped, and split filters on one column are merged.
- **"Today"** for relative dates is the newest run in the sample data (Oct 14, 2026), not the clock.
- **Applying:** a prompt's filters replace existing filters on the same columns and keep the rest.
- **While the model loads** only "Filter by status, customer, created by, or date started" shows;
  the field (placeholder "Describe the search, filter, and sort you want") appears once it's ready.
  Where WebGPU is missing or the download fails, the field appears anyway and prompts go through a
  small rule-based parser (`parseWithRules`).
- **Views:** the views pulldown is inline text inside the field (stack icon, name, ▾; no border,
  the links' 13px). With no filters, no selected view and nothing typed it follows the filter
  links; otherwise it leads the field's bottom line, at the left edge, and stays there while the
  user types. Once results are filtered, the filters line ends with Clear filters and Save view
  (no Match all switch in this variant: its filters always all apply). The model names
  each saved view in 2–4 words (a rule-made name if it isn't available). Typing more than 10
  characters of a saved view's name shows the rest in grey; Tab completes it, Enter opens the view.
  Selecting a view applies its filters; the filters line includes Add filter. Clearing every filter
  (Clear filters, the C shortcut, or removing the last chip) also clears the selected view.
- **Focus:** the field takes focus when it appears, so the F / S / C shortcuts (which only work
  when nothing is focused) need a click outside it first.

## Variant URLs

Each prototype variant has its own URL: `/filters`, `/quick`, `/views`, `/prompt` (`/` opens the
default, Filters only). The switcher updates the URL with `history.pushState`, so the table keeps
its state when switching and Back / Forward move between variants. `app/[variant]/page.tsx`
prerenders the four paths; any other path shows the not-found page.

## Runtime differences from the staff app (environment, not design)

- **Next.js, not Vite.** The prototype stays on Next for Vercel. Synced files import siblings as `./x.js`;
  Vite resolves that to `x.ts`, Turbopack can't, so `dev`/`build` run `--webpack` with
  `experimental.extensionAlias` — that keeps the synced files byte-identical.
- **Client-only render.** Staff is a client-rendered SPA; MUI X's grid uses `Math.random()` during render,
  which Next's prerender rejects, so the page renders client-only (`components/client-only-shell.tsx`).
- **No Bootstrap.** Staff loads `bootstrap.css` globally. Only the two reboot rules MUI visibly relies on
  (border-box, body line-height) are in `app/globals.css`, plus staff's `index.css` body rules. No
  `CssBaseline` (staff doesn't use one).
- **MIT grid** (see above): page sizes stop at 100 (staff also offers 250/500).
- **Synced code is excluded from this repo's ESLint**; it is linted upstream under vivaa's config.

## Behaviour that changed from the previous (Nucleus replica) version

- Theme is the real `muiTheme` (the flow-studio-lite replica had drifted: different chip, table, tooltip
  and input styling). Tooltips are MUI defaults, as in staff.
- Chips are staff's chip (column · operator · blue value box) rather than the segmented
  icon · type │ operator │ value chip; no column icon on chips.
- Partial filters and Add filter are staff's dashed empty chips (no column icon).
- Search is single-line (staff `TextSearch`); it no longer grows to four lines. Placeholder is "Search".
- Sorting is the grid's own header click (asc → desc → off) with its hover arrow and column menu.
- The toolbar no longer measures itself to stack the actions; it wraps the way staff's filter row does.
