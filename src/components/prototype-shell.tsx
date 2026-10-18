"use client"

import * as React from "react"
import Container from "@mui/material/Container"
import Divider from "@mui/material/Divider"
import Stack from "@mui/material/Stack"
import ToggleButton from "@mui/material/ToggleButton"
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup"
import Typography from "@mui/material/Typography"

import { RunsTable, type PrototypeVariant } from "@/components/runs/runs-table"

const VARIANTS: { value: PrototypeVariant; label: string }[] = [
  { value: "filters", label: "Filters only" },
  { value: "quick", label: "With quick filters" },
  { value: "views", label: "Filters and views" },
]

/** Page chrome with a selector to switch between prototype variants. */
export function PrototypeShell() {
  const [variant, setVariant] = React.useState<PrototypeVariant>("filters")
  return (
    <main>
      <Container maxWidth={false}>
        <Stack direction="row" spacing={2} useFlexGap component="header">
          <Typography variant="h1">Flow Runs</Typography>
          <ToggleButtonGroup exclusive value={variant} onChange={(_, v) => v && setVariant(v)} aria-label="Prototype variant">
            {VARIANTS.map((v) => (
              <ToggleButton key={v.value} value={v.value}>
                {v.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Stack>
      </Container>
      <Divider />
      <Container maxWidth={false}>
        <RunsTable variant={variant} />
      </Container>
    </main>
  )
}
