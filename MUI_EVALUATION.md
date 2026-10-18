# MUI-only implementation: what's kept vs. lost

Branch `mui-theme` re-implements the prototype with **unmodified MUI v7 components**, styled **only through the theme**:
**Notable's Nucleus theme** (vendored unmodified in `src/theme/nucleus/` from `flow-studio-lite`, itself synced from
`vivaa/web/common/src/theme/`), plus a thin prototype layer in `src/theme.ts` (custom variants and layout only).
Nucleus owns palette, typography, shape and shared component styling.

**Rules applied**
- Allowed: stock components and their normal props (`variant`, `size`, `color`, `fullWidth`, Stack `direction`/`spacing`/`useFlexGap`/`divider`, Grid `size`, `slotProps`), and the theme: palette, typography, shape, and `components.*` default props / style overrides / **custom variants** (declared via TypeScript module augmentation).
- Not allowed: `sx`, `styled()`, `className`, inline `style`, Tailwind, shadcn — and no deprecated "system props" (`width=`, `fontWeight=`…), so the code stays valid when MUI removes them; layout details come from the theme.
- Not styling: behaviour code (keyboard shortcuts, the zero-row probe, the toolbar stacking measurement) and the `<html>` font variable from `next/font`.

## Kept (same behaviour, MUI parts)
| Feature | MUI implementation |
|---|---|
| Notable look | **Nucleus** palette (Notable blue), type scale, inputs, table, tooltip; soft status tags via `Chip variant="soft"`. Table links follow Nucleus (cell ink, blue on hover) rather than the always-underlined screenshot style. |
| Segmented filter chip: icon · type │ operator │ value │ "and N more" │ ×, max ≈25% width, tooltip summary | `Chip variant="filter"` with `icon`, `onDelete`, label = `Stack` of `Typography` with vertical `Divider`s; `Tooltip` |
| Dashed Add filter + partial (quick) filters; hide rules (column used / > 3 filters) | `Button variant="dashed"` (custom theme variant) |
| Search box with icon, clear, "Save as filter", grows to 4 lines | `TextField type="search" multiline` + `InputAdornment`s |
| Keyboard: F / S / C when nothing is focused; ↑↓ Space Enter Esc in panels | `MenuList` gives arrows, Space and type-ahead natively; Enter handled on the panel; popovers restore focus to the page |
| Operator select, multi-value list, amber "no rows" values and columns | `TextField select`; `MenuList` + `Checkbox`; `ListItemText` colour `warning` |
| Advanced filter: up to 10 lines (and/or · type · operator · criteria · delete), wider panel | `Grid` rows; `TextField select`; `Autocomplete multiple freeSolo` (chips); `Paper variant="panelWide"` |
| Existing-value suggestions for > / < / between | `Autocomplete freeSolo` |
| Confirm before dropping advanced lines | `Dialog` |
| Single-column sort | `TableSortLabel` |
| Column filter button, revealed on hover, stays visible when filtered | `IconButton` in the header cell; reveal rules in the `MuiTableCell` theme override |
| Clear filters + Match all switch, stacking when filters wrap | `Button`/`IconButton`; `FormControlLabel` + `Switch`; `Stack direction` |
| Saved views: selector, save, edited dot, rename, deselect | `ButtonGroup`, `Badge variant="dot"`, `Menu` + `ListItemText`, `TextField` |
| Variant switch in the header; pagination | `ToggleButtonGroup`; `Pagination` |

## Changed (close, but not identical)
| Feature | Before | Now |
|---|---|---|
| Chip edit affordance | Pencil fades in over the value on hover | Click anywhere on the chip to edit (stated in the tooltip). An overlay icon would need custom CSS. |
| Basic criteria list | Text box filtering the list + "Use '<typed>'" custom values | Type-ahead jump in the list (native `MenuList`); free-typed values are available in Advanced (`Autocomplete freeSolo`) |
| Advanced chip box | Single line; chips scroll sideways | `Autocomplete limitTags={2}`: two chips + "+N", full list shown while focused |
| Search growth | Grows downward *over* the table | Grows in place and pushes content down (overlap would need absolute positioning) |
| Icons | Lucide | Material Icons (`@mui/icons-material`) |
| Header hover/sort menu | Column-wide highlight; ↕ menu with Ascending / Descending / Clear | Row hover only; `TableSortLabel` click cycles ascending → descending → off |
| Views rename button | Pencil inside one pill | `ButtonGroup` segment between the name and ▾ |

## Lost
- **Column-wide hover highlight** (every cell in the column): needs per-cell styling driven by hover state.
- **Hover-only pencil on chips** (see above).
- **Search box overlapping the table** when it grows.
- **Custom typed values in the *basic* list** (still available in Advanced).
- **Dark-mode tokens** from the shadcn theme (Nucleus is light-only here).

## Divergences from Nucleus (in `src/theme.ts`)
- Page scroll: Nucleus's `MuiCssBaseline` locks `body` (`overflow: hidden`) for an app shell; this prototype is a normal scrolling page.
- No textarea resize grip on the (multiline) search field.
- Everything else in `src/theme.ts` is additive: custom variants and layout rules Nucleus doesn't define.

## Risk notes
- Custom theme variants (`dashed`, `filter`, `soft`, `panel`, `panelBar`, `filters`) are the main extension point. They're typed and stay within MUI theming, but reviewers should confirm they're acceptable as "styling through themes".
- In development, React Strict Mode makes MUI's focus trap return focus to the button that opened a panel; production behaves correctly.
- The Nucleus files come from flow-studio-lite's replica; swap in a direct sync of `vivaa/web/common/src/theme/` when access is available (see `src/theme/nucleus/README.md`).
