import {
    type RequestAuthInput,
    type RequestOptions,
    sendRequest,
    type HttpMethod,
} from "./RequestHandler";

/**
 * Option keys whose values are nested configuration objects. A per-request
 * partial override on one of these keys (for example
 * `{ retry: { maxRetries: 0 } }`) must keep the instance-level fields it does
 * not mention instead of discarding them, so the merge deep-merges exactly
 * these keys and shallow-merges everything else.
 */
const DEEP_MERGED_OPTION_KEYS = ["retry", "circuitBreaker", "retryBudget"] as const;

/**
 * Assigns a deep-merged value for one key. A generic helper is required
 * because TypeScript collapses a write through a union key (`merged[key]`
 * with `key: "retry" | "circuitBreaker" | "retryBudget"`) to the intersection
 * of all three option types; with `K` deferred to a single type parameter,
 * the assignment targets exactly that key's option type.
 */
const assignDeepMergedOption = <K extends (typeof DEEP_MERGED_OPTION_KEYS)[number]>(
    merged: RequestOptions,
    key: K,
    value: RequestOptions[K]
): void => {
    merged[key] = value;
};

/**
 * Merges per-request transport settings over the instance-level ones.
 *
 * The merge mirrors `resolveRequestOptions` precedence in `RequestHandler`: a
 * field set on `overrides` wins; every other field keeps the instance value.
 * The nested configuration objects (`DEEP_MERGED_OPTION_KEYS` — `retry`,
 * `circuitBreaker`, `retryBudget`) are merged field-by-field, so a per-request
 * `{ retry: { maxRetries: 0 } }` keeps the instance's `retryOnStatus` and
 * `baseDelayMs` instead of silently falling back to library defaults. Passing
 * no overrides returns the instance options unchanged, so the zero-cost path
 * stays allocation-free.
 *
 * @param base - Instance-level transport settings, when configured.
 * @param overrides - Per-request settings that take precedence over `base`.
 * @returns The merged settings, or the defined input when only one side exists.
 * @see {@link RequestOptions}
 */
export const mergeOptions = (
    base: RequestOptions | undefined,
    overrides: RequestOptions | undefined
): RequestOptions | undefined => {
    if (overrides === undefined) return base;
    if (base === undefined) return overrides;
    const merged: RequestOptions = { ...base, ...overrides };
    for (const key of DEEP_MERGED_OPTION_KEYS) {
        const baseValue = base[key];
        const overrideValue = overrides[key];
        // `retry: false` (disable) and `retry: true` are whole-value settings:
        // they replace the instance policy entirely, by design. Only two
        // defined objects merge field-by-field.
        if (
            typeof baseValue === "object" &&
            baseValue !== null &&
            typeof overrideValue === "object" &&
            overrideValue !== null
        ) {
            // The typeof guards prove both sides are the object member of
            // the option's union, so the spread is field-wise; the helper's
            // deferred K keeps the assignment scoped to this key's own
            // option type.
            assignDeepMergedOption(merged, key, { ...baseValue, ...overrideValue });
        }
    }
    return merged;
};

/**
 * Named trailing options for `BaseOperation.dispatch`, replacing the
 * former positional tail so call sites name their arguments and new options
 * can be added without reordering. Mirrors the `SendRequestOptions`
 * pattern already used by {@link sendRequest}.
 *
 * @see {@link BaseOperation}
 */
export interface DispatchOptions {
    /** Whether the operation requires an authentication token; the request fails fast with an `AniLinkAuthError` when set and no auth material is configured. Defaults to `false`. */
    requiresAuth?: boolean;
    /** Human-readable operation name included in missing-token auth errors. Defaults to the concrete subclass name. */
    operation?: string;
    /** Per-request {@link RequestOptions} merged over the instance-level ones. A field set here wins; unset fields keep the instance value. */
    transportOptions?: RequestOptions;
    /** Optional `Content-Type` header override for non-GraphQL endpoints. This is purely a header concern; response interpretation is controlled by `protocol`. When `protocol` is omitted, a set `contentType` implies the `"rest"` protocol. */
    contentType?: string;
    /** The wire protocol of the request, selecting response interpretation and error classification. `"graphql"` unwraps the envelope; `"rest"` returns the body verbatim. When omitted, the protocol is inferred from `contentType`. */
    protocol?: "graphql" | "rest";
}

/**
 * Resolves the label identifying which operation required authentication.
 *
 * Operations know their own identity, so the concrete subclass name is used
 * unless a caller passes something more specific. Returns `undefined` when no
 * usable name exists so the auth error keeps its generic message instead of
 * appending an empty detail.
 *
 * @param operation - Operation instance whose constructor name is inspected.
 * @returns A non-empty operation label, or `undefined` when none is available.
 */
export const resolveOperationLabel = (operation: object): string | undefined => {
    const name = operation.constructor?.name;
    return typeof name === "string" && name.length > 0 ? name : undefined;
};

/**
 * Shared state and dispatch plumbing for every provider's operations.
 *
 * This class owns exactly what every API style has in common — the instance
 * authentication token, the resolved transport settings, and the shallow
 * per-request merge — and delegates the actual HTTP call to the provider-
 * agnostic {@link sendRequest} pipeline. Protocol-specific base classes
 * subclass it: `GraphQLOperation` adds GraphQL envelope handling and
 * `RestOperation` adds query-string and JSON-body handling without
 * duplicating any of the plumbing here.
 */
