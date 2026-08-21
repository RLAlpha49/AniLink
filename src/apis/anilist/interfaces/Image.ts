/**
 * `Image` is an interface representing an image.
 * It includes the large and medium size images each having their own properties.
 * @see https://docs.anilist.co/reference/object/characterimage
 */
export interface Image {
    /**
     * `large` is a string representing the URL of the large size image.
     */
    large: string;

    /**
     * `medium` is a string representing the URL of the medium size image.
     */
    medium: string;
}
