import { describe, expect, test } from "vitest";
import { ANILIST_OPERATION_REGISTRY } from "../src/apis/graphql/anilist/registry";
import { buildAniListApi } from "../src/apis/graphql/anilist/facade";
import type { AniListApi } from "../src/apis/graphql/anilist/facade";

/**
 * Direct facade-group composition tests.
 *
 * The facade group modules (`query-group.ts`, `mutation-group.ts`,
 * `helpers-group.ts`, `custom-group.ts`) declare the typed public surface,
 * and `registry.ts` is the single source of truth for which operations are
 * wired. The existing suites (`queries.test.ts`, `mutations.test.ts`,
 * `page-queries.test.ts`) exercise operations transitively through the
 * facade; these tests import the facade and registry directly so a regression
 * in a single group module or a missing registry entry fails a test that
 * names the broken module, rather than surfacing only as a downstream
 * symptom.
 */

/** The helper members wired manually in `wiring.ts` (not in the registry). */
const HELPER_MEMBERS = [
    "paginate",
    "paginatePages",
    "paginateChunks",
    "fuzzyDate",
    "flattenMediaListCollection",
] as const;

/** The custom escape hatch wired manually in `wiring.ts`. */
const CUSTOM_MEMBERS = ["custom"] as const;

const registryQueryNames = ANILIST_OPERATION_REGISTRY.query.map((entry) => entry.name);
const registryPageNames = ANILIST_OPERATION_REGISTRY.page.map((entry) => entry.name);
const registryMutationNames = ANILIST_OPERATION_REGISTRY.mutation.map((entry) => entry.name);

describe("facade group composition", () => {
    test("buildAniListApi exposes every registered query under query.<name>", () => {
        const api = buildAniListApi("token") as unknown as AniListApi;
        const queryKeys = Object.keys(api.query).filter((key) => key !== "page");

        expect(queryKeys.sort()).toEqual([...registryQueryNames].sort());
        for (const name of registryQueryNames) {
            expect((api.query as Record<string, unknown>)[name]).toBeInstanceOf(Function);
        }
    });

    test("buildAniListApi exposes every registered page query under query.page.<name>", () => {
        const api = buildAniListApi("token") as unknown as AniListApi;
        const pageKeys = Object.keys(api.query.page);

        expect(pageKeys.sort()).toEqual([...registryPageNames].sort());
        for (const name of registryPageNames) {
            expect((api.query.page as Record<string, unknown>)[name]).toBeInstanceOf(Function);
        }
    });

    test("buildAniListApi exposes every registered mutation under mutation.<name>", () => {
        const api = buildAniListApi("token") as unknown as AniListApi;
        const mutationKeys = Object.keys(api.mutation);

        expect(mutationKeys.sort()).toEqual([...registryMutationNames].sort());
        for (const name of registryMutationNames) {
            expect((api.mutation as Record<string, unknown>)[name]).toBeInstanceOf(Function);
        }
    });

    test("buildAniListApi exposes the custom escape hatch and helper members", () => {
        const api = buildAniListApi("token") as unknown as AniListApi;

        for (const name of CUSTOM_MEMBERS) {
            expect((api as Record<string, unknown>)[name]).toBeInstanceOf(Function);
        }
        for (const name of HELPER_MEMBERS) {
            expect((api as Record<string, unknown>)[name]).toBeInstanceOf(Function);
        }
    });
});
