// ───────────────────────────────────────────────────────────────────────────
// Provenance: VivaaHealth/vivaa @ c02217c44fee
// Source:     web/staff/src/components/Layout/FilterBar.tsx
// URL:        https://github.com/VivaaHealth/vivaa/blob/c02217c44fee07d6fe632e2a951b0e0749f295fd/web/staff/src/components/Layout/FilterBar.tsx
// Ref:        main (upstream commit 2025-05-01)
// Fetched:    2026-10-19  (via scripts/sync-from-vivaa.mjs)
// DO NOT EDIT — run `pnpm sync:vivaa` to refresh.
// ───────────────────────────────────────────────────────────────────────────

import { Stack } from '@mui/material';
import { type ReactNode } from 'react';

interface FilterBarProps {
  children: ReactNode;
}

export function FilterBar(props: FilterBarProps) {
  const { children } = props;
  return (
    <Stack direction="row" gap={1} flexWrap="wrap">
      {children}
    </Stack>
  );
}
