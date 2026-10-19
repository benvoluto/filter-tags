"use client"

import * as React from "react"
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter"

import { ThemeProvider } from "common"

/**
 * Emotion cache for the App Router + the staff app's own `ThemeProvider` (synced, unmodified, from
 * vivaa/web/common/src/theme). No CssBaseline: the staff app doesn't use one; its page-level rules
 * are mirrored in app/globals.css.
 */
export function ThemeRegistry({ children }: { children: React.ReactNode }) {
  return (
    <AppRouterCacheProvider>
      <ThemeProvider>{children}</ThemeProvider>
    </AppRouterCacheProvider>
  )
}
