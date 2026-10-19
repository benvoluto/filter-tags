// ───────────────────────────────────────────────────────────────────────────
// Provenance: VivaaHealth/vivaa @ 647c115f78e3
// Source:     web/common/src/theme/colors/colors.ts
// URL:        https://github.com/VivaaHealth/vivaa/blob/647c115f78e319ecfe95baa5947281761fe13ffa/web/common/src/theme/colors/colors.ts
// Ref:        main (upstream commit 2026-09-29)
// Fetched:    2026-10-19  (via scripts/sync-from-vivaa.mjs)
// DO NOT EDIT — run `pnpm sync:vivaa` to refresh.
// ───────────────────────────────────────────────────────────────────────────

import { type Theme } from '@mui/material';

import { blue } from './blue.js';
import { common } from './common.js';
import { gray } from './gray.js';
import { green } from './green.js';
import { red } from './red.js';
import { yellow } from './yellow.js';

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
  agenticChat: {
    dark: blue[20],
    main: blue[30],
    light: blue[40],
    contrastText: common.white,
  },
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
