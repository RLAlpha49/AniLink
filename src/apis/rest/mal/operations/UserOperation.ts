import { RestOperation } from "../../RestOperation";
import { AniLinkValidationError } from "../../../../base/AniLinkError";
import { formatMalFields, MAL_API_BASE_URL } from "../constants";
import type {
    MalRequestOptions,
    MalUser,
    MalUserAnimeListParams,
    MalUserAnimeListResponse,
    MalUserGetParams,
    MalUserMangaListParams,
    MalUserMangaListResponse,
} from "../types";

/**
 * {@link MalUserOperation} is the REST operation adapter for the MyAnimeList user endpoints.
 *
 * It extends {@link RestOperation} and is composed into `MyAnimeListApi` via `buildMyAnimeListApi`, exposing {@link MalUser} through {@link MalRequestOptions} and `MyAnimeListUserApi.me`. The paginated user-list reads `animeList` and `mangaList` cover `GET /users/{user_name}/animelist` and `GET /users/{user_name}/mangalist`.
 *
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/users/operation/users_user_id_get
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/user-animelist/operation/users_user_id_animelist_get
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/user-mangalist/operation/users_user_id_mangalist_get
 */
export class MalUserOperation extends RestOperation {
    /** The base URL for MyAnimeList API v2, from {@link MAL_API_BASE_URL}. */
    protected readonly baseUrl = MAL_API_BASE_URL;

    /**
     * Normalizes a `username` argument for the `@me` check by trimming and
     * lowercasing it, so `@ME` and `" @me "` resolve the authenticated user too.
     */
    private static normalizeUsername(username: string): string {
        return username.trim().toLowerCase();
    }

    /**
     * Validates a normalized username before it is interpolated into a URL
     * path. An empty string would produce a malformed `/users//animelist`
     * path, so it fails fast with a clear client-side message instead of an
     * upstream 404 or URL-parse error.
     *
     * @param normalized - The trimmed, lowercased username.
     * @throws An {@link AniLinkValidationError} when the username is empty.
     */
    private static requireUsername(normalized: string): void {
        if (normalized === "") {
            throw new AniLinkValidationError(["username must be a non-empty user name or @me"]);
        }
    }

    /**
     * {@link MalUserOperation.me} gets the currently authenticated MyAnimeList user.
     *
     * It calls `GET /users/@me` through `RestOperation.execute` with `requiresAuth` and returns a {@link MalUser} shaped by {@link MalRequestOptions.fields}. The facade alias is `MyAnimeListUserApi.me` and it requires `MalCredentials.accessToken`.
     *
     * @param options - Optional field selection and transport settings; a {@link MalRequestOptions} merged over the instance defaults.
     * @returns The authenticated {@link MalUser}.
     * @throws An `AniLinkAuthError` without an access token, or a normalized request error.
     * @example
     * ```typescript
     * const api = new AniLink({ mal: { accessToken: "mal-token" } }).mal;
     * const user = await api.user.me({ fields: ["id", "name"] });
     * ```
     * @see https://myanimelist.net/apiconfig/references/api/v2#tag/users/operation/users_user_id_get
     */
    public async me(options: MalRequestOptions = {}): Promise<MalUser> {
        const { fields, ...transportOptions } = options;
        return await this.execute<MalUser>("/users/@me", {
            requiresAuth: true,
            transportOptions,
            // `buildQueryString` skips undefined values, so `fields` can be
            // passed straight through.
            query: { fields: formatMalFields(fields) },
        });
    }

    /**
     * {@link MalUserOperation.get} gets a MyAnimeList user profile.
     *
     * It calls `GET /users/{username}` through `RestOperation.execute` and
     * returns a {@link MalUser} shaped by {@link MalRequestOptions.fields}.
     * The facade alias is `MyAnimeListUserApi.get`. MyAnimeList documents only
     * `@me` for this endpoint, so `username` accepts `@me` (with the same
     * case-insensitive, whitespace-tolerant check as the user-list reads) and
     * requires an access token to resolve it. Other usernames are passed
     * through, but MyAnimeList currently answers them with `404`.
     *
     * @param params - The profile read inputs; a {@link MalUserGetParams} carrying the username.
     * @param options - Optional field selection and transport settings; a {@link MalRequestOptions} merged over the instance defaults.
     * @returns The requested {@link MalUser}.
     * @throws An `AniLinkAuthError` when no access token is configured.
     * @throws An {@link AniLinkValidationError} when `username` is empty or only whitespace.
     * @throws A normalized `AniLinkError` when the request fails.
     * @example
     * ```typescript
     * const api = new AniLink({ mal: { accessToken: "mal-token" } }).mal;
     * const user = await api.user.get(
     *   { username: "@me" },
     *   { fields: ["id", "name", "location"] }
     * );
     * console.log(user.name);
     * ```
     * @see https://myanimelist.net/apiconfig/references/api/v2#tag/users/operation/users_user_id_get
     */
    public async get(params: MalUserGetParams, options: MalRequestOptions = {}): Promise<MalUser> {
        const { username } = params;
        const { fields, ...transportOptions } = options;
        const normalized = MalUserOperation.normalizeUsername(username);
        MalUserOperation.requireUsername(normalized);
        return await this.execute<MalUser>(
            normalized === "@me" ? "/users/@me" : "/users/{username}",
            {
                // Only a bearer token can identify the authenticated user at
                // `@me`; a client ID alone cannot. Reject the request early,
                // as `me` does.
                requiresAuth: true,
                transportOptions,
                // `buildQueryString` skips undefined/null values, so the
                // optional filters can be passed straight through.
                query: {
                    fields: formatMalFields(fields),
                },
                // The trimmed username, not the raw argument. Surrounding
                // whitespace would otherwise be percent-encoded into the
                // path and answered with a 404.
                pathParams: normalized === "@me" ? undefined : { username: normalized },
            }
        );
    }

