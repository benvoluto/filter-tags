"use client"

import * as React from "react"
import { Box, Stack, ToggleButton, ToggleButtonGroup } from "@mui/material"

import { Text, colors } from "common"
import { RunsTable } from "@/components/runs/runs-table"
import { variantFromPath, type PrototypeVariant } from "@/lib/variants"
import { loadModel } from "@/lib/filter-model"

const VARIANTS: { value: PrototypeVariant; label: string }[] = [
  { value: "filters", label: "Filters only" },
  { value: "quick", label: "With quick filters" },
  { value: "views", label: "Filters and views" },
  { value: "prompt", label: "Prompt" },
]

/**
 * Page chrome laid out like a staff page: an action bar (title at heading3/bold, one rule under it)
 * over a body with the standard 24px padding (web/common Layout: STANDARD_LAYOUT_PADDING_X = 3).
 * The variant switch is prototype scaffolding, drawn with staff's themed ToggleButtonGroup.
 */
export function PrototypeShell() {
  // The variant is in the URL (/prompt, /views…), so a link opens straight to it. Switching uses
  // pushState rather than a navigation, so the table keeps its state across variants as before;
  // Back/Forward switch between them.
  const [variant, setVariantState] = React.useState<PrototypeVariant>(() => variantFromPath(window.location.pathname))
  const setVariant = (next: PrototypeVariant) => {
    setVariantState(next)
    if (window.location.pathname !== `/${next}`) window.history.pushState(null, "", `/${next}${window.location.search}`)
  }
  React.useEffect(() => {
    const onPopState = () => setVariantState(variantFromPath(window.location.pathname))
    window.addEventListener("popstate", onPopState)
    return () => window.removeEventListener("popstate", onPopState)
  }, [])
  // The Prompt variant's on-device model starts loading with the page, whichever variant is shown,
  // so it's usually ready by the time someone switches to it.
  React.useEffect(() => {
    void loadModel()
  }, [])
  return (
    <Box component="main">
      <Stack
        component="header"
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        flexWrap="wrap"
        gap={2}
        sx={{ paddingX: 3, paddingY: 1.5, borderBottom: `1px solid ${colors.border.light}` }}
      >
        <Text variant="heading3" bold>
          Flow Runs
        </Text>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={variant}
          onChange={(_, next: PrototypeVariant | null) => next && setVariant(next)}
          aria-label="Prototype variant"
        >
          {VARIANTS.map((v) => (
            <ToggleButton key={v.value} value={v.value} sx={{ fontSize: "0.875rem", paddingX: 1.5 }}>
              {v.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Stack>
      <Box sx={{ paddingX: 3, paddingY: 2 }}>
        <RunsTable variant={variant} />
      </Box>
    </Box>
  )
}
