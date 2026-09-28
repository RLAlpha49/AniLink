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
 *
 * {@link destroyCachedAgents} tears all of it down — cached pairs, parked
 * pairs, and the shared default pair — and the default pair plus the
 * `axiosClient` binding to it are rebuilt lazily on the next request.
 */
import http from "node:http";
import https from "node:https";
import axios from "axios";
import { DEFAULT_REQUEST_TIMEOUT, MAX_FREE_SOCKETS, MAX_SOCKETS } from "./transportTypes";

/**
 * Construction options for the shared default keep-alive agents, shared by
 * the initial pair and every pair rebuilt after a teardown.
 */
const DEFAULT_AGENT_OPTIONS: http.AgentOptions = {
    keepAlive: true,
    maxSockets: MAX_SOCKETS,
    maxFreeSockets: MAX_FREE_SOCKETS,
    scheduling: "lifo",
};

/**
 * Shared keep-alive agent for plain-HTTP requests, reused by every request
 * that does not customize socket bounds. `let` rather than `const` because
 * {@link destroyCachedAgents} destroys it and the next request rebuilds a
 * fresh one through {@link ensureDefaultAgents}.
 */
let defaultHttpAgent = new http.Agent(DEFAULT_AGENT_OPTIONS);
/**
 * Shared keep-alive agent for HTTPS requests, reused by every request that
 * does not customize socket bounds. Rebuilt together with
 * {@link defaultHttpAgent} after a teardown.
 */
let defaultHttpsAgent = new https.Agent(DEFAULT_AGENT_OPTIONS);

/**
 * The Axios client every transport request is dispatched through, bound
 * to the shared keep-alive agents. Rebuilt alongside the default pair
 * after a teardown so the binding is never left pointing at destroyed
 * agents.
 */
let axiosClient = axios.create({
    timeout: DEFAULT_REQUEST_TIMEOUT,
    httpAgent: defaultHttpAgent,
    httpsAgent: defaultHttpsAgent,
});

/**
 * Set once {@link destroyCachedAgents} has destroyed the default pair and
 * no request has rebuilt it yet. Guards teardown against destroying the
 * same (already destroyed) pair twice and tells {@link ensureDefaultAgents}
 * that a rebuild is due.
 */
let defaultAgentsTornDown = false;

/**
 * Lazily rebuilds the default keep-alive pair and rebinds `axiosClient` to
 * it after a {@link destroyCachedAgents} teardown. Called from
 * {@link resolveAgents}, which runs once per dispatched request before the
 * attempt loop reads `axiosClient`, so the first request after a teardown
 * always sees fresh default agents; while nothing has been torn down this
 * is a no-op, keeping the default path allocation-free.
 */
const ensureDefaultAgents = (): void => {
    if (!defaultAgentsTornDown) {
        return;
    }
    defaultHttpAgent = new http.Agent(DEFAULT_AGENT_OPTIONS);
    defaultHttpsAgent = new https.Agent(DEFAULT_AGENT_OPTIONS);
    axiosClient = axios.create({
        timeout: DEFAULT_REQUEST_TIMEOUT,
        httpAgent: defaultHttpAgent,
        httpsAgent: defaultHttpsAgent,
    });
    defaultAgentsTornDown = false;
};

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

/**
 * Upper bound on the number of evicted agent pairs kept parked before the
 * oldest parked pair is destroyed. Without this cap, a caller cycling through
 * many distinct `maxSockets`/`maxFreeSockets` combinations would park one
 * pair per eviction (each holding two keep-alive agents and their idle
 * sockets) with nothing ever releasing them until an explicit
 * {@link destroyCachedAgents} call — unbounded socket/handle growth in a
 * long-lived process. When parking a newly evicted pair would exceed this
 * cap, the OLDEST parked pair is destroyed first, which is safe because it
 * was evicted long enough ago to have drained any in-flight requests.
 */
const MAX_PARKED_EVICTED_PAIRS = 16;

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
 * list is capped at {@link MAX_PARKED_EVICTED_PAIRS}: parking a newly
 * evicted pair beyond the cap destroys the oldest parked pair first, so
 * the list cannot grow without bound even under unbounded
 * `maxSockets`/`maxFreeSockets` churn. A freshly evicted pair is never
 * destroyed at eviction time — only pairs evicted long enough ago to have
 * drained their in-flight requests are eligible for destruction.
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
 *
 * The parked list is capped at {@link MAX_PARKED_EVICTED_PAIRS}: when parking
 * the newly evicted pair would exceed the cap, the OLDEST parked pair is
 * destroyed (and removed from the list) first. That pair was evicted long
 * enough ago to have drained its in-flight requests, so destroying it only
 * closes idle sockets. The freshly evicted pair is never destroyed here.
 */
