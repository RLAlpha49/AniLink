import { defineBuildConfig } from "unbuild";

/**
 * ESM-only build configuration.
 *
 * unbuild bundles each entry with Rollup and emits:
 *   - `dist/AniLink.mjs`   (root entry: `anilink`)
 *   - `dist/anilist.mjs`   (provider barrel: `anilink/anilist`)
 *   - matching `.d.ts` declaration files, external types resolved via
 *     @rollup/plugin-typescript
 *
 * Both entries share the same module graph, so Rollup deduplicates the shared
 * chunks; the subpath barrel exists so consumers can scope imports to one
 * provider. `axios` (the sole runtime dependency) stays external
 * automatically via unbuild's package.json inference; `inlineDependencies:
 * false` keeps it that way. `rollup.emitCJS: false` ensures no CommonJS
 * output is produced.
 */
export default defineBuildConfig({
    entries: ["./src/AniLink", "./src/anilist", "./src/mal"],
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
