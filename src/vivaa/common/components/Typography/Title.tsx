// ───────────────────────────────────────────────────────────────────────────
// Provenance: VivaaHealth/vivaa @ 64eea0d020a8
// Source:     web/common/src/components/Typography/Title.tsx
// URL:        https://github.com/VivaaHealth/vivaa/blob/64eea0d020a89f99cc6d6529d9e136a228e341f4/web/common/src/components/Typography/Title.tsx
// Ref:        main (upstream commit 2026-07-17)
// Fetched:    2026-10-19  (via scripts/sync-from-vivaa.mjs)
// DO NOT EDIT — run `pnpm sync:vivaa` to refresh.
// ───────────────────────────────────────────────────────────────────────────

import {
  // We are wrapping the Typography component in this component
  // eslint-disable-next-line no-restricted-imports
  Typography,
  type TypographyProps,
} from '@mui/material';
import { type ForwardedRef, forwardRef } from 'react';

import { TypographyColorMap } from './constants.js';
import { MUI_VARIANTS, type TitleVariant } from './variants.js';
import { mergeSxProps } from '../Mui/mergeSxProps.js';

export type TitleComponent = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

export interface TitleProps extends Omit<TypographyProps, 'component' | 'as' | 'variant'> {
  /**
   * Heading component is required. Make sure that your document hierarchy is well structured.
   * Specifically, you must use h1 as the top-level heading, h2 as the second-level heading, and so on.
   */
  component: TitleComponent;
  variant?: TitleVariant;
  bold?: boolean;
}

/**
 * Make sure that your document hierarchy is well structured.
 * This component is intended for headings in your app
 * Specifically, you must use h1 as the top-level heading, h2 as the second-level heading, and so on.
 */
export const Title = forwardRef((props: TitleProps, ref: ForwardedRef<HTMLParagraphElement>) => {
  const { variant = 'heading1', bold, sx, color, ...rest } = props;
  return (
    <Typography
      {...rest}
      ref={ref}
      variant={MUI_VARIANTS[variant]}
      sx={mergeSxProps(
        { color: typeof color === 'string' ? (TypographyColorMap[color] ?? color) : color },
        bold ? { fontWeight: 700 } : {},
        sx
      )}
    />
  );
});

Title.displayName = 'Title';
