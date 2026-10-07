import { defineBuildConfig } from "unbuild";

/**
 * ESM-only build configuration.
 *
 * unbuild bundles each entry with Rollup and emits:
 *   - `dist/AniLink.mjs`   (root entry: `anilink`)
 *   - `dist/anilist.mjs`   (provider barrel: `anilink/anilist`)
 *   - `dist/mal.mjs`       (provider barrel: `anilink/mal`)
 *   - matching `.d.ts` declaration files, external types resolved via
 *     @rollup/plugin-typescript
 *
 * All three entries share the same module graph, so Rollup deduplicates the
 * shared chunks; the subpath barrels exist so consumers can scope imports
 * to one provider. The `graphql` parser used for retry-safety classification
 * is inlined because it is a development dependency; `axios` stays external
 * through unbuild's package.json inference. `rollup.emitCJS: false` ensures
 * no CommonJS output is produced.
 */
export default defineBuildConfig({
    entries: ["./src/AniLink", "./src/anilist", "./src/mal"],
    outDir: "dist",
    declaration: "compatible",
    rollup: {
        emitCJS: false,
        inlineDependencies: ["graphql"],
        esbuild: {
            target: "ES2024",
        },
    },
    failOnWarn: true,
});
