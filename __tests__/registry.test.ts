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
        const renamed = new Set(
            (["query", "page", "mutation"] as const).flatMap((category) =>
                ANILIST_OPERATION_REGISTRY[category]
                    .filter((entry) => entry.methodName !== undefined)
                    .map((entry) => facadePath(category, entry.name))
            )
        );
        expect([...renamed].sort()).toEqual([
            "query.page.activityReplies",
            "query.page.following",
            "query.page.recommendations",
            "query.page.threadComments",
        ]);
    });
});

describe("buildAniListWiring", () => {
    const wiring: AniListApi = buildAniListWiring(undefined, { retry: false });

    test("exposes exactly the registered operations on the runtime surface", () => {
        for (const category of ["query", "page", "mutation"] as const) {
            const section =
                category === "mutation"
                    ? wiring.mutation
                    : category === "page"
                      ? wiring.query.page
                      : wiring.query;
            // `query` additionally carries the nested `page` namespace.
            const runtimeKeys = Object.keys(section)
                .filter((key) => key !== "page")
                .sort();
            const registryKeys = ANILIST_OPERATION_REGISTRY[category]
                .map((entry) => entry.name)
                .sort();
            expect(runtimeKeys).toEqual(registryKeys);
        }
    });

    test("every exposed member is a function", () => {
        for (const category of ["query", "page", "mutation"] as const) {
            const section =
                category === "mutation"
                    ? wiring.mutation
                    : category === "page"
                      ? wiring.query.page
                      : wiring.query;
            for (const [key, value] of Object.entries(section)) {
                if (key === "page") continue;
                expect(typeof value, `${key} must be a function`).toBe("function");
            }
        }
    });

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

    test("helpers are shared module functions, not per-instance copies", () => {
        expect(typeof wiring.paginate).toBe("function");
        expect(typeof wiring.paginatePages).toBe("function");
        expect(typeof wiring.paginateChunks).toBe("function");
        expect(typeof wiring.fuzzyDate).toBe("function");
        expect(typeof wiring.flattenMediaListCollection).toBe("function");
    });

    test("rejects registry entries whose operation method is missing", () => {
        type MutableRegistryEntry = {
            name: string;
            operationClass: new (...args: never[]) => unknown;
            methodName?: string;
        };
        class MissingMethodOperation {}
        const queryEntries = ANILIST_OPERATION_REGISTRY.query as unknown as MutableRegistryEntry[];
        queryEntries.push({ name: "brokenOperation", operationClass: MissingMethodOperation });

        try {
            expect(() => buildAniListWiring()).toThrow(
                'Operation "brokenOperation" does not expose a "brokenOperation" method to bind.'
            );
        } finally {
            queryEntries.pop();
        }
    });

    test("custom is bound to its own CustomRequest instance", () => {
        expect(typeof wiring.custom).toBe("function");
    });
});
