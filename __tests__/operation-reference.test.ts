import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import {
    generateReferenceManifest,
    writeReferenceManifest,
    type ReferenceOperation,
} from "../scripts/generate-operation-reference";
import { loadOperations, type OperationSection } from "../docs-src/lib/load-ops";

/**
 * Shared output directory and manifest written once for the whole suite.
 *
 * {@link writeReferenceManifest} calls {@link generateReferenceManifest},
 * which walks the entire `src/` tree and regex-parses every `.ts` file —
 * expensive enough (~4 s) that regenerating per test dominated the suite.
 * Generating once at module scope and reusing the on-disk output cuts
 * the suite from ~16 s to ~4 s without changing what each test validates.
 */
const outputDir = mkdtempSync(join(tmpdir(), "anilink-operation-reference-"));
const manifestPath = join(outputDir, "lib", "operation-reference", "operations.json");

let writtenManifest: ReturnType<typeof writeReferenceManifest>;
try {
    writtenManifest = writeReferenceManifest(manifestPath);
} catch (error) {
    rmSync(outputDir, { recursive: true, force: true });
    throw error;
}

afterAll(() => {
    rmSync(outputDir, { recursive: true, force: true });
});

describe("operation reference section manifests", () => {
    it("writes one shard for every provider/category present in the manifest", () => {
        const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
            generatedAt: string;
            operations: ReturnType<typeof generateReferenceManifest>["operations"];
        };
        const expectedSections = new Set(
            manifest.operations.map((operation) => `${operation.provider}/${operation.category}`)
        );
        const actualSections = new Set<string>();

        for (const section of expectedSections) {
            const [provider, category] = section.split("/");
            const path = join(
                outputDir,
                "lib",
                "operation-reference",
                provider,
                `${category}.json`
            );
            const shard = JSON.parse(readFileSync(path, "utf8")) as {
                generatedAt: string;
                provider: string;
                category: string;
                operations: typeof manifest.operations;
            };

            expect(shard.provider).toBe(provider);
            expect(shard.category).toBe(category);
            expect(shard.generatedAt).toBe(manifest.generatedAt);
            expect(
                shard.operations.every(
                    (operation) =>
                        operation.provider === provider && operation.category === category
                )
            ).toBe(true);
            for (const operation of shard.operations) {
                actualSections.add(`${operation.provider}/${operation.category}`);
            }
        }

        expect(actualSections).toEqual(expectedSections);
        expect(
            [...expectedSections].flatMap((section) => {
                const [provider, category] = section.split("/");
                const shard = JSON.parse(
                    readFileSync(
                        join(outputDir, "lib", "operation-reference", provider, `${category}.json`),
                        "utf8"
                    )
                ) as { operations: typeof manifest.operations };
                return shard.operations;
            })
        ).toEqual(expect.arrayContaining(manifest.operations));
    });

    it("returns the manifest used to write the complete file and shards", () => {
        const written = JSON.parse(readFileSync(manifestPath, "utf8")) as {
            generatedAt: string;
            operations: ReturnType<typeof generateReferenceManifest>["operations"];
        };

        expect(writtenManifest.generatedAt).toBe(written.generatedAt);
        expect(writtenManifest.operations).toEqual(written.operations);
    });

    it("loads only the requested provider/category section", async () => {
        const grouped = await loadOperations("anilist", "mutation", outputDir);
        const operations = Object.values(grouped).flat();

        expect(operations.length).toBeGreaterThan(0);
        expect(
            operations.every(
                (operation) => operation.provider === "anilist" && operation.category === "mutation"
            )
        ).toBe(true);
    });

    it("loads each MAL namespace section independently", async () => {
        const expectedCounts: Partial<Record<OperationSection, number>> = {
            anime: 7,
            manga: 5,
            user: 4,
            forum: 3,
        };
        const all: ReferenceOperation[] = [];
        for (const [category, count] of Object.entries(expectedCounts)) {
            const grouped = await loadOperations("mal", category as OperationSection, outputDir);
            const operations = Object.values(grouped).flat();

            expect(operations).toHaveLength(count);
            expect(operations.every((operation) => operation.provider === "mal")).toBe(true);
            expect(operations.every((operation) => operation.category === category)).toBe(true);
            all.push(...operations);
        }
        expect(all).toHaveLength(19);
    });

    it("describes auth accurately for public MAL reads", () => {
        const seasonal = writtenManifest.operations.find(
            (operation) => operation.namespace === "mal.anime.seasonal"
        );
        const ranking = writtenManifest.operations.find(
            (operation) => operation.namespace === "mal.anime.ranking"
        );
        const get = writtenManifest.operations.find(
            (operation) => operation.namespace === "mal.anime.get"
        );

        expect(seasonal?.auth).toBe("Not required: a public read.");
        expect(ranking?.auth).toBe("Not required: a public read.");
        expect(get?.auth).toBe(
            "Not required for public anime data; pass an access token for list-related fields."
        );
    });

    it("describes the MAL user-list reads accurately", () => {
        const animeList = writtenManifest.operations.find(
            (operation) => operation.namespace === "mal.user.animeList"
        );
        const mangaList = writtenManifest.operations.find(
            (operation) => operation.namespace === "mal.user.mangaList"
        );

        expect(animeList).toBeDefined();
        expect(mangaList).toBeDefined();
        expect(animeList?.auth).toBe(
            "Not required for public user lists; `@me` and private lists require an access token, because a client ID alone cannot resolve `@me`."
        );
        expect(mangaList?.auth).toBe(
            "Not required for public user lists; `@me` and private lists require an access token, because a client ID alone cannot resolve `@me`."
        );
        // The user-list reads fail fast on `@me` without a token, like `me`.
        expect(animeList?.errors.map((entry) => entry.error)).toContain("AniLinkAuthError");
        expect(mangaList?.errors.map((entry) => entry.error)).toContain("AniLinkAuthError");
        // The params object carries the username plus the list filters; the
        // trailing options carry only fields and transport settings.
        expect(
            animeList?.request
                .find((param) => param.name === "params")
                ?.nestedFields?.map((field) => field.name)
        ).toEqual(["username", "status", "sort", "limit", "offset"]);
        expect(
            mangaList?.request
                .find((param) => param.name === "params")
                ?.nestedFields?.map((field) => field.name)
        ).toEqual(["username", "status", "sort", "limit", "offset"]);
        expect(
            animeList?.request
                .find((param) => param.name === "options")
                ?.nestedFields?.map((field) => field.name)
        ).toEqual(["fields", "timeout", "signal"]);
        expect(
            mangaList?.request
                .find((param) => param.name === "options")
                ?.nestedFields?.map((field) => field.name)
        ).toEqual(["fields", "timeout", "signal"]);
        expect(animeList?.links.find((link) => link.label === "MAL API reference")?.url).toBe(
            "https://myanimelist.net/apiconfig/references/api/v2#tag/user-animelist/operation/users_user_id_animelist_get"
        );
        expect(mangaList?.links.find((link) => link.label === "MAL API reference")?.url).toBe(
            "https://myanimelist.net/apiconfig/references/api/v2#tag/user-mangalist/operation/users_user_id_mangalist_get"
        );
    });

    it("excludes fields from deleteFromList options and keeps it elsewhere", () => {
        const animeDelete = writtenManifest.operations.find(
            (operation) => operation.namespace === "mal.anime.deleteFromList"
        );
        const mangaDelete = writtenManifest.operations.find(
            (operation) => operation.namespace === "mal.manga.deleteFromList"
        );
        const update = writtenManifest.operations.find(
            (operation) => operation.namespace === "mal.anime.updateMyListStatus"
        );

        // The DELETE response carries no body to shape, so `fields` is not
        // documented on the delete operations' options.
        expect(
            animeDelete?.request
                .find((param) => param.name === "options")
                ?.nestedFields?.map((field) => field.name)
        ).toEqual(["timeout", "signal"]);
        expect(
            mangaDelete?.request
                .find((param) => param.name === "options")
                ?.nestedFields?.map((field) => field.name)
        ).toEqual(["timeout", "signal"]);
        // Every other operation keeps the full options documentation.
        expect(
            update?.request
                .find((param) => param.name === "options")
                ?.nestedFields?.map((field) => field.name)
        ).toEqual(["fields", "timeout", "signal"]);
    });

    it("documents the empty-payload validation error on the list-status writes", () => {
        const animeUpdate = writtenManifest.operations.find(
            (operation) => operation.namespace === "mal.anime.updateMyListStatus"
        );
        const mangaUpdate = writtenManifest.operations.find(
            (operation) => operation.namespace === "mal.manga.updateMyListStatus"
        );

        // The writes fail fast when params carries no list-status field to
        // change; the reference must document that like the facade does.
        expect(animeUpdate?.errors.map((entry) => entry.error)).toContain("AniLinkValidationError");
        expect(mangaUpdate?.errors.map((entry) => entry.error)).toContain("AniLinkValidationError");
    });
});
