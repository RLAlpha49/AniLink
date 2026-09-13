import { RestOperation } from "../../RestOperation";
import { AniLinkValidationError } from "../../../../base/AniLinkError";
import { MAL_API_BASE_URL } from "../constants";
import type {
    MalManga,
    MalMangaDeleteParams,
    MalMangaGetParams,
    MalMangaListStatus,
    MalMangaListStatusUpdate,
    MalMangaListStatusUpdateParams,
    MalRequestOptions,
} from "../types";

/**
 * {@link MalMangaOperation} is the REST operation adapter for MyAnimeList manga endpoints.
 *
 * It extends {@link RestOperation} and is composed into `MyAnimeListApi` via `buildMyAnimeListApi`, exposing {@link MalManga} through {@link MalRequestOptions} and `MyAnimeListMangaApi.get`.
 *
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/manga/operation/manga_manga_id_get
 */
export class MalMangaOperation extends RestOperation {
    /** The base URL for MyAnimeList API v2, from {@link MAL_API_BASE_URL}. */
    protected readonly baseUrl = MAL_API_BASE_URL;

    /**
     * The known {@link MalMangaListStatusUpdate} field names, in the order
     * they are encoded into the form body. The whitelist keeps excess
     * properties from JavaScript callers off the wire.
     */
    private static readonly LIST_STATUS_FIELDS = [
        "status",
        "num_chapters_read",
        "num_volumes_read",
        "score",
        "start_date",
        "finish_date",
        "comments",
        "is_rereading",
        "num_times_reread",
        "reread_value",
        "priority",
        "tags",
    ] as const satisfies (keyof MalMangaListStatusUpdate)[];

    /**
     * {@link MalMangaOperation.get} gets one manga by its MyAnimeList ID.
     *
     * It calls `GET /manga/{id}` through `RestOperation.execute` and returns a {@link MalManga} shaped by {@link MalRequestOptions.fields}. The facade alias is `MyAnimeListMangaApi.get`.
     *
     * @param params - The manga lookup inputs; a {@link MalMangaGetParams} carrying the MyAnimeList manga ID.
     * @param options - Optional field selection and transport settings; a {@link MalRequestOptions} merged over the instance defaults.
     * @returns The requested {@link MalManga}.
     * @throws A normalized `AniLinkError` when the request fails.
     * @example
     * ```typescript
     * const api = new AniLink({ mal: { accessToken: "mal-token" } }).mal;
     * const manga = await api.manga.get({ id: 1 }, { fields: ["id", "title"] });
     * ```
     * @see https://myanimelist.net/apiconfig/references/api/v2#tag/manga/operation/manga_manga_id_get
     */
    public async get(
        params: MalMangaGetParams,
        options: MalRequestOptions = {}
    ): Promise<MalManga> {
        const { id } = params;
        const { fields, ...transportOptions } = options;
        return await this.execute<MalManga>("/manga/{id}", {
            transportOptions,
            // `buildQueryString` skips undefined values, so `fields` can be
            // passed straight through.
            query: { fields: Array.isArray(fields) ? fields.join(",") : fields },
            pathParams: { id },
        });
    }

