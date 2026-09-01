/**
 * Shared build-time helper for the operation catalog data loaders.
 *
 * The reference cards under `/operations/anilist` and `/operations/mal`
 * render TypeScript source from the generated operation manifest. The
 * data loaders are responsible only for grouping and filtering the raw
 * manifest — Shiki highlighting happens at render time inside the
 * `OperationCard` component (see
 * `docs-src/lib/useShikiHighlighter.ts`).
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { cwd } from "node:process";
import type {
    ReferenceOperation,
    ReferenceSectionManifest,
} from "../../scripts/generate-operation-reference";

/** A grouped view of operations, keyed by `domain` and ready for the cards. */
export type GroupedOperations = Record<string, ReferenceOperation[]>;

/** Supported provider/category shard names. */
export type OperationSection = ReferenceOperation["category"];

/**
 * Load the generated manifest, filter by `provider`, and group the
 * operations by `domain`. The returned records carry only raw text
 * fields; highlighting is applied at render time.
 *
 * @param provider Which provider to keep — `"anilist"` or `"mal"`.
 */
export async function loadOperations(
    provider: ReferenceOperation["provider"],
    category: OperationSection
): Promise<GroupedOperations> {
    const path = resolve(cwd(), "lib", "operation-reference", provider, `${category}.json`);
    if (!existsSync(path)) {
        throw new Error(
            `could not locate lib/operation-reference/${provider}/${category}.json from ${cwd()}; run \`npm run docs:operations\` first`
        );
    }
    const section = JSON.parse(readFileSync(path, "utf8")) as ReferenceSectionManifest;
    if (section.provider !== provider || section.category !== category) {
        throw new Error(
            `operation reference shard ${path} has provider/category ${section.provider}/${section.category}, expected ${provider}/${category}`
        );
    }
    const grouped: GroupedOperations = {};
    for (const op of section.operations) {
        const bucket = grouped[op.domain] ?? [];
        bucket.push(op);
        grouped[op.domain] = bucket;
    }
    return grouped;
}
