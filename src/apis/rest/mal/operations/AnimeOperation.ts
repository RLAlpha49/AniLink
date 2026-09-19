import { RestOperation } from "../../RestOperation";
import { AniLinkValidationError } from "../../../../base/AniLinkError";
import { DEFAULT_MAL_ANIME_FIELDS, formatMalFields, MAL_API_BASE_URL } from "../constants";
import type {
    MalAnime,
    MalAnimeDeleteParams,
    MalAnimeGetParams,
    MalAnimeListStatus,
    MalAnimeListStatusUpdate,
    MalAnimeListStatusUpdateParams,
    MalAnimeRankingResponse,
    MalAnimeSearchResponse,
    MalAnimeSearchParams,
    MalAnimeSuggestionsResponse,
    MalRankingParams,
    MalRequestOptions,
    MalSeasonalAnimeResponse,
    MalSeasonalParams,
} from "../types";

/**
 * {@link MalAnimeOperation} is the REST operation adapter for MyAnimeList anime endpoints.
 *
 * It extends {@link RestOperation} and is composed into `MyAnimeListApi` via `buildMyAnimeListApi`, exposing {@link MalAnime} through {@link MalRequestOptions} and `MyAnimeListAnimeApi.get`, plus the discovery reads `seasonal`, `ranking`, and `suggestions` for the seasonal, ranking, and suggestion endpoints.
 *
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/anime/operation/anime_anime_id_get
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/anime/operation/anime_season_year_season_get
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/anime/operation/anime_ranking_get
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/anime/operation/anime_suggestions_get
 */
export class MalAnimeOperation extends RestOperation {
    /** The base URL for MyAnimeList API v2, from {@link MAL_API_BASE_URL}. */
    protected readonly baseUrl = MAL_API_BASE_URL;

    /**
     * The known {@link MalAnimeListStatusUpdate} field names, in the order
     * they are encoded into the form body. The whitelist keeps excess
     * properties from JavaScript callers off the wire.
     */
    private static readonly LIST_STATUS_FIELDS = [
        "status",
        "num_watched_episodes",
        "score",
        "start_date",
        "finish_date",
        "comments",
        "is_rewatching",
        "num_times_rewatched",
        "rewatch_value",
        "priority",
        "tags",
    ] as const satisfies (keyof MalAnimeListStatusUpdate)[];

    /**
     * {@link MalAnimeOperation.get} gets one anime by its MyAnimeList ID.
     *
     * It calls `GET /anime/{id}` through `RestOperation.execute` and returns a {@link MalAnime} shaped by {@link MalRequestOptions.fields}; when `fields` is omitted it falls back to {@link DEFAULT_MAL_ANIME_FIELDS}. The facade alias is `MyAnimeListAnimeApi.get`.
     *
     * @param params - The anime lookup inputs; a {@link MalAnimeGetParams} carrying the MyAnimeList anime ID.
     * @param options - Optional field selection and transport settings; a {@link MalRequestOptions} merged over the instance defaults.
     * @returns The requested {@link MalAnime}.
     * @throws A normalized `AniLinkError` when the request fails.
     * @example
     * ```typescript
     * const api = new AniLink({ mal: { accessToken: "mal-token" } }).mal;
     * const anime = await api.anime.get({ id: 21 }, { fields: ["id", "title"] });
     * ```
     * @see https://myanimelist.net/apiconfig/references/api/v2#tag/anime/operation/anime_anime_id_get
     */
    public async get(
        params: MalAnimeGetParams,
        options: MalRequestOptions = {}
    ): Promise<MalAnime> {
        const { id } = params;
        const { fields, ...transportOptions } = options;
        const selectedFields = fields ?? DEFAULT_MAL_ANIME_FIELDS;
        return await this.execute<MalAnime>("/anime/{id}", {
            transportOptions,
            query: { fields: formatMalFields(selectedFields) },
            pathParams: { id },
        });
    }

