import { type SiteTrendConnection } from "../../SiteTrend";
import { SiteTrendConnectionSchema } from "../../../schemas/SiteTrend";

/**
 * `SiteStatisticsResponse` is an interface representing the response from a site statistics query.
 * It includes users, anime, manga, characters, staff, studios, and reviews of type `SiteTrendConnection`.
 * @see https://docs.anilist.co/reference/object/sitestatistics
 */
export interface SiteStatisticsResponse {
    /**
     * `users` is an instance of `SiteTrendConnection` representing the users' statistics.
     */
    users: SiteTrendConnection;

    /**
     * `anime` is an instance of `SiteTrendConnection` representing the anime statistics.
     */
    anime: SiteTrendConnection;

    /**
     * `manga` is an instance of `SiteTrendConnection` representing the manga statistics.
     */
    manga: SiteTrendConnection;

    /**
     * `characters` is an instance of `SiteTrendConnection` representing the characters' statistics.
     */
    characters: SiteTrendConnection;

    /**
     * `staff` is an instance of `SiteTrendConnection` representing the staff statistics.
     */
    staff: SiteTrendConnection;

    /**
     * `studios` is an instance of `SiteTrendConnection` representing the studios' statistics.
     */
    studios: SiteTrendConnection;

    /**
     * `reviews` is an instance of `SiteTrendConnection` representing the reviews' statistics.
     */
    reviews: SiteTrendConnection;
}
