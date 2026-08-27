import { RestOperation } from "../../RestOperation";
import { MAL_API_BASE_URL } from "../constants";
import type { MalAnime, MalRequestOptions } from "../types";

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
        return await this.execute<MalAnime>(
            "/anime/{id}",
            { transportOptions },
            fields === undefined
                ? undefined
                : { fields: Array.isArray(fields) ? fields.join(",") : fields },
            undefined,
            { id }
        );
    }
}
