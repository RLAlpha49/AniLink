import { describe, expect, test, vi } from "vitest";
import {
    ANILIST_OPERATION_REGISTRY,
    type OperationCategory,
} from "../src/apis/graphql/anilist/registry";
import { buildAniListWiring } from "../src/apis/graphql/anilist/wiring";
import type { AniListApi } from "../src/apis/graphql/anilist/facade";

/**
 * Registry integrity and wiring coverage.
 *
 * The registry is the single source of truth for operation wiring; these
 * tests pin its structural contract so drift between the registry, the
 * facade types, and the bound runtime surface fails loudly here.
 */

vi.mock("axios", async () => {
    const { createAxiosStub: build, stashAxiosStub } = await import("./helpers/axiosStub");
    const stub = build();
    stashAxiosStub(stub);
    return stub.module;
});

/** The facade path of a registry entry, e.g. `query.page.users`. */
const facadePath = (category: OperationCategory, name: string): string =>
    category === "page" ? `query.page.${name}` : `${category}.${name}`;

describe("ANILIST_OPERATION_REGISTRY", () => {
    test("covers every category with at least one entry", () => {
        for (const category of ["query", "page", "mutation"] as const) {
            expect(ANILIST_OPERATION_REGISTRY[category].length).toBeGreaterThan(0);
        }
    });

    test("has no duplicate facade keys within or across groups", () => {
        const seen = new Set<string>();
        for (const category of ["query", "page", "mutation"] as const) {
            for (const entry of ANILIST_OPERATION_REGISTRY[category]) {
                const key = facadePath(category, entry.name);
                expect(seen.has(key)).toBe(false);
                seen.add(key);
            }
        }
        // 25 queries + 18 page + 29 mutations = 72 entries.
        expect(seen.size).toBe(72);
    });

    test("every entry resolves to a class whose prototype exposes the bound method", () => {
        for (const category of ["query", "page", "mutation"] as const) {
            for (const entry of ANILIST_OPERATION_REGISTRY[category]) {
                const method = entry.methodName ?? entry.name;
                expect(
                    typeof entry.operationClass.prototype[method],
                    `${facadePath(category, entry.name)} must expose "${method}"`
                ).toBe("function");
            }
        }
    });

    test("entries with an explicit methodName need it (method differs from key)", () => {
        // Every opAs() case binds a differently-named method; assert the known set.
        // methodName is always present (op() defaults it to name, opAs() overrides),
        // so an entry "needs" the override iff it differs from its facade key.
        const renamed = new Set(
            (["query", "page", "mutation"] as const).flatMap((category) =>
                ANILIST_OPERATION_REGISTRY[category]
                    .filter((entry) => entry.methodName !== entry.name)
                    .map((entry) => facadePath(category, entry.name))
            )
        );
        // Only `following` genuinely needs the override: its facade key is
        // `following` but the bound method is `FollowingsQuery.followings`.
        // The other three page entries (activityReplies, threadComments,
        // recommendations) are wired with opAs() passing a methodName equal to
        // the key, so methodName === name and they do not "need" a rename.
        expect([...renamed].sort()).toEqual(["query.page.following"]);
    });
});

describe("buildAniListWiring", () => {
    const wiring: AniListApi = buildAniListWiring(undefined, { retry: false });

    test("bound methods keep their instance binding across calls", async () => {
        const { getAxiosStub } = await import("./helpers/axiosStub");
        const mocks = getAxiosStub();
        mocks.request.mockImplementation(async () => ({
            status: 200,
            data: { data: { Media: { id: 1 } } },
        }));

        // Two calls through the same bound method must both reach the
        // transport with the correct `this` binding and variables.
        await expect(wiring.query.media({ id: 1, type: "ANIME" })).resolves.toEqual({ id: 1 });
        await expect(wiring.query.media({ id: 2, type: "MANGA" })).resolves.toEqual({ id: 1 });
        expect(mocks.request).toHaveBeenCalledTimes(2);
        expect(
            (mocks.request.mock.calls[1][0] as { data?: { variables?: unknown } }).data?.variables
        ).toEqual({ id: 2, type: "MANGA" });
    });

    test("the lazy getter caches the bound method so the same instance is reused", () => {
        expect(wiring.query.media).toBe(wiring.query.media);
        expect(wiring.mutation.deleteMediaListEntry).toBe(wiring.mutation.deleteMediaListEntry);
        expect(wiring.query.page.following).toBe(wiring.query.page.following);
    });

    test("rejects registry entries whose operation method is missing", () => {
        type MutableRegistryEntry = {
            name: string;
            operationClass: new (...args: never[]) => unknown;
            methodName?: string;
        };
        class MissingMethodOperation {}
        const queryEntries = ANILIST_OPERATION_REGISTRY.query as unknown as MutableRegistryEntry[];
        // methodName is always present on a real entry (op() defaults it to name);
        // simulate an op()-style entry so the error reports the facade key, not "undefined".
        queryEntries.push({
            name: "brokenOperation",
            operationClass: MissingMethodOperation,
            methodName: "brokenOperation",
        });

        try {
            expect(() => buildAniListWiring()).toThrow(
                'Operation "brokenOperation" does not expose a "brokenOperation" method to bind.'
            );
        } finally {
            queryEntries.pop();
        }
    });
});