    /**
     * {@link MalUserOperation.animeList} gets a user's anime list, one page at a time.
     *
     * It calls `GET /users/{username}/animelist` through
     * `RestOperation.execute` and returns a {@link MalUserAnimeListResponse}
     * page of `MalUserAnimeListEntry` entries shaped by
     * {@link MalRequestOptions.fields}. The facade exposes this method as
     * `MyAnimeListUserApi.animeList`. `username` accepts a user name or `@me`;
     * `@me` and private lists require an access token. The `@me` check ignores
     * case and surrounding whitespace.
     *
     * @param params - The anime-list read inputs; a {@link MalUserAnimeListParams} carrying the username plus the optional status, sort, and paging filters.
     * @param options - Optional field selection and transport settings; a {@link MalRequestOptions} merged over the instance defaults.
     * @returns The anime list page, a {@link MalUserAnimeListResponse}.
     * @throws An `AniLinkAuthError` when `username` is `@me` and no access token is configured.
     * @throws An {@link AniLinkValidationError} when `username` is empty or only whitespace.
     * @throws A normalized `AniLinkError` when the request fails.
     * @example
     * ```typescript
     * const api = new AniLink({ mal: { accessToken: "mal-token" } }).mal;
     * const list = await api.user.animeList(
     *   { username: "@me", status: "watching" },
     *   { fields: ["id", "title", "list_status"] }
     * );
     * console.log(list.data[0]?.node.title);
     * ```
     * @see https://myanimelist.net/apiconfig/references/api/v2#tag/user-animelist/operation/users_user_id_animelist_get
     */
    public async animeList(
        params: MalUserAnimeListParams,
        options: MalRequestOptions = {}
    ): Promise<MalUserAnimeListResponse> {
        const { username, status, sort, limit, offset } = params;
        const { fields, ...transportOptions } = options;
        const normalized = MalUserOperation.normalizeUsername(username);
        MalUserOperation.requireUsername(normalized);
        return await this.execute<MalUserAnimeListResponse>(
            normalized === "@me" ? "/users/@me/animelist" : "/users/{username}/animelist",
            {
                // Only a bearer token can identify the authenticated user at
                // `@me`; a client ID alone cannot. Require one, as `me` does.
                requiresAuth: normalized === "@me",
                transportOptions,
                // `buildQueryString` skips undefined/null values, so the
                // optional filters can be passed straight through.
                query: {
                    fields: formatMalFields(fields),
                    status,
                    sort,
                    limit,
                    offset,
                },
                // The trimmed username, not the raw argument. Surrounding
                // whitespace would otherwise be percent-encoded into the
                // path and answered with a 404.
                pathParams: normalized === "@me" ? undefined : { username: normalized },
            }
        );
    }

    /**
     * {@link MalUserOperation.mangaList} gets a user's manga list, one page at a time.
     *
     * It calls `GET /users/{username}/mangalist` through
     * `RestOperation.execute` and returns a {@link MalUserMangaListResponse}
     * page of `MalUserMangaListEntry` entries shaped by
     * {@link MalRequestOptions.fields}. The facade exposes this method as
     * `MyAnimeListUserApi.mangaList`. `username` accepts a user name or `@me`;
     * `@me` and private lists require an access token. The `@me` check ignores
     * case and surrounding whitespace.
     *
     * @param params - The manga-list read inputs; a {@link MalUserMangaListParams} carrying the username plus the optional status, sort, and paging filters.
     * @param options - Optional field selection and transport settings; a {@link MalRequestOptions} merged over the instance defaults.
     * @returns The manga list page, a {@link MalUserMangaListResponse}.
     * @throws An `AniLinkAuthError` when `username` is `@me` and no access token is configured.
     * @throws An {@link AniLinkValidationError} when `username` is empty or only whitespace.
     * @throws A normalized `AniLinkError` when the request fails.
     * @example
     * ```typescript
     * const api = new AniLink({ mal: { accessToken: "mal-token" } }).mal;
     * const list = await api.user.mangaList(
     *   { username: "@me", status: "reading" },
     *   { fields: ["id", "title", "list_status"] }
     * );
     * console.log(list.data[0]?.node.title);
     * ```
     * @see https://myanimelist.net/apiconfig/references/api/v2#tag/user-mangalist/operation/users_user_id_mangalist_get
     */
    public async mangaList(
        params: MalUserMangaListParams,
        options: MalRequestOptions = {}
    ): Promise<MalUserMangaListResponse> {
        const { username, status, sort, limit, offset } = params;
        const { fields, ...transportOptions } = options;
        const normalized = MalUserOperation.normalizeUsername(username);
        MalUserOperation.requireUsername(normalized);
        return await this.execute<MalUserMangaListResponse>(
            normalized === "@me" ? "/users/@me/mangalist" : "/users/{username}/mangalist",
            {
                // Only a bearer token can identify the authenticated user at
                // `@me`; a client ID alone cannot. Require one, as `me` does.
                requiresAuth: normalized === "@me",
                transportOptions,
                // `buildQueryString` skips undefined/null values, so the
                // optional filters can be passed straight through.
                query: {
                    fields: formatMalFields(fields),
                    status,
                    sort,
                    limit,
                    offset,
                },
                // The trimmed username, not the raw argument. Surrounding
                // whitespace would otherwise be percent-encoded into the
                // path and answered with a 404.
                pathParams: normalized === "@me" ? undefined : { username: normalized },
            }
        );
    }
}
