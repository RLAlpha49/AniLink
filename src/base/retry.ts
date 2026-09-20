/**
 * Retry policy resolution, backoff math, and retry-budget state.
 *
 * Owns the default retry policy, the partial-policy resolver, the
 * `Retry-After` header parser, the exponential-backoff cap and full-jitter
 * helpers, the per-error-class retry-delay matrix, and the rolling
 * per-window retry-budget state machine (including the window gate that
 * surfaces server-dictated delays outlasting the remaining window). The
 * budget state lives in a module-level `WeakMap` keyed by a stable
 * per-client owner (the shared object threaded through the provider
 * wiring, so the budget spans every operation of one client) so existing
 * tests construct isolated state by passing distinct owner objects,
 * without any API change.
 */
import { randomInt } from "node:crypto";
import axios from "axios";
import {
    AniLinkApiError,
    AniLinkError,
    AniLinkErrorCodes,
    AniLinkGraphQLError,
    AniLinkNetworkError,
} from "./AniLinkError";
import type { RetryBudget, RetryPolicy } from "./transportTypes";

/** The maximum time a `Retry-After` header may delay a retry. */
const MAX_RETRY_AFTER_MS = 60_000;

const DEFAULT_RETRY_POLICY: Required<Pick<RetryPolicy, "jitter">> & RetryPolicy = {
    maxRetries: 3,
    baseDelayMs: 250,
    maxDelayMs: 5_000,
    retryOnStatus: [429, 500, 502, 503, 504],
    retryOnNetworkError: true,
    jitter: true,
};

/**
 * Merges a caller's partial retry setting over the built-in default policy.
 *
 * `false` disables retries entirely (`null`); `undefined` and `true` return
 * a copy of the defaults; a partial object fills only the fields it sets,
 * with `undefined`-valued fields dropped so they cannot shadow a default.
 * The returned {@link RetryPolicy} is always complete, so the retry loop
 * never branches on missing fields.
 *
 * @param retry - The caller's retry setting: disabled, default, or a partial policy.
 * @returns The complete policy, or `null` when retries are disabled.
 */
export const resolveRetryPolicy = (
    retry: boolean | Partial<RetryPolicy> | undefined
): RetryPolicy | null => {
    if (retry === false) {
        return null;
    }
    if (retry === undefined || retry === true) {
        return { ...DEFAULT_RETRY_POLICY };
    }
    const filtered: Partial<RetryPolicy> = {};
    for (const [key, value] of Object.entries(retry)) {
        if (value !== undefined) {
            (filtered as Record<string, unknown>)[key] = value;
        }
    }
    return { ...DEFAULT_RETRY_POLICY, ...filtered };
};

/**
 * Parses a `Retry-After` header into the delay to wait, in milliseconds.
 *
 * Both documented formats are supported: delay-seconds (`"120"`) and
 * HTTP-date (resolved against `now`, which is injectable for tests). The
 * result is clamped to `[0, MAX_RETRY_AFTER_MS]` so a hostile value cannot
 * park a caller indefinitely; absent, empty, and unparseable headers return
 * `null` so the caller falls back to client-chosen backoff.
 *
 * @param header - The raw `Retry-After` header value, when present.
 * @param now - The current time in milliseconds, for HTTP-date values.
 * @returns The clamped delay in milliseconds, or `null` when the header is absent or unparseable.
 */
export const parseRetryAfter = (header: string | undefined, now: number): number | null => {
    if (header === undefined || header === null || header === "") {
        return null;
    }

    const seconds = Number(header);
    if (Number.isFinite(seconds) && seconds >= 0) {
        return Math.min(seconds * 1000, MAX_RETRY_AFTER_MS);
    }

    const date = Date.parse(header);
    if (Number.isFinite(date)) {
        return Math.max(0, Math.min(date - now, MAX_RETRY_AFTER_MS));
    }

    return null;
};

const getRetryAfterDelay = (error: unknown): number | null => {
    if (axios.isAxiosError(error)) {
        const header = error.response?.headers?.["retry-after"];
        if (typeof header === "string" || header === undefined) {
            return parseRetryAfter(header, Date.now());
        }
    }
    return null;
};

