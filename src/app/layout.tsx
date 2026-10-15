import type { Metadata, Viewport } from "next"
import { Sora } from "next/font/google"

import { TooltipProvider } from "@/components/ui/tooltip"
import "./globals.css"

const sora = Sora({ variable: "--font-sora", subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Flow Runs · Filter prototype",
  description: "Prototype of search, sort, and filter-chip interactions on a paginated data table.",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sora.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col" suppressHydrationWarning>
        <TooltipProvider delay={300}>{children}</TooltipProvider>
      </body>
    </html>
  )
}
