// ───────────────────────────────────────────────────────────────────────────
// Provenance: VivaaHealth/vivaa @ 64eea0d020a8
// Source:     web/common/src/components/Mui/mergeSxProps.ts
// URL:        https://github.com/VivaaHealth/vivaa/blob/64eea0d020a89f99cc6d6529d9e136a228e341f4/web/common/src/components/Mui/mergeSxProps.ts
// Ref:        main (upstream commit 2026-07-17)
// Fetched:    2026-10-19  (via scripts/sync-from-vivaa.mjs)
// DO NOT EDIT — run `pnpm sync:vivaa` to refresh.
// ───────────────────────────────────────────────────────────────────────────

import { type SxProps, type Theme } from '@mui/material/styles';

export function mergeSxProps(...sxPropsArray: (SxProps<Theme> | undefined)[]): SxProps<Theme> {
  return sxPropsArray
    .flatMap((sxProps) => (Array.isArray(sxProps) ? sxProps : ([sxProps] as SxProps<Theme>)))
    .filter(Boolean);
}
