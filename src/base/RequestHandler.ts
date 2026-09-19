/**
 * Provider-agnostic transport entry point and public re-export facade.
 *
 * This module is the stable public surface of the shared transport: it
 * re-exports the option/hook types and constants from `./transportTypes`,
 * the keep-alive agent cache from `./agents`, the GraphQL envelope unwrapping
 * from `./envelope`, and the retry math from `./retry`, and it owns the
 * request pipeline itself (`executeWithRetry` and {@link sendRequest}). The
 * resilience mechanisms (retry budget, circuit breaker, rate-limit pacing,
 * error normalization, hook invocation) and the response-cache policy live
 * in their own cohesive modules so each is independently reviewable;
 * consumers keep importing every symbol from `./RequestHandler` unchanged.
 */
import { randomUUID } from "node:crypto";
import type { AxiosResponse } from "axios";
import { AniLinkAuthError, AniLinkGraphQLError } from "./AniLinkError";
import {
    type DiagnosticsMode,
    type HttpMethod,
    type OnHookErrorHandler,
    type RequestAuth,
    type RequestAuthInput,
    type RequestOptions,
} from "./transportTypes";
import { resolveRequestOptions, type ResolvedRequestOptions } from "./requestOptions";
import { axiosClient } from "./agents";
import { invalidateAfterMutation, resolveCacheAuthKey } from "./responseCache";
import { unwrapGraphQLResponse } from "./envelope";
import { getRateLimitInfo, normalizeRequestError, stampRequestId } from "./errors";
import { computeNextRetryDelay, getRetryBudgetState } from "./retry";
import {
    checkCircuitOpen,
    circuitScopeOf,
    getCircuitState,
    isAvailabilityFailure,
    recordCircuitFailure,
    recordCircuitSuccess,
} from "./circuitBreaker";
import { awaitPaceDeadline, paceAfterSuccess } from "./pacing";
import { buildErrorContext, reportDiagnostic, reportFailure, safeInvoke } from "./hooks";
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
    AniLinkDiagnostic,
    DiagnosticsMode,
    CircuitOpenContext,
    OnCircuitOpenHandler,
    OnCircuitCloseHandler,
    RequestOptions,
} from "./transportTypes";
export { destroyCachedAgents } from "./agents";
export type { GraphQLResponseEnvelope, UnwrapOptions } from "./envelope";
export { unwrapSingleRootField, unwrapGraphQLResponse } from "./envelope";
export { parseRetryAfter, getBackoffDelay, applyJitter } from "./retry";

interface ExecuteOptions {
    url: string;
    method: HttpMethod;
    data?: object | string;
    headers: Record<string, string>;
}

/**
 * Execution modifiers for {@link executeWithRetry}, replacing the former
 * positional trailing booleans so call sites name their arguments.
 *
 * @see {@link executeWithRetry}
 */
interface ExecuteModifiers {
    /** Whether the response body is returned verbatim (REST) instead of unwrapped (GraphQL). */
    rawPassthrough?: boolean;
    /**
     * Whether this request was a cacheable read that missed the response
     * cache: its network-served onResponse emission then carries
     * `cacheHit: false` so consumers can count misses directly instead of
     * subtracting hits from total response counts.
     */
    cacheMiss?: boolean;
}

/**
 * The outcome of one {@link executeWithRetry} dispatch: the resolved value
 * plus whether it came from a partial-success envelope resolved by
 * `allowPartialData`. The partial flag lets {@link sendRequest} keep the
 * degraded result out of the response cache — a later cache hit would
 * replay the data without the `onError` reporting that accompanied the
 * original fetch.
 *
 * @see {@link executeWithRetry}
 */
interface ExecuteOutcome<T> {
    /** The resolved response value. */
    result: T;
    /** Whether the value was resolved from a partial-success GraphQL envelope. */
    resolvedPartial: boolean;
}

