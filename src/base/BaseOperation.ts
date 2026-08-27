import {
    type RequestAuthInput,
    type RequestOptions,
    sendRequest,
    type HttpMethod,
} from "./RequestHandler";

/**
 * Merges per-request transport settings over the instance-level ones.
 *
 * The merge is shallow and mirrors `resolveRequestOptions` precedence in
 * `RequestHandler`: a field set on `overrides` wins; every other field keeps
 * the instance value. Passing no overrides returns the instance options
 * unchanged, so the zero-cost path stays allocation-free.
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
    return { ...base, ...overrides };
};

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
     * The authentication token shared by all operations of an instance.
     */
    private readonly requestAuth?: RequestAuthInput;

    /**
     * The transport settings resolved at construction time.
     */
    private readonly resolvedOptions?: RequestOptions;

    /**
     * Constructs a new `BaseOperation` instance.
     *
     * @param authToken - The authentication material used for API requests. A string is treated as a bearer token for backwards compatibility.
     * @param options - Transport settings scoped to this instance (timeout, cancellation, retry policy, lifecycle hooks).
     */
    constructor(authToken?: RequestAuthInput, options?: RequestOptions) {
        this.requestAuth = authToken;
        this.resolvedOptions = options;
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
     * @param data - The request body payload, when the call carries one.
     * @param requiresAuth - Whether the operation requires an authentication token.
     * @param operation - Human-readable operation name included in missing-token auth errors. Defaults to the concrete subclass name.
     * @param transportOptions - Optional per-request transport settings merged over the instance-level ones. A field set here wins; unset fields keep the instance value.
     * @param contentType - Optional `Content-Type` override. When provided, the response body is returned verbatim instead of being unwrapped as a GraphQL envelope.
     * @returns Whatever the shared pipeline resolves for the call.
     * @throws An {@link AniLinkAuthError} when `requiresAuth` is true and no token is set, or a normalized {@link AniLinkError} when the request fails.
     */
    protected async dispatch<T = unknown>(
        url: string,
        method: HttpMethod,
        data?: object,
        requiresAuth = false,
        operation?: string,
        transportOptions?: RequestOptions,
        contentType?: string
    ): Promise<T> {
        return await sendRequest<T>(
            url,
            method,
            data,
            this.requestAuth,
            requiresAuth || undefined,
            mergeOptions(this.resolvedOptions, transportOptions),
            operation ?? resolveOperationLabel(this),
            contentType
        );
    }
}
