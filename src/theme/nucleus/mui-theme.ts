// ───────────────────────────────────────────────────────────────────────────
// Provenance: VivaaHealth/flow-studio-lite @ 7a110ef9822d
// Source:     src/theme/mui-theme.ts  (itself a replica of
//             vivaa/web/common/src/theme/muiTheme.ts — see the note below)
// Local edits (the whole list):
//   • `gridClasses` is imported from the free `@mui/x-data-grid` (MIT) instead of
//     `@mui/x-data-grid-pro`; the class names are identical, so the MuiDataGrid
//     block below is unchanged. (This prototype doesn't render a Data Grid.)
// TODO: replace with a sync of vivaa/web/common/src/theme/muiTheme.ts once
//       repo access is available. Prototype-specific additions live in
//       src/theme.ts, never here.
// ───────────────────────────────────────────────────────────────────────────

import { chipClasses, linkClasses } from '@mui/material'
import { createTheme } from '@mui/material/styles'
import { gridClasses } from '@mui/x-data-grid'
import { colors, paletteColors } from './colors'

/* ══════════════════════════════════════════════════════════════════════════
   THE NUCLEUS THEME.

   A replica of `vivaa/web/common/src/theme/muiTheme.ts`, and the parts that
   can be the real thing are the real thing.

   **The type scale is `theme/typography.ts`, synced.** It is not restated
   here, and restating it is the specific mistake this arrangement exists to
   prevent: a hand-copied scale drifts silently, and this one had — every
   heading's `letterSpacing` was missing and `caption` was at 1.5 against
   upstream's 135%. Nothing about a screen tells you that; you find it by
   diffing against the source, which is a thing nobody does on a schedule.

   The rule from AGENTS.md, in this file's terms: **if a value exists upstream,
   sync it and spread it.** Two deliberate divergences in the *typography*, and
   they are the whole list there:

   • `fontFamily`. Upstream is `'Inter, sans-serif'`; this is the full stack
     with system fallbacks, because a prototype opened on a plane with no
     Google Fonts should not render in Times.
   • `allVariants` adds font smoothing and nothing else. It deliberately does
     **not** add tracking: MUI applies `allVariants` last, so a `letterSpacing`
     here silently beats every per-heading value the synced scale carries.

   **This whole file cannot come through `scripts/sync-manifest.json`,** and
   that is the one thing to know before reaching for the manifest here.
   Upstream's is 667 lines to this one's 360: it themes a component set this
   prototype does not render, and this one carries local blocks upstream has no
   reason to (the scrollbar in `MuiCssBaseline`, the icon-button sizes, the two
   table rules the visual budget is written around). A synced file opens with a
   DO NOT EDIT header, so syncing this one would delete all of that on the next
   pull. Individual *values* still come from upstream, transcribed against the
   source and named where they land — the `MuiDataGrid` block below is verbatim
   from `vivaa/web/common/src/theme/muiTheme.ts`.

   `./mui-augment` is upstream's own module augmentation, side-effect imported
   the way upstream imports it: it is what registers `monospace` as a variant
   and `theme.colors` / `theme.boxShadows` as theme members.

   The `components` block is a different situation and worth being honest
   about: the pieces that carry the product's shape are upstream's, verbatim —
   `MuiBreadcrumbs`, `MuiButton`, `MuiTabs`, `MuiTab`, the table head, the
   input focus ring. Others carry local additions this tree needs and
   production has no reason to (`MuiCssBaseline`'s scrollbar, `MuiIconButton`'s
   sizes). **When you touch one, diff it against
   `vivaa/web/common/src/theme/muiTheme.ts` rather than against what is here** —
   the last two defects in this file were both a line of upstream that looked
   decorative and was not.
   ══════════════════════════════════════════════════════════════════════════ */
import './mui-augment'
import { typography } from './typography'

export const FONT_STACK =
  '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
export const MONO_STACK = '"Roboto Mono", ui-monospace, "SF Mono", Menlo, monospace'

/* 0.25% tracking, as a length. CSS letter-spacing takes a length, not a
   percentage, so the Figma value is expressed in em. */
const TRACK = '0.0025em'

/** Upstream's `focusBoxShadow`. Keyboard focus is a 4px halo rather than an
    outline, so it reads the same on a filled button and an outlined one. */
const FOCUS_RING = `0 0 0 4px ${colors.extended.gray[93]}`

