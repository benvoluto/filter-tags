import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    // Files synced from vivaa (src/vivaa/**) import siblings as `./x.js`, TypeScript's ESM
    // convention, which the staff app's Vite build resolves to `./x.ts`. Webpack does the same via
    // extensionAlias; Turbopack has no equivalent, so dev and build run with `--webpack`. This keeps
    // the synced files byte-identical to upstream.
    extensionAlias: { ".js": [".ts", ".tsx", ".js"] },
  },
}

export default nextConfig
