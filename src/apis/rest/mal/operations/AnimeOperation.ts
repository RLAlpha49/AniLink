import { RestOperation } from "../../RestOperation";
import { MAL_API_BASE_URL } from "../constants";
import type { MalAnime, MalRequestOptions } from "../types";

/** REST operation adapter for MyAnimeList anime endpoints. */
export class MalAnimeOperation extends RestOperation {
    protected readonly baseUrl = MAL_API_BASE_URL;

    /**
     * Gets one anime by its MyAnimeList ID.
     *
     * @param id - The MyAnimeList anime ID.
     * @param options - Optional field selection and transport settings.
     * @returns The requested MAL anime.
     * @throws A normalized AniLink error when the request fails.
     * @example
     * ```typescript
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
