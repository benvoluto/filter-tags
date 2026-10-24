import type { WebWorkerMLCEngine } from "@mlc-ai/web-llm"

import { FEW_SHOT, MODEL_SCHEMA, buildSystemPrompt, type ModelOutput } from "./prompt-filters"

/*
 * The on-device model: Qwen2.5 1.5B Instruct through WebLLM (WebGPU), in a web worker. It starts
 * loading with the page. About 1 GB is downloaded on the first visit and kept in the browser's
 * Cache Storage (WebLLM's default), so later visits load from disk. One engine per page, shared by
 * every component, so switching prototype variants doesn't reload it.
 */

const MODEL_F16 = "Qwen2.5-1.5B-Instruct-q4f16_1-MLC"
/** For GPUs without 16-bit float shaders. */
const MODEL_F32 = "Qwen2.5-1.5B-Instruct-q4f32_1-MLC"

export type ModelStatus =
  | { state: "idle" }
  | { state: "unsupported"; reason: string }
  /** `cached`: the weights are already on this device, so this is a load from disk, not a download. */
  | { state: "loading"; progress: number; text: string; cached: boolean }
  | { state: "ready"; modelId: string }
  | { state: "error"; message: string }

let status: ModelStatus = { state: "idle" }
let engine: Promise<WebWorkerMLCEngine | null> | null = null
const listeners = new Set<(s: ModelStatus) => void>()

function setStatus(next: ModelStatus) {
  status = next
  listeners.forEach((l) => l(next))
}

export function getModelStatus() {
  return status
}

export function subscribeModelStatus(listener: (s: ModelStatus) => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

type GpuNavigator = Navigator & {
  gpu?: { requestAdapter: () => Promise<{ features: { has: (f: string) => boolean } } | null> }
}

/** Starts the download/compile (idempotent). Resolves to null when this browser can't run it. */
export function loadModel(): Promise<WebWorkerMLCEngine | null> {
  if (engine) return engine
  if (status.state === "unsupported") return Promise.resolve(null)
  const start = async () => {
    const gpu = (navigator as GpuNavigator).gpu
    if (!gpu) throw new UnsupportedError("This browser has no WebGPU")
    const adapter = await gpu.requestAdapter()
    if (!adapter) throw new UnsupportedError("No WebGPU adapter (GPU blocked or unavailable)")
    const modelId = adapter.features.has("shader-f16") ? MODEL_F16 : MODEL_F32
    const { CreateWebWorkerMLCEngine, hasModelInCache } = await import("@mlc-ai/web-llm")
    const cached = await hasModelInCache(modelId).catch(() => false)
    setStatus({ state: "loading", progress: 0, text: "Starting…", cached })
    // Ask the browser not to evict a 1 GB cache under storage pressure (it may say no).
    if (!cached) void navigator.storage?.persist?.().catch(() => false)
    const worker = new Worker(new URL("./llm.worker.ts", import.meta.url), { type: "module" })
    const created = await CreateWebWorkerMLCEngine(worker, modelId, {
      initProgressCallback: (r) => setStatus({ state: "loading", progress: r.progress, text: r.text, cached }),
    })
    setStatus({ state: "ready", modelId })
    return created
  }
  engine = start().catch((e: unknown) => {
    if (e instanceof UnsupportedError) {
      setStatus({ state: "unsupported", reason: e.message })
    } else {
      // A failed download can be retried on the next load.
      engine = null
      setStatus({ state: "error", message: e instanceof Error ? e.message : String(e) })
    }
    return null
  })
  return engine
}

class UnsupportedError extends Error {}

/** Sentence → constrained JSON. Throws if the model isn't ready. */
export async function promptModel(text: string): Promise<ModelOutput> {
  const llm = status.state === "ready" ? await engine : null
  if (!llm) throw new Error("Model not ready")
  const reply = await llm.chat.completions.create({
    messages: [
      { role: "system", content: buildSystemPrompt() },
      ...FEW_SHOT.flatMap((ex) => [
        { role: "user" as const, content: ex.user },
        { role: "assistant" as const, content: JSON.stringify(ex.output) },
      ]),
      { role: "user", content: text },
    ],
    temperature: 0,
    max_tokens: 400,
    response_format: { type: "json_object", schema: MODEL_SCHEMA },
  })
  // The chat history isn't reused: each prompt stands alone.
  await llm.resetChat()
  return JSON.parse(reply.choices[0]?.message.content ?? "{}") as ModelOutput
}

/** Naming examples: filter summary → a short title. */
const NAME_EXAMPLES: [string, string][] = [
  ["Status is any of Failed, Cancelled · EHR is Epic · sorted by Errors descending", "Failed Epic runs"],
  ["Owner is Priya Shah · Started on or after Oct 11, 2026", "Priya's recent runs"],
  ["Duration greater than 10m 00s · Customer is Riverbend Health", "Slow Riverbend runs"],
]

/**
 * A very short name (2–4 words) for a saved view, from a summary of its filters and sort. Null
 * when the model isn't ready or returns nothing usable; callers fall back to a rule-made name.
 */
export async function suggestViewName(summary: string): Promise<string | null> {
  const llm = status.state === "ready" ? await engine : null
  if (!llm) return null
  try {
    const reply = await llm.chat.completions.create({
      messages: [
        { role: "system", content: "You name saved views of a table of workflow runs. Reply with only a 2 to 4 word title. No quotes, no punctuation at the end." },
        ...NAME_EXAMPLES.flatMap(([user, name]) => [
          { role: "user" as const, content: user },
          { role: "assistant" as const, content: name },
        ]),
        { role: "user", content: summary },
      ],
      temperature: 0,
      max_tokens: 12,
    })
    await llm.resetChat()
    const name = (reply.choices[0]?.message.content ?? "")
      .split("\n")[0]
      .replace(/["“”.:]/g, "")
      .trim()
      .split(/\s+/)
      .slice(0, 4)
      .join(" ")
    return name.length >= 3 ? name : null
  } catch {
    return null
  }
}
