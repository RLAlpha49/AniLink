/**
 * Response interfaces generated from the schema fragments under
 * `src/apis/anilist/schemas/` and the committed AniList schema snapshot.
 * Run `npm run interfaces:generate` after changing a fragment;
 * do not edit the generated block by hand.
 */
// @generated-start
// Content between the generation markers is produced by scripts/generate-interfaces.ts; do not edit by hand.
import { type CharacterResponse } from "../query/Character";
import { type PageInfo } from "./PageInfo";
/**
 * `CharactersPageResponse` — a page of characters with pagination metadata.
 *
 * Generated from the schema fragments; do not edit by hand.
 * @see https://docs.anilist.co/reference/object/character
 */
export interface CharactersPageResponse {
    /**
     * The pagination information
     */
    pageInfo: PageInfo;

    /**
     * `characters` is a list of `CharacterResponse` entries representing the characters.
     */
    characters: CharacterResponse[];
}

// @generated-end
