import type { Metadata, Viewport } from "next"

import "@/vivaa/common/styles/fonts.css"
import "./globals.css"

import { ThemeRegistry } from "@/components/theme-registry"

export const metadata: Metadata = {
  title: "Flow Runs · Filter prototype (vivaa staff components)",
  description:
    "Prototype of search, sort, filter chips and saved views, built on the vivaa staff app's own theme, FiltersV2 chip/popover and NotableDataGrid.",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <ThemeRegistry>{children}</ThemeRegistry>
      </body>
    </html>
  )
}
