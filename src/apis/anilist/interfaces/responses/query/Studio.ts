import { type Media } from "../../Media";
import { type Staff } from "../../Staff";

/**
 * `StudioResponse` is an interface representing the response from a studio query.
 * It includes the studio's id, name, animation studio status, media, site url, favourite status, and favourites count.
 * @see https://docs.anilist.co/reference/object/studio
 */
export interface StudioResponse {
    /**
     * `id` is a number representing the id of the studio.
     */
    id: number;

    /**
     * `name` is a string representing the name of the studio.
     */
    name: string;

    /**
     * `isAnimationStudio` is a boolean indicating whether the studio is an animation studio.
     */
    isAnimationStudio: boolean;

    /**
     * `media` is an object representing the media associated with the studio.
     * It includes an array of `edges` each representing a media edge with its own properties.
     */
    media: {
        edges: Array<{
            /**
             * `id` is a number representing the id of the media edge.
             */
            id: number;

            /**
             * `relationType` is a string representing the type of relation.
             */
            relationType: string;

            /**
             * `isMainStudio` is a boolean indicating whether the studio is the main studio for the media.
             */
            isMainStudio: boolean;

            /**
             * `characters` is an instance of `Staff` representing the characters associated with the media.
             */
            characters: Staff;

            /**
             * `characterRole` is a string representing the role of the character.
             */
            characterRole: string;

            /**
             * `characterName` is a string representing the name of the character.
             */
            characterName: string;

            /**
             * `roleNotes` is a string representing any notes about the role.
             */
            roleNotes: string;

            /**
             * `dubGroup` is a string representing the dub group.
             */
            dubGroup: string;

            /**
             * `voiceActors` is an instance of `Staff` representing the voice actors for the media.
             */
            voiceActors: Staff;

            /**
             * `voiceActorRole` is an object representing the role of the voice actor.
             * It includes the voice actor's name, any role notes, and the dub group.
             */
            voiceActorRole: {
                /**
                 * `voiceActor` is a string representing the name of the voice actor.
                 */
                voiceActor: string;

                /**
                 * `roleNotes` is a string representing any notes about the role of the voice actor.
                 */
                roleNotes: string;

                /**
                 * `dubGroup` is a string representing the dub group of the voice actor.
                 */
                dubGroup: string;
            };

            /**
             * `favouriteOrder` is a number representing the order of the favourite.
             */
            favouriteOrder: number;

            /**
             * `node` is an instance of `Media` representing the media node.
             */
            node: Media;
        }>;
    };

    /**
     * `siteUrl` is a string representing the URL of the studio on the site.
     */
    siteUrl: string;

    /**
     * `isFavourite` is a boolean indicating whether the studio is a favourite.
     */
    isFavourite: boolean;

    /**
     * `favourites` is a number representing the count of favourites for the studio.
     */
    favourites: number;
}
