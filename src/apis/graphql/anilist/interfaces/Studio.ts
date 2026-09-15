/**
 * {@link Studio} is the minimal studio shape used inside favoured-entity stat rows: the
 * `id` and `name` of the studio a row counts. The full studio response is
 * `StudioResponse`.
 * @see https://docs.anilist.co/reference/object/studio
 */
export interface Studio {
    /**
     * The AniList id of the studio.
     */
    id: number;

    /**
     * The studio's name.
     */
    name: string;
}
