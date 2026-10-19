"use client"

import * as React from "react"
import { Box, Popover, popoverClasses } from "@mui/material"

/**
 * Asks the open filter popover to re-measure after its content changes size (e.g. the editor
 * widening into Advanced). MUI's Popover re-positions on window `resize`, so this works for both
 * popovers here — including staff's `FilterChipAndPopover`, which is synced unmodified and exposes
 * no `action` ref.
 */
export function useRepositionPopover() {
  return React.useCallback(() => {
    requestAnimationFrame(() => window.dispatchEvent(new Event("resize")))
  }, [])
}

/**
 * The popover for filters opened from a column header, where there is no chip to anchor
 * `FilterChipAndPopover` to. Its Popover props and `sx` are copied verbatim from
 * web/staff/src/components/FiltersV2/components/ChipAndPopover.tsx so both entry points open the
 * same panel.
 */
export function HeaderFilterPopover(props: {
  anchorElement: Element | null
  onClose: () => void
  children: React.ReactNode
}) {
  const { anchorElement, onClose, children } = props
  const popoverId = React.useId()
  return (
    <Popover
      id={popoverId}
      open={Boolean(anchorElement)}
      anchorEl={anchorElement}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "left",
      }}
      onClose={onClose}
      sx={{
        [`& .${popoverClasses.paper}`]: {
          marginTop: "4px",
          border: "1px solid #d9d9d9",
          boxShadow: "0px 16px 40px 0px rgba(37, 39, 82, 0.14)",
        },
      }}
    >
      <Box padding="16px">{children}</Box>
    </Popover>
  )
}
