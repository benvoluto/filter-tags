"use client"

import { alpha, createTheme } from "@mui/material/styles"

/**
 * All visual styling for the MUI variant of the prototype lives here: palette, typography, shape,
 * and component default props / style overrides / custom variants. Components use stock MUI parts
 * with semantic props only (variant, size, color, direction, spacing…) — no sx, styled(), or classes.
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
    /** Soft, square status tag (Notable disposition style). */
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

const ink = "#2b2b2b"
const muted = "#737373"
const line = "#e5e5e5"

export const theme = createTheme({
  cssVariables: true,
  palette: {
    mode: "light",
    primary: { main: "#262626", contrastText: "#fafafa" },
    secondary: { main: "#525252" },
    text: { primary: ink, secondary: muted },
    divider: line,
    background: { default: "#ffffff", paper: "#ffffff" },
    success: { main: "#16a34a" },
    error: { main: "#ef4444" },
    info: { main: "#2563eb" },
    // Pale amber, used for "returns no rows" criteria and the edited-view dot.
    warning: { main: "#d9902f", light: "#fdf3e1", contrastText: "#ffffff" },
    action: { hover: "#f4f4f5", selected: "#efeff0" },
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: "var(--font-inter), system-ui, -apple-system, sans-serif",
    fontSize: 13,
    h1: { fontSize: "1.125rem", fontWeight: 600, letterSpacing: "-0.01em" },
    body1: { fontSize: 13 },
    body2: { fontSize: 13 },
    subtitle2: { fontSize: 13, fontWeight: 500, lineHeight: 1.5 },
    caption: { fontSize: 11 },
    button: { textTransform: "none", fontWeight: 500, fontSize: 13 },
  },
  components: {
    MuiCssBaseline: { styleOverrides: { body: { WebkitFontSmoothing: "antialiased" } } },

    // ── Layout ────────────────────────────────────────────────────────────────────────────
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
            // Left: search · partial filters · chips · Add filter (grows, wraps)
            "& > :first-of-type": { flex: "1 1 0", minWidth: 0 },
            // Right: actions group stays at the right edge.
            "& > :last-child:not(:first-of-type)": { flexShrink: 0, flexWrap: "nowrap", justifyContent: "flex-end", minHeight: 32 },
            "@media (max-width: 640px)": { flexDirection: "column", alignItems: "stretch" },
          },
        },
        {
          props: { variant: "panelBar" },
          style: {
            minHeight: 0,
            padding: 0,
            gap: 8,
            flexWrap: "wrap",
            "& > :first-of-type:not(:last-child)": { marginRight: "auto", minWidth: 0 },
          },
        },
      ],
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      variants: [
        { props: { variant: "panel" }, style: { width: "22rem", maxWidth: "100%", padding: 12 } },
        { props: { variant: "panelWide" }, style: { width: "46rem", maxWidth: "100%", padding: 12 } },
      ],
    },
    MuiPopover: {
      defaultProps: { marginThreshold: 12 },
      styleOverrides: {
        paper: ({ theme }) => ({
          marginTop: 6,
          borderRadius: 8,
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: "0 10px 20px -6px rgb(0 0 0 / 0.08), 0 3px 6px -3px rgb(0 0 0 / 0.05)",
          maxWidth: "calc(100vw - 2rem)",
        }),
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: ({ theme }) => ({
          borderRadius: 8,
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: "0 10px 20px -6px rgb(0 0 0 / 0.08)",
          maxWidth: 360,
          "& .MuiMenuItem-root": { whiteSpace: "normal", alignItems: "flex-start" },
        }),
      },
    },
    MuiDivider: { styleOverrides: { root: { borderColor: line } } },
    MuiContainer: { styleOverrides: { root: { paddingTop: 12, paddingBottom: 12 } } },

    // ── Buttons & toggles ────────────────────────────────────────────────────────────────
    MuiButtonBase: { defaultProps: { disableRipple: true } },
    MuiButton: {
      defaultProps: { disableElevation: true, size: "small" },
      styleOverrides: {
        root: { borderRadius: 999, minHeight: 32, paddingBlock: 4, paddingInline: 12, lineHeight: 1.5, whiteSpace: "nowrap" },
        startIcon: { marginRight: 4, "& > *:nth-of-type(1)": { fontSize: 16 } },
        endIcon: { marginLeft: 4, "& > *:nth-of-type(1)": { fontSize: 16 } },
      },
      variants: [
        {
          props: { variant: "dashed" },
          style: ({ theme }) => ({
            border: `1px dashed ${theme.palette.grey[400]}`,
            color: theme.palette.text.primary,
            "& .MuiSvgIcon-root": { color: theme.palette.text.secondary, fontSize: 16 },
            "&:hover": { backgroundColor: theme.palette.action.hover, borderColor: theme.palette.grey[500] },
          }),
        },
        { props: { variant: "outlined" }, style: { borderColor: line, color: ink } },
        { props: { variant: "text" }, style: { color: muted, fontWeight: 400, fontSize: 12 } },
      ],
    },
    MuiIconButton: {
      defaultProps: { size: "small" },
      styleOverrides: { root: { borderRadius: 999 }, sizeSmall: { padding: 6, "& .MuiSvgIcon-root": { fontSize: 16 } } },
    },
    MuiButtonGroup: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 999, height: 32 },
        grouped: { minWidth: 0, borderColor: line, color: ink },
        firstButton: { paddingLeft: 12, paddingRight: 6, borderRightColor: "transparent !important" },
        middleButton: { paddingInline: 4, borderRightColor: "transparent !important" },
        lastButton: { paddingLeft: 2, paddingRight: 8 },
      },
    },
    MuiToggleButtonGroup: { defaultProps: { size: "small" }, styleOverrides: { root: { borderRadius: 999, padding: 2, backgroundColor: "#f5f5f5" } } },
    MuiToggleButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          border: 0,
          borderRadius: "999px !important",
          paddingBlock: 3,
          paddingInline: 10,
          fontSize: 12,
          textTransform: "none",
          color: theme.palette.text.secondary,
          "&.Mui-selected": { backgroundColor: "#fff", color: theme.palette.text.primary, boxShadow: `0 0 0 1px ${line}` },
        }),
      },
    },
    MuiSwitch: { defaultProps: { size: "small" } },
    MuiFormControlLabel: {
      styleOverrides: {
        root: { marginLeft: 0, marginRight: 0, gap: 4, whiteSpace: "nowrap" },
        label: ({ theme }) => ({ fontSize: 12, color: theme.palette.text.secondary }),
      },
    },
    MuiCheckbox: { defaultProps: { size: "small", disableRipple: true }, styleOverrides: { root: { padding: 2 } } },

    // ── Chips ────────────────────────────────────────────────────────────────────────────
    MuiChip: {
      variants: [
        {
          props: { variant: "filter" },
          style: ({ theme }) => ({
            height: 32,
            borderRadius: 16,
            border: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.background.paper,
            maxWidth: "min(100%, max(25vw, 18rem))",
            fontSize: 13,
            "&:hover, &.Mui-focusVisible": { backgroundColor: theme.palette.action.hover, borderColor: theme.palette.grey[400] },
            "& .MuiChip-icon": { marginLeft: 10, marginRight: -2, fontSize: 15, color: theme.palette.text.secondary },
            "& .MuiChip-label": { display: "flex", minWidth: 0, paddingLeft: 8, paddingRight: 4 },
            "& .MuiChip-label > .MuiStack-root": { minWidth: 0, flexWrap: "nowrap" },
            "& .MuiChip-label .MuiStack-root > .MuiTypography-root:last-of-type": { minWidth: 0 },
            "& .MuiChip-deleteIcon": { fontSize: 16, margin: "0 8px 0 4px", flexShrink: 0, color: theme.palette.text.secondary },
            "& .MuiChip-deleteIcon:hover": { color: theme.palette.error.main },
          }),
        },
        ...(["success", "error", "warning", "info", "default"] as const).map((color) => ({
          props: { variant: "soft" as const, color },
          style: ({ theme }: { theme: import("@mui/material/styles").Theme }) => {
            const main =
              color === "default" ? theme.palette.text.secondary : color === "warning" ? "#b45309" : theme.palette[color].main
            return {
              height: 20,
              borderRadius: 4,
              fontSize: 11,
              fontWeight: 600,
              color: main,
              backgroundColor: color === "default" ? "#f4f4f5" : alpha(color === "warning" ? "#f59e0b" : main, 0.1),
              "& .MuiChip-label": { paddingInline: 6 },
            }
          },
        })),
        {
          props: { size: "small", variant: "outlined" },
          style: ({ theme }) => ({ height: 24, borderColor: theme.palette.divider, backgroundColor: "#f5f5f5", fontSize: 12 }),
        },
      ],
    },

    // ── Inputs ───────────────────────────────────────────────────────────────────────────
    MuiTextField: {
      defaultProps: { size: "small" },
      variants: [{ props: { type: "search" }, style: { width: "22rem", maxWidth: "100%", "@media (max-width: 640px)": { width: "100%" } } }],
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 8,
          fontSize: 13,
          "& .MuiOutlinedInput-notchedOutline": { borderColor: theme.palette.grey[300] },
          "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: theme.palette.grey[400] },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: theme.palette.grey[500], borderWidth: 1 },
          // The search field is a pill.
          "&:has(input[type=search]), &:has(textarea)": { borderRadius: 16 },
        }),
        input: { paddingBlock: 6, lineHeight: "20px", height: "auto" },
        // Multiline (the search field): 6 + 20 + 6 = 32px, matching the other controls.
        multiline: { paddingBlock: 6, "& textarea": { paddingBlock: 0, lineHeight: "20px" } },
      },
    },
    MuiInputAdornment: { styleOverrides: { root: ({ theme }) => ({ color: theme.palette.text.secondary, "& .MuiSvgIcon-root": { fontSize: 16 } }) } },
    MuiSelect: { defaultProps: { size: "small" }, styleOverrides: { select: { paddingBlock: 5, fontSize: 13 } } },
    MuiAutocomplete: {
      defaultProps: { size: "small" },
      styleOverrides: {
        option: { fontSize: 13, minHeight: 32 },
        paper: { borderRadius: 8, boxShadow: "0 10px 20px -6px rgb(0 0 0 / 0.08)" },
        inputRoot: { paddingBlock: "2px !important" },
        tag: { height: 22, fontSize: 12 },
      },
    },
    MuiMenuItem: {
      defaultProps: { dense: true },
      styleOverrides: { root: { fontSize: 13, borderRadius: 6, marginInline: 4, gap: 8, "& .MuiListItemIcon-root": { minWidth: 0 } } },
    },
    MuiMenuList: {
      // Scrolling lists in filter panels: no box, just a bottom rule.
      styleOverrides: { root: ({ theme }) => ({ maxHeight: 260, overflowY: "auto", borderBottom: `1px solid ${theme.palette.divider}`, paddingBlock: 4 }) },
    },
    MuiListItemText: {
      styleOverrides: { primary: { fontSize: 13 }, secondary: { fontSize: 12, whiteSpace: "pre-line" } },
    },
    MuiListItemIcon: { styleOverrides: { root: { minWidth: 0, color: muted, "& .MuiSvgIcon-root": { fontSize: 16 } } } },
    MuiListSubheader: { styleOverrides: { root: { fontSize: 12, lineHeight: "28px", color: muted } } },
    MuiTooltip: {
      defaultProps: { arrow: true, enterDelay: 300 },
      styleOverrides: { tooltip: { fontSize: 12, backgroundColor: ink, whiteSpace: "pre-line" }, arrow: { color: ink } },
    },
    MuiBadge: { styleOverrides: { dot: { height: 6, minWidth: 6 } } },
    MuiLink: {
      defaultProps: { underline: "always", color: "inherit" },
      styleOverrides: { root: { textDecorationColor: alpha(ink, 0.4), "&:hover": { textDecorationColor: ink } } },
    },

    // ── Table ────────────────────────────────────────────────────────────────────────────
    MuiTableContainer: { styleOverrides: { root: ({ theme }) => ({ border: `1px solid ${theme.palette.divider}`, borderRadius: 6 }) } },
    MuiTable: { defaultProps: { size: "small", stickyHeader: true } },
    MuiTableCell: {
      styleOverrides: {
        root: ({ theme }) => ({ borderBottomColor: theme.palette.divider, whiteSpace: "nowrap", fontSize: 13, height: 40 }),
        head: ({ theme }) => ({
          backgroundColor: "#fafafa",
          fontWeight: 600,
          color: theme.palette.text.primary,
          // Column actions appear on hover/focus; a filtered column keeps its (primary) icon visible.
          "& .MuiIconButton-root": { opacity: 0, transition: "opacity .15s" },
          "&:hover .MuiIconButton-root, & .MuiIconButton-root:focus-visible, & .MuiIconButton-colorPrimary": { opacity: 1 },
          "& .MuiTableSortLabel-root": { gap: 2 },
          "& > .MuiStack-root": { justifyContent: "space-between", flexWrap: "nowrap" },
        }),
        alignRight: { "& > .MuiStack-root": { flexDirection: "row-reverse" } },
      },
    },
    MuiTableRow: { styleOverrides: { root: { "&:last-child td": { borderBottom: 0 } } } },
    MuiTableSortLabel: { styleOverrides: { icon: { fontSize: 14 } } },
    MuiPagination: { defaultProps: { shape: "rounded", size: "small" } },
    MuiDialog: { styleOverrides: { paper: { borderRadius: 12, maxWidth: 440 } } },
    MuiDialogTitle: { styleOverrides: { root: { fontSize: 15, fontWeight: 600 } } },
  },
})
