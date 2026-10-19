"use client"

import * as React from "react"
import { Box, Stack, ToggleButton, ToggleButtonGroup } from "@mui/material"

import { Text, colors } from "common"
import { RunsTable, type PrototypeVariant } from "@/components/runs/runs-table"

const VARIANTS: { value: PrototypeVariant; label: string }[] = [
  { value: "filters", label: "Filters only" },
  { value: "quick", label: "With quick filters" },
  { value: "views", label: "Filters and views" },
]

/**
 * Page chrome laid out like a staff page: an action bar (title at heading3/bold, one rule under it)
 * over a body with the standard 24px padding (web/common Layout: STANDARD_LAYOUT_PADDING_X = 3).
 * The variant switch is prototype scaffolding, drawn with staff's themed ToggleButtonGroup.
 */
export function PrototypeShell() {
  const [variant, setVariant] = React.useState<PrototypeVariant>("filters")
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
