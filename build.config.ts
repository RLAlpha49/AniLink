import { defineBuildConfig } from "unbuild";

/**
 * ESM-only build configuration.
 *
 * unbuild bundles `src/AniLink.ts` with Rollup and emits:
 *   - `dist/AniLink.mjs`  (ESM, extension-correct specifiers — source stays extensionless)
 *   - `dist/AniLink.d.ts` (type declarations, external types resolved via @rollup/plugin-typescript)
 *
 * `axios` (the sole runtime dependency) stays external automatically via
 * unbuild's package.json inference; `inlineDependencies: false` keeps it that way.
 * `rollup.emitCJS: false` ensures no CommonJS output is produced.
 */
export default defineBuildConfig({
    entries: ["./src/AniLink"],
    outDir: "dist",
    declaration: "compatible",
    rollup: {
        emitCJS: false,
        inlineDependencies: false,
        esbuild: {
            target: "ES2024",
        },
    },
    failOnWarn: true,
});
