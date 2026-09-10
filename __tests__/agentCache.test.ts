import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { destroyCachedAgents } from "../src/base/RequestHandler";
import { getAxiosStub } from "./helpers/axiosStub";

/**
 * Bounded LRU keep-alive agent cache tests.
 *
 * `RequestHandler` keeps a bounded cache of custom keep-alive agent pairs so
 * repeated requests with the same `maxSockets`/`maxFreeSockets` reuse warm
 * sockets instead of leaking a fresh pair per request. The cache is capped at
 * `MAX_CACHED_AGENT_PAIRS` (8); LRU entries are evicted and `.destroy()`-ed.
 * `destroyCachedAgents` releases every cached pair for teardown.
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
});
