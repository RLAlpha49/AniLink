/**
 * Provider-agnostic transport entry point and public re-export facade.
 *
 * This module is the stable public surface of the shared transport: it
 * re-exports the option/hook types and constants from `./transportTypes`,
 * the keep-alive agent cache from `./agents`, the GraphQL envelope unwrapping
 * from `./envelope`, and the retry math from `./retry`, and it owns the
 * request pipeline itself (`executeWithRetry` and {@link sendRequest}) plus
 * the auth-scoped response-cache wiring. The resilience mechanisms (retry
 * budget, circuit breaker, rate-limit pacing, error normalization, hook
 * invocation) live in their own cohesive modules so each is independently
 * reviewable; consumers keep importing every symbol from `./RequestHandler`
 * unchanged.
 */
import { createHash, randomUUID } from "node:crypto";
import type { AxiosResponse } from "axios";
import { AniLinkAuthError } from "./AniLinkError";
import {
    type HttpMethod,
    type RequestAuth,
    type RequestAuthInput,
    type RequestOptions,
} from "./transportTypes";
import { resolveRequestOptions, type ResolvedRequestOptions } from "./requestOptions";
import { axiosClient } from "./agents";
import { unwrapGraphQLResponse } from "./envelope";
import { getRateLimitInfo, normalizeRequestError, stampRequestId } from "./errors";
import { computeNextRetryDelay, getRetryBudgetState } from "./retry";
import {
    checkCircuitOpen,
    circuitScopeOf,
    getCircuitState,
    recordCircuitFailure,
    recordCircuitSuccess,
} from "./circuitBreaker";
import { awaitPaceDeadline, paceAfterSuccess, rethrowIfPacingAbort } from "./pacing";
import { buildErrorContext, reportFailure, safeInvoke } from "./hooks";
import { sleep } from "./sleep";

// --- Public type and constant re-exports -----------
export { DEFAULT_REQUEST_TIMEOUT, MAX_FREE_SOCKETS, MAX_SOCKETS } from "./transportTypes";
export type {
    RetryBudget,
    RetryPolicy,
    HttpMethod,
    RequestAuth,
    RequestAuthInput,
    RequestErrorContext,
    OnErrorHandler,
    RequestContext,
    OnRequestStartHandler,
    OnResponseHandler,
    OnPaceHandler,
    OnHookErrorHandler,
    CircuitOpenContext,
    OnCircuitOpenHandler,
    OnCircuitCloseHandler,
    RequestOptions,
} from "./transportTypes";
export { destroyCachedAgents } from "./agents";
export type { GraphQLResponseEnvelope } from "./envelope";
export { unwrapSingleRootField, unwrapGraphQLResponse } from "./envelope";
export { parseRetryAfter, getBackoffDelay, applyJitter } from "./retry";

interface ExecuteOptions {
    url: string;
    method: HttpMethod;
    data?: object;
    headers: Record<string, string>;
}

