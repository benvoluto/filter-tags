"use client"

import * as React from "react"
import Popover, { type PopoverActions } from "@mui/material/Popover"

const RepositionContext = React.createContext<() => void>(() => {})

/** Lets content inside a FilterPopover ask it to re-measure (e.g. when the editor widens to advanced). */
export function useRepositionPopover() {
  return React.useContext(RepositionContext)
}

/**
 * Stock MUI Popover used for every filter editor (Add filter, partial filters, column headers, chips).
 * Focus is placed by the editor's own lists/inputs; the popover re-positions when the content resizes.
 */
export function FilterPopover({
  open,
  anchorEl,
  onClose,
  children,
}: {
  open: boolean
  anchorEl: Element | null
  onClose: () => void
  children: React.ReactNode
}) {
  const actions = React.useRef<PopoverActions>(null)
  const reposition = React.useCallback(() => {
    // Wait for the new layout before measuring.
    requestAnimationFrame(() => actions.current?.updatePosition())
  }, [])
  return (
    <Popover
      action={actions}
      disableAutoFocus
      open={open && Boolean(anchorEl)}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
    >
      <RepositionContext.Provider value={reposition}>{children}</RepositionContext.Provider>
    </Popover>
  )
}
