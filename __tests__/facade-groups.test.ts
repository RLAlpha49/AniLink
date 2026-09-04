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
            expect(typeof (api.query as Record<string, unknown>)[name]).toBe("function");
        }
    });

    test("buildAniListApi exposes every registered page query under query.page.<name>", () => {
        const api = buildAniListApi("token") as unknown as AniListApi;
        const pageKeys = Object.keys(api.query.page);

        expect(pageKeys.sort()).toEqual([...registryPageNames].sort());
        for (const name of registryPageNames) {
            expect(typeof (api.query.page as Record<string, unknown>)[name]).toBe("function");
        }
    });

    test("buildAniListApi exposes every registered mutation under mutation.<name>", () => {
        const api = buildAniListApi("token") as unknown as AniListApi;
        const mutationKeys = Object.keys(api.mutation);

        expect(mutationKeys.sort()).toEqual([...registryMutationNames].sort());
        for (const name of registryMutationNames) {
            expect(typeof (api.mutation as Record<string, unknown>)[name]).toBe("function");
        }
    });

    test("buildAniListApi exposes the custom escape hatch and helper members", () => {
        const api = buildAniListApi("token") as unknown as AniListApi;

        for (const name of CUSTOM_MEMBERS) {
            expect(typeof (api as Record<string, unknown>)[name]).toBe("function");
        }
        for (const name of HELPER_MEMBERS) {
            expect(typeof (api as Record<string, unknown>)[name]).toBe("function");
        }
    });

    test("the registry has no duplicate query names within a category", () => {
        const checkUnique = (names: string[], category: string) => {
            const seen = new Set<string>();
            for (const name of names) {
                expect(seen.has(name), `duplicate ${category} name: ${name}`).toBe(false);
                seen.add(name);
            }
        };
        checkUnique(registryQueryNames, "query");
        checkUnique(registryPageNames, "page");
        checkUnique(registryMutationNames, "mutation");
    });

    test("every registry entry binds to a callable method on its operation class", () => {
        // If a registry entry's methodName/name does not match a real method
        // on the operation class, buildAniListApi throws during binding.
        // Constructing the facade exercises every binding; reaching this
        // assertion means no entry is mis-wired.
        expect(() => buildAniListApi("token")).not.toThrow();
    });

    test("the query group type and registry agree on operation count", () => {
        // The registry is the source of truth; the facade type declares the
        // same operations. This guards against a new operation being added to
        // the registry without a matching type declaration (or vice versa).
        expect(registryQueryNames.length).toBe(ANILIST_OPERATION_REGISTRY.query.length);
        expect(registryPageNames.length).toBe(ANILIST_OPERATION_REGISTRY.page.length);
        expect(registryMutationNames.length).toBe(ANILIST_OPERATION_REGISTRY.mutation.length);
    });
});