const executeWithRetry = async <T>(
    options: ExecuteOptions,
    resolved: ResolvedRequestOptions,
    stateOwner?: object,
    rawPassthrough = false
): Promise<T> => {
    const { url, method, data, headers } = options;
    const policy = resolved.retry;
    // Correlation ID joining every lifecycle hook emission for this logical
    // request (including across retries) in a metrics or logging backend.
    // Generated before `circuitScopeOf` so an unparseable-URL validation
    // error thrown from that call can still be correlated to this request.
    const requestId = randomUUID();
    const host = circuitScopeOf(url, requestId);
    const circuit =
        resolved.circuitBreaker !== undefined && stateOwner !== undefined
            ? getCircuitState(stateOwner, host)
            : undefined;
    const budgetState = getRetryBudgetState(stateOwner, resolved.retryBudget);
    let attempt = 0;

    for (;;) {
        const startedAt = Date.now();
        const hookContext = { requestId, url, method, attempt: attempt + 1 };
        const circuitError = checkCircuitOpen(circuit, resolved.circuitBreaker);
        if (circuitError !== undefined) {
            safeInvoke(
                resolved.onRequestStart,
                "onRequestStart",
                resolved.onHookError,
                hookContext
            );
            stampRequestId(circuitError, requestId);
            safeInvoke(
                resolved.onError,
                "onError",
                resolved.onHookError,
                circuitError,
                buildErrorContext(requestId, url, method, attempt + 1, circuitError)
            );
            throw circuitError;
        }
        try {
            await awaitPaceDeadline(stateOwner, host, resolved, hookContext);
        } catch (paceError) {
            // A caller abort during the pre-dispatch pacing wait carries no
            // upstream-health signal. When the reserved half-open probe is
            // aborted here, the breaker closes — matching the axios-cancel
            // path, where the same abort also closes it — instead of
            // re-opening with a fresh cooldown that punishes the caller with
            // a fast-fail window for an abort that says nothing about the
            // upstream.
            if (circuit !== undefined && circuit.probeInFlight) {
                recordCircuitSuccess(circuit, resolved, hookContext, host);
            }
            throw paceError;
        }
        safeInvoke(resolved.onRequestStart, "onRequestStart", resolved.onHookError, hookContext);
        let responseReported = false;
        try {
            const response: AxiosResponse = await axiosClient({
                url,
                method,
                data,
                headers,
                timeout: resolved.timeout,
                signal: resolved.signal,
                httpAgent: resolved.httpAgent,
                httpsAgent: resolved.httpsAgent,
            });
            const rateLimit = getRateLimitInfo(response.headers as Record<string, unknown>);
            safeInvoke(resolved.onResponse, "onResponse", resolved.onHookError, {
                ...hookContext,
                durationMs: Date.now() - startedAt,
                ...(rateLimit !== undefined ? { rateLimit } : {}),
            });
            responseReported = true;
            const result = rawPassthrough
                ? (response.data as T)
                : unwrapGraphQLResponse<T>(
                      response.data,
                      response.headers as Record<string, unknown>
                  );
            recordCircuitSuccess(circuit, resolved, hookContext, host);
            await paceAfterSuccess(response, resolved, hookContext, rateLimit, stateOwner, host);
            return result;
        } catch (error: unknown) {
            rethrowIfPacingAbort(resolved, error);
            if (!responseReported) {
                safeInvoke(resolved.onResponse, "onResponse", resolved.onHookError, {
                    ...hookContext,
                    durationMs: Date.now() - startedAt,
                });
            }
            const normalized = normalizeRequestError(resolved, error, rawPassthrough, requestId);
            const wasProbe = circuit?.probeInFlight === true;
            recordCircuitFailure(
                circuit,
                resolved.circuitBreaker,
                normalized,
                resolved,
                hookContext,
                host
            );
            const delay = computeNextRetryDelay({
                normalized,
                rawError: error,
                attempt,
                policy,
                budgetState,
                budget: resolved.retryBudget,
                wasProbe,
            });
            if (delay !== null && budgetState !== undefined) {
                budgetState.retriesUsed += 1;
            }
            reportFailure(
                requestId,
                url,
                method,
                attempt + 1,
                normalized,
                resolved,
                delay ?? undefined
            );
            if (delay === null) {
                throw normalized;
            }
            attempt += 1;
            await sleep(delay, resolved.signal, requestId);
        }
    }
};

/**
 * Trailing options for {@link sendRequest}, replacing the former positional
 * rest tuple so call sites name their arguments and new options can be added
 * without reordering.
 *
 * @see {@link sendRequest}
 */
