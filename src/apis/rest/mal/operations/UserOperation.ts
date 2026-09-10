import { RestOperation } from "../../RestOperation";
import { MAL_API_BASE_URL } from "../constants";
import type {
    MalRequestOptions,
    MalUser,
    MalUserAnimeListOptions,
    MalUserAnimeListResponse,
    MalUserMangaListOptions,
    MalUserMangaListResponse,
} from "../types";

/**
 * {@link MalUserOperation} is the REST operation adapter for the MyAnimeList user endpoints.
 *
 * It extends `RestOperation` and is composed into `MyAnimeListApi` via `buildMyAnimeListApi`, exposing {@link MalUser} through {@link MalRequestOptions} and `MyAnimeListUserApi.me`, plus the paginated user-list reads `animeList` and `mangaList` for `GET /users/{user_name}/animelist` and `GET /users/{user_name}/mangalist`.
 *
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/users/operation/users_user_id_get
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/user-animelist/operation/users_user_id_animelist_get
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/user-mangalist/operation/users_user_id_mangalist_get
 */
export class MalUserOperation extends RestOperation {
    /** The base URL for MyAnimeList API v2, from {@link MAL_API_BASE_URL}. */
    protected readonly baseUrl = MAL_API_BASE_URL;

    /**
     * Normalizes a `username` argument for the `@me` check: trimmed and
     * lowercased, so `@ME` and `" @me "` resolve the authenticated user too.
     */
    private static normalizeUsername(username: string): string {
        return username.trim().toLowerCase();
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
            query:
                fields === undefined
                    ? undefined
                    : { fields: Array.isArray(fields) ? fields.join(",") : fields },
        });
    }

    /**
     * {@link MalUserOperation.animeList} gets a user's anime list, one page at a time.
     *
     * It calls `GET /users/{username}/animelist` through `RestOperation.execute` and returns a {@link MalUserAnimeListResponse} page of {@link MalUserAnimeListEntry} entries shaped by {@link MalUserAnimeListOptions.fields}. The facade alias is `MyAnimeListUserApi.animeList` and it is a public read: `username` accepts a user name or `@me`, with `@me` and private lists requiring an access token (a client ID alone cannot resolve `@me`). The `@me` check is case-insensitive and ignores surrounding whitespace.
     *
     * @param username - The MyAnimeList user name, or `@me` for the authenticated user (case-insensitive, surrounding whitespace ignored).
     * @param options - Optional status, sort, paging, field selection, and transport settings; a {@link MalUserAnimeListOptions} merged over the instance defaults.
     * @returns The anime list page, a {@link MalUserAnimeListResponse}.
     * @throws An `AniLinkAuthError` when `username` is `@me` and no access token is configured.
     * @throws A normalized `AniLinkError` when the request fails.
     * @example
     * ```typescript
     * const api = new AniLink({ mal: { accessToken: "mal-token" } }).mal;
     * const list = await api.user.animeList("@me", {
     *   status: "watching",
     *   fields: ["id", "title", "list_status"],
     * });
     * console.log(list.data[0]?.node.title);
     * ```
     * @see https://myanimelist.net/apiconfig/references/api/v2#tag/user-animelist/operation/users_user_id_animelist_get
     */
    public async animeList(
        username: string,
        options: MalUserAnimeListOptions = {}
    ): Promise<MalUserAnimeListResponse> {
        const { fields, status, sort, limit, offset, ...transportOptions } = options;
        const normalized = MalUserOperation.normalizeUsername(username);
        return await this.execute<MalUserAnimeListResponse>(
            normalized === "@me" ? "/users/@me/animelist" : "/users/{username}/animelist",
            {
                // `@me` resolves the authenticated user, which only a bearer token
                // can identify — a client ID alone cannot — so fail fast like `me`.
                requiresAuth: normalized === "@me",
                transportOptions,
                // `buildQueryString` skips undefined/null values, so the
                // optional filters can be passed straight through.
                query: {
                    fields: Array.isArray(fields) ? fields.join(",") : fields,
                    status,
                    sort,
                    limit,
                    offset,
                },
                pathParams: normalized === "@me" ? undefined : { username },
            }
        );
    }

    /**
     * {@link MalUserOperation.mangaList} gets a user's manga list, one page at a time.
     *
     * It calls `GET /users/{username}/mangalist` through `RestOperation.execute` and returns a {@link MalUserMangaListResponse} page of {@link MalUserMangaListEntry} entries shaped by {@link MalUserMangaListOptions.fields}. The facade alias is `MyAnimeListUserApi.mangaList` and it is a public read: `username` accepts a user name or `@me`, with `@me` and private lists requiring an access token (a client ID alone cannot resolve `@me`). The `@me` check is case-insensitive and ignores surrounding whitespace.
     *
     * @param username - The MyAnimeList user name, or `@me` for the authenticated user (case-insensitive, surrounding whitespace ignored).
     * @param options - Optional status, sort, paging, field selection, and transport settings; a {@link MalUserMangaListOptions} merged over the instance defaults.
     * @returns The manga list page, a {@link MalUserMangaListResponse}.
     * @throws An `AniLinkAuthError` when `username` is `@me` and no access token is configured.
     * @throws A normalized `AniLinkError` when the request fails.
     * @example
     * ```typescript
     * const api = new AniLink({ mal: { accessToken: "mal-token" } }).mal;
     * const list = await api.user.mangaList("@me", {
     *   status: "reading",
     *   fields: ["id", "title", "list_status"],
     * });
     * console.log(list.data[0]?.node.title);
     * ```
     * @see https://myanimelist.net/apiconfig/references/api/v2#tag/user-mangalist/operation/users_user_id_mangalist_get
     */
    public async mangaList(
        username: string,
        options: MalUserMangaListOptions = {}
    ): Promise<MalUserMangaListResponse> {
        const { fields, status, sort, limit, offset, ...transportOptions } = options;
        const normalized = MalUserOperation.normalizeUsername(username);
        return await this.execute<MalUserMangaListResponse>(
            normalized === "@me" ? "/users/@me/mangalist" : "/users/{username}/mangalist",
            {
                // `@me` resolves the authenticated user, which only a bearer token
                // can identify — a client ID alone cannot — so fail fast like `me`.
                requiresAuth: normalized === "@me",
                transportOptions,
                // `buildQueryString` skips undefined/null values, so the
                // optional filters can be passed straight through.
                query: {
                    fields: Array.isArray(fields) ? fields.join(",") : fields,
                    status,
                    sort,
                    limit,
                    offset,
                },
                pathParams: normalized === "@me" ? undefined : { username },
            }
        );
    }
}