    /**
     * {@link MalAnimeOperation.search} searches MyAnimeList anime by keyword.
     *
     * It calls `GET /anime` through `RestOperation.execute` with the `q` keyword
     * plus the `limit`/`offset` paging filters and returns a
     * {@link MalAnimeSearchResponse} page of `MalAnimeSearchEntry` entries
     * shaped by {@link MalRequestOptions.fields}. The facade alias is
     * `MyAnimeListAnimeApi.search` and it is a public read.
     *
     * @param params - The search inputs; a {@link MalAnimeSearchParams} carrying the keyword plus the optional paging filters.
     * @param options - Optional field selection and transport settings; a {@link MalRequestOptions} merged over the instance defaults.
     * @returns The search results page, a {@link MalAnimeSearchResponse}.
     * @throws An {@link AniLinkValidationError} when `q` is empty or only whitespace.
     * @throws A normalized `AniLinkError` when the request fails.
     * @example
     * ```typescript
     * const api = new AniLink({ mal: { accessToken: "mal-token" } }).mal;
     * const results = await api.anime.search(
     *   { q: "one piece" },
     *   { fields: ["id", "title", "main_picture"] }
     * );
     * console.log(results.data[0]?.node.title);
     * ```
     * @see https://myanimelist.net/apiconfig/references/api/v2#tag/anime/operation/anime_get
     */
    public async search(
        params: MalAnimeSearchParams,
        options: MalRequestOptions = {}
    ): Promise<MalAnimeSearchResponse> {
        const { q, limit, offset } = params;
        // An empty keyword would reach the wire as `?q=` and a remote `400`.
        // Fail fast with a labeled client-side error instead, like the
        // username reads fail fast on an empty username.
        if (q.trim() === "") {
            throw new AniLinkValidationError(["q must be a non-empty search keyword"]);
        }
        const { fields, ...transportOptions } = options;
        return await this.execute<MalAnimeSearchResponse>("/anime", {
            transportOptions,
            // `buildQueryString` skips undefined values, so the optional
            // filters can be passed straight through.
            query: {
                q,
                limit,
                offset,
                fields: formatMalFields(fields),
            },
        });
    }

    /**
     * {@link MalAnimeOperation.seasonal} gets the anime of one broadcast season.
     *
     * It calls `GET /anime/season/{year}/{season}` through `RestOperation.execute` and returns a {@link MalSeasonalAnimeResponse} page of `MalSeasonalAnime` entries shaped by {@link MalRequestOptions.fields}. The facade alias is `MyAnimeListAnimeApi.seasonal` and it is a public read.
     *
     * @param params - The seasonal read inputs; a {@link MalSeasonalParams} carrying the year and broadcast window.
     * @param options - Optional field selection and transport settings; a {@link MalRequestOptions} merged over the instance defaults.
     * @returns The seasonal anime page, a {@link MalSeasonalAnimeResponse}.
     * @throws A normalized `AniLinkError` when the request fails.
     * @example
     * ```typescript
     * const api = new AniLink({ mal: { accessToken: "mal-token" } }).mal;
     * const season = await api.anime.seasonal(
     *   { year: 2024, season: "winter" },
     *   { fields: ["id", "title", "main_picture"] }
     * );
     * console.log(season.data[0]?.node.title);
     * ```
     * @see https://myanimelist.net/apiconfig/references/api/v2#tag/anime/operation/anime_season_year_season_get
     */
    public async seasonal(
        params: MalSeasonalParams,
        options: MalRequestOptions = {}
    ): Promise<MalSeasonalAnimeResponse> {
        const { year, season } = params;
        const { fields, ...transportOptions } = options;
        return await this.execute<MalSeasonalAnimeResponse>("/anime/season/{year}/{season}", {
            transportOptions,
            // `buildQueryString` skips undefined values, so `fields` can be
            // passed straight through.
            query: { fields: formatMalFields(fields) },
            pathParams: { year, season },
        });
    }

