/**
 * Provider-agnostic transport entry point and public re-export facade.
 *
 * This module is the stable public surface of the shared transport: it
 * re-exports the option/hook types and constants from `./transportTypes`,
 * the keep-alive agent cache from `./agents`, the GraphQL envelope unwrapping
 * from `./envelope`, and the retry math from `./retry`, and it owns the
 * request entry itself ({@link sendRequest}): option resolution, the auth
 * guard and header build, the response-cache policy wiring, and the
 * mutation invalidation. The resilience mechanisms (the attempt loop, retry
 * budget, circuit breaker, rate-limit pacing, error normalization, hook
 * invocation) and the cache policy live in their own cohesive modules so
 * each is independently reviewable; consumers keep importing every symbol
 * from `./RequestHandler` unchanged.
 */
import { AniLinkAuthError } from "./AniLinkError";
import {
    type DiagnosticsMode,
    type HttpMethod,
    type OnHookErrorHandler,
    type RequestAuth,
    type RequestAuthInput,
    type RequestOptions,
} from "./transportTypes";
import { resolveRequestOptions } from "./requestOptions";
import {
    extractQueryRootField,
    invalidateAfterMutation,
    resolveCacheAuthKey,
    tryCacheRead,
} from "./responseCache";
import { executeWithRetry } from "./attemptLoop";
import { reportDiagnostic } from "./hooks";

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

/**
 * Trailing options for {@link sendRequest}, replacing the former positional
 * rest tuple so call sites name their arguments and new options can be added
 * without reordering.
 *
 * @see {@link sendRequest}
 */
export interface SendRequestOptions {
    /**
     * Whether the operation requires an authentication token; the request
     * fails fast with an {@link AniLinkAuthError} when set and no auth
     * material is configured — before the response cache is consulted, so
     * an auth-required read is never served an anonymous-namespace cache
     * hit.
     */
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

    // The auth guard runs inside the attempt loop (see the `authGuard`
    // modifier): it throws before any network dispatch, where a requestId
    // exists and the error hooks can observe the failure. The cache read
    // below is additionally gated on the guard passing, so a `requiresAuth`
    // request with no auth material fails fast with an
    // {@link AniLinkAuthError} instead of being served an
    // anonymous-namespace cache hit — the documented fail-fast contract.
    const authGuard =
        requiresAuth && !resolvedAuth.hasAuthMaterial
            ? () => new AniLinkAuthError(operation)
            : undefined;

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

    const cacheAuthKey =
        authGuard !== undefined
            ? undefined
            : resolveCacheAuthKey(resolved.responseCache, method, data, isRestCall, resolvedAuth);

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

    // The cache write-back, executed inside the attempt loop (see the
    // `writeBack` modifier) so the onResponse emission can report whether
    // the cache actually filled. Partial-success envelopes resolved by
    // `allowPartialData` are never cached: a later cache hit would replay
    // the degraded data without the onError reporting that accompanied the
    // original fetch, silently hiding the failures. The in-flight
    // generation guard drops a response whose read was invalidated while it
    // was in flight: a mutation that completed during this read has already
    // dropped the stale entries, and re-caching this response would
    // reintroduce the pre-mutation data for the rest of the TTL. The read's
    // GraphQL root field is extracted lazily inside the write-back — only
    // on the first successful attempt, where it is actually needed — so
    // cacheable reads that miss, fail, or resolve partial never pay the
    // document scan.
    const writeBack =
        cacheAuthKey !== undefined
            ? (result: unknown, resolvedPartial: boolean): boolean =>
                  resolvedPartial
                      ? false
                      : resolved.responseCache!.setIfFresh(
                            method,
                            url,
                            data,
                            cacheAuthKey,
                            cacheGenerationAtRead!,
                            result,
                            // Scoped invalidation attributes the entry
                            // to the root field its document selects, and
                            // the in-flight guard matches scoped
                            // invalidations against the read's own root
                            // field. REST reads are never GraphQL documents.
                            isRestCall ? undefined : extractQueryRootField(data)
                        )
            : undefined;

    const { result } = await executeWithRetry<unknown>(
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
            authGuard,
            writeBack,
        }
    );

    if (cacheAuthKey === undefined) {
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
