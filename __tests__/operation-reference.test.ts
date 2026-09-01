import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
    generateReferenceManifest,
    writeReferenceManifest,
} from "../scripts/generate-operation-reference";
import { loadOperations } from "../docs-src/lib/load-ops";

const temporaryDirectories: string[] = [];

afterEach(() => {
    for (const directory of temporaryDirectories.splice(0)) {
        rmSync(directory, { recursive: true, force: true });
    }
});

describe("operation reference section manifests", () => {
    it("writes one shard for every provider/category present in the manifest", () => {
        const outputDir = mkdtempSync(join(tmpdir(), "anilink-operation-reference-"));
        temporaryDirectories.push(outputDir);

        writeReferenceManifest(join(outputDir, "operations.json"));
        const manifest = JSON.parse(readFileSync(join(outputDir, "operations.json"), "utf8")) as {
            generatedAt: string;
            operations: ReturnType<typeof generateReferenceManifest>["operations"];
        };
        const expectedSections = new Set(
            manifest.operations.map((operation) => `${operation.provider}/${operation.category}`)
        );
        const actualSections = new Set<string>();

        for (const section of expectedSections) {
            const [provider, category] = section.split("/");
            const path = join(outputDir, provider, `${category}.json`);
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
                    readFileSync(join(outputDir, provider, `${category}.json`), "utf8")
                ) as { operations: typeof manifest.operations };
                return shard.operations;
            })
        ).toEqual(expect.arrayContaining(manifest.operations));
    }, 30_000);

    it("returns the manifest used to write the complete file and shards", () => {
        const outputDir = mkdtempSync(join(tmpdir(), "anilink-operation-reference-"));
        temporaryDirectories.push(outputDir);

        const generated = writeReferenceManifest(join(outputDir, "operations.json"));
        const written = JSON.parse(readFileSync(join(outputDir, "operations.json"), "utf8")) as {
            generatedAt: string;
            operations: ReturnType<typeof generateReferenceManifest>["operations"];
        };

        expect(generated.generatedAt).toBe(written.generatedAt);
        expect(generated.operations).toEqual(written.operations);
    }, 30_000);

    it("loads only the requested provider/category section", async () => {
        const outputDir = mkdtempSync(join(tmpdir(), "anilink-operation-reference-"));
        temporaryDirectories.push(outputDir);
        writeReferenceManifest(join(outputDir, "lib", "operation-reference", "operations.json"));

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
        const outputDir = mkdtempSync(join(tmpdir(), "anilink-operation-reference-"));
        temporaryDirectories.push(outputDir);
        writeReferenceManifest(join(outputDir, "lib", "operation-reference", "operations.json"));

        const grouped = await loadOperations("mal", "rest", outputDir);
        const operations = Object.values(grouped).flat();

        expect(operations).toHaveLength(2);
        expect(operations.every((operation) => operation.provider === "mal")).toBe(true);
        expect(operations.every((operation) => operation.category === "rest")).toBe(true);
    });
});