/**
 * The un-clamped milliseconds a `Retry-After` header dictates, when the raw
 * error carries one.
 *
 * Unlike {@link getRetryAfterDelay}, the delay is not capped at
 * {@link MAX_RETRY_AFTER_MS}: the retry-budget window gate must compare the
 * *true* server-dictated delay against the window's remaining time, so a
 * `Retry-After: 120` against a window with 90s left surfaces immediately
 * instead of retrying into a clamped 60-second hop that re-hits the 429 and
 * spends another budget unit. The clamped value remains what the caller
 * actually sleeps (see {@link getRetryDelay}).
 *
 * @param error - The raw thrown value, for `Retry-After` extraction.
 * @returns The un-clamped delay in milliseconds, or `null` when the raw
 * error carries no parseable `Retry-After` header.
 */
const getUnclampedRetryAfterDelay = (error: unknown): number | null => {
    if (axios.isAxiosError(error)) {
        const header = error.response?.headers?.["retry-after"];
        if (typeof header === "string" || header === undefined) {
            const seconds = Number(header);
            if (header !== "" && Number.isFinite(seconds) && seconds >= 0) {
                return seconds * 1000;
            }
            const date = Date.parse(header);
            if (Number.isFinite(date)) {
                return Math.max(0, date - Date.now());
            }
        }
    }
    return null;
};

/**
 * Derives a server-dictated retry delay from an error's own rate-limit
 * metadata.
 *
 * A GraphQL-envelope 429 arrives as an HTTP 200: axios resolves, the envelope
 * unwrapper throws, and the raw thrown value is the normalized error itself —
 * no Axios error exists to carry a `Retry-After` header. The envelope's
 * `x-ratelimit-reset` header (threaded onto the error as `rateLimit.reset`)
 * is the deadline `Retry-After` would have communicated, so the delay is
 * computed from it instead: the epoch-second reset deadline converted to
 * milliseconds, clamped to `[0, MAX_RETRY_AFTER_MS]` like
 * {@link parseRetryAfter}.
 *
 * The same metadata is attached to HTTP-level 429s (parsed from the
 * `x-ratelimit-*` response headers), so an HTTP 429 that carries the reset
 * deadline but no `Retry-After` header waits for the window reset too,
 * instead of retrying on short backoff against a window that may be
 * minutes away.
 *
 * @param error - The normalized 429 carrying rate-limit metadata.
 * @returns The delay until the rate-limit window resets, or `null` when the error carries no rate-limit metadata.
 */
const getRateLimitResetDelay = (error: AniLinkApiError): number | null => {
    if (error.rateLimit === undefined) {
        return null;
    }
    return Math.max(0, Math.min(error.rateLimit.reset * 1000 - Date.now(), MAX_RETRY_AFTER_MS));
};

/**
 * The un-clamped milliseconds until an error's rate-limit window resets.
 *
 * Unlike {@link getRateLimitResetDelay}, the deadline is not capped at
 * {@link MAX_RETRY_AFTER_MS}: the retry-budget window gate must compare the
 * *true* reset deadline against the window's remaining time, so a reset
 * that genuinely outlasts the window surfaces immediately instead of
 * retrying into repeated clamped 60-second hops that each spend a budget
 * unit.
 *
 * @param error - The normalized 429 carrying rate-limit metadata.
 * @returns The un-clamped delay until the rate-limit window resets, or
 * `null` when the error carries no rate-limit metadata.
 */
const getUnclampedRateLimitResetDelay = (error: AniLinkApiError): number | null => {
    if (error.rateLimit === undefined) {
        return null;
    }
    return Math.max(0, error.rateLimit.reset * 1000 - Date.now());
};

/**
 * Computes the server-dictated delay for a 429, when one exists: the
 * `Retry-After` header when the raw error carries one, otherwise the
 * error's own `rateLimit.reset` metadata (present on both HTTP-level and
 * GraphQL-envelope 429s).
 *
 * This is the single source of the server-dictated delay: both the
 * retry-budget window gate in {@link computeNextRetryDelay} and the
 * per-error-class matrix in {@link getRetryDelay} call it, so the gate can
 * never disagree with the delay actually slept.
 *
 * @param error - The normalized 429.
 * @param rawError - The raw thrown value, for `Retry-After` extraction.
 * @returns The server-dictated delay in milliseconds, or `null` when the
 * server dictated none (the candidate delay falls back to client-chosen
 * backoff).
 */
