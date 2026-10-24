"use client"

import * as React from "react"
import { Box, CircularProgress, IconButton, InputAdornment, Link, Stack, TextField, Tooltip } from "@mui/material"
import { ArrowUpIcon, SparkleIcon } from "@phosphor-icons/react"

import { Text, colors } from "common"
import { FILTER_HEIGHT } from "@/vivaa/staff/components/FiltersV2/constants"
import { type ColumnKey } from "@/lib/data"
import { getModelStatus, promptModel, subscribeModelStatus } from "@/lib/filter-model"
import { groundModelOutput, parseWithRules, type PromptResult } from "@/lib/prompt-filters"
import { FilterEditor, type FilterDraft } from "./filter-editor"
import { HeaderFilterPopover } from "./filter-popover"
import type { SavedView } from "@/lib/views"

export const PROMPT_PLACEHOLDER = "Describe the search, filter, and sort you want"

/** The underlined filter links under the prompt: label as read in the sentence → column. */
const LINK_FILTERS: { label: string; column: ColumnKey }[] = [
  { label: "status", column: "status" },
  { label: "customer", column: "customer" },
  { label: "created by", column: "owner" },
  { label: "date started", column: "started" },
]

/** Same 13px the rest of the filter row uses. */
const FONT_SIZE = "0.8125rem"
/** One line of the field. The filter links sit on the second line, so they share this. */
const LINE_HEIGHT = "20px"
/** Vertical padding of a multiline field (the theme sets it, with !important). */
const PADDING_Y = "8.5px"
/** Where the typed text starts: the outlined input's 14px padding + 16px icon + 8px adornment gap. */
const TEXT_LEFT = "38px"
/** A saved view is suggested once the typed text is longer than this and starts its name. */
const VIEW_SUGGEST_MIN_CHARS = 10

/** The saved view whose name the text is the start of (case-insensitive), once it's long enough. */
function suggestedView(text: string, views: SavedView[]): SavedView | null {
  const typed = text.trimStart().toLowerCase()
  if (typed.length <= VIEW_SUGGEST_MIN_CHARS) return null
  return views.find((v) => v.name.toLowerCase().startsWith(typed) && v.name.length >= typed.length) ?? null
}

function useModelStatus() {
  return React.useSyncExternalStore(subscribeModelStatus, getModelStatus, getModelStatus)
}

export type AppliedPrompt = { text: string; result: PromptResult; source: "model" | "rules" }

/**
 * The "prompt" variant's entry point, standing in for the search box and Add filter: one large
 * field that turns a sentence into filter chips and a sort. While it's empty, its second line holds
 * underlined links that open the ordinary filter editor for the most-used columns; they go away
 * as soon as the user types. Typing the start of a saved view's name suggests it; Enter opens it.
 *
 * The model starts loading with the page (PrototypeShell). Until it's ready only the filter links
 * show. If it can't load here (no WebGPU, download failed), the field appears anyway and prompts
 * go through the rule-based parser.
 */
