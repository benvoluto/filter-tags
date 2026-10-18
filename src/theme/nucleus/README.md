# Nucleus theme (vendored)

These files are Notable's **Nucleus** MUI theme, copied from
[`VivaaHealth/flow-studio-lite`](https://github.com/VivaaHealth/flow-studio-lite/tree/main/src/theme),
which syncs them from the production source, `vivaa/web/common/src/theme/`.

- The color, typography and augmentation files keep their upstream provenance
  headers (vivaa commit, path, "DO NOT EDIT").
- `mui-theme.ts` is flow-studio-lite's replica of `vivaa/web/common/src/theme/muiTheme.ts`.

## Local edits (the whole list)
1. `mui-theme.ts`: `gridClasses` is imported from the free, MIT-licensed `@mui/x-data-grid`
   instead of `@mui/x-data-grid-pro` (identical class names; the `MuiDataGrid` block is verbatim).
2. `colors.ts`: sibling imports drop the `.js` suffix (`'./blue.js'` → `'./blue'`), because
   Next's Turbopack doesn't map `.js` specifiers to `.ts` files the way Vite does.
- **Do not edit these files.** Prototype-specific variants and overrides are layered
  on top in `src/theme.ts`.
- When access to `vivaa` is available, replace this folder with a direct sync of
  `vivaa/web/common/src/theme/` (and drop the flow-studio-lite step).