const getServerDictatedDelay = (error: AniLinkApiError, rawError: unknown): number | null =>
    getRetryAfterDelay(rawError) ?? getRateLimitResetDelay(error);

/**
 * Computes the raw exponential backoff cap for an attempt.
 *
 * @param attempt - The zero-based index of the attempt that just failed.
 * @param policy - The active retry policy.
 * @returns The un-jittered delay cap in milliseconds.
 */
export const getBackoffDelay = (attempt: number, policy: RetryPolicy): number =>
    Math.min(policy.baseDelayMs * 2 ** attempt, policy.maxDelayMs);

/**
 * Applies full jitter to a computed backoff cap: the returned wait is a
 * uniformly random value in `[0, cap]`, which spreads out retries from
 * concurrent clients instead of synchronizing them.
 *
 * @param cap - The un-jittered delay cap in milliseconds.
 * @param policy - The active retry policy.
 * @returns The delay to wait before the next retry, in milliseconds.
 */
export const applyJitter = (cap: number, policy: RetryPolicy): number =>
    policy.jitter === false ? cap : randomInt(0, cap + 1);

/**
 * Computes the delay before the next retry, or `null` when the request should
 * not be retried. `Retry-After` delays are returned un-jittered because the
 * server dictates them.
 *
 * The retry matrix is explicit per error class:
 * - `AniLinkGraphQLError` (a subclass of `AniLinkApiError` thrown from a 200
 *   envelope) retries only when its upstream status is retryable (429 or a
 *   `retryOnStatus` code extracted from the GraphQL error entry). A GraphQL
 *   error with no upstream status (envelope default 200) is not retried,
 *   because it represents a permanent query/validation failure, not a
 *   transient transport condition. A GraphQL 429's delay comes from the
 *   error's own `rateLimit.reset` metadata (the envelope's
 *   `x-ratelimit-reset` header): the raw thrown value is the error itself,
 *   so no Axios error carries a `Retry-After` header to read.
 * - `AniLinkApiError` (HTTP-level) retries on 429 (honoring `Retry-After`,
 *   or the error's `rateLimit.reset` metadata when the header is absent)
 *   and on any `retryOnStatus` code.
 * - `AniLinkNetworkError` retries on network/timeout failures when
 *   `retryOnNetworkError` is set, but never on `ABORTED`.
 * - `AniLinkAuthError` and `AniLinkValidationError` are never retried.
 *
 * @param error - The normalized failure for the attempt.
 * @param rawError - The raw thrown value, for `Retry-After` extraction.
 * @param attempt - The zero-based index of the attempt that just failed.
 * @param policy - The active retry policy.
 * @returns The delay to wait in milliseconds, or `null` when the failure must not be retried.
 */
export const getRetryDelay = (
    error: AniLinkError,
    rawError: unknown,
    attempt: number,
    policy: RetryPolicy
): number | null => {
    if (attempt >= policy.maxRetries) {
        return null;
    }

    if (error instanceof AniLinkGraphQLError) {
        if (error.status === 429) {
            return (
                getServerDictatedDelay(error, rawError) ??
                applyJitter(getBackoffDelay(attempt, policy), policy)
            );
        }
        if (policy.retryOnStatus.includes(error.status)) {
            return applyJitter(getBackoffDelay(attempt, policy), policy);
        }
        // No upstream status (envelope 200): a permanent GraphQL failure,
        // not a transient transport condition.
        return null;
    }

    if (error instanceof AniLinkApiError) {
        if (error.status === 429) {
            return (
                getServerDictatedDelay(error, rawError) ??
                applyJitter(getBackoffDelay(attempt, policy), policy)
            );
        }
        if (policy.retryOnStatus.includes(error.status)) {
            return applyJitter(getBackoffDelay(attempt, policy), policy);
        }
        return null;
    }

    if (error instanceof AniLinkNetworkError) {
        if (error.code === AniLinkErrorCodes.ABORTED) {
            return null;
        }
        if (policy.retryOnNetworkError) {
            return applyJitter(getBackoffDelay(attempt, policy), policy);
        }
    }

    return null;
};

/**
 * The inputs to {@link computeNextRetryDelay}: everything the retry-delay
 * decision needs, so the retry loop itself stays free of delay branching.
 */
