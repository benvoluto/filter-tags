"use client"

import { alpha, createTheme, type Theme } from "@mui/material/styles"
// Types the `MuiDataGrid` key that the Nucleus theme configures (free MUI X Data Grid).
import type {} from "@mui/x-data-grid/themeAugmentation"

import { colors } from "./theme/nucleus/colors"
import { muiTheme as nucleusTheme } from "./theme/nucleus/mui-theme"

/**
 * The prototype's theme = Notable's Nucleus theme (vendored, unmodified, in ./theme/nucleus)
 * + a thin layer of prototype-only additions below. Nucleus owns palette, typography, shape and
 * the shared component look; this file only adds what the filter prototype needs that Nucleus
 * doesn't have: custom variants, layout rules, and one page-level divergence (see MuiCssBaseline).
 *
 * Components use stock MUI parts with semantic props only (variant, size, color, direction,
 * spacing…) — no sx, styled(), or className.
 */

declare module "@mui/material/Button" {
  interface ButtonPropsVariantOverrides {
    /** Dashed pill: Add filter and partial ("quick") filters. */
    dashed: true
  }
}
declare module "@mui/material/Chip" {
  interface ChipPropsVariantOverrides {
    /** Segmented filter chip: [icon type] | operator | value | ×. */
    filter: true
    /** Soft, square status tag. */
    soft: true
  }
}
declare module "@mui/material/Paper" {
  interface PaperPropsVariantOverrides {
    /** Filter editor panels inside popovers. */
    panel: true
    panelWide: true
  }
}
declare module "@mui/material/Toolbar" {
  interface ToolbarPropsVariantOverrides {
    /** The search / filters / actions bar above the table. */
    filters: true
    /** Row inside a panel: first item on the left, the rest pushed right. */
    panelBar: true
  }
}

const border = colors.border.light

