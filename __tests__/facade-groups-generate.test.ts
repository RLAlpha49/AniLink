import { describe, expect, test } from "vitest";
import { readFileSync, writeFileSync } from "node:fs";
import { execFile } from "node:child_process";
import { join } from "node:path";
import { ANILIST_OPERATION_REGISTRY } from "../src/apis/graphql/anilist/registry";
import { FACADE_OPERATION_DOCS } from "../scripts/generate-facade-groups.config";
import {
    collectRegistryEntries,
    generateFacadeGroupFiles,
    parseRegistrySource,
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

    test("generated narrowing unions carry the class-side always-keys", async () => {
        // The always-keys are parsed from each operation class's
        // composeDocument argument — the single source of truth — so the
        // generated unions must carry exactly those keys: the entity
        // constants, the shared page constant, and nothing for an
        // always-key-less query.
        const generated = await generateFacadeGroupFiles();
        const queryGroup = generated.get("src/apis/graphql/anilist/facade/query-group.ts") ?? "";
        expect(queryGroup).toContain('DeepPick<MediaResponse, K | "id" | "idMal">');
        expect(queryGroup).toContain('DeepPick<MediaListCollectionResponse, K | "hasNextChunk">');
        expect(queryGroup).toContain('DeepPick<UsersPageResponse, K | "pageInfo">');
        expect(queryGroup).toContain("DeepPick<MediaTrendResponse, K>");
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

    test("every parsed registry entry resolves a runtime registry entry", () => {
        // loadMethodInfo resolves each parsed entry in the imported runtime
        // registry; a miss means the parsed registry source and the runtime
        // registry have drifted. This test pins that lookup contract for the
        // real registry: every parsed entry resolves.
        const entries = collectRegistryEntries();
        for (const entry of entries) {
            const resolved = ANILIST_OPERATION_REGISTRY[entry.category].find(
                (candidate) => candidate.name === entry.name
            );
            expect(
                resolved,
                `${entry.category}:${entry.name} must resolve in the runtime registry`
            ).toBeDefined();
        }
    });

    test("parseRegistrySource throws when an op call shape is not covered by the entry regex", () => {
        // A fifth argument (or any call shape the entry regex does not cover)
        // would silently drop the entry from generation — a wrong public
        // facade with no error. The count guard must fail loudly instead.
        const fake = [
            "export const ANILIST_OPERATION_REGISTRY = {",
            "    query: [",
            '        op("user", UserQuery, USER_ALWAYS, extraArg),',
            "    ],",
            "    page: [],",
            "    mutation: [],",
            "} as const;",
        ].join("\n");
        expect(() => parseRegistrySource(fake)).toThrow(/parsed/);
    });

    test("generation throws when a fields operation's FieldPath bound is not recognized", async () => {
        // A bound the strict regex cannot capture (here: a union) must fail
        // generation loudly. The silent alternative — falling back to the
        // wide response bound — would emit a facade promising paths the
        // composer rejects, the exact drift this generator exists to
        // prevent. The generator runs in a subprocess so its module-level
        // source cache cannot serve the pre-mutation file text.
        const classPath = join(process.cwd(), "src/apis/graphql/anilist/query/User.ts");
        const original = readFileSync(classPath, "utf8");
        try {
            writeFileSync(
                classPath,
                original.replace(
                    /async\s+user<K extends FieldPath<\w+>>/,
                    "async user<K extends FieldPath<UserResponse | ViewerResponse>>"
                )
            );
            const run = new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
                execFile(
                    process.execPath,
                    ["--import", "tsx", "scripts/generate-facade-groups.ts", "--check"],
                    { cwd: process.cwd() },
                    (error, stdout, stderr) => {
                        if (error && error.code !== 1) reject(error);
                        else resolve({ stdout: String(stdout), stderr: String(stderr) });
                    }
                );
            });
            const { stdout, stderr } = await run;
            expect(`${stdout}${stderr}`).toMatch(/FieldPath bound/);
        } finally {
            writeFileSync(classPath, original);
        }
    });

    test("generation throws when an always-keys constant uses an unsupported literal", async () => {
        // A constant the literal parser cannot fully consume (here: single
        // quotes) must fail generation loudly. The silent alternative —
        // parsing zero keys — would emit DeepPick<Response, K> without the
        // always-keys, a wrong public type with no error. The generator
        // runs in a subprocess so its module-level source cache cannot
        // serve the pre-mutation file text.
        const classPath = join(process.cwd(), "src/apis/graphql/anilist/query/Media.ts");
        const original = readFileSync(classPath, "utf8");
        try {
            writeFileSync(
                classPath,
                original.replace(
                    'export const MEDIA_ALWAYS: readonly string[] = ["id", "idMal"];',
                    "export const MEDIA_ALWAYS: readonly string[] = ['id', 'idMal'];"
                )
            );
            const run = new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
                execFile(
                    process.execPath,
                    ["--import", "tsx", "scripts/generate-facade-groups.ts", "--check"],
                    { cwd: process.cwd() },
                    (error, stdout, stderr) => {
                        if (error && error.code !== 1) reject(error);
                        else resolve({ stdout: String(stdout), stderr: String(stderr) });
                    }
                );
            });
            const { stdout, stderr } = await run;
            expect(`${stdout}${stderr}`).toMatch(/Unsupported always-keys/);
        } finally {
            writeFileSync(classPath, original);
        }
    });
});
