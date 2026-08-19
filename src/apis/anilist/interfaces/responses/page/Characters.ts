import { type CharacterResponse } from "../query/Character";
import { type PageInfo } from "./PageInfo";

/**
 * `CharactersPageResponse` is the paginated response from a characters query.
 * @see https://docs.anilist.co/reference/object/character
 */
export interface CharactersPageResponse {
    /** Pagination metadata for the response. */
    pageInfo: PageInfo;

    /** Characters returned for the requested page. */
    characters: CharacterResponse[];
}
