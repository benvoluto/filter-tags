"use client"

import * as React from "react"
import Badge from "@mui/material/Badge"
import Button from "@mui/material/Button"
import ButtonGroup from "@mui/material/ButtonGroup"
import Divider from "@mui/material/Divider"
import InputAdornment from "@mui/material/InputAdornment"
import ListItemIcon from "@mui/material/ListItemIcon"
import ListItemText from "@mui/material/ListItemText"
import ListSubheader from "@mui/material/ListSubheader"
import Menu from "@mui/material/Menu"
import MenuItem from "@mui/material/MenuItem"
import TextField from "@mui/material/TextField"
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown"
import CheckIcon from "@mui/icons-material/Check"
import EditOutlinedIcon from "@mui/icons-material/EditOutlined"
import LayersOutlinedIcon from "@mui/icons-material/LayersOutlined"

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
      <ButtonGroup ref={setGroup} variant="outlined" aria-label="Saved views">
        <Button
          startIcon={<LayersOutlinedIcon />}
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
            <EditOutlinedIcon fontSize="inherit" />
          </Button>
        ) : null}
        <Button aria-label="Choose a view" aria-haspopup="menu" onClick={() => setOpen(true)}>
          <ArrowDropDownIcon fontSize="small" />
        </Button>
      </ButtonGroup>

      <Menu anchorEl={group} open={open} onClose={() => setOpen(false)}>
        <ListSubheader>Saved views</ListSubheader>
        {views.length === 0 ? (
          <MenuItem disabled>
            <ListItemText primary="No saved views yet" secondary="Add filters, then choose Save view." />
          </MenuItem>
        ) : (
          views.map((v) => (
            <MenuItem key={v.id} selected={v.id === selectedId} onClick={() => pick(v)}>
              <ListItemIcon>{v.id === selectedId ? <CheckIcon /> : null}</ListItemIcon>
              <ListItemText
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
              <LayersOutlinedIcon />
            </InputAdornment>
          ),
        },
      }}
    />
  )
}