export const theme = createTheme(nucleusTheme, {
  components: {
    // Divergence from Nucleus: its baseline locks the page (`body { overflow: hidden }`, 100%
    // height) for an app shell with its own scroll regions. This prototype is a normal scrolling page.
    MuiCssBaseline: {
      styleOverrides: {
        "html, body, #root": { height: "auto" },
        body: { overflow: "auto" },
      },
    },

    // ── Layout (prototype-only) ───────────────────────────────────────────────────────────
    MuiContainer: { styleOverrides: { root: { paddingTop: 12, paddingBottom: 12 } } },
    MuiStack: {
      variants: [
        // Gap-based stacks wrap their items (toolbar groups, chip rows).
        { props: { useFlexGap: true }, style: { flexWrap: "wrap", alignItems: "center" } },
        { props: { direction: "row" }, style: { alignItems: "center" } },
      ],
    },
    MuiToolbar: {
      defaultProps: { disableGutters: true },
      variants: [
        {
          props: { variant: "filters" },
          style: {
            minHeight: 0,
            padding: 0,
            gap: 8,
            alignItems: "flex-start",
            // Left: views · search · partial filters · chips · Add filter (grows, wraps)
            "& > :first-of-type": { flex: "1 1 0", minWidth: 0 },
            // Right: actions stay at the right edge.
            "& > :last-child:not(:first-of-type)": { flexShrink: 0, flexWrap: "nowrap", justifyContent: "flex-end", minHeight: 36 },
            "@media (max-width: 640px)": { flexDirection: "column", alignItems: "stretch" },
          },
        },
        {
          props: { variant: "panelBar" },
          style: { minHeight: 0, padding: 0, gap: 8, flexWrap: "wrap", "& > :first-of-type:not(:last-child)": { marginRight: "auto", minWidth: 0 } },
        },
      ],
    },
    MuiPaper: {
      variants: [
        { props: { variant: "panel" }, style: { width: "22rem", maxWidth: "100%", padding: 12 } },
        { props: { variant: "panelWide" }, style: { width: "48rem", maxWidth: "100%", padding: 12 } },
      ],
    },
    MuiPopover: {
      defaultProps: { marginThreshold: 12 },
      styleOverrides: { paper: { marginTop: 6, border: `1px solid ${border}`, maxWidth: "calc(100vw - 2rem)" } },
    },
    // Scrolling lists in filter panels: no box, just a bottom rule.
    MuiMenuList: { styleOverrides: { root: { maxHeight: 260, overflowY: "auto", borderBottom: `1px solid ${border}` } } },
    MuiMenu: { styleOverrides: { paper: { maxWidth: 360, "& .MuiMenuItem-root": { whiteSpace: "normal", alignItems: "flex-start" } } } },
    MuiListItemText: { styleOverrides: { secondary: { whiteSpace: "pre-line" } } },
    MuiTooltip: { styleOverrides: { tooltip: { whiteSpace: "pre-line" } } },
    MuiTextField: {
      defaultProps: { size: "small" },
      variants: [{ props: { type: "search" }, style: { width: "22rem", maxWidth: "100%", "@media (max-width: 640px)": { width: "100%" } } }],
    },
    // The search field is multiline (it grows while focused); it shouldn't show a resize grip.
    MuiInputBase: { styleOverrides: { inputMultiline: { resize: "none" } } },
    MuiFormControlLabel: { styleOverrides: { root: { marginLeft: 0, marginRight: 0, gap: 4, whiteSpace: "nowrap" } } },

    // ── Custom variants (prototype-only) ─────────────────────────────────────────────────
    MuiButton: {
      variants: [
        {
          props: { variant: "dashed" },
          style: ({ theme }: { theme: Theme }) => ({
            borderRadius: 999,
            border: `1px dashed ${theme.palette.grey[400]}`,
            color: theme.palette.text.primary,
            "& .MuiSvgIcon-root": { color: theme.palette.text.secondary },
            "&:hover": { backgroundColor: theme.palette.grey[100], borderColor: theme.palette.grey[500] },
          }),
        },
      ],
    },
    MuiChip: {
      variants: [
        {
          props: { variant: "filter" },
          style: ({ theme }: { theme: Theme }) => ({
            height: 32,
            borderRadius: 16,
            border: `1px solid ${border}`,
            backgroundColor: theme.palette.background.paper,
            maxWidth: "min(100%, max(25vw, 18rem))",
            "&:hover, &.Mui-focusVisible": { backgroundColor: theme.palette.grey[100] },
            "& .MuiChip-icon": { marginLeft: 10, marginRight: -2, fontSize: 16, color: theme.palette.text.secondary },
            "& .MuiChip-label": { display: "flex", minWidth: 0, paddingLeft: 8, paddingRight: 4 },
            "& .MuiChip-label > .MuiStack-root": { minWidth: 0, flexWrap: "nowrap" },
            "& .MuiChip-label .MuiStack-root > .MuiTypography-root:last-of-type": { minWidth: 0 },
            "& .MuiChip-deleteIcon": { fontSize: 16, margin: "0 8px 0 4px", flexShrink: 0, color: theme.palette.text.secondary },
            "& .MuiChip-deleteIcon:hover": { color: theme.palette.error.main },
          }),
        },
        ...(["success", "error", "warning", "info", "default"] as const).map((color) => ({
          props: { variant: "soft" as const, color },
          style: ({ theme }: { theme: Theme }) => {
            const main = color === "default" ? theme.palette.text.secondary : theme.palette[color].dark
            return {
              height: 20,
              borderRadius: 4,
              fontSize: 11,
              fontWeight: 600,
              color: main,
              backgroundColor: color === "default" ? theme.palette.grey[100] : alpha(theme.palette[color].main, 0.12),
              "& .MuiChip-label": { paddingInline: 6 },
            }
          },
        })),
      ],
    },

    // ── Table header: column actions appear on hover/focus; a filtered column keeps its icon ──
    MuiTableCell: {
      styleOverrides: {
        root: { whiteSpace: "nowrap" },
        head: {
          "& .MuiIconButton-root": { opacity: 0, transition: "opacity .15s" },
          "&:hover .MuiIconButton-root, & .MuiIconButton-root:focus-visible, & .MuiIconButton-colorPrimary": { opacity: 1 },
          "& > .MuiStack-root": { justifyContent: "space-between", flexWrap: "nowrap" },
        },
        alignRight: { "& > .MuiStack-root": { flexDirection: "row-reverse" } },
      },
    },
    MuiTableContainer: { styleOverrides: { root: { border: `1px solid ${border}`, borderRadius: 4 } } },
    MuiTable: { defaultProps: { size: "small", stickyHeader: true } },
    MuiPagination: { defaultProps: { shape: "rounded", size: "small" } },
  },
})