    /**
     * {@link MalAnimeOperation.ranking} gets one of MyAnimeList's anime ranking lists.
     *
     * It calls `GET /anime/ranking` through `RestOperation.execute` with the `ranking_type` query parameter and returns a {@link MalAnimeRankingResponse} page of `MalRankingEntry` entries shaped by {@link MalRequestOptions.fields}. The facade alias is `MyAnimeListAnimeApi.ranking` and it is a public read.
     *
     * @param params - The ranking read inputs; a {@link MalRankingParams} carrying the ranking list to fetch.
     * @param options - Optional field selection and transport settings; a {@link MalRequestOptions} merged over the instance defaults.
     * @returns The ranking page, a {@link MalAnimeRankingResponse}.
     * @throws A normalized `AniLinkError` when the request fails.
     * @example
     * ```typescript
     * const api = new AniLink({ mal: { accessToken: "mal-token" } }).mal;
     * const top = await api.anime.ranking(
     *   { rankingType: "airing" },
     *   { fields: ["id", "title", "mean"] }
     * );
     * console.log(top.data[0]?.node.title, top.data[0]?.ranking.rank);
     * ```
     * @see https://myanimelist.net/apiconfig/references/api/v2#tag/anime/operation/anime_ranking_get
     */
    public async ranking(
        params: MalRankingParams,
        options: MalRequestOptions = {}
    ): Promise<MalAnimeRankingResponse> {
        const { rankingType } = params;
        const { fields, ...transportOptions } = options;
        return await this.execute<MalAnimeRankingResponse>("/anime/ranking", {
            transportOptions,
            // `buildQueryString` skips undefined values, so `fields` can be
            // passed straight through.
            query: {
                ranking_type: rankingType,
                fields: formatMalFields(fields),
            },
        });
    }

    /**
     * {@link MalAnimeOperation.suggestions} gets MyAnimeList's anime suggestions for the authenticated user.
     *
     * It calls `GET /anime/suggestions` through `RestOperation.execute` with `requiresAuth` and returns a {@link MalAnimeSuggestionsResponse} page of `MalSuggestion` entries shaped by {@link MalRequestOptions.fields}. The facade alias is `MyAnimeListAnimeApi.suggestions` and it requires `MalCredentials.accessToken`.
     *
     * @param options - Optional field selection and transport settings; a {@link MalRequestOptions} merged over the instance defaults.
     * @returns The suggestions page, a {@link MalAnimeSuggestionsResponse}.
     * @throws An `AniLinkAuthError` without an access token, or a normalized request error.
     * @example
     * ```typescript
     * const api = new AniLink({ mal: { accessToken: "mal-token" } }).mal;
     * const suggestions = await api.anime.suggestions({
     *   fields: ["id", "title", "main_picture"],
     * });
     * console.log(suggestions.data[0]?.node.title);
     * ```
     * @see https://myanimelist.net/apiconfig/references/api/v2#tag/anime/operation/anime_suggestions_get
     */
    public async suggestions(
        options: MalRequestOptions = {}
    ): Promise<MalAnimeSuggestionsResponse> {
        const { fields, ...transportOptions } = options;
        return await this.execute<MalAnimeSuggestionsResponse>("/anime/suggestions", {
            requiresAuth: true,
            transportOptions,
            // `buildQueryString` skips undefined values, so `fields` can be
            // passed straight through.
            query: { fields: formatMalFields(fields) },
        });
    }

    /**
     * Encodes a {@link MalAnimeListStatusUpdate} as the form-urlencoded body
     * MAL's list-status endpoints require.
     *
     * MAL documents `PATCH /anime/{id}/my_list_status` with an
     * `application/x-www-form-urlencoded` request body, not JSON. Only the
     * known list-status fields are encoded — excess properties from
     * JavaScript callers (typos like `num_watched_episode`) are dropped
     * instead of being sent to MAL as silent no-op fields. Array values
     * (`tags`) are joined into the comma-separated string MAL expects.
     *
     * @param payload - The list-status fields to update.
     * @returns The encoded body string, safe to pass as the request `data`.
     */
    private encodeListStatusBody(payload: MalAnimeListStatusUpdate): string {
        const params = new URLSearchParams();
        for (const key of MalAnimeOperation.LIST_STATUS_FIELDS) {
            const value = payload[key];
            if (value === undefined) continue;
            if (Array.isArray(value)) {
                params.set(key, value.join(","));
            } else {
                params.set(key, String(value));
            }
        }
        return params.toString();
    }