export function PromptBox({
  onApply,
  onAddFilter,
  views,
  onOpenView,
  viewsMenu,
  pristine,
}: {
  onApply: (applied: AppliedPrompt) => void
  onAddFilter: (draft: FilterDraft) => void
  /** Saved views, suggested inline as their names are typed. */
  views: SavedView[]
  onOpenView: (view: SavedView) => void
  /** The inline views pulldown, shown on the field's bottom line. */
  viewsMenu: React.ReactNode
  /** No filters and no selected view: the pulldown follows the filter links instead of leading. */
  pristine: boolean
}) {
  const [text, setText] = React.useState("")
  const [isThinking, setIsThinking] = React.useState(false)
  const [linkFilter, setLinkFilter] = React.useState<{ column: ColumnKey; anchor: Element } | null>(null)
  const status = useModelStatus()
  // While the model loads, only the filter links show; the field appears once it's ready (or once
  // it's clear it can't load here, in which case prompts use the basic parser).
  const isModelLoading = status.state === "idle" || status.state === "loading"
  const suggestion = suggestedView(text, views)
  const isEmpty = text === ""
  // The field's bottom line (views pulldown, filter links) can wrap on narrow screens; the field's
  // bottom padding reserves room for however tall it is.
  const bottomLineRef = React.useRef<HTMLParagraphElement>(null)
  const [bottomLineHeight, setBottomLineHeight] = React.useState(20)
  React.useLayoutEffect(() => {
    const el = bottomLineRef.current
    if (!el) return
    const observer = new ResizeObserver(() => setBottomLineHeight(el.offsetHeight))
    observer.observe(el)
    return () => observer.disconnect()
  }, [isModelLoading])
  // Focus the field when it appears (the model finished loading, or was already loaded).
  const inputRef = React.useRef<HTMLTextAreaElement>(null)
  React.useEffect(() => {
    if (!isModelLoading) inputRef.current?.focus()
  }, [isModelLoading])

  const submit = async () => {
    const prompt = text.trim()
    if (!prompt || isThinking) return
    if (suggestion) {
      // A saved view's name: open the view instead of reading the text as a prompt.
      onOpenView(suggestion)
      setText("")
      return
    }
    setIsThinking(true)
    try {
      let applied: AppliedPrompt
      if (getModelStatus().state === "ready") {
        try {
          applied = { text: prompt, result: groundModelOutput(await promptModel(prompt)), source: "model" }
        } catch {
          const result = parseWithRules(prompt)
          applied = { text: prompt, result: { ...result, notes: ["The model failed on this one; used the basic parser", ...result.notes] }, source: "rules" }
        }
      } else {
        applied = { text: prompt, result: parseWithRules(prompt), source: "rules" }
      }
      onApply(applied)
      setText("")
    } finally {
      setIsThinking(false)
    }
  }

  /** "<lead> status, customer, created by, or date started", each an underlined link. */
  const filterLinks = (lead: string) => (
    <>
      {lead}{" "}
      {LINK_FILTERS.map((f, i) => (
        <React.Fragment key={f.column}>
          <Link
            component="button"
            type="button"
            underline="always"
            onClick={(e) => setLinkFilter({ column: f.column, anchor: e.currentTarget })}
            sx={{ fontSize: "inherit", lineHeight: "inherit", verticalAlign: "baseline", pointerEvents: "auto" }}
          >
            {f.label}
          </Link>
          {i < LINK_FILTERS.length - 2 ? ", " : i === LINK_FILTERS.length - 2 ? ", or " : ""}
        </React.Fragment>
      ))}
    </>
  )

  const linkFilterPopover = (
    <HeaderFilterPopover anchorElement={linkFilter?.anchor ?? null} onClose={() => setLinkFilter(null)}>
      {linkFilter && (
        <FilterEditor
          key={linkFilter.column}
          column={linkFilter.column}
          onCancel={() => setLinkFilter(null)}
          onSubmit={(draft) => {
            onAddFilter(draft)
            setLinkFilter(null)
          }}
        />
      )}
    </HeaderFilterPopover>
  )

  const gap = <Box component="span" sx={{ display: "inline-block", width: 12 }} />

  if (isModelLoading) {
    return (
      <Stack direction="row" alignItems="center" sx={{ minHeight: FILTER_HEIGHT }}>
        <Text variant="body2" color={colors.content.dark} component="span" sx={{ fontSize: FONT_SIZE, lineHeight: LINE_HEIGHT }}>
          {filterLinks("Filter by")}
          {gap}
          {viewsMenu}
        </Text>
        {linkFilterPopover}
      </Stack>
    )
  }

  return (
    <Stack gap={1} sx={{ width: "100%" }}>
      <Box sx={{ position: "relative" }}>
        <TextField
          multiline
          minRows={1}
          inputRef={inputRef}
          maxRows={5}
          fullWidth
          value={text}
          placeholder={PROMPT_PLACEHOLDER}
          aria-label={PROMPT_PLACEHOLDER}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault()
              void submit()
            }
            // Tab completes the suggested name in the field (Enter then opens it).
            if (e.key === "Tab" && !e.shiftKey && suggestion && text.trimStart().length < suggestion.name.length) {
              e.preventDefault()
              setText(suggestion.name)
            }
            if (e.key === "Escape" && text) setText("")
          }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start" sx={{ alignSelf: "flex-start", marginTop: 0 }}>
                  <SparkleIcon size={16} color={colors.extended.gray["45"]} />
                </InputAdornment>
              ),
              sx: {
                fontSize: FONT_SIZE,
                lineHeight: LINE_HEIGHT,
                borderRadius: 2,
                alignItems: "flex-start",
                paddingRight: "52px !important",
                paddingBottom: `calc(${PADDING_Y} + ${bottomLineHeight}px) !important`,
                "& textarea": { resize: "none", lineHeight: LINE_HEIGHT },
              },
            },
          }}
        />
        {/*
          The field's bottom line, in space its bottom padding reserves. Empty with no filters or
          view: "or filter by …" then the views pulldown. Otherwise the pulldown leads, at the left
          edge, followed by the filter links while the field is empty. Only the links and the
          pulldown take clicks; a click anywhere else lands in the field.
        */}
        <Text
          ref={bottomLineRef}
          variant="body2"
          color={colors.content.dark}
          component="span"
          sx={{
            position: "absolute",
            left: TEXT_LEFT,
            right: "56px",
            bottom: PADDING_Y,
            fontSize: FONT_SIZE,
            lineHeight: LINE_HEIGHT,
            pointerEvents: "none",
          }}
        >
          {pristine && isEmpty ? (
            <>
              {filterLinks("or filter by")}
              {gap}
              {viewsMenu}
            </>
          ) : (
            <>
              {viewsMenu}
              {isEmpty && (
                <>
                  {gap}
                  {filterLinks("or filter by")}
                </>
              )}
            </>
          )}
        </Text>
        {/*
          A matching saved view: the rest of its name in grey after what's typed (the typed part
          is drawn invisibly so the grey text lines up with the cursor), and what Enter will do.
        */}
        {suggestion && (
          <Text
            variant="body2"
            component="span"
            aria-live="polite"
            sx={{
              position: "absolute",
              left: TEXT_LEFT,
              right: "56px",
              top: PADDING_Y,
              fontSize: FONT_SIZE,
              lineHeight: LINE_HEIGHT,
              whiteSpace: "pre-wrap",
              pointerEvents: "none",
            }}
          >
            <Box component="span" sx={{ visibility: "hidden" }}>
              {text}
            </Box>
            <Box component="span" sx={{ color: colors.content.disabled }}>
              {suggestion.name.slice(text.trimStart().length)}
            </Box>
            <Box
              component="span"
              sx={{
                marginLeft: 1,
                paddingX: 0.75,
                borderRadius: 0.5,
                fontSize: "0.75rem",
                color: colors.content.dark,
                backgroundColor: colors.background.default,
                border: `1px solid ${colors.border.light}`,
              }}
            >
              ↵ open saved view
            </Box>
          </Text>
        )}
        {/* Apply, pinned to the bottom-right corner of the field. */}
        <Box sx={{ position: "absolute", right: "10px", bottom: "8px", display: "flex" }}>
          {isThinking ? (
            <CircularProgress size={20} aria-label="Reading your request" />
          ) : (
            <Tooltip title="Apply (Enter)">
              <span>
                <IconButton
                  size="small"
                  color="primary"
                  aria-label="Apply"
                  disabled={!text.trim()}
                  onClick={() => void submit()}
                  sx={{ border: `1px solid ${colors.border.light}` }}
                >
                  <ArrowUpIcon size={14} />
                </IconButton>
              </span>
            </Tooltip>
          )}
        </Box>
      </Box>
      {linkFilterPopover}
    </Stack>
  )
}