export interface RetryDelayInput {
    /** The normalized failure for the attempt. */
    normalized: AniLinkError;
    /** The raw thrown value, used for `Retry-After` extraction. */
    rawError: unknown;
    /** The zero-based index of the attempt that just failed. */
    attempt: number;
    /** The active retry policy, or `null` when retries are disabled. */
    policy: RetryPolicy | null;
    /** The live retry-budget window, when a budget is configured. */
    budgetState: RetryBudgetState | undefined;
    /** The configured budget, when one is set. */
    budget: RetryBudget | undefined;
    /** Whether the failed attempt was the reserved half-open breaker probe. */
    wasProbe: boolean;
}

/**
 * Computes the delay before the next retry, or `null` when the request must
 * surface the failure instead. Four gates run before the per-error-class
 * matrix in {@link getRetryDelay}: a failed half-open probe surfaces
 * immediately (retrying would fast-fail against the still-open breaker), a
 * disabled policy never retries, an exhausted retry budget surfaces the
 * failure without spending another retry, and a server-dictated delay (a
 * `Retry-After` header, or the `rateLimit.reset` metadata carried by both
 * HTTP-level and GraphQL-envelope 429s) longer than the budget window's
 * remaining time surfaces the failure instead of sleeping past the window
 * the budget was configured to bound.
 *
 * The window gate applies only to server-dictated delays — the only
 * candidate delays that can park a caller for up to a full minute per
 * retry. Client-chosen jittered backoff delays are never gated by the
 * window: they are already bounded by the policy's `maxDelayMs` cap, so they
 * cannot stretch one window's retry spend across many minutes of
 * wall-clock waits. The gate compares the *un-clamped* server-dictated
 * deadline (see `getUnclampedRetryAfterDelay` and
 * `getUnclampedRateLimitResetDelay`): a delay that genuinely outlasts
 * the window surfaces immediately, instead of retrying into repeated
 * clamped 60-second hops that each spend a budget unit. Like the count gate,
 * the window gate requires both halves of the budget (the live state and
 * the configuration) and spends no budget unit when it surfaces the
 * failure.
 *
 * @param input - The decision inputs; see {@link RetryDelayInput}.
 * @returns The delay in milliseconds, or `null` to stop retrying.
 */
export const computeNextRetryDelay = (input: RetryDelayInput): number | null => {
    const { normalized, rawError, attempt, policy, budgetState, budget, wasProbe } = input;
    if (wasProbe || policy === null) {
        return null;
    }
    if (
        budgetState !== undefined &&
        budget !== undefined &&
        budgetState.retriesUsed >= budget.maxRetriesPerWindow
    ) {
        // Budget exhausted: surface the failure without retrying.
        return null;
    }
    if (
        budgetState !== undefined &&
        budget !== undefined &&
        normalized instanceof AniLinkApiError &&
        normalized.status === 429
    ) {
        // A 429 is the only error class whose candidate delay comes from the
        // server — via the `Retry-After` header, or via the `rateLimit.reset`
        // metadata carried by both HTTP-level and GraphQL-envelope 429s — so
        // it is the only delay that can be checked against the window before
        // the matrix runs. When the server-dictated delay would still be
        // sleeping after the window ends, it has outlasted the retry spend
        // the budget was configured to bound: surface instead of parking
        // the caller past the window.
        //
        // The comparison uses the un-clamped server-dictated deadline: the
        // clamped delay (capped at MAX_RETRY_AFTER_MS) is what the caller
        // actually sleeps, but a delay that genuinely outlasts the window
        // must surface now — otherwise each clamped 60-second hop spends a
        // budget unit and re-hits the 429, stretching one window's spend
        // across many minutes of wall-clock waits.
        const serverDictatedDelay =
            getUnclampedRetryAfterDelay(rawError) ?? getUnclampedRateLimitResetDelay(normalized);
        if (
            serverDictatedDelay !== null &&
            serverDictatedDelay > budgetState.windowEndsAt - Date.now()
        ) {
            return null;
        }
    }
    return getRetryDelay(normalized, rawError, attempt, policy);
};

