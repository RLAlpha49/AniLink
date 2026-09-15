import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { destroyCachedAgents } from "../src/base/RequestHandler";
import { getAxiosStub } from "./helpers/axiosStub";

/**
 * Bounded LRU keep-alive agent cache tests.
 *
 * `RequestHandler` keeps a bounded cache of custom keep-alive agent pairs so
 * repeated requests with the same `maxSockets`/`maxFreeSockets` reuse warm
 * sockets instead of leaking a fresh pair per request. The cache is capped
 * at `MAX_CACHED_AGENT_PAIRS` (8); LRU entries are evicted and parked (NOT
 * destroyed at eviction time, since they may still carry in-flight requests)
 * in a parked list capped at `MAX_PARKED_EVICTED_PAIRS` (16). Overflowing the
 * parked cap destroys the OLDEST parked pair, which was evicted long enough
 * ago to have drained its in-flight requests. `destroyCachedAgents`
 * releases every cached and parked pair for teardown.
 */

vi.mock("axios", async () => {
    const { createAxiosStub: build, stashAxiosStub } = await import("./helpers/axiosStub");
    const stub = build();
    stashAxiosStub(stub);
    return stub.module;
});

const mocks = getAxiosStub();

/** Captures the agent pair handed to axios for the nth call. */
const agentsFor = (callIndex: number): { httpAgent: unknown; httpsAgent: unknown } => {
    const config = mocks.request.mock.calls[callIndex]?.[0] as
        { httpAgent?: unknown; httpsAgent?: unknown } | undefined;
    return { httpAgent: config?.httpAgent, httpsAgent: config?.httpsAgent };
};

beforeEach(() => {
    vi.clearAllMocks();
    destroyCachedAgents();
    mocks.request.mockResolvedValue({ data: { data: { Media: { id: 1 } } } });
});

afterEach(() => {
    destroyCachedAgents();
});

