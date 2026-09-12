import type { RequestOptions } from "../../../../base/RequestHandler";

/**
 * Cross-resource MyAnimeList types: the shared picture node, the paging node
 * of list-style responses, and the `fields`-aware request options every MAL
 * operation accepts.
 */

/**
 * {@link MalPicture} is the image variants returned by MyAnimeList for an anime or manga entity.
 *
 * It is the `main_picture` shape inside {@link MalAnime} and {@link MalManga} and is selected via {@link MalRequestOptions.fields} through `MalAnimeOperation.get`, `MalMangaOperation.get`, `MyAnimeListAnimeApi.get`, and `MyAnimeListMangaApi.get`.
 *
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/anime/operation/anime_anime_id_get
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/manga/operation/manga_manga_id_get
 */
export interface MalPicture {
    /** The large image URL, when MyAnimeList provides one. */
    large?: string;
    /** The medium image URL, when MyAnimeList provides one. */
    medium?: string;
}

/**
 * {@link MalRequestOptions} is the public request options shared by MAL endpoint methods.
 *
 * It extends {@link RequestOptions} with the MyAnimeList `fields` selector consumed by `MalAnimeOperation.get`, `MalAnimeOperation.seasonal`, `MalAnimeOperation.ranking`, `MalAnimeOperation.suggestions`, `MalMangaOperation.get`, and `MalUserOperation.me` through `MyAnimeListApi`. Transport settings are merged over the instance defaults from `MalCredentials` via `buildMyAnimeListApi`.
 *
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/anime/operation/anime_anime_id_get
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/anime/operation/anime_season_year_season_get
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/anime/operation/anime_ranking_get
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/anime/operation/anime_suggestions_get
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/manga/operation/manga_manga_id_get
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/users/operation/users_user_id_get
 */
export interface MalRequestOptions extends RequestOptions {
    /** A comma-separated field selector, or the same selector as an array. */
    fields?: string | readonly string[];
}

/**
 * {@link MalPaging} is the paging node MyAnimeList attaches to list-style responses.
 *
 * It carries a `next` URL pointing at the next page when one exists; the
 * discovery reads (`seasonal`, `ranking`, `suggestions`) return it inside
 * their response types so callers can follow pages manually. A `previous`
 * URL appears when the list continues backwards, per MyAnimeList's common
 * list/pagination format.
 *
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/anime/operation/anime_season_year_season_get
 */
export interface MalPaging {
    /** The URL of the next page, when the list continues. */
    next?: string;
    /** The URL of the previous page, when the list continues backwards. */
    previous?: string;
}
