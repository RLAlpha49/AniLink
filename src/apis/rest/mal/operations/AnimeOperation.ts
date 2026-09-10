import { RestOperation } from "../../RestOperation";
import { MAL_API_BASE_URL } from "../constants";
import type {
    MalAnime,
    MalAnimeListStatus,
    MalAnimeListStatusUpdate,
    MalRequestOptions,
} from "../types";

/**
 * {@link MalAnimeOperation} is the REST operation adapter for MyAnimeList anime endpoints.
 *
 * It extends {@link RestOperation} and is composed into `MyAnimeListApi` via `buildMyAnimeListApi`, exposing {@link MalAnime} through {@link MalRequestOptions} and `MyAnimeListAnimeApi.get`.
 *
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/anime/operation/anime_anime_id_get
 */
export class MalAnimeOperation extends RestOperation {
    /** The base URL for MyAnimeList API v2, from {@link MAL_API_BASE_URL}. */
    protected readonly baseUrl = MAL_API_BASE_URL;

    /**
     * {@link MalAnimeOperation.get} gets one anime by its MyAnimeList ID.
     *
     * It calls `GET /anime/{id}` through `RestOperation.execute` and returns a {@link MalAnime} shaped by {@link MalRequestOptions.fields}. The facade alias is `MyAnimeListAnimeApi.get`.
     *
     * @param id - The MyAnimeList anime ID.
     * @param options - Optional field selection and transport settings; a {@link MalRequestOptions} merged over the instance defaults.
     * @returns The requested {@link MalAnime}.
     * @throws A normalized `AniLinkError` when the request fails.
     * @example
     * ```typescript
     * const api = new AniLink({ mal: { accessToken: "mal-token" } }).mal;
     * const anime = await api.anime.get(21, { fields: ["id", "title"] });
     * ```
     * @see https://myanimelist.net/apiconfig/references/api/v2#tag/anime/operation/anime_anime_id_get
     */
    public async get(id: number, options: MalRequestOptions = {}): Promise<MalAnime> {
        const { fields, ...transportOptions } = options;
        return await this.execute<MalAnime>("/anime/{id}", {
            transportOptions,
            query:
                fields === undefined
                    ? undefined
                    : { fields: Array.isArray(fields) ? fields.join(",") : fields },
            pathParams: { id },
        });
    }

    /**
     * Encodes a {@link MalAnimeListStatusUpdate} as the form-urlencoded body
     * MAL's list-status endpoints require.
     *
     * MAL documents `PATCH /anime/{id}/my_list_status` with an
     * `application/x-www-form-urlencoded` request body, not JSON. Array values
     * (`tags`) are joined into the comma-separated string MAL expects.
     *
     * @param payload - The list-status fields to update.
     * @returns The encoded body string, safe to pass as the request `data`.
     */
    private encodeListStatusBody(payload: MalAnimeListStatusUpdate): string {
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(payload)) {
            if (value === undefined) continue;
            if (Array.isArray(value)) {
                if (Array.isArray(value)) {
                    params.set(key, value.join(","));
                }
            } else {
                params.set(key, String(value));
            }
        }
        return params.toString();
    }

    /**
     * {@link MalAnimeOperation.updateMyListStatus} updates the authenticated user's anime list status.
     *
     * It calls `PATCH /anime/{id}/my_list_status` through `RestOperation.execute` with `requiresAuth` and a form-urlencoded {@link MalAnimeListStatusUpdate} body (MAL rejects JSON on this endpoint), returning the updated {@link MalAnimeListStatus}. The facade alias is `MyAnimeListAnimeApi.updateMyListStatus` and it requires `MalCredentials.accessToken`.
     *
     * @param id - The MyAnimeList anime ID.
     * @param payload - The list-status fields to update; a {@link MalAnimeListStatusUpdate} of only the fields to change.
     * @param options - Optional field selection and transport settings; a {@link MalRequestOptions} merged over the instance defaults.
     * @returns The updated {@link MalAnimeListStatus}.
     * @throws An `AniLinkAuthError` without an access token, or a normalized request error.
     * @example
     * ```typescript
     * const api = new AniLink({ mal: { accessToken: "mal-token" } }).mal;
     * const status = await api.anime.updateMyListStatus(21, {
     *   status: "watching",
     *   num_watched_episodes: 10,
     *   score: 9,
     * });
     * ```
     * @see https://myanimelist.net/apiconfig/references/api/v2#tag/user-animelist/operation/anime_anime_id_my_list_status_put
     */
    public async updateMyListStatus(
        id: number,
        payload: MalAnimeListStatusUpdate,
        options: MalRequestOptions = {}
    ): Promise<MalAnimeListStatus> {
        const { fields, ...transportOptions } = options;
        return await this.execute<MalAnimeListStatus>("/anime/{id}/my_list_status", {
            method: "PATCH",
            requiresAuth: true,
            transportOptions,
            contentType: "application/x-www-form-urlencoded",
            body: this.encodeListStatusBody(payload),
            query:
                fields === undefined
                    ? undefined
                    : { fields: Array.isArray(fields) ? fields.join(",") : fields },
            pathParams: { id },
        });
    }

    /**
     * {@link MalAnimeOperation.deleteFromList} removes an anime from the authenticated user's list.
     *
     * It calls `DELETE /anime/{id}/my_list_status` through `RestOperation.execute` with `requiresAuth` and resolves with no body. The facade alias is `MyAnimeListAnimeApi.deleteFromList` and it requires `MalCredentials.accessToken`.
     *
     * @param id - The MyAnimeList anime ID.
     * @param options - Optional transport settings; a {@link MalRequestOptions} merged over the instance defaults.
     * @returns Resolves once the entry is deleted; the response carries no body.
     * @throws An `AniLinkAuthError` without an access token, or a normalized request error.
     * @example
     * ```typescript
     * const api = new AniLink({ mal: { accessToken: "mal-token" } }).mal;
     * await api.anime.deleteFromList(21);
     * ```
     * @see https://myanimelist.net/apiconfig/references/api/v2#tag/user-animelist/operation/anime_anime_id_my_list_status_delete
     */
    public async deleteFromList(id: number, options: MalRequestOptions = {}): Promise<void> {
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
