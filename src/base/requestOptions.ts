/**
 * Resolved transport options and the option normalizer.
 *
 * {@link resolveRequestOptions} folds a partial public {@link RequestOptions}
 * into the complete, validated set the request pipeline uses for one call:
 * it resolves the retry policy, the keep-alive agents, the pacing and
 * rate-limit-floor defaults, and forwards every hook. The
 * {@link ResolvedRequestOptions} interface is the shared shape every
 * resilience module (errors, pacing, circuit breaker, retry loop) reads
 * from, so it lives here rather than in `transportTypes` to keep the type
 * next to the resolver and avoid pulling runtime agents into the leaf type
 * module.
 */
import type http from "node:http";
import type https from "node:https";
import type { ResponseCache } from "./responseCache";
import {
    type OnCircuitCloseHandler,
    type OnCircuitOpenHandler,
    type OnErrorHandler,
    type OnHookErrorHandler,
    type OnPaceHandler,
    type OnRequestStartHandler,
    type OnResponseHandler,
    type RequestOptions,
    type RetryBudget,
    type RetryPolicy,
    DEFAULT_REQUEST_TIMEOUT,
} from "./transportTypes";
import { resolveAgents } from "./agents";
import { resolveRetryPolicy } from "./retry";

export interface ResolvedRequestOptions {
    timeout: number;
    signal?: AbortSignal;
    exposeRawAxiosError: boolean;
    retry: RetryPolicy | null;
    paceWithRateLimit: boolean;
    rateLimitFloor: number;
    circuitBreaker?: { threshold: number; cooldownMs: number };
    retryBudget?: RetryBudget;
    httpAgent: http.Agent;
    httpsAgent: https.Agent;
    onError?: OnErrorHandler;
    onRetry?: OnErrorHandler;
    onRequestStart?: OnRequestStartHandler;
    onResponse?: OnResponseHandler;
    onPace?: OnPaceHandler;
    onHookError?: OnHookErrorHandler;
    onCircuitOpen?: OnCircuitOpenHandler;
    onCircuitClose?: OnCircuitCloseHandler;
    ignorePaceDeadline: boolean;
    responseCache?: ResponseCache;
}

/**
 * Resolves partial transport settings into the complete set used by one
 * request pipeline.
 *
 * Passing no options restores the defaults. A timeout of zero is valid because
 * Axios uses it to disable its timeout.
 *
 * @param options - Optional transport configuration.
 * @returns The fully resolved options.
 * @throws A `TypeError` when `timeout` is negative or not finite.
 */
export const resolveRequestOptions = (options: RequestOptions = {}): ResolvedRequestOptions => {
    const timeout = options.timeout ?? DEFAULT_REQUEST_TIMEOUT;

    if (!Number.isFinite(timeout) || timeout < 0) {
        throw new TypeError("timeout must be a finite number greater than or equal to 0");
    }

    const agents = resolveAgents(options.maxSockets, options.maxFreeSockets);

    return {
        timeout,
        signal: options.signal,
        exposeRawAxiosError: options.exposeRawAxiosError ?? false,
        retry: resolveRetryPolicy(options.retry),
        paceWithRateLimit: options.paceWithRateLimit ?? true,
        rateLimitFloor: Math.max(1, options.rateLimitFloor ?? 1),
        circuitBreaker: options.circuitBreaker,
        retryBudget: options.retryBudget,
        httpAgent: agents.httpAgent,
        httpsAgent: agents.httpsAgent,
        onError: options.onError,
        onRetry: options.onRetry,
        onRequestStart: options.onRequestStart,
        onResponse: options.onResponse,
        onPace: options.onPace,
        onHookError: options.onHookError,
        onCircuitOpen: options.onCircuitOpen,
        onCircuitClose: options.onCircuitClose,
        ignorePaceDeadline: options.ignorePaceDeadline ?? false,
        responseCache: options.responseCache,
    };
};
