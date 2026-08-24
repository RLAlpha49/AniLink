import { type RequestOptions, sendRequest } from "./RequestHandler";
import {
    type VariableTypeMappings,
    requireVariables,
    validateVariables,
} from "./ValidateVariables";

/**
 * Merges per-request transport settings over the instance-level ones.
 *
 * The merge is shallow and mirrors `resolveRequestOptions` precedence in
 * `RequestHandler`: a field set on `overrides` wins; every other field keeps
 * the instance value. Passing no overrides returns the instance options
 * unchanged, so the zero-cost path stays allocation-free.
 */
const mergeOptions = (
    base: RequestOptions | undefined,
    overrides: RequestOptions | undefined
): RequestOptions | undefined => {
    if (overrides === undefined) return base;
    if (base === undefined) return overrides;
    return { ...base, ...overrides };
};

/**
 * The AniList GraphQL endpoint used by every AniLink operation. It is defined
 * once here and imported everywhere it is needed.
 */
export const ANILIST_GRAPHQL_URL = "https://graphql.anilist.co";

/**
 * A single variable-presence requirement declared by an operation.
 *
 * Mirrors the requirement shapes accepted by {@link requireVariables}, with
 * the operation's error `message` attached so an operation can declare its
 * whole validation contract as data.
 */
export type VariableRequirement =
    | { readonly kind: "one"; readonly message: string }
    | { readonly kind: "all"; readonly names: readonly string[]; readonly message: string }
    | { readonly kind: "any"; readonly names: readonly string[]; readonly message: string }
    | { readonly kind: "notOnly"; readonly names: readonly string[]; readonly message: string };

/**
 * The declarative contract an operation passes to {@link APIWrapper.execute}.
 *
 * Every field is optional: an operation declares only the variation points it
 * needs, and `execute` applies them in a fixed order so validation behaviour
 * is uniform across the whole API surface.
 */
export interface ExecuteOptions {
    /**
     * Variable-presence requirements evaluated before type validation. Each
     * entry maps directly to one {@link requireVariables} call.
     */
    readonly requirements?: readonly VariableRequirement[];

    /**
     * The variable type map used to type-check caller-supplied variables.
     * Omit for operations that declare no typed variables.
     */
    readonly mappings?: VariableTypeMappings;

    /**
     * Whether the operation requires an authentication token. Defaults to
     * `false` (public queries).
     */
    readonly requiresAuth?: boolean;

    /**
     * Per-request transport settings (`timeout`, `signal`, retry policy,
     * lifecycle hooks, pacing, circuit breaker) merged over the instance-level
     * options for this single call. A field set here wins; unset fields keep
     * the instance value.
     */
    readonly transportOptions?: RequestOptions;
}

/**
 * Resolves the label identifying which operation required authentication.
 *
 * Operations know their own identity, so the concrete subclass name is used
 * unless a caller passes something more specific. Returns `undefined` when no
 * usable name exists so the auth error keeps its generic message instead of
 * appending an empty detail.
 */
const resolveOperationLabel = (wrapper: APIWrapper): string | undefined => {
    const name = wrapper.constructor?.name;
    return typeof name === "string" && name.length > 0 ? name : undefined;
};

/**
 * `APIWrapper` is the base class for all API operations.
 *
 * It owns the shared transport plumbing — the endpoint, the authentication
 * token, and the `request` helper that wraps `sendRequest` — so concrete
 * operation classes only declare their variables interface, GraphQL document,
 * and a thin method that calls `request`.
 */
export class APIWrapper {
    /**
     * The authentication token shared by all operations of an instance.
     */
    private readonly authToken?: string;

    /**
     * The transport settings resolved at construction time.
     */
    private readonly resolvedOptions?: RequestOptions;

    /**
     * Constructs a new `APIWrapper` instance.
     *
     * @param authToken - The authentication token used for API requests.
     * @param options - Transport settings scoped to this instance (timeout, cancellation, retry policy, lifecycle hooks).
     */
    constructor(authToken?: string, options?: RequestOptions) {
        this.authToken = authToken;
        this.resolvedOptions = options;
    }

    /**
     * Sends a GraphQL document to the configured endpoint.
     *
     * The token guard, Authorization header, timeout, retry policy, and error
     * normalization are handled by the shared request pipeline.
     *
     * @param query - The GraphQL document to execute.
     * @param variables - The variables for the document. When omitted the request body contains only the query.
     * @param requiresAuth - Whether the operation requires an authentication token.
     * @param operation - Optional human-readable operation name included in missing-token auth errors. Defaults to the concrete operation class name.
     * @param transportOptions - Optional per-request transport settings merged over the instance-level ones. A field set here wins; unset fields keep the instance value.
     * @returns The unwrapped response data. For documents with a single root field this is the bare field value; otherwise it is the full `{ data }` envelope.
     * @throws An `AniLinkAuthError` when `requiresAuth` is true and no token is set, or a normalized `AniLinkError` when the request fails.
     */
    protected async request<T = unknown>(
        query: string,
        variables?: unknown,
        requiresAuth = false,
        operation?: string,
        transportOptions?: RequestOptions
    ): Promise<T> {
        const data = variables === undefined ? { query } : { query, variables };
        return await sendRequest<T>(
            ANILIST_GRAPHQL_URL,
            "POST",
            data,
            this.authToken,
            requiresAuth || undefined,
            mergeOptions(this.resolvedOptions, transportOptions),
            operation ?? resolveOperationLabel(this)
        );
    }

    /**
     * Runs the shared validate-then-dispatch pipeline for an operation.
     *
     * Operations declare their contract as an {@link ExecuteOptions} object —
     * variable-presence requirements, an optional type map, and the auth
     * requirement — and this method applies them in a fixed order before
     * delegating to {@link APIWrapper.request}.
     *
     * @param query - The GraphQL document to execute.
     * @param variables - The variables for the document. Pass `undefined` for
     * operations that take no variables.
     * @param options - The declarative validation and auth contract.
     * @param transportOptions - Optional per-request transport settings forwarded to {@link APIWrapper.request}.
     * @returns The unwrapped response data, as described by {@link APIWrapper.request}.
     * @throws An {@link AniLinkValidationError} when a requirement or type check
     * fails, or a normalized `AniLinkError` when the request fails.
     */
    protected async execute<T = unknown>(
        query: string,
        variables: object | undefined,
        options: ExecuteOptions
    ): Promise<T> {
        const { requirements, mappings, requiresAuth, transportOptions } = options;

        if (requirements && variables !== undefined) {
            for (const requirement of requirements) {
                requireVariables(variables, requirement, requirement.message);
            }
        }

        if (mappings && variables !== undefined) {
            validateVariables(variables, mappings);
        }

        return await this.request<T>(query, variables, requiresAuth, undefined, transportOptions);
    }
}