/* ── the tooltip ──────────────────────────────────────────────────────────
   Figma's, which is the one every designer in this building already reads a
   hundred times a day: a dark neutral chip, the caption size, one line of
   words, and — where the caller supplies one — the keystroke set back from
   them at the end of the row.

   **The fill is `content.default`, not a navy of its own.** It was `#1b1f38`,
   which is nothing in this palette and is a near-miss on the rail: a second
   dark surface a few percent off the one the product already has. An overlay
   drawn in the app's own ink inverts a token rather than introducing one, and
   the gray ramp has no step below it to reach for.

   **Exported, because the rail has a theme of its own.** `side-navigation.tsx`
   builds a whole second `createTheme` for the one dark surface in the app, and
   a `ThemeProvider` replaces the theme rather than extending it — so every
   tooltip inside the rail was falling through to MUI's own mid-gray at MUI's
   own size, which is a second tooltip design in a product that has one. This
   is the one override both themes have to share; the rest of them are
   deliberately the rail's. */
export const TOOLTIP = {
  styleOverrides: {
    tooltip: {
      ...typography.caption,
      backgroundColor: colors.content.default,
      color: colors.content.knockout,
      fontWeight: 400, letterSpacing: TRACK,
      padding: '6px 10px', borderRadius: 4, maxWidth: 260,
    },
    arrow: { color: colors.content.default },
  },
} as const

