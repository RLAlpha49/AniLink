import { type RequestOptions, sendRequest } from "./RequestHandler";

/**
 * The AniList GraphQL endpoint used by every AniLink operation. It is defined
 * once here and imported everywhere it is needed.
 */
export const ANILIST_GRAPHQL_URL = "https://graphql.anilist.co";

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
     * @returns The unwrapped response data. For documents with a single root field this is the bare field value; otherwise it is the full `{ data }` envelope.
     * @throws An `AniLinkAuthError` when `requiresAuth` is true and no token is set, or a normalized `AniLinkError` when the request fails.
     */
    protected async request<T = unknown>(
        query: string,
        variables?: unknown,
        requiresAuth = false,
        operation?: string
    ): Promise<T> {
        const data = variables === undefined ? { query } : { query, variables };
        return await sendRequest<T>(
            ANILIST_GRAPHQL_URL,
            "POST",
            data,
            this.authToken,
            requiresAuth || undefined,
            this.resolvedOptions,
            operation ?? resolveOperationLabel(this)
        );
    }
}
