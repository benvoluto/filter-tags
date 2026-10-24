/**
 * "filters": filters only · "quick": + partial (quick) filters · "views": + quick filters and saved
 * views · "prompt": one natural-language field (on-device model) in place of search and Add filter
 *
 * Each is also a URL: /filters, /quick, /views, /prompt (/ shows the default).
 */
export const PROTOTYPE_VARIANTS = ["filters", "quick", "views", "prompt"] as const

export type PrototypeVariant = (typeof PROTOTYPE_VARIANTS)[number]

export const DEFAULT_VARIANT: PrototypeVariant = "filters"

export function isPrototypeVariant(value: string): value is PrototypeVariant {
  return (PROTOTYPE_VARIANTS as readonly string[]).includes(value)
}

/** The variant a path names (/prompt → "prompt"); the default for / or anything else. */
export function variantFromPath(pathname: string): PrototypeVariant {
  const segment = pathname.split("/").filter(Boolean)[0] ?? ""
  return isPrototypeVariant(segment) ? segment : DEFAULT_VARIANT
}