    /**
     * {@link MalAnimeOperation.updateMyListStatus} updates the authenticated user's anime list status.
     *
     * It calls `PATCH /anime/{id}/my_list_status` through `RestOperation.execute` with `requiresAuth` and a form-urlencoded {@link MalAnimeListStatusUpdate} body (the endpoint's documented request format), returning the updated {@link MalAnimeListStatus}. The facade alias is `MyAnimeListAnimeApi.updateMyListStatus` and it requires `MalCredentials.accessToken`.
     *
     * @param params - The list-status write inputs; a {@link MalAnimeListStatusUpdateParams} carrying the anime ID plus only the fields to change.
     * @param options - Optional field selection and transport settings; a {@link MalRequestOptions} merged over the instance defaults.
     * @returns The updated {@link MalAnimeListStatus}.
     * @throws An `AniLinkAuthError` without an access token, an {@link AniLinkValidationError} when params carries no list-status field to change, or a normalized request error.
     * @example
     * ```typescript
     * const api = new AniLink({ mal: { accessToken: "mal-token" } }).mal;
     * const status = await api.anime.updateMyListStatus({
     *   id: 21,
     *   status: "watching",
     *   num_watched_episodes: 10,
     *   score: 9,
     * });
     * ```
     * @see https://myanimelist.net/apiconfig/references/api/v2#tag/user-animelist/operation/anime_anime_id_my_list_status_put
     */
    public async updateMyListStatus(
        params: MalAnimeListStatusUpdateParams,
        options: MalRequestOptions = {}
    ): Promise<MalAnimeListStatus> {
        const { id, ...payload } = params;
        // An empty payload would PATCH an empty form body — a no-op write.
        // Fail fast instead of sending it to MAL.
        const hasUpdateField = MalAnimeOperation.LIST_STATUS_FIELDS.some(
            (field) => payload[field] !== undefined
        );
        if (!hasUpdateField) {
            throw new AniLinkValidationError([
                "params must carry at least one list-status field to change",
            ]);
        }
        const { fields, ...transportOptions } = options;
        return await this.execute<MalAnimeListStatus>("/anime/{id}/my_list_status", {
            method: "PATCH",
            requiresAuth: true,
            transportOptions,
            contentType: "application/x-www-form-urlencoded",
            body: this.encodeListStatusBody(payload),
            // `buildQueryString` skips undefined values, so `fields` can be
            // passed straight through.
            query: { fields: formatMalFields(fields) },
            pathParams: { id },
        });
    }

    /**
     * {@link MalAnimeOperation.deleteFromList} removes an anime from the authenticated user's list.
     *
     * It calls `DELETE /anime/{id}/my_list_status` through `RestOperation.execute` with `requiresAuth` and resolves with no body. The facade alias is `MyAnimeListAnimeApi.deleteFromList` and it requires `MalCredentials.accessToken`.
     *
     * @param params - The delete inputs; a {@link MalAnimeDeleteParams} carrying the MyAnimeList anime ID.
     * @param options - Optional transport settings; a {@link MalRequestOptions} merged over the instance defaults.
     * @returns Resolves once the entry is deleted; the response carries no body.
     * @throws An `AniLinkAuthError` without an access token, or a normalized request error.
     * @example
     * ```typescript
     * const api = new AniLink({ mal: { accessToken: "mal-token" } }).mal;
     * await api.anime.deleteFromList({ id: 21 });
     * ```
     * @see https://myanimelist.net/apiconfig/references/api/v2#tag/user-animelist/operation/anime_anime_id_my_list_status_delete
     */
    public async deleteFromList(
        params: MalAnimeDeleteParams,
        options: MalRequestOptions = {}
    ): Promise<void> {
        const { id } = params;
        const { fields: _ignoredFields, ...transportOptions } = options;
        void _ignoredFields;
        await this.execute<void>("/anime/{id}/my_list_status", {
            method: "DELETE",
            requiresAuth: true,
            transportOptions,
            pathParams: { id },
        });
    }
}
