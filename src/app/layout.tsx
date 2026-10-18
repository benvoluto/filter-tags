import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"

import { ThemeRegistry } from "@/components/theme-registry"

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Flow Runs · Filter prototype (MUI)",
  description: "Prototype of search, sort, filter chips, and saved views on a paginated table — built with stock MUI + theme.",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={inter.variable}>
      <body suppressHydrationWarning>
        <ThemeRegistry>{children}</ThemeRegistry>
      </body>
    </html>
  )
}
