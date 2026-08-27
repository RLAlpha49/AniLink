import type { RequestOptions } from "../../../base/RequestHandler";

/** The image variants returned by MyAnimeList for an anime or manga entity. */
export interface MalPicture {
    /** The large image URL, when MyAnimeList provides one. */
    large?: string;
    /** The medium image URL, when MyAnimeList provides one. */
    medium?: string;
}

/** The typed portion of a MyAnimeList anime response. */
export interface MalAnime {
    /** The MyAnimeList numeric identifier. */
    id: number;
    /** The canonical MyAnimeList title. */
    title: string;
    /** Optional image variants requested through the `fields` query parameter. */
    main_picture?: MalPicture;
    /** Additional fields requested by a caller remain available without narrowing. */
    [field: string]: unknown;
}

/** The typed portion of the authenticated MyAnimeList user response. */
export interface MalUser {
    /** The MyAnimeList numeric user identifier. */
    id: number;
    /** The user's MyAnimeList name. */
    name: string;
    /** Optional profile location. */
    location?: string;
    /** Optional account creation timestamp. */
    joined_at?: string;
    /** Additional fields requested by a caller remain available without narrowing. */
    [field: string]: unknown;
}

/** Public request options shared by MAL endpoint methods. */
export interface MalRequestOptions extends RequestOptions {
    /** A comma-separated field list, or the same list as an array. */
    fields?: string | readonly string[];
}
