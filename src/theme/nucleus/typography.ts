// ───────────────────────────────────────────────────────────────────────────
// Provenance: VivaaHealth/vivaa @ 64eea0d020a8
// Source:     web/common/src/theme/typography/typography.ts
// URL:        https://github.com/VivaaHealth/vivaa/blob/64eea0d020a89f99cc6d6529d9e136a228e341f4/web/common/src/theme/typography/typography.ts
// Ref:        main (upstream commit 2026-07-17)
// Fetched:    2026-09-01  (via scripts/sync-from-monorepo.mjs)
// Note:       The type scale itself. mui-theme.ts spreads this rather than restating it - a transcribed scale is how this tree lost every heading letterSpacing and got caption's line height wrong.
// DO NOT EDIT — run `pnpm sync:monorepo` to refresh.
// ───────────────────────────────────────────────────────────────────────────

import { type TypographyVariantsOptions } from '@mui/material/styles';

import { colors } from './colors';

export const typography: NonNullable<TypographyVariantsOptions> = {
  fontFamily: 'Inter, sans-serif',
  allVariants: {
    fontFamily: 'Inter, sans-serif',
    fontWeight: 400,
    color: colors.content.default,
  },
  h1: {
    fontSize: '2rem',
    lineHeight: '120%',
    fontWeight: 700,
    letterSpacing: '-0.02em',
  },
  h2: {
    fontSize: '1.5rem',
    lineHeight: '125%',
    fontWeight: 600,
    letterSpacing: '-0.015em',
  },
  h3: {
    fontSize: '1.25rem',
    lineHeight: '135%',
    fontWeight: 600,
    letterSpacing: '-0.01em',
  },
  h4: {
    fontSize: '1.125rem',
    lineHeight: '145%',
    fontWeight: 600,
    letterSpacing: '-0.005em',
  },
  h5: {
    fontSize: '1rem',
    lineHeight: '150%',
    fontWeight: 600,
    letterSpacing: '0.0025em',
  },
  h6: {
    fontSize: '0.875rem',
    lineHeight: '150%',
    fontWeight: 600,
    letterSpacing: '0.02em',
  },
  body1: {
    fontSize: '1rem',
    lineHeight: '150%',
  },
  body2: {
    fontSize: '0.875rem',
    lineHeight: '150%',
  },
  subtitle1: {
    fontSize: '1rem',
    lineHeight: '150%',
  },
  subtitle2: {
    fontSize: '0.75rem',
    lineHeight: '150%',
    fontWeight: 500,
  },
  caption: {
    fontSize: '0.75rem',
    lineHeight: '135%',
  },
  overline: {
    fontSize: '0.625rem',
    lineHeight: '150%',
    textTransform: 'uppercase',
  },
  monospace: {
    fontFamily: 'monospace',
    fontSize: '0.875rem',
    lineHeight: '145%',
  },
  button: {
    textTransform: 'none',
    lineHeight: '145%',
    fontWeight: 600,
  },
};
