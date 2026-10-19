import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Code synced or adapted from VivaaHealth/vivaa. It is linted upstream under vivaa's own config;
    // editing it here to satisfy this repo's rules would break the byte-for-byte sync.
    "src/vivaa/**",
  ]),
]);

export default eslintConfig;
