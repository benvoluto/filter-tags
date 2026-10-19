"use client"

import * as React from "react"
import {
  Badge,
  Button,
  ButtonGroup,
  Divider,
  InputAdornment,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Menu,
  MenuItem,
  TextField,
} from "@mui/material"
import { CaretDownIcon, CheckIcon, PencilSimpleIcon, StackIcon } from "@phosphor-icons/react"

import { colors } from "common"
import { FILTER_HEIGHT } from "@/vivaa/staff/components/FiltersV2/constants"
import { sortSummary, viewFilterSummary, type SavedView } from "@/lib/views"

/**
 * Saved-views selector: [views icon · name (edited dot)] [rename] [▾] as one ButtonGroup.
 * Nothing is selected by default; picking a view applies its filters, sort, and match mode.
 */
export function ViewsMenu({
  views,
  selectedId,
  edited,
  onSelect,
  onRename,
}: {
  views: SavedView[]
  selectedId: string | null
  edited: boolean
  onSelect: (view: SavedView | null) => void
  onRename: (id: string, name: string) => void
}) {
  const selected = views.find((v) => v.id === selectedId) ?? null
  const [group, setGroup] = React.useState<HTMLDivElement | null>(null)
  const [open, setOpen] = React.useState(false)
  const [renaming, setRenaming] = React.useState(false)

  if (selected && renaming) {
    return (
      <RenameField
        initial={selected.name}
        onDone={(name) => {
          if (name) onRename(selected.id, name)
          setRenaming(false)
        }}
      />
    )
  }

  const pick = (view: SavedView | null) => {
    setOpen(false)
    onSelect(view)
  }

  return (
    <>
      <ButtonGroup ref={setGroup} variant="outlined" aria-label="Saved views" sx={{ height: FILTER_HEIGHT }}>
        <Button
          startIcon={<StackIcon size={16} />}
          onClick={() => setOpen(true)}
          aria-haspopup="menu"
          aria-label={selected ? `View: ${selected.name}${edited ? " (edited)" : ""}` : "Views"}
        >
          <Badge color="warning" variant="dot" invisible={!(selected && edited)} title="Edited since saved">
            {selected ? selected.name : "Views"}
          </Badge>
        </Button>
        {selected ? (
          <Button aria-label={`Rename ${selected.name}`} title="Rename view" onClick={() => setRenaming(true)}>
            <PencilSimpleIcon size={14} />
          </Button>
        ) : null}
        <Button aria-label="Choose a view" aria-haspopup="menu" onClick={() => setOpen(true)}>
          <CaretDownIcon size={14} />
        </Button>
      </ButtonGroup>

      <Menu
        anchorEl={group}
        open={open}
        onClose={() => setOpen(false)}
        slotProps={{ paper: { sx: { maxWidth: 360 } }, list: { sx: { "& .MuiMenuItem-root": { whiteSpace: "normal", alignItems: "flex-start" } } } }}
      >
        <ListSubheader>Saved views</ListSubheader>
        {views.length === 0 ? (
          <MenuItem disabled>
            <ListItemText primary="No saved views yet" secondary="Add filters, then choose Save view." />
          </MenuItem>
        ) : (
          views.map((v) => (
            <MenuItem key={v.id} selected={v.id === selectedId} onClick={() => pick(v)}>
              <ListItemIcon>{v.id === selectedId ? <CheckIcon size={16} /> : null}</ListItemIcon>
              <ListItemText
                slotProps={{ secondary: { sx: { whiteSpace: "pre-line" } } }}
                primary={v.name}
                secondary={`${viewFilterSummary(v)}\n${sortSummary(v.sort)}${v.matchMode === "any" ? " · match any filter" : ""}`}
              />
            </MenuItem>
          ))
        )}
        {selected ? <Divider /> : null}
        {selected ? (
          <MenuItem onClick={() => pick(null)}>
            <ListItemText secondary="Deselect view (keep current filters)" />
          </MenuItem>
        ) : null}
      </Menu>
    </>
  )
}

/** Inline name editor: Enter or blur saves, Esc cancels (an empty name keeps the old one). */
function RenameField({ initial, onDone }: { initial: string; onDone: (name: string | null) => void }) {
  const [name, setName] = React.useState(initial)
  const done = React.useRef(false)
  const finish = (value: string | null) => {
    if (done.current) return
    done.current = true
    onDone(value?.trim() || null)
  }
  return (
    <TextField
      autoFocus
      size="small"
      value={name}
      onChange={(e) => setName(e.target.value)}
      onFocus={(e) => e.currentTarget.select()}
      onBlur={() => finish(name)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault()
          finish(name)
        } else if (e.key === "Escape") {
          e.preventDefault()
          finish(null)
        }
      }}
      slotProps={{
        htmlInput: { "aria-label": "View name", maxLength: 60 },
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <StackIcon size={16} color={colors.extended.gray["45"]} />
            </InputAdornment>
          ),
        },
      }}
    />
  )
}