export interface SendRequestOptions {
    /** Whether the operation requires an authentication token; the request fails fast with an {@link AniLinkAuthError} when set and no auth material is configured. */
    requiresAuth?: boolean;
    /** Per-request {@link RequestOptions}; when omitted, library defaults apply (30 second timeout, automatic retries under the default policy, proactive rate-limit pacing, no hooks). */
    options?: RequestOptions;
    /** Optional operation name included in missing-token auth errors. */
    operation?: string;
    /**
     * The wire protocol of the request, which selects response interpretation
     * and error classification explicitly instead of inferring it from
     * `contentType`. `"graphql"` (the default) unwraps the GraphQL response
     * envelope and classifies HTTP failures as {@link AniLinkApiError};
     * `"rest"` returns the parsed body verbatim and classifies HTTP failures
     * as {@link AniLinkRestError}. When omitted, the protocol is inferred from
     * `contentType` for backwards compatibility: a set `contentType` implies
     * `"rest"`, an unset one implies `"graphql"`.
     */
    protocol?: "graphql" | "rest";
    /**
     * Optional `Content-Type` header override for non-GraphQL endpoints — for
     * example form-urlencoded OAuth token requests, or `application/json` for
     * REST calls. This is purely a header concern; response interpretation
     * and error classification are controlled by `protocol`.
     */
    contentType?: string;
    /**
     * Stable per-client object used to key cross-request transport state (the
     * circuit breaker and retry budget). Operation dispatch passes the
     * operation instance; direct callers that reuse one transport-settings
     * object can omit this, in which case the `circuitBreaker`/
     * `retryBudget` configuration object itself keys the state. Passing a
     * fresh object per request prevents breaker state from ever accumulating.
     */
    stateOwner?: object;
}

/**
 * Sends a request to the specified URL.
 *
 * This is the provider-agnostic transport entry point. GraphQL callers get
 * envelope unwrapping by leaving `protocol` unset (or `"graphql"`); REST
 * callers pass `protocol: "rest"` (and typically a `contentType`) and
 * receive the parsed body verbatim. HTTP failures on REST calls surface as
 * {@link AniLinkRestError}; GraphQL calls surface as {@link AniLinkApiError}.
 *
 * @typeParam T - The expected response payload type.
 * @param url - The URL to send the request to.
 * @param method - The HTTP method to use ('GET', 'POST', 'PUT', or 'DELETE').
 * @param data - The data to send with the request.
 * @param auth - The authentication material to include in the request headers. A string is treated as a bearer token for backwards compatibility.
 * @param sendOptions - Named trailing options; see {@link SendRequestOptions}.
 * @returns The unwrapped response data. For documents with a single root
 * field this is the bare field value; multi-root-field (or zero-root-field)
 * documents are returned as the full `{ data }` envelope unchanged. Use
 * {@link unwrapGraphQLResponse} for the tolerant rule or
 * {@link unwrapSingleRootField} when a caller needs the strict single-root-field
 * result (`undefined` signals the document did not match). With
 * `protocol: "rest"`, the parsed response body is returned as-is.
 * @throws `AniLinkAuthError` when authentication is required but no auth material is configured.
 * @throws `AniLinkApiError` for an upstream HTTP failure.
 * @throws `AniLinkGraphQLError` for GraphQL errors in an HTTP 200 envelope.
 * @throws `AniLinkNetworkError` for network, timeout, cancellation, or circuit-breaker failures.
 * @see {@link RequestOptions}
 * @see {@link SendRequestOptions}
 */

/**
 * Builds an authentication-safe cache key fragment from a bearer token.
 *
 * The token is SHA-256 hashed (truncated to 16 hex chars) so the raw
 * credential is never stored in the cache key, which lives in memory for up
 * to the cache's TTL. The hash is deterministic, so the same token always
 * maps to the same cache entry, while a different token gets a different
 * entry. When no bearer token is present, the literal `"none"` is used so
 * unauthenticated requests share one cache namespace.
 *
 * @param token - The bearer token, when present.
 * @returns The auth-scoping cache key fragment.
 */
const buildAuthCacheKey = (token: string | undefined): string =>
    token === undefined
        ? "none"
        : `bearer:${createHash("sha256").update(token).digest("hex").slice(0, 16)}`;

/**
 * Computes the auth-scoping key fragment for a cached response, or `undefined`
 * to signal that the request must not be cached.
 *
 * The cache is only safe when every identity that could produce a different
 * response gets a different cache namespace. Bearer tokens are scoped by a
 * SHA-256 hash of the token. When auth material is present through explicit
 * `RequestAuth.headers` (for example a custom `Authorization` header, Basic
 * auth, or a provider API key sent via `X-API-Key`), the header values are
 * not captured by the key, so two different identities would collapse to the
 * same `"none"` namespace and cross-contaminate. In that case the cache is
 * skipped (fail-closed) instead of risking a cross-identity disclosure. This
 * also ensures an unused `auth.token` is never hashed when a custom
 * `Authorization` header takes precedence over the bearer token.
 *
 * @param hasBearerToken - Whether a bearer token was supplied via `auth.token`.
 * @param hasCredentialHeaders - Whether any non-empty explicit `auth.headers` entry is present.
 * @param token - The bearer token, when present.
 * @returns The auth-scoping cache key fragment, or `undefined` to skip caching.
 */
