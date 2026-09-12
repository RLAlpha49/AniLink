import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ANILIST_OPERATION_REGISTRY } from "../src/apis/graphql/anilist/registry";
import { FACADE_OPERATION_DOCS } from "../scripts/generate-facade-groups.config";
import {
    collectRegistryEntries,
    generateFacadeGroupFiles,
} from "../scripts/generate-facade-groups";

/**
 * Codegen tests for the generated AniList facade group files.
 *
 * `scripts/generate-facade-groups.ts` derives `query-group.ts` and
 * `mutation-group.ts` from the operation registry, the operation classes, and
 * the curated prose config. These tests pin the two invariants the generator
 * promises: the config covers exactly the registry operations, and the
 * on-disk files match what the generator would emit (the same comparison
 * `npm run facade:generate -- --check` performs in CI).
 */

describe("facade group generation", () => {
    test("curated prose config covers exactly the registry operations", () => {
        const registryKeys = new Set(
            ANILIST_OPERATION_REGISTRY.query
                .map((entry) => `query:${entry.name}`)
                .concat(ANILIST_OPERATION_REGISTRY.page.map((entry) => `page:${entry.name}`))
                .concat(
                    ANILIST_OPERATION_REGISTRY.mutation.map((entry) => `mutation:${entry.name}`)
                )
        );
        const configKeys = new Set(Object.keys(FACADE_OPERATION_DOCS));

        expect([...registryKeys].filter((key) => !configKeys.has(key))).toEqual([]);
        expect([...configKeys].filter((key) => !registryKeys.has(key))).toEqual([]);
    });

    test("generated output matches the on-disk group files", async () => {
        const generated = await generateFacadeGroupFiles();

        expect(generated.size).toBe(2);
        for (const [path, content] of generated) {
            const onDisk = readFileSync(join(process.cwd(), path), "utf8").replace(/\r\n/g, "\n");
            expect(onDisk, `${path} is stale; run 'npm run facade:generate'`).toBe(content);
        }
    });

    test("generated query group carries the parity asserts and the nested page section", async () => {
        const generated = await generateFacadeGroupFiles();
        const queryGroup = generated.get("src/apis/graphql/anilist/facade/query-group.ts") ?? "";

        for (const constant of [
            "_assertQueryParity",
            "_assertQueryParityReverse",
            "_assertPageParity",
            "_assertPageParityReverse",
        ]) {
            expect(queryGroup).toContain(`const ${constant}`);
        }
        expect(queryGroup).toContain("        page: {");
        expect(queryGroup).toContain("export type AniListQueries = {");
    });

    test("collectRegistryEntries mirrors the runtime registry shape", () => {
        const entries = collectRegistryEntries();
        const byCategory = entries.reduce<Record<string, number>>((acc, entry) => {
            acc[entry.category] = (acc[entry.category] ?? 0) + 1;
            return acc;
        }, {});

        expect(byCategory).toEqual({
            query: ANILIST_OPERATION_REGISTRY.query.length,
            page: ANILIST_OPERATION_REGISTRY.page.length,
            mutation: ANILIST_OPERATION_REGISTRY.mutation.length,
        });
    });
});
