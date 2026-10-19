// ───────────────────────────────────────────────────────────────────────────
// Provenance: VivaaHealth/vivaa @ 64eea0d020a8
// Source:     web/common/src/components/Tag/Tag.tsx
// URL:        https://github.com/VivaaHealth/vivaa/blob/64eea0d020a89f99cc6d6529d9e136a228e341f4/web/common/src/components/Tag/Tag.tsx
// Ref:        main (upstream commit 2026-07-17)
// Fetched:    2026-10-19  (via scripts/sync-from-vivaa.mjs)
// DO NOT EDIT — run `pnpm sync:vivaa` to refresh.
// ───────────────────────────────────────────────────────────────────────────

import { type BoxProps, type SxProps } from '@mui/material';
import { forwardRef } from 'react';

import { colors } from '../../theme/colors/colors.js';
import { mergeSxProps } from '../Mui/mergeSxProps.js';
import { Span } from '../Span/Span.js';
export type TagColor = 'success' | 'warning' | 'error' | 'primary' | 'pending' | 'default';

const CONTAINED_TAG_COLOR_SX: Record<TagColor, SxProps> = {
  success: {
    color: colors.success.default,
    backgroundColor: colors.success.light,
  },
  warning: {
    color: colors.extended.yellow[25],
    backgroundColor: colors.warning.light,
  },
  error: {
    color: colors.error.default,
    backgroundColor: colors.error.light,
  },
  primary: {
    color: colors.primary.darker,
    backgroundColor: colors.extended.blue[95],
  },
  pending: {
    color: colors.content.default,
    backgroundColor: colors.extended.gray[93],
  },
  default: {
    color: colors.content.default,
    backgroundColor: colors.extended.gray[93],
  },
};

export interface TagProps extends Omit<BoxProps, 'component' | 'color'> {
  color: TagColor;
  variant?: 'contained';
}

export const Tag = forwardRef((props: TagProps, ref) => {
  const { color, variant, ...spanProps } = props;
  return (
    <Span
      {...spanProps}
      ref={ref}
      sx={mergeSxProps(props.sx, CONTAINED_TAG_COLOR_SX[color], {
        borderRadius: 1,
        paddingX: 1,
        paddingY: 0.25,
        fontSize: '0.75rem',
        lineHeight: '145%',
        fontWeight: 600,
        display: 'inline-block',
        whiteSpace: 'nowrap',
      })}
    />
  );
});

Tag.displayName = 'Tag';
