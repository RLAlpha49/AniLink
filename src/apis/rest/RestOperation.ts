import { BaseOperation, resolveOperationLabel } from "../../base/BaseOperation";
import { AniLinkValidationError } from "../../base/AniLinkError";
import { type HttpMethod, type RequestOptions } from "../../base/RequestHandler";

/**
 * The declarative contract a REST operation passes to
 * `RestOperation.execute`.
 *
 * Every field except the path is optional: an operation declares only the
 * variation points it needs, and `execute` applies them in a fixed order so
 * request behaviour is uniform across the whole API surface.
 */
export interface RestExecuteOptions {
    /**
     * The HTTP method for the call. Defaults to `"GET"`.
     */
    readonly method?: HttpMethod;

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
     * Query parameters appended to the URL (GET/DELETE), when provided.
     */
    readonly query?: Record<string, unknown>;

    /**
     * The request body (POST/PUT/PATCH): a JSON object, or a pre-encoded
     * string body (for example a form-urlencoded list-status payload), when
     * provided.
     */
    readonly body?: object | string;

    /**
     * Values substituted into `{placeholder}` segments of `path`. Defaults to
     * an empty map so paths without placeholders need none.
     */
    readonly pathParams?: Readonly<Record<string, string | number>>;

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
 * is percent-encoded. An empty record produces an empty string. A plain
 * object value throws a `TypeError` instead of silently serializing as
 * `[object Object]` — a nested parameter is a caller bug, and the wrong
 * request it would produce is far harder to debug than the throw.
 *
 * @param params - The query parameters, with flat primitive or array values.
 * @returns A query string beginning with `?`, or an empty string.
 * @throws A `TypeError` when a value is a plain object (nested parameters
 * are not supported; flatten them into primitive keys at the call site).
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
        } else if (typeof value === "object") {
            throw new TypeError(
                `Query parameter "${key}" is an object; buildQueryString accepts flat primitive or array values only. Flatten nested parameters into primitive keys before passing them.`
            );
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
 * It is the REST counterpart of the shared `GraphQLOperation` base:
 * both extend the {@link BaseOperation} transport plumbing, but this class
 * shapes plain HTTP requests instead of GraphQL documents — path-based URLs
 * with query strings, JSON bodies, and verbatim response bodies (no envelope
 * unwrapping). Failures surface as `AniLinkRestError` via the shared
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
     * GET and DELETE calls pass their parameters as a query string; POST, PUT,
     * and PATCH calls send them as a JSON body. Responses are returned verbatim
     * — REST providers have no GraphQL-style envelope, so no unwrapping
     * happens.
     *
     * @typeParam T - The expected parsed response body.
     * @param path - The endpoint path beginning with `/` (for example `/anime/{id}`); placeholders are substituted from `pathParams` before interpolation into the URL.
     * @param options - The declarative request contract: method, auth requirement, content type, query/body/pathParams, and per-request transport settings.
     * @returns The parsed response body as-is.
     * @throws An {@link AniLinkAuthError} when `requiresAuth` is true and no token is set, an {@link AniLinkValidationError} when a `{placeholder}` in `path` has no matching `pathParams` entry, or a normalized {@link AniLinkError} (typically `AniLinkRestError`) when the request fails.
     */
    protected async execute<T = unknown>(
        path: string,
        options: RestExecuteOptions = {}
    ): Promise<T> {
        const {
            method = "GET",
            requiresAuth = false,
            contentType,
            query,
            body,
            pathParams = {},
            transportOptions,
        } = options;

        const interpolatedPath = path.replace(/\{(\w+)\}/g, (_match, name: string) => {
            const value = pathParams[name];
            if (value === undefined) {
                // A placeholder with no value would otherwise reach the wire
                // as a literally-braced URL (for example `/anime/{id}`), which
                // every REST provider answers with a confusing 404/400.
                // Fail fast with the missing parameter's name, plus the
                // operation label when one is available, so the caller knows
                // which call failed before anything is dispatched.
                const details = [`Missing path parameter: ${name}`];
                const operationLabel = resolveOperationLabel(this);
                if (operationLabel !== undefined) {
                    details.push(`Operation: ${operationLabel}`);
                }
                throw new AniLinkValidationError(details);
            }
            return encodeURIComponent(String(value));
        });

        const url = `${this.baseUrl}${interpolatedPath}${buildQueryString(query ?? {})}`;

        const carriesBody = method === "POST" || method === "PUT" || method === "PATCH";
        // An explicit content type opts every REST call out of GraphQL
        // envelope unwrapping in the shared pipeline, so it is set even for
        // body-less GET/DELETE requests.
        const effectiveContentType = contentType ?? "application/json";

        return await this.dispatch<T>(url, method, carriesBody ? body : undefined, {
            requiresAuth,
            transportOptions,
            contentType: effectiveContentType,
            protocol: "rest",
        });
    }
}
