import type { MalAnime, MalRequestOptions, MalUser } from "./types";

/** The anime group exposed by the MyAnimeList provider. */
export interface MyAnimeListAnimeApi {
    /** Gets one anime by its MAL ID. */
    get: (id: number, options?: MalRequestOptions) => Promise<MalAnime>;
}

/** The user group exposed by the MyAnimeList provider. */
export interface MyAnimeListUserApi {
    /** Gets the currently authenticated MAL user. */
    me: (options?: MalRequestOptions) => Promise<MalUser>;
}

/** The typed MyAnimeList REST surface exposed by `aniLink.mal`. */
export interface MyAnimeListApi {
    /** Anime operations. */
    anime: MyAnimeListAnimeApi;
    /** User operations. */
    user: MyAnimeListUserApi;
}
