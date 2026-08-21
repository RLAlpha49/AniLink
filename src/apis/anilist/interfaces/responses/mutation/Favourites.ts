import { type Title } from "../../Title";
import { TitleSchema } from "../../../schemas/Title";

/**
 * `Favourites` is an interface that contains the favourites of a user.
 * It includes the anime, manga, characters, staff, and studios that are favourited.
 * @see https://docs.anilist.co/reference/object/favourites
 */
export interface Favourites {
    anime: {
        edges: Array<{
            id: number;
            node: {
                id: number;
                title: Title;
            };
        }>;
        nodes: Array<{
            id: number;
            title: Title;
        }>;
    };
    manga: {
        edges: Array<{
            id: number;
            node: {
                id: number;
                title: Title;
            };
        }>;
        nodes: Array<{
            id: number;
            title: Title;
        }>;
    };
    characters: {
        edges: Array<{
            id: number;
            node: {
                id: number;
                name: {
                    full: string;
                };
            };
        }>;
        nodes: Array<{
            id: number;
            name: {
                full: string;
            };
        }>;
    };
    staff: {
        edges: Array<{
            id: number;
            node: {
                id: number;
                name: {
                    full: string;
                };
            };
        }>;
        nodes: Array<{
            id: number;
            name: {
                full: string;
            };
        }>;
    };
    studios: {
        edges: Array<{
            id: number;
            node: {
                id: number;
                name: string;
            };
        }>;
        nodes: Array<{
            id: number;
            name: string;
        }>;
    };
}
