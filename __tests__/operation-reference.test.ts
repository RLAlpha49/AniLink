import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import {
    generateReferenceManifest,
    writeReferenceManifest,
} from "../scripts/generate-operation-reference";
import { loadOperations } from "../docs-src/lib/load-ops";

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

    it("loads the MAL REST section independently", async () => {
        const grouped = await loadOperations("mal", "rest", outputDir);
        const operations = Object.values(grouped).flat();

        expect(operations).toHaveLength(7);
        expect(operations.every((operation) => operation.provider === "mal")).toBe(true);
        expect(operations.every((operation) => operation.category === "rest")).toBe(true);
    });
});
