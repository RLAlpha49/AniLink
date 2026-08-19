/**
 * `MediaTagCollectionResponse` is an interface representing the response from a media tag collection query.
 * It includes the fields returned for each media tag.
 * @see https://docs.anilist.co/reference/object/mediatag
 */
export interface MediaTagCollectionResponse {
    /** The unique media tag identifier. */
    id: number;

    /** The media tag name. */
    name: string;

    /** The media tag description. */
    description: string;

    /** The media tag category. */
    category: string;

    /** The media tag rank. */
    rank: number;

    /** Whether the tag is a general spoiler. */
    isGeneralSpoiler: boolean;

    /** Whether the tag is a media spoiler. */
    isMediaSpoiler: boolean;

    /** Whether the tag is for adult content. */
    isAdult: boolean;

    /** The identifier of the user who created the tag. */
    userId: number;
}
