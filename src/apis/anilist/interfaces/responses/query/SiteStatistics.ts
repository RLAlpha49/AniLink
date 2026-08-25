/**
 * Response interfaces generated from the schema fragments under
 * `src/apis/anilist/schemas/` and the committed AniList schema snapshot.
 * Run `npm run interfaces:generate` after changing a fragment;
 * do not edit the generated block by hand.
 */
// @generated-start
// Content between the generation markers is produced by scripts/generate-interfaces.ts; do not edit by hand.
import { type SiteTrendConnection } from "../../SiteTrend";
/**
 * `SiteStatisticsResponse` — site-wide statistic connections across users, anime, manga, and more.
 *
 * Generated from the schema fragments; do not edit by hand.
 * @see https://docs.anilist.co/reference/object/sitestatistics
 */
export interface SiteStatisticsResponse {
    /**
     * `users` is an instance of `SiteTrendConnection` representing the users.
     */
    users: SiteTrendConnection;

    /**
     * `anime` is an instance of `SiteTrendConnection` representing the anime.
     */
    anime: SiteTrendConnection;

    /**
     * `manga` is an instance of `SiteTrendConnection` representing the manga.
     */
    manga: SiteTrendConnection;

    /**
     * `characters` is an instance of `SiteTrendConnection` representing the characters.
     */
    characters: SiteTrendConnection;

    /**
     * `staff` is an instance of `SiteTrendConnection` representing the staff.
     */
    staff: SiteTrendConnection;

    /**
     * `studios` is an instance of `SiteTrendConnection` representing the studios.
     */
    studios: SiteTrendConnection;

    /**
     * `reviews` is an instance of `SiteTrendConnection` representing the reviews.
     */
    reviews: SiteTrendConnection;
}

// @generated-end
