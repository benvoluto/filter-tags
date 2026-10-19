// ───────────────────────────────────────────────────────────────────────────
// Provenance: VivaaHealth/vivaa @ 64eea0d020a8
// Source:     web/common/src/theme/ThemeProvider.tsx
// URL:        https://github.com/VivaaHealth/vivaa/blob/64eea0d020a89f99cc6d6529d9e136a228e341f4/web/common/src/theme/ThemeProvider.tsx
// Ref:        main (upstream commit 2026-07-17)
// Fetched:    2026-10-19  (via scripts/sync-from-vivaa.mjs)
// DO NOT EDIT — run `pnpm sync:vivaa` to refresh.
// ───────────────────────────────────────────────────────────────────────────

import { ThemeProvider as MuiThemeProvider } from '@mui/material';
import type React from 'react';

import { muiTheme } from './muiTheme.js';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider(props: ThemeProviderProps) {
  return <MuiThemeProvider theme={muiTheme}>{props.children}</MuiThemeProvider>;
}

ThemeProvider.displayName = 'ThemeProvider';