const buildCacheAuthKey = (
    hasBearerToken: boolean,
    hasCredentialHeaders: boolean,
    token: string | undefined
): string | undefined => {
    // Effective credential headers are present but not captured by the key:
    // fail closed instead of collapsing distinct identities to "none". This
    // also avoids hashing an unused bearer token when a custom Authorization
    // header overrides it.
    if (hasCredentialHeaders) {
        return undefined;
    }
    if (hasBearerToken) {
        return buildAuthCacheKey(token);
    }
    return buildAuthCacheKey(undefined);
};

export const sendRequest = async <T = unknown>(
    url: string,
    method: HttpMethod,
    data?: object,
    auth?: RequestAuthInput,
    sendOptions?: SendRequestOptions
): Promise<T> => {
    const {
        requiresAuth = false,
        options,
        operation,
        protocol,
        contentType,
        stateOwner,
    } = sendOptions ?? {};
    const isRestCall = protocol === "rest" || (protocol === undefined && contentType !== undefined);
    const resolvedAuth: RequestAuth | undefined = typeof auth === "string" ? { token: auth } : auth;
    const hasBearerToken = resolvedAuth?.token !== undefined && resolvedAuth.token !== "";
    const hasAuthorizationHeader = Object.entries(resolvedAuth?.headers ?? {}).some(
        ([key, value]) => key.toLowerCase() === "authorization" && value !== ""
    );
    // Any non-empty explicit auth header (custom Authorization, X-API-Key,
    // Basic, etc.) is credential material the cache key does not capture.
    const hasCredentialHeaders = Object.entries(resolvedAuth?.headers ?? {}).some(
        ([, value]) => value !== ""
    );
    const hasAuthMaterial = hasBearerToken || hasAuthorizationHeader;

    if (requiresAuth && !hasAuthMaterial) {
        throw new AniLinkAuthError(operation);
    }

    const headers: Record<string, string> =
        contentType === undefined
            ? {
                  "Content-Type": "application/json",
                  Accept: "application/json",
              }
            : { "Content-Type": contentType };

    Object.assign(headers, resolvedAuth?.headers);

    if (hasBearerToken && !hasAuthorizationHeader) {
        headers.Authorization = `Bearer ${resolvedAuth.token}`;
    }

    const resolved = resolveRequestOptions(options);

    const cacheEnabled = resolved.responseCache !== undefined && method === "GET";
    const cacheAuthKey = cacheEnabled
        ? buildCacheAuthKey(hasBearerToken, hasCredentialHeaders, resolvedAuth?.token)
        : undefined;
    // When effective credential headers are present but not captured by the
    // cache key (for example a custom `Authorization` or `X-API-Key` header),
    // `buildCacheAuthKey` returns `undefined` to fail closed: skip the cache
    // entirely instead of risking a cross-identity disclosure.
    const cacheActive = cacheEnabled && cacheAuthKey !== undefined;

    if (cacheActive) {
        const cached = resolved.responseCache!.get<T>(method, url, data, cacheAuthKey);
        if (cached !== undefined) {
            const requestId = randomUUID();
            const hookContext = { requestId, url, method, attempt: 1 };
            safeInvoke(
                resolved.onRequestStart,
                "onRequestStart",
                resolved.onHookError,
                hookContext
            );
            safeInvoke(resolved.onResponse, "onResponse", resolved.onHookError, {
                ...hookContext,
                durationMs: 0,
                cacheHit: true,
            });
            return cached;
        }
    }

    const result = await executeWithRetry<unknown>(
        { url, method, data, headers },
        resolved,
        stateOwner ?? options,
        isRestCall
    );

    if (cacheActive) {
        resolved.responseCache!.set(method, url, data, cacheAuthKey, result);
    }

    return result as T;
};
