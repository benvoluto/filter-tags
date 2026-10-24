"use client"

import * as React from "react"
import { Box, Button, CircularProgress, IconButton, InputAdornment, LinearProgress, Link, Stack, TextField, Tooltip } from "@mui/material"
import { ArrowUpIcon, SparkleIcon } from "@phosphor-icons/react"

import { Text, colors } from "common"
import { type ColumnKey } from "@/lib/data"
import { getModelStatus, loadModel, promptModel, subscribeModelStatus, type ModelStatus } from "@/lib/filter-model"
import { describeResult, groundModelOutput, parseWithRules, type PromptResult } from "@/lib/prompt-filters"
import { FilterEditor, type FilterDraft } from "./filter-editor"
import { HeaderFilterPopover } from "./filter-popover"

export const PROMPT_PLACEHOLDER = "Describe the runs you want, e.g. failed Epic runs from the last 3 days with more than 2 errors, longest first"

/** The underlined filter links under the prompt: label as read in the sentence → column. */
const LINK_FILTERS: { label: string; column: ColumnKey }[] = [
  { label: "status", column: "status" },
  { label: "customer", column: "customer" },
  { label: "created by", column: "owner" },
  { label: "date started", column: "started" },
]

/** Same 13px the rest of the filter row uses. */
const FONT_SIZE = "0.8125rem"

function useModelStatus() {
  return React.useSyncExternalStore(subscribeModelStatus, getModelStatus, getModelStatus)
}

export type AppliedPrompt = { text: string; result: PromptResult; source: "model" | "rules" }

/**
 * The "prompt" variant's entry point, standing in for the search box and Add filter: one large
 * field that turns a sentence into filter chips, plus underlined links that open the ordinary
 * filter editor for the most-used columns.
 *
 * The model loads on first focus. Until it's ready (or if the browser can't run it) prompts go
 * through the rule-based parser, so the box always does something.
 */
export function PromptBox({
  onApply,
  onAddFilter,
  lastApplied,
  onUndo,
}: {
  onApply: (applied: AppliedPrompt) => void
  onAddFilter: (draft: FilterDraft) => void
  lastApplied: AppliedPrompt | null
  onUndo: (() => void) | null
}) {
  const [text, setText] = React.useState("")
  const [isThinking, setIsThinking] = React.useState(false)
  const [linkFilter, setLinkFilter] = React.useState<{ column: ColumnKey; anchor: Element } | null>(null)
  const status = useModelStatus()

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
      <TextField
        multiline
        minRows={2}
        maxRows={5}
        fullWidth
        value={text}
        placeholder={PROMPT_PLACEHOLDER}
        aria-label="Describe the runs you want"
        onFocus={() => void loadModel()}
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
              <InputAdornment position="start" sx={{ alignSelf: "flex-start", marginTop: "10px" }}>
                <SparkleIcon size={16} color={colors.extended.gray["45"]} />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end" sx={{ alignSelf: "flex-end", marginBottom: "14px" }}>
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
              </InputAdornment>
            ),
            sx: { fontSize: FONT_SIZE, borderRadius: 2, alignItems: "flex-start", paddingY: 1.25, "& textarea": { resize: "none" } },
          },
        }}
      />

      <Stack direction="row" justifyContent="space-between" alignItems="baseline" flexWrap="wrap" columnGap={2} rowGap={0.5}>
        <Text variant="body2" color={colors.content.dark} component="span" sx={{ fontSize: FONT_SIZE }}>
          Or filter by{" "}
          {LINK_FILTERS.map((f, i) => (
            <React.Fragment key={f.column}>
              <Link
                component="button"
                type="button"
                underline="always"
                onClick={(e) => setLinkFilter({ column: f.column, anchor: e.currentTarget })}
                sx={{ fontSize: "inherit", verticalAlign: "baseline" }}
              >
                {f.label}
              </Link>
              {i < LINK_FILTERS.length - 2 ? ", " : i === LINK_FILTERS.length - 2 ? " or " : ""}
            </React.Fragment>
          ))}
        </Text>
        <ModelStatusLine status={status} />
      </Stack>

      {lastApplied && <AppliedLine applied={lastApplied} onUndo={onUndo} />}

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
      return caption("On-device model loads when you click in the box (about 1 GB, first time only)")
    case "loading":
      return (
        <Stack gap={0.5} sx={{ minWidth: 220 }}>
          {caption(`Loading on-device model… ${Math.round(status.progress * 100)}% · basic parser until then`)}
          <LinearProgress variant="determinate" value={status.progress * 100} sx={{ height: 2 }} />
        </Stack>
      )
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

/** What the last prompt became, so a wrong reading is visible and one click from undone. */
function AppliedLine({ applied, onUndo }: { applied: AppliedPrompt; onUndo: (() => void) | null }) {
  const reading = describeResult(applied.result)
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "baseline",
        flexWrap: "wrap",
        columnGap: 1,
        rowGap: 0.25,
        paddingX: 1.5,
        paddingY: 0.75,
        borderRadius: 1,
        backgroundColor: colors.background.default,
      }}
    >
      <Text variant="caption" color={colors.content.dark}>
        “{applied.text}” →
      </Text>
      <Text variant="caption" bold>
        {reading || "no filters"}
      </Text>
      {applied.source === "rules" && (
        <Text variant="caption" color={colors.content.dark}>
          (basic parser)
        </Text>
      )}
      {applied.result.notes.map((n) => (
        <Text key={n} variant="caption" color={colors.warning.dark}>
          {n}
        </Text>
      ))}
      {onUndo && (
        <Button variant="text" size="small" onClick={onUndo} sx={{ marginLeft: "auto", minWidth: 0, paddingY: 0 }}>
          Undo
        </Button>
      )}
    </Box>
  )
}