/**
 * Resolves one successful attempt's response body into the value the
 * pipeline returns — the raw body for REST passthrough, or the unwrapped
 * GraphQL envelope — accounting for the `allowPartialData` opt-in.
 *
 * When the envelope is a partial success resolved by `allowPartialData`,
 * the error entries surface through the `onError` hook with a fully
 * populated attempt context (a partial resolution is terminal — the data
 * is returned, not retried — so the hook is the only place the failures
 * appear), and the returned `partialAvailabilityFailure` carries the error
 * when its class counts toward the circuit breaker: the caller must
 * account for the degraded upstream exactly as the strict mode's throw
 * would, instead of letting the success path reset the failure streak —
 * otherwise a persistently degraded upstream that always fails one root
 * field keeps the breaker permanently closed under the opt-in while
 * tripping it under strict mode.
 *
 * @param response - The successful Axios response for the attempt.
 * @param resolved - The resolved request options.
 * @param rawPassthrough - Whether the body is returned verbatim (REST)
 * instead of unwrapped (GraphQL).
 * @param requestId - The correlation ID of the logical request.
 * @param url - The request URL, for the error-hook context.
 * @param method - The HTTP method, for the error-hook context.
 * @param attempt - The zero-based attempt index.
 * @returns The resolved value, whether it came from a partial-success
 * envelope, and the availability-class partial error for breaker accounting.
 */
const resolveEnvelopeOutcome = <T>(
    response: AxiosResponse,
    resolved: ResolvedRequestOptions,
    rawPassthrough: boolean,
    requestId: string,
    url: string,
    method: HttpMethod,
    attempt: number
): {
    result: T;
    resolvedPartial: boolean;
    partialAvailabilityFailure: AniLinkGraphQLError | undefined;
} => {
    let resolvedPartial = false;
    let partialAvailabilityFailure: AniLinkGraphQLError | undefined;
    const result = rawPassthrough
        ? (response.data as T)
        : unwrapGraphQLResponse<T>(
              response.data,
              response.headers as Record<string, unknown>,
              resolved.allowPartialData
                  ? {
                        allowPartialData: true,
                        onPartialData: (partialError) => {
                            resolvedPartial = true;
                            if (isAvailabilityFailure(partialError)) {
                                partialAvailabilityFailure = partialError;
                            }
                            stampRequestId(partialError, requestId);
                            safeInvoke(
                                resolved.onError,
                                "onError",
                                resolved.onHookError,
                                resolved.diagnostics,
                                partialError,
                                buildErrorContext(requestId, url, method, attempt + 1, partialError)
                            );
                        },
                    }
                  : undefined
          );
    return { result, resolvedPartial, partialAvailabilityFailure };
};

