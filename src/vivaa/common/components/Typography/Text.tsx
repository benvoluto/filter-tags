// ───────────────────────────────────────────────────────────────────────────
// Provenance: VivaaHealth/vivaa @ 64eea0d020a8
// Source:     web/common/src/components/Typography/Text.tsx
// URL:        https://github.com/VivaaHealth/vivaa/blob/64eea0d020a89f99cc6d6529d9e136a228e341f4/web/common/src/components/Typography/Text.tsx
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
import {
  type CodeVariant,
  MUI_VARIANTS,
  type TypographyVariant,
  codeVariants,
} from './variants.js';
import { mergeSxProps } from '../Mui/mergeSxProps.js';

export interface TextProps extends Omit<TypographyProps<'p'>, 'component' | 'as' | 'variant'> {
  variant?: TypographyVariant;
  bold?: boolean;
  component?: 'span' | 'label';
}

export const Text = forwardRef((props: TextProps, ref: ForwardedRef<HTMLParagraphElement>) => {
  const { variant = 'body1', bold, sx, color, component, ...rest } = props;
  const isCodeVariant = codeVariants.has(variant as CodeVariant);
  return (
    <Typography
      {...rest}
      ref={ref}
      component={component ?? (isCodeVariant ? 'pre' : 'p')}
      variant={MUI_VARIANTS[variant]}
      sx={mergeSxProps(
        { color: typeof color === 'string' ? (TypographyColorMap[color] ?? color) : color },
        bold ? { fontWeight: 700 } : {},
        sx
      )}
    />
  );
});

Text.displayName = 'Text';
