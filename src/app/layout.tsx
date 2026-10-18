import type { Metadata, Viewport } from "next"

import { ThemeRegistry } from "@/components/theme-registry"

export const metadata: Metadata = {
  title: "Flow Runs · Filter prototype (MUI + Nucleus)",
  description: "Prototype of search, sort, filter chips, and saved views — stock MUI v7 components with Notable's Nucleus theme.",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <head>
        {/* Nucleus's font stack names "Inter" (and "Roboto Mono" for the monospace variant). */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* Root layout = every page, so the Pages-Router-era warning doesn't apply here. */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Roboto+Mono:wght@400;500&display=swap"
        />
      </head>
      <body suppressHydrationWarning>
        <ThemeRegistry>{children}</ThemeRegistry>
      </body>
    </html>
  )
}
