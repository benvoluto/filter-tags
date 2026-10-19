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

/** The anchor of a popover that isn't a staff filter chip (column headers). */
const AnchorContext = React.createContext<Element | null>(null)

/**
 * Vertical space the popover's paper adds around its content: 4px offset (staff's `marginTop`),
 * MUI's 16px `marginThreshold` from the viewport edge, 16px padding top and bottom, 1px borders.
 */
const PAPER_CHROME = 4 + 16 + 32 + 2
const MIN_PANEL_HEIGHT = 200

/**
 * The height a filter panel may use so its popover stays **below** its anchor. MUI's Popover slides
 * a too-tall paper up until it fits, which put the panel over the filter chips and its own buttons;
 * capping the panel instead makes its list scroll.
 *
 * The anchor is found without touching the synced `FilterChipAndPopover`: its chip carries
 * `aria-describedby` = the popover's id. Column-header popovers provide theirs via context.
 */
export function usePanelMaxHeight(panelRef: React.RefObject<HTMLElement | null>) {
  const anchorFromContext = React.useContext(AnchorContext)
  const [maxHeight, setMaxHeight] = React.useState<number | undefined>(undefined)
  React.useLayoutEffect(() => {
    const measure = () => {
      const popoverRoot = panelRef.current?.closest(".MuiPopover-root")
      const anchor =
        anchorFromContext ??
        (popoverRoot?.id ? document.querySelector(`[aria-describedby="${CSS.escape(popoverRoot.id)}"]`) : null)
      if (!anchor) return
      const space = window.innerHeight - anchor.getBoundingClientRect().bottom - PAPER_CHROME
      setMaxHeight(Math.max(MIN_PANEL_HEIGHT, Math.floor(space)))
    }
    measure()
    window.addEventListener("resize", measure)
    return () => window.removeEventListener("resize", measure)
  }, [panelRef, anchorFromContext])
  return maxHeight
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
      <Box padding="16px">
        <AnchorContext.Provider value={anchorElement}>{children}</AnchorContext.Provider>
      </Box>
    </Popover>
  )
}
