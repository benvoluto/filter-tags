// ───────────────────────────────────────────────────────────────────────────
// Provenance: VivaaHealth/vivaa @ 30d502602128
// Source:     web/common/src/components/Typography/variants.ts
// URL:        https://github.com/VivaaHealth/vivaa/blob/30d5026021289bd7fd981e39faf212d4d29543d4/web/common/src/components/Typography/variants.ts
// Ref:        main (upstream commit 2026-09-11)
// Fetched:    2026-10-19  (via scripts/sync-from-vivaa.mjs)
// DO NOT EDIT — run `pnpm sync:vivaa` to refresh.
// ───────────────────────────────────────────────────────────────────────────

import { type TypographyProps } from '@mui/material';

export type TitleVariant =
  'heading1' | 'heading2' | 'heading3' | 'heading4' | 'heading5' | 'heading6';

export type ParagraphVariant =
  TitleVariant | 'body1' | 'body2' | 'subtitle1' | 'subtitle2' | 'caption' | 'overline' | 'button';

export type CodeVariant = 'monospace';

export type TypographyVariant = TitleVariant | ParagraphVariant | CodeVariant;

export const MUI_VARIANTS: Record<TypographyVariant, TypographyProps['variant']> = {
  heading1: 'h1',
  heading2: 'h2',
  heading3: 'h3',
  heading4: 'h4',
  heading5: 'h5',
  heading6: 'h6',
  body1: 'body1',
  body2: 'body2',
  subtitle1: 'subtitle1',
  subtitle2: 'subtitle2',
  caption: 'caption',
  overline: 'overline',
  button: 'button',
  monospace: 'monospace',
};

export const titleVariants = new Set<TitleVariant>([
  'heading1',
  'heading2',
  'heading3',
  'heading4',
  'heading5',
  'heading6',
]);
export const paragraphVariants = new Set<ParagraphVariant>([
  ...titleVariants,
  'body1',
  'body2',
  'subtitle1',
  'subtitle2',
  'caption',
  'overline',
  'button',
]);
export const codeVariants = new Set<CodeVariant>(['monospace']);

export const typographyVariants = new Set<TypographyVariant>([
  ...titleVariants,
  ...paragraphVariants,
  ...codeVariants,
]);