const executeWithRetry = async <T>(
    options: ExecuteOptions,
    resolved: ResolvedRequestOptions,
    stateOwner: object | undefined,
    modifiers: ExecuteModifiers = {}
): Promise<ExecuteOutcome<T>> => {
    const { rawPassthrough = false, cacheMiss = false } = modifiers;
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
    // Total time this logical request has spent waiting for rate-limit
    // pacing across its attempts: stamped on the onResponse emission so a
    // paced request stays identifiable in latency dashboards without the
    // onPace hook being pre-wired. Declared outside the attempt loop so a
    // wait before a retried attempt is not lost when that attempt fails.
    let pacedWaitMs = 0;

    for (;;) {
        const startedAt = Date.now();
        const hookContext = { requestId, url, method, attempt: attempt + 1 };
        const circuitError = checkCircuitOpen(circuit, resolved.circuitBreaker);
        if (circuitError !== undefined) {
            safeInvoke(
                resolved.onRequestStart,
                "onRequestStart",
                resolved.onHookError,
                resolved.diagnostics,
                hookContext
            );
            stampRequestId(circuitError, requestId);
            safeInvoke(
                resolved.onError,
                "onError",
                resolved.onHookError,
                resolved.diagnostics,
                circuitError,
                buildErrorContext(requestId, url, method, attempt + 1, circuitError)
            );
            throw circuitError;
        }
        const paceStartedAt = Date.now();
        try {
            await awaitPaceDeadline(stateOwner, host, resolved, hookContext);
            pacedWaitMs += Date.now() - paceStartedAt;
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
        safeInvoke(
            resolved.onRequestStart,
            "onRequestStart",
            resolved.onHookError,
            resolved.diagnostics,
            hookContext
        );
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
            safeInvoke(
                resolved.onResponse,
                "onResponse",
                resolved.onHookError,
                resolved.diagnostics,
                {
                    ...hookContext,
                    durationMs: Date.now() - startedAt,
                    ...(rateLimit !== undefined ? { rateLimit } : {}),
                    ...(cacheMiss ? { cacheHit: false } : {}),
                    ...(pacedWaitMs > 0 ? { pacedMs: pacedWaitMs } : {}),
                }
            );
            responseReported = true;
            const { result, resolvedPartial, partialAvailabilityFailure } =
                resolveEnvelopeOutcome<T>(
                    response,
                    resolved,
                    rawPassthrough,
                    requestId,
                    url,
                    method,
                    attempt
                );
            if (partialAvailabilityFailure !== undefined) {
                // The partial envelope's error entries carry upstream-health
                // signal, so the breaker counts the attempt like the strict
                // mode's throw would — the same normalized error, the same
                // probe bookkeeping (a failed half-open probe re-opens with
                // a scaled cooldown).
                recordCircuitFailure(
                    circuit,
                    resolved.circuitBreaker,
                    partialAvailabilityFailure,
                    resolved,
                    hookContext,
                    host
                );
            } else {
                recordCircuitSuccess(circuit, resolved, hookContext, host);
            }
            paceAfterSuccess(response, resolved, rateLimit, stateOwner, host);
            return { result, resolvedPartial };
        } catch (error: unknown) {
            if (!responseReported) {
                safeInvoke(
                    resolved.onResponse,
                    "onResponse",
                    resolved.onHookError,
                    resolved.diagnostics,
                    {
                        ...hookContext,
                        durationMs: Date.now() - startedAt,
                        ...(pacedWaitMs > 0 ? { pacedMs: pacedWaitMs } : {}),
                    }
                );
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
     * envelope and classifies HTTP failures as `AniLinkApiError`;
     * `"rest"` returns the parsed body verbatim and classifies HTTP failures
     * as `AniLinkRestError`. When omitted, the protocol is inferred from
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
     * circuit breaker, retry budget, and rate-limit pacing deadlines).
     * Operation dispatch passes a per-client shared state owner threaded
     * through the provider wiring, so breaker, budget, and pacing state span
     * every operation of one client; direct callers that reuse one
     * transport-settings object can omit this, in which case the
     * `circuitBreaker`/`retryBudget` configuration object itself keys the
     * state. Passing a fresh object per request prevents breaker state from
     * ever accumulating.
     */
    stateOwner?: object;
}

/** Whether the options-keyed transport-state warning has been emitted. */
let warnedOptionsKeyedState = false;

/**
 * Emits a one-time warning when cross-request transport state would be
 * keyed by the per-request options object because no `stateOwner` was
 * passed. Callers that build a fresh options object per call silently get a
 * fresh state key per call, so failure streaks never accumulate, the
 * breaker/budget never engage, and recorded rate-limit pacing deadlines never
 * gate later requests. One warning per process avoids log spam.
 *
 * The one-shot is consumed only when an emission actually happened: a
 * first trigger under `diagnostics: "silent"` (or `"hook"` with no
 * observer) suppresses its own emission without burning the warning for
 * later requests that would emit.
 *
 * The diagnostic is routed through the structured {@link reportDiagnostic}
 * emit path (the library's single diagnostics surface) so it lands in the
 * consumer's `onHookError` observer as a structured record, falling back to
 * a `console.warn` of the serialized record when no observer is configured —
 * and fully suppressible via `diagnostics: "silent"`.
 *
 * @param onHookError - Consumer callback observing hook failures, when
 * configured on the triggering request's options.
 * @param diagnostics - The resolved diagnostics mode for the triggering request.
 */
const warnOptionsKeyedState = (
    onHookError: OnHookErrorHandler | undefined,
    diagnostics: DiagnosticsMode
): void => {
    if (warnedOptionsKeyedState) {
        return;
    }
    // The one-shot is consumed only when reportDiagnostic actually emitted:
    // it alone owns the routing truth (observer presence, mode, rawError),
    // so a trigger whose configuration suppresses the emission — silent
    // mode, or hook mode with no observer — leaves the warning available
    // for a later request that would emit. Re-deriving "would emit" here
    // once duplicated that truth and drifted: a silent-mode trigger with an
    // observer consumed the one-shot while emitting nothing.
    if (
        reportDiagnostic({
            kind: "state-owner",
            hookName: "stateOwner",
            message:
                "cross-request transport state (circuit breaker, retry budget, rate-limit pacing deadlines) is keyed by the per-request options object because no stateOwner was passed. Pass a stable stateOwner (or reuse one options object across calls) so failure streaks accumulate and pacing deadlines apply.",
            onHookError,
            diagnostics,
        })
    ) {
        warnedOptionsKeyedState = true;
    }
};

/**
 * The auth facts one request needs, resolved once from the caller's input.
 *
 * Extracted from {@link sendRequest} so the auth guard, the header build, and
 * the cache-key decision each read precomputed booleans instead of
 * re-deriving them from the raw {@link RequestAuthInput}.
 */
interface ResolvedAuthMaterial {
    /** The normalized auth, or `undefined` when no material was supplied. */
    auth: RequestAuth | undefined;
    /** Whether a non-empty bearer token is present. */
    hasBearerToken: boolean;
    /** Whether an explicit `Authorization` header is present. */
    hasAuthorizationHeader: boolean;
    /** Whether any non-empty explicit auth header is present. */
    hasCredentialHeaders: boolean;
    /** Whether any auth material at all is present. */
    hasAuthMaterial: boolean;
}

/**
 * Normalizes the caller's auth input and derives the facts the pipeline
 * needs: which credential shapes are present. A legacy string input becomes
 * `{ token }`; header presence is computed once here so the auth guard, the
 * header build, and the cache-key decision stay branch-free.
 *
 * @param auth - The caller-supplied auth material, when present.
 * @returns The resolved auth facts.
 */
const resolveAuthMaterial = (auth: RequestAuthInput | undefined): ResolvedAuthMaterial => {
    const normalized: RequestAuth | undefined = typeof auth === "string" ? { token: auth } : auth;
    const hasBearerToken = normalized?.token !== undefined && normalized.token !== "";
    // One pass over the explicit headers computes both facts the pipeline
    // needs: whether an Authorization header overrides the bearer token, and
    // whether any non-empty header (custom Authorization, X-API-Key, Basic,
    // etc.) is credential material the cache key does not capture. A single
    // loop avoids allocating two intermediate entry arrays per request on
    // the transport's hottest path.
    let hasAuthorizationHeader = false;
    let hasCredentialHeaders = false;
    if (normalized?.headers !== undefined) {
        for (const key in normalized.headers) {
            if (normalized.headers[key] !== "") {
                hasCredentialHeaders = true;
                if (key.toLowerCase() === "authorization") {
                    hasAuthorizationHeader = true;
                }
            }
        }
    }
    return {
        auth: normalized,
        hasBearerToken,
        hasAuthorizationHeader,
        hasCredentialHeaders,
        hasAuthMaterial: hasBearerToken || hasAuthorizationHeader,
    };
};

/**
 * Builds the request headers: the content-type defaults (JSON for GraphQL
 * calls, the caller's override for REST/form calls), the explicit auth
 * headers, and the bearer `Authorization` header when no explicit one
 * overrides it.
 *
 * @param resolvedAuth - The resolved auth facts.
 * @param contentType - The caller's `Content-Type` override, when present.
 * @returns The complete header map for the request.
 */
const buildHeaders = (
    resolvedAuth: ResolvedAuthMaterial,
    contentType: string | undefined
): Record<string, string> => {
    const headers: Record<string, string> =
        contentType === undefined
            ? {
                  "Content-Type": "application/json",
                  Accept: "application/json",
              }
            : { "Content-Type": contentType };

    Object.assign(headers, resolvedAuth.auth?.headers);

    if (resolvedAuth.hasBearerToken && !resolvedAuth.hasAuthorizationHeader) {
        headers.Authorization = `Bearer ${resolvedAuth.auth!.token}`;
    }
    return headers;
};

/**
 * Reads the response cache for a request and, on a hit, fires the
 * `onRequestStart`/`onResponse` hooks with `cacheHit: true` before returning
 * the cached body.
 *
 * The correlation `requestId` is generated lazily — only when a hook is
 * actually configured — so the cache-hit fast path of a hook-less hot loop
 * does not pay the UUID generation cost on every call.
 *
 * @param resolved - The resolved request options.
 * @param method - The HTTP method.
 * @param url - The request URL.
 * @param data - The request body, when present.
 * @param cacheAuthKey - The auth-scoping cache key fragment.
 * @returns The cached response, or `undefined` on a miss.
 */
const tryCacheRead = <T>(
    resolved: ResolvedRequestOptions,
    method: HttpMethod,
    url: string,
    data: object | string | undefined,
    cacheAuthKey: string
): T | undefined => {
    const cached = resolved.responseCache!.get<T>(method, url, data, cacheAuthKey);
    if (cached === undefined) {
        return undefined;
    }
    if (resolved.onRequestStart !== undefined || resolved.onResponse !== undefined) {
        const requestId = randomUUID();
        const hookContext = { requestId, url, method, attempt: 1 };
        safeInvoke(
            resolved.onRequestStart,
            "onRequestStart",
            resolved.onHookError,
            resolved.diagnostics,
            hookContext
        );
        safeInvoke(resolved.onResponse, "onResponse", resolved.onHookError, resolved.diagnostics, {
            ...hookContext,
            durationMs: 0,
            cacheHit: true,
        });
    }
    return cached;
};

/**
 * Sends a request to the specified URL.
 *
 * This is the provider-agnostic transport entry point. GraphQL callers get
 * envelope unwrapping by leaving `protocol` unset (or `"graphql"`); REST
 * callers pass `protocol: "rest"` (and typically a `contentType`) and
 * receive the parsed body verbatim. HTTP failures on REST calls surface as
 * `AniLinkRestError`; GraphQL calls surface as `AniLinkApiError`.
 *
 * @typeParam T - The expected response payload type.
 * @param url - The URL to send the request to.
 * @param method - The HTTP method to use ('GET', 'POST', 'PUT', or 'DELETE').
 * @param data - The data to send with the request: a JSON-serializable object, or a pre-encoded string body (for example form-urlencoded OAuth grants).
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
export const sendRequest = async <T = unknown>(
    url: string,
    method: HttpMethod,
    data?: object | string,
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
    const resolvedAuth = resolveAuthMaterial(auth);

    if (requiresAuth && !resolvedAuth.hasAuthMaterial) {
        throw new AniLinkAuthError(operation);
    }

    const headers = buildHeaders(resolvedAuth, contentType);

    const resolved = resolveRequestOptions(options);

    if (
        stateOwner === undefined &&
        options !== undefined &&
        (resolved.circuitBreaker !== undefined ||
            resolved.retryBudget !== undefined ||
            resolved.paceWithRateLimit)
    ) {
        warnOptionsKeyedState(resolved.onHookError, resolved.diagnostics);
    }

    const cacheAuthKey = resolveCacheAuthKey(
        resolved.responseCache,
        method,
        data,
        isRestCall,
        resolvedAuth
    );

    // Captured on a cache miss, before the read goes to the network, so the
    // write-back can detect an invalidation that landed while the response
    // was in flight (see ResponseCache.setIfFresh).
    let cacheGenerationAtRead: number | undefined;

    if (cacheAuthKey !== undefined) {
        const cached = tryCacheRead<T>(resolved, method, url, data, cacheAuthKey);
        if (cached !== undefined) {
            return cached;
        }
        cacheGenerationAtRead = resolved.responseCache!.getGeneration();
    }

    const { result, resolvedPartial } = await executeWithRetry<unknown>(
        { url, method, data, headers },
        resolved,
        stateOwner ?? options,
        {
            rawPassthrough: isRestCall,
            // A cacheable read that missed the cache: its network response
            // carries cacheHit: false so consumers can count misses without
            // subtracting hits from total response counts. Fail-closed reads
            // (no cache key) and mutations stay unmarked.
            cacheMiss: cacheAuthKey !== undefined,
        }
    );

    if (cacheAuthKey !== undefined) {
        // Partial-success envelopes resolved by `allowPartialData` are
        // never cached: a later cache hit would replay the degraded data
        // without the onError reporting that accompanied the original
        // fetch, silently hiding the failures.
        if (!resolvedPartial) {
            // Write back only when no invalidation landed while the response
            // was in flight: a mutation that completed during this read has
            // already dropped the stale entries, and re-caching this
            // response would reintroduce the pre-mutation data for the rest
            // of the TTL.
            resolved.responseCache!.setIfFresh(
                method,
                url,
                data,
                cacheAuthKey,
                cacheGenerationAtRead!,
                result
            );
        }
    } else {
        // A successful mutation invalidates the cached reads of the mutated
        // resource even when the mutation itself is not cache-keyed
        // (`cacheAuthKey` is read-only). Runs after the write succeeded so a
        // failed mutation never drops fresh cached entries. The write-ness
        // decision inside is shape-based, so a fail-closed read landing here
        // (no cache key) is a no-op, not an invalidation.
        invalidateAfterMutation(resolved.responseCache, method, url, data, isRestCall);
    }

    return result as T;
};
