import { BaseOperation } from "../../base/BaseOperation";
import { type RequestOptions } from "../../base/RequestHandler";

/**
 * The declarative contract a REST operation passes to
 * {@link RestOperation.execute}.
 *
 * Every field except the path is optional: an operation declares only the
 * variation points it needs, and `execute` applies them in a fixed order so
 * request behaviour is uniform across the whole API surface.
 */
export interface RestExecuteOptions {
    /**
     * The HTTP method for the call. Defaults to `"GET"`.
     */
    readonly method?: "GET" | "POST" | "PUT" | "DELETE";

    /**
     * Whether the operation requires an authentication token. Defaults to
     * `false` (public endpoints).
     */
    readonly requiresAuth?: boolean;

    /**
     * The `Content-Type` of the request. Defaults to `"application/json"`,
     * which also opts every REST call out of GraphQL envelope unwrapping in
     * the shared transport pipeline.
     */
    readonly contentType?: string;

    /**
     * Per-request transport settings (`timeout`, `signal`, retry policy,
     * lifecycle hooks, pacing, circuit breaker) merged over the instance-level
     * options for this single call. A field set here wins; unset fields keep
     * the instance value.
     */
    readonly transportOptions?: RequestOptions;
}

/**
 * Builds a URL query string from a flat record of primitive values.
 *
 * `undefined` and `null` values are skipped entirely, arrays become repeated
 * keys (the convention MyAnimeList uses for list parameters), and every value
 * is percent-encoded. An empty record produces an empty string.
 *
 * @param params - The query parameters, with flat primitive or array values.
 * @returns A query string beginning with `?`, or an empty string.
 */
export const buildQueryString = (params: Record<string, unknown>): string => {
    const segments: string[] = [];
    for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === null) {
            continue;
        }
        const encodedKey = encodeURIComponent(key);
        if (Array.isArray(value)) {
            for (const item of value) {
                if (item !== undefined && item !== null) {
                    segments.push(`${encodedKey}=${encodeURIComponent(String(item))}`);
                }
            }
        } else {
            segments.push(`${encodedKey}=${encodeURIComponent(String(value))}`);
        }
    }
    return segments.length > 0 ? `?${segments.join("&")}` : "";
};

/**
 * `RestOperation` is the REST protocol layer shared by every REST-style
 * provider.
 *
 * It is the REST counterpart of the shared {@link GraphQLOperation} base:
 * both extend the {@link BaseOperation} transport plumbing, but this class
 * shapes plain HTTP requests instead of GraphQL documents — path-based URLs
 * with query strings, JSON bodies, and verbatim response bodies (no envelope
 * unwrapping). Failures surface as {@link AniLinkRestError} via the shared
 * pipeline's error normalization.
 *
 * Concrete operations declare their endpoint path, parameter interface, and a
 * thin method that calls `execute`.
 */
export abstract class RestOperation extends BaseOperation {
    /**
     * The base URL every operation of this provider appends its path to,
     * including any version prefix (for example `https://api.myanimelist.net/v2`).
     */
    protected abstract readonly baseUrl: string;

    /**
     * Sends one REST call through the shared transport pipeline.
     *
     * GET and DELETE calls pass their parameters as a query string; POST and
     * PUT calls send them as a JSON body. Responses are returned verbatim —
     * REST providers have no GraphQL-style envelope, so no unwrapping happens.
     *
     * @typeParam T - The expected parsed response body.
     * @param path - The endpoint path beginning with `/` (for example `/anime/{id}`); placeholders are substituted from `pathParams` before interpolation into the URL.
     * @param options - The declarative request contract: method, auth requirement, content type, and per-request transport settings.
     * @param query - Query parameters appended to the URL (GET/DELETE), when provided.
     * @param body - The JSON request body (POST/PUT), when provided.
     * @param pathParams - Values substituted into `{placeholder}` segments of `path`. Defaults to an empty map so paths without placeholders need none.
     * @returns The parsed response body as-is.
     * @throws An `AniLinkAuthError` when `requiresAuth` is true and no token is set, or a normalized `AniLinkError` (typically `AniLinkRestError`) when the request fails.
     */
    protected async execute<T = unknown>(
        path: string,
        options: RestExecuteOptions = {},
        query?: Record<string, unknown>,
        body?: object,
        pathParams: Readonly<Record<string, string | number>> = {}
    ): Promise<T> {
        const { method = "GET", requiresAuth = false, contentType, transportOptions } = options;

        const interpolatedPath = path.replace(/\{(\w+)\}/g, (match, name: string) => {
            const value = pathParams[name];
            return value === undefined ? match : encodeURIComponent(String(value));
        });

        const url = `${this.baseUrl}${interpolatedPath}${buildQueryString(query ?? {})}`;

        const carriesBody = method === "POST" || method === "PUT";
        // An explicit content type opts every REST call out of GraphQL
        // envelope unwrapping in the shared pipeline, so it is set even for
        // body-less GET/DELETE requests.
        const effectiveContentType = contentType ?? "application/json";

        return await this.dispatch<T>(
            url,
            method,
            carriesBody ? body : undefined,
            requiresAuth,
            undefined,
            transportOptions,
            effectiveContentType
        );
    }
}