/**
 * Whether a failure that surfaced without a retry did so because of the
 * retry-budget count gate — the failure was retryable (the per-class matrix
 * in {@link getRetryDelay} would have returned a delay), but the window's
 * retry spend was already used up.
 *
 * This is the precise condition behind the `budgetExhausted` fact on the
 * terminal `onError` report: `computeNextRetryDelay` returns `null` for four
 * disjoint reasons (a failed probe, a disabled policy, the budget gate, and
 * a non-retryable error class), and only the budget gate should carry the
 * flag. A never-retryable failure (a validation error, an auth error, a
 * status-less GraphQL envelope) that happens to land while the shared
 * budget is spent must not be miscounted as chronic budget exhaustion.
 *
 * @param input - The same decision inputs {@link computeNextRetryDelay}
 * received for the failed attempt.
 * @returns `true` when the budget count gate is what surfaced the failure.
 */
export const isBudgetGatedFailure = (input: RetryDelayInput): boolean => {
    const { normalized, rawError, attempt, policy, budgetState, budget, wasProbe } = input;
    // A probe failure or a disabled policy surfaces for its own reason,
    // never the budget's; without both budget halves there is no budget gate.
    if (wasProbe || policy === null) {
        return false;
    }
    if (budgetState === undefined || budget === undefined) {
        return false;
    }
    if (budgetState.retriesUsed < budget.maxRetriesPerWindow) {
        // The count gate did not fire; whatever surfaced this failure, it
        // was not the budget.
        return false;
    }
    // The count gate fired. It is the reason only when the failure would
    // otherwise have been retried: the per-class matrix must return a delay
    // for this attempt (a retryable class, within the policy's retry cap).
    return getRetryDelay(normalized, rawError, attempt, policy) !== null;
};

/**
 * Shared retry-budget state, keyed on a stable per-client owner like the
 * circuit breaker's `circuitStates` map. Only populated when a request opts
 * in via `retryBudget`.
 *
 * @see {@link RetryBudget}
 */
export interface RetryBudgetState {
    /** Retries spent in the current window. */
    retriesUsed: number;
    /** Epoch milliseconds at which the current window ends and resets. */
    windowEndsAt: number;
}

const retryBudgetStates = new WeakMap<object, RetryBudgetState>();

/**
 * Returns the live retry-budget window for the caller, rolling it forward to
 * a fresh window when the previous one has elapsed.
 *
 * The window is **fixed**, not sliding: it is anchored to the first failure
 * after the previous window elapsed, and resets completely when
 * `windowEndsAt` passes. A burst of failures at adjacent window edges can
 * therefore spend up to `2 x maxRetriesPerWindow` retries within one
 * `windowMs` of wall-clock time (the tail of one window plus the head of
 * the next). This is the documented trade-off for the O(1) single-counter
 * accounting; consumers that need a strict sliding-window bound should size
 * `maxRetriesPerWindow` for the worst-case edge burst.
 *
 * @param owner - The caller's transport-settings object.
 * @param budget - The configured budget, when enabled.
 * @returns The mutable budget state, or `undefined` when the budget is disabled.
 */
export const getRetryBudgetState = (
    owner: object | undefined,
    budget: RetryBudget | undefined
): RetryBudgetState | undefined => {
    if (owner === undefined || budget === undefined) {
        return undefined;
    }
    let state = retryBudgetStates.get(owner);
    if (state === undefined) {
        state = { retriesUsed: 0, windowEndsAt: 0 };
        retryBudgetStates.set(owner, state);
    }
    if (Date.now() >= state.windowEndsAt) {
        state.retriesUsed = 0;
        state.windowEndsAt = Date.now() + budget.windowMs;
    }
    return state;
};

/**
 * Returns the recorded retry-budget window for one owner without rolling
 * it forward — the read-only counterpart of {@link getRetryBudgetState} used
 * by transport-state snapshots. Unlike {@link getRetryBudgetState}, reading
 * through this helper never resets `retriesUsed` or re-anchors
 * `windowEndsAt`, so snapshotting an elapsed window reports the spent state
 * as-is instead of silently granting a fresh window; an owner with no
 * recorded state yields `undefined` without allocating one.
 *
 * @param owner - The caller's transport-settings object.
 * @returns The recorded budget state, or `undefined` when none exists.
 */
export const peekRetryBudgetState = (owner: object): RetryBudgetState | undefined =>
    retryBudgetStates.get(owner);
