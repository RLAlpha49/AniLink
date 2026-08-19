/**
 * `Studio` is an interface representing a studio.
 * It includes the id and name each having their own properties.
 * @see https://docs.anilist.co/reference/object/studio
 */
export interface Studio {
    /**
     * `id` is a number representing the id of the studio.
     */
    id: number;

    /**
     * `name` is a string representing the name of the studio.
     */
    name: string;
}