const evictLruAgentPair = (): void => {
    const oldestKey = cachedAgentPairs.keys().next().value;
    if (oldestKey !== undefined) {
        const evicted = cachedAgentPairs.get(oldestKey);
        cachedAgentPairs.delete(oldestKey);
        if (evicted !== undefined) {
            if (parkedEvictedPairs.length >= MAX_PARKED_EVICTED_PAIRS) {
                const oldestParked = parkedEvictedPairs.shift();
                if (oldestParked !== undefined) {
                    oldestParked.httpAgent.destroy();
                    oldestParked.httpsAgent.destroy();
                }
            }
            parkedEvictedPairs.push(evicted);
        }
    }
};

/**
 * Destroys every keep-alive agent pair the transport holds: every cached
 * custom agent pair, every pair evicted while requests may still have been
 * in flight, and the shared default `http`/`https` pair bound to
 * `axiosClient`. Clears the cache so long-lived processes can release
 * sockets on demand — including the default path's idle sockets, which
 * would otherwise linger until the upstream keep-alive timeout closes
 * them. Intended for tests and explicit teardown.
 *
 * The default pair is rebuilt lazily: the next request re-creates fresh
 * default agents and rebinds `axiosClient` to them (see
 * {@link ensureDefaultAgents}), so the default path keeps working after a
 * teardown without allocating anything at teardown time.
 *
 * **Must not be called while requests are in-flight — whether they use
 * default or customized agents.** The agents are shared across requests
 * with identical `maxSockets`/`maxFreeSockets` bounds, so destroying them
 * closes the underlying sockets and can fail concurrent requests that are
 * still draining over those sockets. Call this only after all in-flight
 * requests have settled (for example in a shutdown hook that has awaited
 * the final request, or in test teardown after the test's assertions).
 * Calling it twice is safe (the second call iterates an empty cache and
 * skips the already-destroyed default pair until a request rebuilds it).
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
    if (!defaultAgentsTornDown) {
        defaultHttpAgent.destroy();
        defaultHttpsAgent.destroy();
        defaultAgentsTornDown = true;
    }
};

/**
 * Builds (or reuses) the keep-alive agents for one request's socket bounds.
 *
 * When the caller leaves `maxSockets`/`maxFreeSockets` unset the shared
 * module-level agents are reused, so the default path allocates nothing and
 * every instance keeps competing for the same warm pool — rebuilt first if
 * {@link destroyCachedAgents} tore the previous pair down. Supplying either
 * bound constructs dedicated agents, but identical configurations now share
 * one cached agent pair (bounded by `MAX_CACHED_AGENT_PAIRS`) so
 * repeated requests with the same socket settings reuse warm sockets instead
 * of leaking a fresh agent pair per request. LRU entries are evicted
 * (dropped from the cache without destroying their agents, which may still
 * carry in-flight requests) when the cap is reached.
 *
 * A defined-but-invalid bound (non-finite, non-integer, or negative) throws a
 * `TypeError`, matching the transport's handling of `timeout`: a typo like
 * `maxSockets: 2.5` is a caller bug that must surface, not silently coerce to
 * a default.
 *
 * @param maxSockets - Upper bound on concurrent sockets, when customized.
 * @param maxFreeSockets - Upper bound on retained idle sockets, when customized.
 * @returns The agents to send the request with.
 * @throws A `TypeError` when either bound is defined but not a finite,
 * non-negative integer.
 */
export const resolveAgents = (
    maxSockets: number | undefined,
    maxFreeSockets: number | undefined
): { httpAgent: http.Agent; httpsAgent: https.Agent } => {
    // Runs once per dispatched request (through resolveRequestOptions), so
    // a teardown's lazy default-pair/axiosClient rebuild always happens
    // before the attempt loop dispatches.
    ensureDefaultAgents();
    if (maxSockets === undefined && maxFreeSockets === undefined) {
        return { httpAgent: defaultHttpAgent, httpsAgent: defaultHttpsAgent };
    }
    const normalizeSockets = (value: number | undefined, fallback: number, min: number): number => {
        if (value === undefined) {
            return fallback;
        }
        if (!Number.isFinite(value) || !Number.isInteger(value) || value < 0) {
            throw new TypeError(
                `Invalid socket bound ${value}: maxSockets/maxFreeSockets must be finite, non-negative integers.`
            );
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
