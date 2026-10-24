"use client"

import * as React from "react"
import { Box, CircularProgress, IconButton, InputAdornment, LinearProgress, Link, Stack, TextField, Tooltip } from "@mui/material"
import { ArrowUpIcon, SparkleIcon } from "@phosphor-icons/react"

import { Text, colors } from "common"
import { type ColumnKey } from "@/lib/data"
import { getModelStatus, loadModel, promptModel, subscribeModelStatus, type ModelStatus } from "@/lib/filter-model"
import { groundModelOutput, parseWithRules, type PromptResult } from "@/lib/prompt-filters"
import { FilterEditor, type FilterDraft } from "./filter-editor"
import { HeaderFilterPopover } from "./filter-popover"

export const PROMPT_PLACEHOLDER = "Describe the runs you want"

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

function useModelStatus() {
  return React.useSyncExternalStore(subscribeModelStatus, getModelStatus, getModelStatus)
}

export type AppliedPrompt = { text: string; result: PromptResult; source: "model" | "rules" }

/**
 * The "prompt" variant's entry point, standing in for the search box and Add filter: one large
 * field that turns a sentence into filter chips. While it's empty, its second line holds
 * underlined links that open the ordinary filter editor for the most-used columns; they go away
 * as soon as the user types.
 *
 * The model starts loading with the page (PrototypeShell). Until it's ready (or if the browser
 * can't run it) prompts go through the rule-based parser, so the box always does something.
 */
export function PromptBox({
  onApply,
  onAddFilter,
}: {
  onApply: (applied: AppliedPrompt) => void
  onAddFilter: (draft: FilterDraft) => void
}) {
  const [text, setText] = React.useState("")
  const [isThinking, setIsThinking] = React.useState(false)
  const [linkFilter, setLinkFilter] = React.useState<{ column: ColumnKey; anchor: Element } | null>(null)
  const status = useModelStatus()
  // The links can wrap on narrow screens; the empty field reserves room for however tall they are.
  const isEmpty = text === ""
  const linksRef = React.useRef<HTMLParagraphElement>(null)
  const [linksHeight, setLinksHeight] = React.useState(20)
  React.useLayoutEffect(() => {
    const el = linksRef.current
    if (!el) return
    const observer = new ResizeObserver(() => setLinksHeight(el.offsetHeight))
    observer.observe(el)
    return () => observer.disconnect()
  }, [isEmpty])

  const submit = async () => {
    const prompt = text.trim()
    if (!prompt || isThinking) return
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

  return (
    <Stack gap={1} sx={{ width: "100%" }}>
      <Box sx={{ position: "relative" }}>
        <TextField
          multiline
          minRows={text ? 2 : 1}
          maxRows={5}
          fullWidth
          value={text}
          placeholder={PROMPT_PLACEHOLDER}
          aria-label="Describe the runs you want"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault()
              void submit()
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
                ...(isEmpty && { paddingBottom: `calc(${PADDING_Y} + ${linksHeight}px) !important` }),
                "& textarea": { resize: "none", lineHeight: LINE_HEIGHT },
              },
            },
          }}
        />
        {/*
          The filter links, drawn in the empty field under the placeholder, in space its bottom
          padding reserves. Only the links take clicks; a click anywhere else lands in the field.
        */}
        {!text && (
          <Text
            ref={linksRef}
            variant="body2"
            color={colors.content.dark}
            component="span"
            sx={{
              position: "absolute",
              left: TEXT_LEFT,
              right: "56px",
              top: `calc(${PADDING_Y} + ${LINE_HEIGHT})`,
              fontSize: FONT_SIZE,
              lineHeight: LINE_HEIGHT,
              pointerEvents: "none",
            }}
          >
            or filter by{" "}
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
                {i < LINK_FILTERS.length - 2 ? ", " : i === LINK_FILTERS.length - 2 ? " or " : ""}
              </React.Fragment>
            ))}
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

      <Stack direction="row" justifyContent="flex-end">
        <ModelStatusLine status={status} />
      </Stack>

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
    </Stack>
  )
}

function ModelStatusLine({ status }: { status: ModelStatus }) {
  const caption = (children: React.ReactNode, color: string = colors.content.dark) => (
    <Text variant="caption" color={color} component="span">
      {children}
    </Text>
  )
  switch (status.state) {
    case "idle":
      return caption("Starting on-device model…")
    case "loading": {
      const pct = Math.round(status.progress * 100)
      const what = status.cached
        ? `Loading on-device model from this browser’s cache… ${pct}%`
        : `Downloading on-device model (about 1 GB, first visit only)… ${pct}%`
      return (
        <Stack gap={0.5} sx={{ minWidth: 220 }}>
          {caption(`${what} · basic parser until then`)}
          <LinearProgress variant="determinate" value={status.progress * 100} sx={{ height: 2 }} />
        </Stack>
      )
    }
    case "ready":
      return caption("On-device model ready · your prompt stays in this browser")
    case "unsupported":
      return caption(`${status.reason} · using the basic parser`)
    case "error":
      return (
        <Stack direction="row" gap={1} alignItems="baseline">
          {caption("Model didn't load · using the basic parser", colors.content.dark)}
          <Link component="button" type="button" variant="caption" onClick={() => void loadModel()}>
            Retry
          </Link>
        </Stack>
      )
  }
}
