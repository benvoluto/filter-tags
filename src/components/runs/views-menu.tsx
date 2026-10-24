"use client"

import * as React from "react"
import {
  Badge,
  Box,
  Button,
  ButtonGroup,
  Divider,
  InputAdornment,
  InputBase,
  Link,
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

      <ViewsMenuList
        anchorEl={group}
        open={open}
        onClose={() => setOpen(false)}
        views={views}
        selectedId={selectedId}
        onPick={pick}
      />
    </>
  )
}

/** The list of saved views, shared by both triggers. `onRename` adds a "Rename view" item. */
function ViewsMenuList({
  anchorEl,
  open,
  onClose,
  views,
  selectedId,
  onPick,
  onRename,
}: {
  anchorEl: Element | null
  open: boolean
  onClose: () => void
  views: SavedView[]
  selectedId: string | null
  onPick: (view: SavedView | null) => void
  onRename?: () => void
}) {
  const selected = views.find((v) => v.id === selectedId) ?? null
  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      slotProps={{ paper: { sx: { maxWidth: 360 } }, list: { sx: { "& .MuiMenuItem-root": { whiteSpace: "normal", alignItems: "flex-start" } } } }}
    >
      <ListSubheader>Saved views</ListSubheader>
      {views.length === 0 ? (
        <MenuItem disabled>
          <ListItemText primary="No saved views yet" secondary="Add filters, then choose Save view." />
        </MenuItem>
      ) : (
        views.map((v) => (
          <MenuItem key={v.id} selected={v.id === selectedId} onClick={() => onPick(v)}>
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
      {selected && onRename ? (
        <MenuItem onClick={onRename}>
          <ListItemText secondary="Rename view" />
        </MenuItem>
      ) : null}
      {selected ? (
        <MenuItem onClick={() => onPick(null)}>
          <ListItemText secondary="Deselect view (keep current filters)" />
        </MenuItem>
      ) : null}
    </Menu>
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

/**
 * The views pulldown as inline text, for inside the prompt field: [stack icon] name (edited dot) ▾,
 * no border, at the surrounding text's size. "Rename view" is in its menu, and renaming swaps the
 * trigger for an inline text field.
 */
export function InlineViewsMenu({
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
  const [anchor, setAnchor] = React.useState<HTMLElement | null>(null)
  const [open, setOpen] = React.useState(false)
  const [renaming, setRenaming] = React.useState(false)

  if (selected && renaming) {
    return (
      <InlineRename
        initial={selected.name}
        onDone={(name) => {
          if (name) onRename(selected.id, name)
          setRenaming(false)
        }}
      />
    )
  }

  return (
    <>
      <Link
        ref={setAnchor}
        component="button"
        type="button"
        underline="none"
        aria-haspopup="menu"
        aria-label={selected ? `View: ${selected.name}${edited ? " (edited)" : ""}` : "Views"}
        onClick={() => setOpen(true)}
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: 0.5,
          fontSize: "inherit",
          lineHeight: "inherit",
          verticalAlign: "bottom",
          pointerEvents: "auto",
          maxWidth: "100%",
        }}
      >
        <StackIcon size={14} style={{ flexShrink: 0 }} />
        <Box component="span" sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {selected ? selected.name : "Views"}
        </Box>
        {selected && edited ? (
          <Box
            component="span"
            title="Edited since saved"
            sx={{ width: 6, height: 6, borderRadius: "50%", flexShrink: 0, backgroundColor: colors.warning.default }}
          />
        ) : null}
        <CaretDownIcon size={12} style={{ flexShrink: 0 }} />
      </Link>
      <ViewsMenuList
        anchorEl={anchor}
        open={open}
        onClose={() => setOpen(false)}
        views={views}
        selectedId={selectedId}
        onPick={(view) => {
          setOpen(false)
          onSelect(view)
        }}
        onRename={() => {
          setOpen(false)
          setRenaming(true)
        }}
      />
    </>
  )
}

/** Inline-size rename field (the prompt field's 20px line): Enter or blur saves, Esc cancels. */
function InlineRename({ initial, onDone }: { initial: string; onDone: (name: string | null) => void }) {
  const [name, setName] = React.useState(initial)
  const done = React.useRef(false)
  const finish = (value: string | null) => {
    if (done.current) return
    done.current = true
    onDone(value?.trim() || null)
  }
  return (
    <InputBase
      autoFocus
      value={name}
      onChange={(e) => setName(e.target.value)}
      onFocus={(e) => e.currentTarget.select()}
      onBlur={() => finish(name)}
      onKeyDown={(e) => {
        e.stopPropagation()
        if (e.key === "Enter") {
          e.preventDefault()
          finish(name)
        } else if (e.key === "Escape") {
          e.preventDefault()
          finish(null)
        }
      }}
      inputProps={{ "aria-label": "View name", maxLength: 60 }}
      sx={{
        pointerEvents: "auto",
        fontSize: "inherit",
        lineHeight: "inherit",
        height: 20,
        width: 200,
        paddingX: 0.5,
        borderBottom: `1px solid ${colors.border.dark}`,
        "& input": { padding: 0, height: 20 },
      }}
    />
  )
}
