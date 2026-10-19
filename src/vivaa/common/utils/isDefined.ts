// ───────────────────────────────────────────────────────────────────────────
// Provenance: VivaaHealth/vivaa @ 71d2d18ff25c
// Source:     web/common/src/utils/isDefined.ts
// URL:        https://github.com/VivaaHealth/vivaa/blob/71d2d18ff25c5057ee793fadf066459d23c99bb1/web/common/src/utils/isDefined.ts
// Ref:        main (upstream commit 2026-07-31)
// Fetched:    2026-10-19  (via scripts/sync-from-vivaa.mjs)
// DO NOT EDIT — run `pnpm sync:vivaa` to refresh.
// ───────────────────────────────────────────────────────────────────────────

export function isTruthy<T>(value: T | null | undefined | false): value is T {
  return !!value;
}

export function isDefined<T>(value: T): value is NonNullable<T> {
  return value !== null && value !== undefined;
}
