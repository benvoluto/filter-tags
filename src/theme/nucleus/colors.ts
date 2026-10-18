// ───────────────────────────────────────────────────────────────────────────
// Provenance: VivaaHealth/vivaa @ d4c8374a45ea
// Source:     web/common/src/theme/colors/colors.ts
// URL:        https://github.com/VivaaHealth/vivaa/blob/d4c8374a45eaa5c02912c1f7a40a5245137679cc/web/common/src/theme/colors/colors.ts
// Ref:        main (upstream commit 2026-08-19)
// Fetched:    2026-09-01  (via scripts/sync-from-monorepo.mjs)
// Note:       Semantic color tokens re-export. Aggregates the sibling palette files below into a single { colors } export.
// DO NOT EDIT — run `pnpm sync:monorepo` to refresh.
// ───────────────────────────────────────────────────────────────────────────

import { type Theme } from '@mui/material';

import { blue } from './blue';
import { common } from './common';
import { gray } from './gray';
import { green } from './green';
import { red } from './red';
import { yellow } from './yellow';

export const colors = {
  common,
  extended: {
    blue,
    green,
    gray,
    red,
    yellow,
  },
  background: {
    default: gray[97],
    dark: gray[85],
    disabled: gray[93],
    knockout: common.white,
    brand: blue[90],
  },
  content: {
    default: gray[25],
    dark: gray[45],
    disabled: gray[65],
    knockout: common.white,
  },
  border: {
    default: gray[75],
    light: gray[85],
    dark: gray[55],
    focus: gray[25],
  },
  primary: {
    default: '#0b67fd',
    dark: blue[40],
    darker: blue[30],
  },
  secondary: {
    default: blue[95],
    dark: blue[90],
    darker: blue[80],
  },
  error: {
    default: red[60],
    dark: red[40],
    light: red[95],
  },
  danger: {
    default: red[60],
    dark: red[40],
    light: red[95],
  },
  success: {
    default: green[40],
    dark: green[30],
    light: green[95],
  },
  warning: {
    default: yellow[50],
    dark: yellow[45],
    light: yellow[95],
  },
};

export const paletteColors: Partial<Theme['palette']> = {
  primary: {
    light: blue[70],
    main: '#0b67fd',
    dark: blue[40],
    contrastText: common.white,
  },
  /**
   * FIXME - replace with real secondary colors from design system
   */
  secondary: {
    light: blue[70],
    main: '#0b67fd',
    dark: blue[40],
    contrastText: common.white,
  },
  error: {
    light: red[70],
    main: red[60],
    dark: red[40],
    contrastText: common.white,
  },
  success: {
    light: green[55],
    main: green[40],
    dark: green[30],
    contrastText: common.white,
  },
  info: {
    light: blue[70],
    main: blue[60],
    dark: blue[30],
    contrastText: common.white,
  },
  warning: {
    light: yellow[60],
    main: yellow[50],
    dark: yellow[45],
    contrastText: common.white,
  },
};