export abstract class BaseOperation {
    /**
     * Stable object keying cross-request transport state (the circuit
     * breaker, retry budget, and rate-limit pacing deadlines). Defaults to
     * a fresh per-instance object, so failure streaks accumulate across
     * every request this operation dispatches regardless of per-request
     * option objects. When a provider wiring passes one shared owner to
     * every operation it constructs, the state instead spans the whole
     * client: breaker streaks, retry budgets, and pacing deadlines
     * accumulate across every operation of that client (still scoped per
     * upstream host inside the state maps, so providers stay isolated).
     */
    private readonly stateOwner: object;

    /**
     * The authentication token shared by all operations of an instance.
     *
     * Mutable only through {@link BaseOperation.updateAuth} so a provider
     * wiring seam can swap in refreshed auth material (for example the MAL
     * automatic token-refresh lifecycle) without rebuilding operations.
     */
    private requestAuth?: RequestAuthInput;

    /**
     * The transport settings resolved at construction time.
     */
    private readonly resolvedOptions?: RequestOptions;

    /**
     * Constructs a new `BaseOperation` instance.
     *
     * @param authToken - The authentication material used for API requests. A string is treated as a bearer token for backwards compatibility.
     * @param options - Transport settings scoped to this instance (timeout, cancellation, retry policy, lifecycle hooks).
     * @param stateOwner - Stable object keying cross-request transport state (circuit breaker, retry budget, pacing deadlines). Provider wirings pass one shared owner to every operation they construct so that state spans the whole client; when omitted, a fresh per-instance object is used and the state stays scoped to this operation.
     */
    constructor(authToken?: RequestAuthInput, options?: RequestOptions, stateOwner?: object) {
        this.requestAuth = authToken;
        this.resolvedOptions = options;
        this.stateOwner = stateOwner ?? {};
    }

    /**
     * The instance authentication token, readable by protocol subclasses.
     *
     * @returns The bearer token from {@link RequestAuthInput}, or `undefined`.
     */
    protected get token(): string | undefined {
        return typeof this.requestAuth === "string" ? this.requestAuth : this.requestAuth?.token;
    }

    /**
     * The provider-specific authentication material, readable by protocol subclasses.
     *
     * @returns The configured {@link RequestAuthInput}, or `undefined`.
     */
    protected get auth(): RequestAuthInput | undefined {
        return this.requestAuth;
    }

    /**
     * The instance transport settings, readable by protocol subclasses.
     *
     * @returns The configured {@link RequestOptions}, or `undefined`.
     */
    protected get instanceOptions(): RequestOptions | undefined {
        return this.resolvedOptions;
    }

    /**
     * Swaps the instance authentication material in place.
     *
     * @internal This mutator exists for provider wiring seams that refresh
     * credentials mid-flight (the MAL automatic token-refresh lifecycle swaps
     * the stored auth on the operation instances before replaying a 401'd
     * request). It is not part of the public API surface.
     *
     * @param auth - The replacement authentication material, or `undefined` to clear it.
     */
    public updateAuth(auth: RequestAuthInput | undefined): void {
        this.requestAuth = auth;
    }

    /**
     * Reads the current instance authentication material.
     *
     * @internal Companion to {@link BaseOperation.updateAuth} for wiring
     * seams that rebuild auth from the operation's live state at swap time
     * (the MAL refresh lifecycle reads each operation's current auth before
     * applying a fresh access token, so a replay never rebuilds headers from
     * a stale construction-time snapshot). It is not part of the public API
     * surface.
     *
     * @returns The current {@link RequestAuthInput}, or `undefined`.
     */
    public getAuth(): RequestAuthInput | undefined {
        return this.requestAuth;
    }

    /**
     * Dispatches one HTTP call through the shared transport pipeline.
     *
     * The token guard, Authorization header, timeout, retry policy, pacing,
     * circuit breaker, hooks, and error normalization are all handled by the
     * shared pipeline; subclasses only choose the URL, method, body shape,
     * and response interpretation.
     *
     * @typeParam T - The parsed response type returned verbatim by the pipeline.
     * @param url - The absolute endpoint URL to call.
     * @param method - The HTTP method for the call.
     * @param data - The request body payload, when the call carries one: a JSON-serializable object, or a pre-encoded string body (for example form-urlencoded OAuth grants).
     * @param options - Named trailing options; see {@link DispatchOptions}.
     * @returns Whatever the shared pipeline resolves for the call.
     * @throws An {@link AniLinkAuthError} when `requiresAuth` is true and no token is set, or a normalized {@link AniLinkError} when the request fails.
     */
    protected async dispatch<T = unknown>(
        url: string,
        method: HttpMethod,
        data?: object | string,
        options: DispatchOptions = {}
    ): Promise<T> {
        const { requiresAuth, operation, transportOptions, contentType, protocol } = options;
        return await sendRequest<T>(url, method, data, this.requestAuth, {
            requiresAuth: requiresAuth || undefined,
            options: mergeOptions(this.resolvedOptions, transportOptions),
            operation: operation ?? resolveOperationLabel(this),
            contentType,
            protocol,
            // The stable owner keys cross-request transport state (circuit
            // breaker, retry budget, pacing deadlines) so failure streaks
            // accumulate across requests even when each call carries fresh
            // per-request options — across the whole client when the wiring
            // shared one owner, or across this instance's requests otherwise.
            stateOwner: this.stateOwner,
        });
    }
}
