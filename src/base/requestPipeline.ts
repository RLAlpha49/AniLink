/**
 * Provider-agnostic request pipeline composition.
 *
 * This module owns the order for one request: auth material and options are
 * resolved first, cache eligibility is decided before cache reads, cache misses
 * enter the retry loop, and successful writes invalidate affected cache entries.
 * The cache operations live in `./responseCache`; retry and hook ordering live
 * in `./attemptLoop`.
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
     * material is configured. The response cache is not consulted, so an
     * auth-required read is never served an anonymous-namespace cache hit.
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
     * Optional `Content-Type` header override for non-GraphQL endpoints. Use
     * it for form-urlencoded OAuth token requests or `application/json` for
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
 * consumer's `onHookError` observer as a structured record, falling back to a
 * `console.warn` of the serialized record when no observer is configured.
 * The warning is fully suppressible via `diagnostics: "silent"`.
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
    // so a trigger whose configuration suppresses the emission (silent
    // mode, or hook mode with no observer) leaves the warning available
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
 * The auth guard, header builder, and cache-key decision use these facts
 * instead of re-deriving them from the raw {@link RequestAuthInput}.
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
 * Normalizes the caller's auth input and derives the credential facts needed
 * by the pipeline.
 *
 * @param auth - The caller-supplied auth material, when present.
 * @returns The resolved auth facts.
 */
const resolveAuthMaterial = (auth: RequestAuthInput | undefined): ResolvedAuthMaterial => {
    const normalized: RequestAuth | undefined = typeof auth === "string" ? { token: auth } : auth;
    const hasBearerToken = normalized?.token !== undefined && normalized.token !== "";
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
 * Builds the request headers from the resolved auth and content type.
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
 * Sends a request to the specified URL through the ordered transport pipeline.
 *
 * GraphQL callers get envelope unwrapping by leaving `protocol` unset (or
 * `"graphql"`); REST callers pass `protocol: "rest"` and receive the parsed
 * body verbatim. HTTP failures on REST calls surface as `AniLinkRestError`;
 * GraphQL calls surface as `AniLinkApiError`.
 *
 * @typeParam T - The expected response payload type.
 * @param url - The URL to send the request to.
 * @param method - The HTTP method to use (`GET`, `POST`, `PUT`, or `DELETE`).
 * @param data - The data to send with the request, when present.
 * @param auth - The authentication material to include in the request headers. A string is treated as a bearer token for backwards compatibility.
 * @param sendOptions - Named trailing options; see {@link SendRequestOptions}.
 * @returns The unwrapped response data. For documents with a single root
 * field this is the bare field value; multi-root-field or zero-root-field
 * documents return the full `{ data }` envelope. With `protocol: "rest"`,
 * the parsed response body is returned as-is.
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

    // Build the guard before deciding whether a cache read is allowed. A
    // missing credential disables the cache path, then the attempt loop emits
    // the correlated auth error without dispatching a network request.
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

    // Auth eligibility and an explicit cache bypass both precede cache reads.
    const cacheAuthKey =
        authGuard !== undefined || resolved.bypassResponseCache
            ? undefined
            : resolveCacheAuthKey(resolved.responseCache, method, data, isRestCall, resolvedAuth);

    let cacheGenerationAtRead: number | undefined;

    if (cacheAuthKey !== undefined) {
        const cached = tryCacheRead<T>(resolved, method, url, data, cacheAuthKey);
        if (cached !== undefined) {
            return cached;
        }
        cacheGenerationAtRead = resolved.responseCache!.getGeneration();
    }

    // The attempt loop calls this after a successful non-partial response and
    // before onResponse, so hook metadata reports whether the cache was filled.
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
                            isRestCall ? undefined : extractQueryRootField(data)
                        )
            : undefined;

    const { result } = await executeWithRetry<unknown>(
        { url, method, data, headers },
        resolved,
        stateOwner ?? options,
        {
            rawPassthrough: isRestCall,
            cacheMiss: cacheAuthKey !== undefined,
            authGuard,
            writeBack,
        }
    );

    // Mutation invalidation follows a successful dispatch. The cache module
    // classifies request shape and applies the matching invalidation policy.
    if (cacheAuthKey === undefined) {
        invalidateAfterMutation(resolved.responseCache, method, url, data, isRestCall);
    }

    return result as T;
};
