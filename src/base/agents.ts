/**
 * Shared keep-alive agents and the bounded custom-agent cache.
 *
 * Owns the module-level default `http`/`https` keep-alive agents and the
 * Axios client bound to them, plus the LRU-bounded cache of dedicated agent
 * pairs constructed when a caller customizes `maxSockets`/`maxFreeSockets`.
 * The shared agents are reused on the default path so the common case
 * allocates nothing; identical custom configurations share one cached pair
 * so repeated requests reuse warm sockets instead of leaking a fresh agent
 * pair per request.
 */
import http from "node:http";
import https from "node:https";
import axios from "axios";
import { DEFAULT_REQUEST_TIMEOUT, MAX_FREE_SOCKETS, MAX_SOCKETS } from "./transportTypes";

const defaultHttpAgent = new http.Agent({
    keepAlive: true,
    maxSockets: MAX_SOCKETS,
    maxFreeSockets: MAX_FREE_SOCKETS,
    scheduling: "lifo",
});
const defaultHttpsAgent = new https.Agent({
    keepAlive: true,
    maxSockets: MAX_SOCKETS,
    maxFreeSockets: MAX_FREE_SOCKETS,
    scheduling: "lifo",
});

const axiosClient = axios.create({
    timeout: DEFAULT_REQUEST_TIMEOUT,
    httpAgent: defaultHttpAgent,
    httpsAgent: defaultHttpsAgent,
});

/**
 * Upper bound on the number of distinct custom agent pairs kept alive in the
 * cache. Each entry holds two keep-alive agents (http + https) plus their
 * idle sockets, so the cache is bounded to stop unbounded socket/handle growth
 * when callers pass many distinct `maxSockets`/`maxFreeSockets` combinations
 * through one long-lived process. Least-recently-used entries are evicted
 * (dropped from the cache without destroying their agents, which may still
 * carry in-flight requests) when the cap is reached.
 */
const MAX_CACHED_AGENT_PAIRS = 8;

interface CachedAgentPair {
    httpAgent: http.Agent;
    httpsAgent: https.Agent;
}

const cachedAgentPairs = new Map<string, CachedAgentPair>();

/**
 * Agent pairs evicted from the cache but not yet destroyed. Eviction must
 * not `.destroy()` an agent that may still carry in-flight requests, so the
 * pair is parked here instead; {@link destroyCachedAgents} drains the list
 * so an evicted pair's idle sockets can still be released on demand. The
 * list is bounded by the cache cap (each eviction parks at most one pair,
 * and a re-requested configuration reuses or rebuilds rather than
 * duplicating), so it cannot grow without bound.
 */
const parkedEvictedPairs: CachedAgentPair[] = [];

const buildAgentCacheKey = (maxSockets: number, maxFreeSockets: number): string =>
    `${maxSockets}:${maxFreeSockets}`;

/**
 * Evicts the least-recently-used cached agent pair when the cache is full.
 * The map entry is dropped WITHOUT calling `.destroy()`: the evicted agents
 * may still carry in-flight requests, and destroying them would close live
 * sockets. The pair is parked in {@link parkedEvictedPairs} so explicit
 * teardown through {@link destroyCachedAgents} can still reach it; until
 * then its idle sockets linger until the server closes them (keep-alive
 * timeout) or GC reclaims the now-unreachable agent. Map preserves insertion
 * order, so the first key is the least recently used after the delete+re-insert
 * refresh in {@link resolveAgents}.
 */
const evictLruAgentPair = (): void => {
    const oldestKey = cachedAgentPairs.keys().next().value;
    if (oldestKey !== undefined) {
        const evicted = cachedAgentPairs.get(oldestKey);
        cachedAgentPairs.delete(oldestKey);
        if (evicted !== undefined) {
            parkedEvictedPairs.push(evicted);
        }
    }
};

/**
 * Destroys every cached custom agent pair — plus every pair evicted while
 * requests may still have been in flight — and clears the cache. Intended
 * for tests and explicit teardown so long-lived processes can release the
 * keep-alive sockets held by customized agents on demand.
 *
 * **Must not be called while requests using these agents are in-flight.**
 * The agents are shared across every request with identical
 * `maxSockets`/`maxFreeSockets` bounds, so destroying them closes the
 * underlying sockets and can fail concurrent requests that are still
 * draining over those sockets. Call this only after all in-flight requests
 * have settled (for example in a shutdown hook that has awaited the final
 * request, or in test teardown after the test's assertions). Calling it
 * twice is safe (the second call iterates an empty cache).
 */
export const destroyCachedAgents = (): void => {
    for (const pair of cachedAgentPairs.values()) {
        pair.httpAgent.destroy();
        pair.httpsAgent.destroy();
    }
    cachedAgentPairs.clear();
    for (const pair of parkedEvictedPairs) {
        pair.httpAgent.destroy();
        pair.httpsAgent.destroy();
    }
    parkedEvictedPairs.length = 0;
};

/**
 * Builds (or reuses) the keep-alive agents for one request's socket bounds.
 *
 * When the caller leaves `maxSockets`/`maxFreeSockets` unset the shared
 * module-level agents are reused, so the default path allocates nothing and
 * every instance keeps competing for the same warm pool. Supplying either
 * bound constructs dedicated agents, but identical configurations now share
 * one cached agent pair (bounded by {@link MAX_CACHED_AGENT_PAIRS}) so
 * repeated requests with the same socket settings reuse warm sockets instead
 * of leaking a fresh agent pair per request. LRU entries are evicted
 * (dropped from the cache without destroying their agents, which may still
 * carry in-flight requests) when the cap is reached.
 *
 * @param maxSockets - Upper bound on concurrent sockets, when customized.
 * @param maxFreeSockets - Upper bound on retained idle sockets, when customized.
 * @returns The agents to send the request with.
 */
export const resolveAgents = (
    maxSockets: number | undefined,
    maxFreeSockets: number | undefined
): { httpAgent: http.Agent; httpsAgent: https.Agent } => {
    if (maxSockets === undefined && maxFreeSockets === undefined) {
        return { httpAgent: defaultHttpAgent, httpsAgent: defaultHttpsAgent };
    }
    const normalizeSockets = (value: number | undefined, fallback: number, min: number): number => {
        if (value === undefined || !Number.isFinite(value) || !Number.isInteger(value)) {
            return Math.max(min, fallback);
        }
        return Math.max(min, value);
    };
    const sockets = normalizeSockets(maxSockets, MAX_SOCKETS, 1);
    const freeSockets = normalizeSockets(maxFreeSockets, MAX_FREE_SOCKETS, 0);
    const key = buildAgentCacheKey(sockets, freeSockets);
    const cached = cachedAgentPairs.get(key);
    if (cached !== undefined) {
        // Refresh recency: delete + re-insert moves the pair to the end.
        cachedAgentPairs.delete(key);
        cachedAgentPairs.set(key, cached);
        return { httpAgent: cached.httpAgent, httpsAgent: cached.httpsAgent };
    }
    if (cachedAgentPairs.size >= MAX_CACHED_AGENT_PAIRS) {
        evictLruAgentPair();
    }
    const agentOptions = {
        keepAlive: true,
        maxSockets: sockets,
        maxFreeSockets: freeSockets,
        scheduling: "lifo" as const,
    };
    const pair: CachedAgentPair = {
        httpAgent: new http.Agent(agentOptions),
        httpsAgent: new https.Agent(agentOptions),
    };
    cachedAgentPairs.set(key, pair);
    return { httpAgent: pair.httpAgent, httpsAgent: pair.httpsAgent };
};

export { axiosClient, defaultHttpAgent, defaultHttpsAgent };
