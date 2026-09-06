/**
 * Retry policy resolution, backoff math, and retry-budget state.
 *
 * Owns the default retry policy, the partial-policy resolver, the
 * `Retry-After` header parser, the exponential-backoff cap and full-jitter
 * helpers, the per-error-class retry-delay matrix, and the rolling
 * per-window retry-budget state machine. The budget state lives in a
 * module-level `WeakMap` keyed by a stable per-client owner so existing
 * tests construct isolated state by passing distinct owner objects, without
 * any API change.
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
 *   transient transport condition.
 * - `AniLinkApiError` (HTTP-level) retries on 429 (honoring `Retry-After`)
 *   and on any `retryOnStatus` code.
 * - `AniLinkNetworkError` retries on network/timeout failures when
 *   `retryOnNetworkError` is set, but never on `ABORTED`.
 * - `AniLinkAuthError` and `AniLinkValidationError` are never retried.
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
                getRetryAfterDelay(rawError) ??
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
                getRetryAfterDelay(rawError) ??
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
 * Shared retry-budget state, keyed on a stable per-client owner like
 * {@link circuitStates}. Only populated when a request opts in via
 * `retryBudget`.
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
