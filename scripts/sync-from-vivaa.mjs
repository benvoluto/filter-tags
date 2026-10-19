#!/usr/bin/env node
// Sync files from VivaaHealth/vivaa into this prototype, with a provenance header prepended to each
// text file so the reader always knows the source path, commit SHA and fetch date. Adapted from
// flow-studio-lite's scripts/sync-from-monorepo.mjs; the differences are that destinations keep
// upstream's directory layout under src/vivaa/ (so relative imports resolve unchanged) and that a
// manifest entry may be `"binary": true` (font files), which is copied byte-for-byte with no header.
//
// Requires: gh CLI, authenticated with access to VivaaHealth/vivaa.
// Usage:
//   pnpm sync:vivaa          # sync every manifest entry
//   pnpm sync:vivaa <path>   # sync entries whose destPath contains <path>

import { execFileSync } from "node:child_process"
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, extname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const REPO = "VivaaHealth/vivaa"
const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, "..")
const MANIFEST_PATH = resolve(HERE, "sync-manifest.json")

function gh(args, { binary = false } = {}) {
  return execFileSync("gh", args, { encoding: binary ? "buffer" : "utf8", maxBuffer: 32 * 1024 * 1024 })
}

function fetchLatestCommit(sourcePath, ref) {
  const raw = gh(["api", `repos/${REPO}/commits?path=${encodeURIComponent(sourcePath)}&sha=${encodeURIComponent(ref)}&per_page=1`])
  const commits = JSON.parse(raw)
  if (!Array.isArray(commits) || commits.length === 0) throw new Error(`No commits found for ${sourcePath}@${ref}`)
  const c = commits[0]
  return { sha: c.sha, shortSha: c.sha.slice(0, 12), date: (c.commit?.author?.date ?? c.commit?.committer?.date ?? "").slice(0, 10) }
}

function fetchFileContent(sourcePath, sha, binary) {
  return gh(["api", "-H", "Accept: application/vnd.github.raw", `repos/${REPO}/contents/${sourcePath}?ref=${sha}`], { binary })
}

const COMMENT_STYLES = {
  ".ts": { open: "//", close: "" },
  ".tsx": { open: "//", close: "" },
  ".css": { open: "/*", close: " */" },
}

function buildHeader(ext, entry, meta, fetchedDate) {
  const style = COMMENT_STYLES[ext]
  if (!style) return ""
  const lines = [
    `Provenance: ${REPO} @ ${meta.shortSha}`,
    `Source:     ${entry.sourcePath}`,
    `URL:        https://github.com/${REPO}/blob/${meta.sha}/${entry.sourcePath}`,
    `Ref:        ${entry.ref ?? "main"} (upstream commit ${meta.date || "unknown"})`,
    `Fetched:    ${fetchedDate}  (via scripts/sync-from-vivaa.mjs)`,
  ]
  if (entry.rewrite) lines.push(`Rewrites:   ${Object.entries(entry.rewrite).map(([a, b]) => `'${a}' → '${b}'`).join(", ")}`)
  if (entry.note) lines.push(`Note:       ${entry.note}`)
  lines.push("DO NOT EDIT — run `pnpm sync:vivaa` to refresh.")
  if (style.close) return `${style.open}\n${lines.map((l) => ` * ${l}`).join("\n")}\n${style.close.trimStart()}\n\n`
  const rule = `${style.open} ${"─".repeat(75)}`
  return `${rule}\n${lines.map((l) => `${style.open} ${l}`).join("\n")}\n${rule}\n\n`
}

// Whole-specifier rewrites only (the specifier is a literal in the source).
function rewriteImports(content, rewrite) {
  if (!rewrite) return content
  let out = content
  for (const [from, to] of Object.entries(rewrite)) {
    const literal = from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    const before = out
    out = out.replace(new RegExp(`(['"\`])${literal}\\1`, "g"), `$1${to}$1`)
    if (out === before) console.warn(`  ! rewrite "${from}" matched nothing — stale manifest entry?`)
  }
  return out
}

function preservedFetchedDate(outPath, sha) {
  try {
    const existing = readFileSync(outPath, "utf8")
    const shaMatch = existing.match(/Provenance:.*@ ([0-9a-f]{7,40})/i)
    if (!shaMatch || !sha.startsWith(shaMatch[1])) return null
    return existing.match(/Fetched:\s+(\d{4}-\d{2}-\d{2})/)?.[1] ?? null
  } catch {
    return null
  }
}

function main() {
  const filter = process.argv[2] ?? null
  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"))
  const today = new Date().toISOString().slice(0, 10)
  const entries = filter ? manifest.filter((e) => e.destPath.includes(filter)) : manifest
  if (entries.length === 0) {
    console.error(filter ? `No manifest entries match "${filter}"` : "Manifest is empty.")
    process.exit(1)
  }

  let failed = 0
  for (const entry of entries) {
    const { sourcePath, destPath, ref = "main", binary = false } = entry
    try {
      process.stdout.write(`→ ${sourcePath}\n`)
      const meta = fetchLatestCommit(sourcePath, ref)
      const outPath = resolve(ROOT, destPath)
      mkdirSync(dirname(outPath), { recursive: true })
      if (binary) {
        writeFileSync(outPath, fetchFileContent(sourcePath, meta.sha, true))
      } else {
        const content = rewriteImports(fetchFileContent(sourcePath, meta.sha, false), entry.rewrite)
        const header = buildHeader(extname(destPath).toLowerCase(), entry, meta, preservedFetchedDate(outPath, meta.sha) ?? today)
        writeFileSync(outPath, header + content)
      }
      process.stdout.write(`  ${destPath}  (${meta.shortSha}, ${meta.date})\n`)
    } catch (err) {
      failed++
      process.stderr.write(`  ✗ failed: ${err.message}\n`)
    }
  }
  if (failed > 0) {
    console.error(`\n${failed} entr${failed === 1 ? "y" : "ies"} failed.`)
    process.exit(1)
  }
  console.log(`\nSynced ${entries.length} file${entries.length === 1 ? "" : "s"} from ${REPO}.`)
}

main()