    /**
     * Encodes a {@link MalMangaListStatusUpdate} as the form-urlencoded body
     * MAL's list-status endpoints require.
     *
     * MAL documents `PATCH /manga/{id}/my_list_status` with an
     * `application/x-www-form-urlencoded` request body, not JSON. Only the
     * known list-status fields are encoded — excess properties from
     * JavaScript callers (typos like `num_chapter_read`) are dropped
     * instead of being sent to MAL as silent no-op fields. Array values
     * (`tags`) are joined into the comma-separated string MAL expects.
     *
     * @param payload - The list-status fields to update.
     * @returns The encoded body string, safe to pass as the request `data`.
     */
    private encodeListStatusBody(payload: MalMangaListStatusUpdate): string {
        const params = new URLSearchParams();
        for (const key of MalMangaOperation.LIST_STATUS_FIELDS) {
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
     * {@link MalMangaOperation.updateMyListStatus} updates the authenticated user's manga list status.
     *
     * It calls `PATCH /manga/{id}/my_list_status` through `RestOperation.execute` with `requiresAuth` and a form-urlencoded {@link MalMangaListStatusUpdate} body (MAL rejects JSON on this endpoint), returning the updated {@link MalMangaListStatus}. The facade alias is `MyAnimeListMangaApi.updateMyListStatus` and it requires `MalCredentials.accessToken`.
     *
     * @param params - The list-status write inputs; a {@link MalMangaListStatusUpdateParams} carrying the manga ID plus only the fields to change.
     * @param options - Optional field selection and transport settings; a {@link MalRequestOptions} merged over the instance defaults.
     * @returns The updated {@link MalMangaListStatus}.
     * @throws An `AniLinkAuthError` without an access token, an `AniLinkValidationError` when params carries no list-status field to change, or a normalized request error.
     * @example
     * ```typescript
     * const api = new AniLink({ mal: { accessToken: "mal-token" } }).mal;
     * const status = await api.manga.updateMyListStatus({
     *   id: 1,
     *   status: "reading",
     *   num_chapters_read: 10,
     *   score: 9,
     * });
     * ```
     * @see https://myanimelist.net/apiconfig/references/api/v2#tag/user-mangalist/operation/manga_manga_id_my_list_status_put
     */
    public async updateMyListStatus(
        params: MalMangaListStatusUpdateParams,
        options: MalRequestOptions = {}
    ): Promise<MalMangaListStatus> {
        const { id, ...payload } = params;
        // An empty payload would PATCH an empty form body — a no-op write.
        // Fail fast instead of sending it to MAL.
        const hasUpdateField = MalMangaOperation.LIST_STATUS_FIELDS.some(
            (field) => payload[field] !== undefined
        );
        if (!hasUpdateField) {
            throw new AniLinkValidationError([
                "params must carry at least one list-status field to change",
            ]);
        }
        const { fields, ...transportOptions } = options;
        return await this.execute<MalMangaListStatus>("/manga/{id}/my_list_status", {
            method: "PATCH",
            requiresAuth: true,
            transportOptions,
            contentType: "application/x-www-form-urlencoded",
            body: this.encodeListStatusBody(payload),
            // `buildQueryString` skips undefined values, so `fields` can be
            // passed straight through.
            query: { fields: Array.isArray(fields) ? fields.join(",") : fields },
            pathParams: { id },
        });
    }

    /**
     * {@link MalMangaOperation.deleteFromList} removes a manga from the authenticated user's list.
     *
     * It calls `DELETE /manga/{id}/my_list_status` through `RestOperation.execute` with `requiresAuth` and resolves with no body. The facade alias is `MyAnimeListMangaApi.deleteFromList` and it requires `MalCredentials.accessToken`.
     *
     * @param params - The delete inputs; a {@link MalMangaDeleteParams} carrying the MyAnimeList manga ID.
     * @param options - Optional transport settings; a {@link MalRequestOptions} merged over the instance defaults.
     * @returns Resolves once the entry is deleted; the response carries no body.
     * @throws An `AniLinkAuthError` without an access token, or a normalized request error.
     * @example
     * ```typescript
     * const api = new AniLink({ mal: { accessToken: "mal-token" } }).mal;
     * await api.manga.deleteFromList({ id: 1 });
     * ```
     * @see https://myanimelist.net/apiconfig/references/api/v2#tag/user-mangalist/operation/manga_manga_id_my_list_status_delete
     */
    public async deleteFromList(
        params: MalMangaDeleteParams,
        options: MalRequestOptions = {}
    ): Promise<void> {
        const { id } = params;
        const { fields: _ignoredFields, ...transportOptions } = options;
        void _ignoredFields;
        await this.execute<void>("/manga/{id}/my_list_status", {
            method: "DELETE",
            requiresAuth: true,
            transportOptions,
            pathParams: { id },
        });
    }
}