describe("agent cache", () => {
    test("reuses the same agent pair for identical socket bounds", async () => {
        const { sendRequest } = await import("../src/base/RequestHandler");
        const options = { retry: false, maxSockets: 10, maxFreeSockets: 5 };

        await sendRequest("https://graphql.anilist.co", "GET", undefined, undefined, {
            requiresAuth: false,
            options,
        });
        await sendRequest("https://graphql.anilist.co", "GET", undefined, undefined, {
            requiresAuth: false,
            options,
        });

        const first = agentsFor(0);
        const second = agentsFor(1);
        expect(first.httpAgent).toBe(second.httpAgent);
        expect(first.httpsAgent).toBe(second.httpsAgent);
    });

    test("uses distinct agent pairs for distinct socket bounds", async () => {
        const { sendRequest } = await import("../src/base/RequestHandler");

        await sendRequest("https://graphql.anilist.co", "GET", undefined, undefined, {
            requiresAuth: false,
            options: { retry: false, maxSockets: 10, maxFreeSockets: 5 },
        });
        await sendRequest("https://graphql.anilist.co", "GET", undefined, undefined, {
            requiresAuth: false,
            options: { retry: false, maxSockets: 20, maxFreeSockets: 5 },
        });

        const first = agentsFor(0);
        const second = agentsFor(1);
        expect(first.httpAgent).not.toBe(second.httpAgent);
    });

    test("destroyCachedAgents releases cached pairs so the next request gets a fresh agent", async () => {
        const { sendRequest } = await import("../src/base/RequestHandler");
        const options = { retry: false, maxSockets: 10, maxFreeSockets: 5 };

        await sendRequest("https://graphql.anilist.co", "GET", undefined, undefined, {
            requiresAuth: false,
            options,
        });
        const beforeDestroy = agentsFor(0);

        destroyCachedAgents();

        await sendRequest("https://graphql.anilist.co", "GET", undefined, undefined, {
            requiresAuth: false,
            options,
        });
        const afterDestroy = agentsFor(1);

        expect(afterDestroy.httpAgent).not.toBe(beforeDestroy.httpAgent);
    });

    test("evicts LRU entries once more than 8 distinct pairs are cached", async () => {
        const { sendRequest } = await import("../src/base/RequestHandler");

        // Issue 10 distinct socket-bound combinations; the cache caps at 8.
        for (let i = 1; i <= 10; i += 1) {
            await sendRequest("https://graphql.anilist.co", "GET", undefined, undefined, {
                requiresAuth: false,
                options: { retry: false, maxSockets: i, maxFreeSockets: 1 },
            });
        }

        // The first two pairs (maxSockets 1 and 2) were evicted as LRU, so
        // re-requesting maxSockets 1 must produce a fresh agent, not the
        // original one.
        const evictedAgent = agentsFor(0).httpAgent;
        await sendRequest("https://graphql.anilist.co", "GET", undefined, undefined, {
            requiresAuth: false,
            options: { retry: false, maxSockets: 1, maxFreeSockets: 1 },
        });
        const reissuedAgent = agentsFor(10).httpAgent;
        expect(reissuedAgent).not.toBe(evictedAgent);
    });

    test("eviction does not destroy the evicted agent while it may be in use", async () => {
        const { sendRequest } = await import("../src/base/RequestHandler");

        // Fill the cache exactly to its cap (8) with distinct pairs.
        for (let i = 1; i <= 8; i += 1) {
            await sendRequest("https://graphql.anilist.co", "GET", undefined, undefined, {
                requiresAuth: false,
                options: { retry: false, maxSockets: i, maxFreeSockets: 1 },
            });
        }

        // The first pair (maxSockets 1) is the LRU entry; the 9th insert
        // evicts it. `http.Agent` exposes no `destroyed` flag, so destruction
        // is observed through spies on its `destroy` methods, installed
        // BEFORE the eviction fires. The evicted agents may still carry
        // in-flight requests, so eviction must not destroy them.
        const evictedHttp = agentsFor(0).httpAgent as { destroy: () => void };
        const evictedHttps = agentsFor(0).httpsAgent as { destroy: () => void };
        const httpDestroy = vi.spyOn(evictedHttp, "destroy");
        const httpsDestroy = vi.spyOn(evictedHttps, "destroy");

        await sendRequest("https://graphql.anilist.co", "GET", undefined, undefined, {
            requiresAuth: false,
            options: { retry: false, maxSockets: 9, maxFreeSockets: 1 },
        });

        expect(httpDestroy).not.toHaveBeenCalled();
        expect(httpsDestroy).not.toHaveBeenCalled();
        httpDestroy.mockRestore();
        httpsDestroy.mockRestore();
    });

    test("refreshes recency on reuse so a touched pair survives the next eviction", async () => {
        const { sendRequest } = await import("../src/base/RequestHandler");

        // Fill the cache to its cap (8) with distinct pairs.
        for (let i = 1; i <= 8; i += 1) {
            await sendRequest("https://graphql.anilist.co", "GET", undefined, undefined, {
                requiresAuth: false,
                options: { retry: false, maxSockets: i, maxFreeSockets: 1 },
            });
        }

        // Touch the oldest pair (maxSockets 1) so it becomes the most
        // recently used; the untouched maxSockets 2 pair is now the LRU.
        await sendRequest("https://graphql.anilist.co", "GET", undefined, undefined, {
            requiresAuth: false,
            options: { retry: false, maxSockets: 1, maxFreeSockets: 1 },
        });
        const touchedAgent = agentsFor(8).httpAgent;

        // The 9th distinct pair evicts maxSockets 2 (the new LRU), not the
        // touched maxSockets 1 pair.
        await sendRequest("https://graphql.anilist.co", "GET", undefined, undefined, {
            requiresAuth: false,
            options: { retry: false, maxSockets: 9, maxFreeSockets: 1 },
        });

        // Re-requesting maxSockets 1 must return the touched (surviving)
        // agent, not a fresh one.
        await sendRequest("https://graphql.anilist.co", "GET", undefined, undefined, {
            requiresAuth: false,
            options: { retry: false, maxSockets: 1, maxFreeSockets: 1 },
        });
        expect(agentsFor(10).httpAgent).toBe(touchedAgent);
    });

    test("destroyCachedAgents tears down pairs evicted while requests may still be in flight", async () => {
        const { sendRequest } = await import("../src/base/RequestHandler");

        // Fill the cache to its cap (8) with distinct pairs.
        for (let i = 1; i <= 8; i += 1) {
            await sendRequest("https://graphql.anilist.co", "GET", undefined, undefined, {
                requiresAuth: false,
                options: { retry: false, maxSockets: i, maxFreeSockets: 1 },
            });
        }

        // Evict the first pair with a 9th distinct configuration.
        await sendRequest("https://graphql.anilist.co", "GET", undefined, undefined, {
            requiresAuth: false,
            options: { retry: false, maxSockets: 9, maxFreeSockets: 1 },
        });
        const evictedHttp = agentsFor(0).httpAgent as { destroy: () => void };
        const evictedHttps = agentsFor(0).httpsAgent as { destroy: () => void };
        const httpDestroy = vi.spyOn(evictedHttp, "destroy");
        const httpsDestroy = vi.spyOn(evictedHttps, "destroy");

        // Explicit teardown must reach the evicted pair too: without it, an
        // evicted pair's idle sockets could never be released on demand.
        destroyCachedAgents();

        expect(httpDestroy).toHaveBeenCalledTimes(1);
        expect(httpsDestroy).toHaveBeenCalledTimes(1);
        httpDestroy.mockRestore();
        httpsDestroy.mockRestore();
    });

    test("destroys the oldest parked pair once the parked list overflows its cap", async () => {
        const { sendRequest } = await import("../src/base/RequestHandler");

        // Drive 17 distinct configurations (maxSockets 1..17): configs 1..8
        // fill the cache, configs 9..17 evict pairs 1..9, so the parked list
        // holds 9 pairs with config 1's pair as the oldest.
        for (let i = 1; i <= 17; i += 1) {
            await sendRequest("https://graphql.anilist.co", "GET", undefined, undefined, {
                requiresAuth: false,
                options: { retry: false, maxSockets: i, maxFreeSockets: 1 },
            });
        }

        // Spies must be installed before the evictions that overflow the
        // cap. `http.Agent` exposes no `destroyed` flag, so destruction is
        // observed through spies on the `destroy` methods.
        const oldestParkedHttp = agentsFor(0).httpAgent as { destroy: () => void };
        const oldestParkedHttps = agentsFor(0).httpsAgent as { destroy: () => void };
        const oldestHttpDestroy = vi.spyOn(oldestParkedHttp, "destroy");
        const oldestHttpsDestroy = vi.spyOn(oldestParkedHttps, "destroy");
        // Config 9's pair (call index 8) is the most recently parked pair at
        // this point; it stays parked through the overflow trim and must not
        // be destroyed by it.
        const recentParkedHttp = agentsFor(8).httpAgent as { destroy: () => void };
        const recentParkedHttps = agentsFor(8).httpsAgent as { destroy: () => void };
        const recentHttpDestroy = vi.spyOn(recentParkedHttp, "destroy");
        const recentHttpsDestroy = vi.spyOn(recentParkedHttps, "destroy");
        // Config 17's pair (call index 16) is still cached; it becomes the
        // FRESHLY evicted pair on the overflow eviction and must never be the
        // pair destroyed by the trim.
        const freshEvictedHttp = agentsFor(16).httpAgent as { destroy: () => void };
        const freshEvictedHttps = agentsFor(16).httpsAgent as { destroy: () => void };
        const freshHttpDestroy = vi.spyOn(freshEvictedHttp, "destroy");
        const freshHttpsDestroy = vi.spyOn(freshEvictedHttps, "destroy");

        // Drive configs 18..25: 8 more evictions (pairs 10..17 parked). The
        // 17th eviction overall (config 25's) would push the parked list to
        // 17, overflowing the cap of 16 — so the OLDEST parked pair (config
        // 1's) is destroyed first.
        for (let i = 18; i <= 25; i += 1) {
            await sendRequest("https://graphql.anilist.co", "GET", undefined, undefined, {
                requiresAuth: false,
                options: { retry: false, maxSockets: i, maxFreeSockets: 1 },
            });
        }

        expect(oldestHttpDestroy).toHaveBeenCalledTimes(1);
        expect(oldestHttpsDestroy).toHaveBeenCalledTimes(1);
        expect(recentHttpDestroy).not.toHaveBeenCalled();
        expect(recentHttpsDestroy).not.toHaveBeenCalled();
        expect(freshHttpDestroy).not.toHaveBeenCalled();
        expect(freshHttpsDestroy).not.toHaveBeenCalled();

        // Explicit teardown still works after the trim: the remaining parked
        // pairs (configs 2..17) are destroyed and the list is cleared. The
        // already-trimmed config 1 pair is no longer parked, so its destroy
        // count stays at exactly one.
        destroyCachedAgents();

        expect(oldestHttpDestroy).toHaveBeenCalledTimes(1);
        expect(recentHttpDestroy).toHaveBeenCalledTimes(1);
        expect(recentHttpsDestroy).toHaveBeenCalledTimes(1);
        expect(freshHttpDestroy).toHaveBeenCalledTimes(1);
        expect(freshHttpsDestroy).toHaveBeenCalledTimes(1);
        oldestHttpDestroy.mockRestore();
        oldestHttpsDestroy.mockRestore();
        recentHttpDestroy.mockRestore();
        recentHttpsDestroy.mockRestore();
        freshHttpDestroy.mockRestore();
        freshHttpsDestroy.mockRestore();
    });

    test("destroyCachedAgents still tears down pairs remaining in the parked list after overflow trimming", async () => {
        const { sendRequest } = await import("../src/base/RequestHandler");

        // Drive 25 distinct configurations: 17 evictions park 17 pairs, the
        // 17th overflow destroys the oldest (config 1's pair), leaving
        // configs 2..17 parked.
        for (let i = 1; i <= 25; i += 1) {
            await sendRequest("https://graphql.anilist.co", "GET", undefined, undefined, {
                requiresAuth: false,
                options: { retry: false, maxSockets: i, maxFreeSockets: 1 },
            });
        }

        // Config 2's pair (call index 1) is now the oldest remaining parked
        // pair; it must still be reachable by explicit teardown.
        const remainingHttp = agentsFor(1).httpAgent as { destroy: () => void };
        const remainingHttps = agentsFor(1).httpsAgent as { destroy: () => void };
        const httpDestroy = vi.spyOn(remainingHttp, "destroy");
        const httpsDestroy = vi.spyOn(remainingHttps, "destroy");

        destroyCachedAgents();

        expect(httpDestroy).toHaveBeenCalledTimes(1);
        expect(httpsDestroy).toHaveBeenCalledTimes(1);
        httpDestroy.mockRestore();
        httpsDestroy.mockRestore();
    });
});
