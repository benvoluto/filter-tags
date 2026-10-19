// ───────────────────────────────────────────────────────────────────────────
// Provenance: VivaaHealth/vivaa @ 64eea0d020a8
// Source:     web/common/src/components/Span/Span.tsx
// URL:        https://github.com/VivaaHealth/vivaa/blob/64eea0d020a89f99cc6d6529d9e136a228e341f4/web/common/src/components/Span/Span.tsx
// Ref:        main (upstream commit 2026-07-17)
// Fetched:    2026-10-19  (via scripts/sync-from-vivaa.mjs)
// DO NOT EDIT — run `pnpm sync:vivaa` to refresh.
// ───────────────────────────────────────────────────────────────────────────

import { Box, type BoxProps } from '@mui/material';
import { forwardRef } from 'react';

export interface SpanProps extends Omit<BoxProps, 'component'> {}

export const Span = forwardRef((props: SpanProps, ref) => {
  return <Box component="span" {...props} ref={ref} />;
});

Span.displayName = 'Span';
