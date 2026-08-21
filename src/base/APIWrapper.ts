import { sendRequest } from "./RequestHandler";

/**
 * The default AniList GraphQL endpoint used by every AniLink operation.
 */
export const ANILIST_GRAPHQL_URL = "https://graphql.anilist.co";

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
     * The base URL for the API.
     */
    protected baseURL: string;

    /**
     * The authentication token shared by all operations of an instance.
     */
    private readonly authToken?: string;

    /**
     * Constructs a new `APIWrapper` instance.
     *
     * @param authToken - The authentication token used for API requests.
     * @param baseURL - The base URL for the API. Defaults to the AniList GraphQL endpoint.
     */
    constructor(authToken?: string, baseURL: string = ANILIST_GRAPHQL_URL) {
        this.baseURL = baseURL;
        this.authToken = authToken;
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
     * @returns The unwrapped response data. For documents with a single root field this is the bare field value; otherwise it is the full `{ data }` envelope.
     * @throws An `AniLinkAuthError` when `requiresAuth` is true and no token is set, or a normalized `AniLinkError` when the request fails.
     */
    protected async request<T = unknown>(
        query: string,
        variables?: unknown,
        requiresAuth = false
    ): Promise<T> {
        const data = variables === undefined ? { query } : { query, variables };
        return await sendRequest<T>(
            this.baseURL,
            "POST",
            data,
            this.authToken,
            requiresAuth || undefined
        );
    }
}