export const muiTheme = createTheme({
  palette: {
    ...paletteColors,
    grey: {
      50: '#fafafa',
      100: colors.extended.gray[97],
      200: colors.extended.gray[93],
      300: colors.extended.gray[85],
      400: colors.extended.gray[75],
      500: colors.extended.gray[65],
      600: colors.extended.gray[45],
      700: colors.extended.gray[35],
      800: colors.extended.gray[25],
      900: '#1f1f1f',
    },
    background: { default: colors.background.knockout, paper: colors.background.knockout },
    text: {
      primary: colors.content.default,
      secondary: colors.content.dark,
      disabled: colors.content.dark,
    },
    divider: colors.border.light,
  },

  /* headingN → hN, 1:1, and the sizes are upstream's. See `Text` in
     src/ui/text.tsx for the name mapping, which is also synced. */
  typography: {
    ...typography,
    fontFamily: FONT_STACK,
    fontSize: 14,
    allVariants: {
      ...typography.allVariants,
      fontFamily: FONT_STACK,
      /* Smoothing only. Anything else here beats the scale — see the header. */
      WebkitFontSmoothing: 'antialiased',
      MozOsxFontSmoothing: 'grayscale',
      textRendering: 'optimizeLegibility',
    },
    button: { ...typography.button, fontFamily: FONT_STACK },
  },

  shape: { borderRadius: 4 },
  spacing: 8,

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '*': { boxSizing: 'border-box' },
        'html, body, #root': { height: '100%', margin: 0 },
        body: { overflow: 'hidden' },
        /* One scrollbar treatment for the whole light side of the app. The
           navy rail declares its own in side-navigation. */
        '::-webkit-scrollbar': { width: 10, height: 10 },
        '::-webkit-scrollbar-thumb': {
          borderRadius: 6,
          border: '3px solid transparent',
          backgroundClip: 'content-box',
          backgroundColor: colors.extended.gray[85],
        },
        '::-webkit-scrollbar-thumb:hover': { backgroundColor: colors.extended.gray[75] },
        '::-webkit-scrollbar-track': { background: 'transparent' },
      },
    },

    MuiButton: {
      defaultProps: { disableRipple: true },
      styleOverrides: {
        root: {
          fontFamily: FONT_STACK,
          fontWeight: 600,
          borderRadius: 4,
          textTransform: 'none',
          boxShadow: 'none',
          /* Upstream's, and it is load-bearing rather than decorative: MUI's
             own `sizeSmall` ships `fontSize: pxToRem(13)`, and 13 is not on
             the scale. A root override outranks it, so this one line is what
             keeps a small button at 14 — the same size the label beside it
             is. Drop it and every small button in the app silently becomes
             the one size production does not have. */
          fontSize: '0.875rem',
          '&.Mui-focusVisible': { boxShadow: FOCUS_RING },
          transition: 'all 200ms ease-in-out',
          whiteSpace: 'nowrap',
          '& .MuiButton-startIcon': { marginLeft: 0, marginRight: 8 },
          '& .MuiButton-endIcon': { marginLeft: 8, marginRight: 0 },
          '&:hover, &:active': { boxShadow: 'none' },
        },
        /* No `outlined` or `contained` override, because upstream has none and
           MUI's defaults are what production ships: an outlined button is
           primary-coloured with a primary-tinted edge, not a gray box with
           gray text. The flow toolbar's Test control is the tell — in the
           product it reads as an action and here it read as disabled chrome. */
        containedPrimary: { '&:hover': { backgroundColor: colors.primary.dark } },
        /* Upstream's paddings, verbatim, and no heights. The height is
           padding plus the `button` variant's own 145% leading, which the
           synced typography now supplies — pinning min/max instead was what
           made a small button 24px of 12px type where production has 24px of
           14px. The outlined pair is one pixel tighter each way so a border
           does not make an outlined button taller than the filled one beside
           it, which is the split-button in the flow toolbar. */
        sizeSmall:  { padding: '2px 8px',  '&.MuiButton-outlined': { padding: '1px 7px' } },
        sizeMedium: { padding: '6px 12px', '&.MuiButton-outlined': { padding: '5px 11px' } },
        sizeLarge:  { padding: '10px 12px', '&.MuiButton-outlined': { padding: '9px 11px' } },
      },
    },

    MuiIconButton: {
      defaultProps: { disableRipple: true },
      styleOverrides: {
        root: {
          borderRadius: 4,
          color: colors.content.dark,
          '&:hover': { backgroundColor: colors.background.default, color: colors.content.default },
        },
        sizeSmall: { minHeight: 28, maxHeight: 28, width: 28, padding: 4 },
        sizeMedium: { minHeight: 32, maxHeight: 32, width: 32, padding: 4 },
      },
    },

    MuiInputBase: {
      styleOverrides: {
        root: { '& input': { padding: '6.5px 12px' } },
        sizeSmall: { fontSize: '0.875rem' },
        input: { '&::placeholder': { opacity: 1, color: colors.extended.gray[65] } },
        multiline: { padding: '8.5px 12px !important' },
        inputMultiline: { resize: 'vertical' },
      },
    },

    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          backgroundColor: colors.background.knockout,
          '& fieldset': { borderColor: colors.border.default },
          '&:hover:not(.Mui-disabled) fieldset': { borderColor: colors.border.dark },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: colors.border.focus,
            borderWidth: 1,
            boxShadow: `0 0 0 4px ${colors.extended.gray[93]}`,
          },
          '&.Mui-disabled': {
            backgroundColor: colors.background.disabled,
            '& fieldset': { borderColor: colors.border.light },
          },
        },
      },
    },

    /* transform: unset is what defeats MUI's floating label. Nucleus labels sit
       statically above the input — see FormField. */
    MuiInputLabel: {
      defaultProps: { size: 'small' },
      styleOverrides: {
        root: { fontSize: '1rem', fontWeight: 600, transform: 'unset', translate: 'unset',
                color: colors.content.default },
        sizeSmall: { fontSize: '0.875rem' },
      },
    },
    MuiFormLabel: {
      styleOverrides: {
        root: { fontSize: '0.875rem', fontWeight: 600, transform: 'unset', translate: 'unset',
                '&.Mui-focused': { color: colors.content.default } },
      },
    },
    MuiFormHelperText: { styleOverrides: { root: { marginLeft: 0, fontSize: '0.75rem' } } },

    MuiPaper: { styleOverrides: { root: { borderRadius: 4, backgroundImage: 'none' } } },
    MuiCard: { defaultProps: { variant: 'outlined' },
               styleOverrides: { root: { borderColor: colors.border.light } } },
    MuiCardContent: { styleOverrides: { root: { '&:last-child': { paddingBottom: 16 } } } },
    MuiDivider: { styleOverrides: { root: { borderColor: colors.border.light } } },

    /* Upstream's, verbatim: 48px rows, a 16px gap, and a 4px indicator in
       blue[40]. Nothing here sets type — `typography.button` does, and it is
       synced, which is why the textTransform and the 600 are absent. */
    MuiTabs: {
      styleOverrides: {
        root: {
          minHeight: 48,
          borderBottom: '1px solid',
          borderColor: colors.border.light,
          '& .MuiTabs-flexContainer': { gap: '16px' },
        },
        indicator: {
          height: 4,
          backgroundColor: colors.extended.blue[40],
          borderRadius: '4px 4px 0 0',
        },
      },
    },
    MuiTab: {
      defaultProps: { disableRipple: true },
      styleOverrides: {
        root: {
          padding: 0, minWidth: 0, minHeight: 48,
          color: colors.content.dark,
          '&.Mui-selected': { color: colors.extended.blue[40] },
        },
      },
    },

    /* ── the breadcrumb, and it is the whole top bar's type ───────────────
       Upstream's block, verbatim, and the part that matters is what it says
       about the trail: **every crumb is the page title's size.** The parent
       links are `heading3` bold in gray[45] and the leaf is `heading3` bold
       in blue[5] — one size, told apart by ink. A trail set smaller than the
       leaf is a different component, and it is the one thing in this app that
       appears on literally every screen. */
    MuiBreadcrumbs: {
      defaultProps: { separator: '>' },
      styleOverrides: {
        root: {
          '& a': {
            color: colors.extended.gray[45],
            textDecoration: 'none',
            transition: 'color 0.3s ease',
            '&:hover, &:focus, &:active': { color: colors.extended.gray[25] },
          },
          '& div': { color: colors.content.default, cursor: 'default', fontWeight: 600 },
          '& span': { color: colors.extended.blue[5] },
        },
      },
    },

    MuiTableContainer: { styleOverrides: { root: { boxShadow: 'unset' } } },
    /* Table text follows body2 (14px); light rules separate rows without
       competing with their contents. Sticky headers retain an opaque fill. */
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-root': {
            backgroundColor: colors.background.default,
            borderBottomColor: colors.extended.gray[93],
            fontWeight: 600,
            fontSize: '0.875rem',
            color: colors.content.default,
            lineHeight: 1.4,
            whiteSpace: 'nowrap',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: colors.extended.gray[93],
          fontSize: '0.875rem',
          '& .MuiTypography-caption': { fontSize: 'inherit' },
          /* A link inside a cell is the row's NAME, not a call to action. The
             ported pages set their first column as a Link, so Feeds arrived as
             twenty-five blue lines in a column — at which point the accent
             cannot single anything out, because it is on everything. Blue
             survives on hover, where it means "this one". Scoped to cells, so a
             link in a paragraph is still a link. */
          '& .MuiLink-root': { color: 'inherit' },
          '& .MuiLink-root:hover': { color: colors.primary.default },
        },
        sizeSmall: { padding: '6px 12px' },
      },
    },

    /* Upstream's, verbatim. The thing it does *not* say is the load-bearing
       part: no `borderRadius`, so MUI's own pill survives. A filter chip is a
       32px pill in production, and squaring it here squares it everywhere at
       once — see `FilterChip` in `ui/controls.tsx`. */
    MuiChip: {
      styleOverrides: {
        root: {
          padding: '0 4px',
          [`&.${chipClasses.focusVisible}`]: { boxShadow: FOCUS_RING },
        },
        labelMedium: { padding: '12px' },
      },
    },

    /* ── the grid, and why its rules are not the two above ────────────────
       Verbatim from upstream's `MuiDataGrid` block. An index page's table is
       a `DataGridPro`, not a `<Table>`, and it keeps the outer border and the
       header separators the grid draws by default — this is the one component
       on every list screen of the shipped product, so fidelity outranks the
       hierarchy budget here. `<Table>` keeps the two-rule treatment above,
       which is what the detail tables inside cards and panels are for.

       Headers use an opaque white fill for sticky scrolling. The link rule
       is the same argument `MuiTableCell` makes twenty
       lines up, made upstream first: a link in a cell is the row's name, so it
       takes the cell's ink and only turns blue on hover. */
    MuiDataGrid: {
      styleOverrides: {
        columnHeaders: { backgroundColor: colors.background.default },
        columnHeader: {
          backgroundColor: colors.background.default,
          [`& .${gridClasses.sortButton}`]: {
            color: colors.content.default,
          },
          [`&:not(.${gridClasses['columnHeader--sorted']}):hover .${gridClasses.sortButton}`]: {
            color: colors.content.dark,
          },
        },
        cell: {
          [`& .${linkClasses.root}`]: {
            color: colors.extended.gray[25],
            '&:hover': { color: colors.extended.blue[5] },
          },
        },
      },
    },

    /* ── the tooltip ──
       Figma's, which is the one every designer in this building already reads
       a hundred times a day: a dark neutral chip, the caption size, one line
       of words, and the keystroke set back from them where there is one.

       **The fill is `content.default`, not a navy of its own.** It was
       `#1b1f38`, which is nothing in this palette and is a near-miss on the
       rail — a second dark surface, four percent off the one the product has.
       An overlay drawn in the app's own ink inverts a token rather than
       introducing one, and the ramp has no step below it to reach for.

       The words are `typography.caption` spread rather than restated, for the
       reason the whole file spreads that object: a transcribed size is a size
       that drifts, and this one had already lost the tracking. */
    MuiTooltip: TOOLTIP,
    MuiDialog: { styleOverrides: { paper: { border: `1px solid ${colors.border.light}` } } },
    MuiDialogContent: { defaultProps: { dividers: true } },
    MuiMenu: { defaultProps: { disableScrollLock: true } },
    MuiMenuItem: { styleOverrides: { root: { fontSize: '0.875rem', minHeight: 34 } } },
    MuiCheckbox: { defaultProps: { disableRipple: true, size: 'small' } },
    /* `fontSize: inherit` is the load-bearing line. MUI's Link defaults to
       body1 — 16px — so a link inside a 13px table cell arrives three pixels
       too big, and eight call sites across surfaces/ answered that by writing
       `fontSize: '0.8125rem'` next to it. That reads like a type scale leaking
       and is really one component refusing to inherit: MuiTableCell above sets
       13px once, and every link in a cell should be whatever its cell is. Same
       for a link in a caption, which the old default silently enlarged. */
    MuiLink: { defaultProps: { underline: 'hover' },
               styleOverrides: { root: { color: colors.primary.default,
                                         cursor: 'pointer', fontSize: 'inherit' } } },
  },
})

export { colors }
