import { AniListOperation } from "../AniListOperation";
import type { RequestOptions } from "../../../../base/RequestHandler";
import { type SiteStatisticsResponse } from "../interfaces/responses/query/SiteStatistics";
import { type SiteTrendSort, SiteTrendSortMappings } from "../types/Sort";
import { SiteStatisticsSchema } from "../schemas/responses/query/SiteStatistics";

/**
 * {@link SiteStatisticsVariables} contains variables for the {@link SiteStatisticsQuery} operation.
 *
 * See {@link SiteStatisticsQuery} and {@link SiteStatisticsResponse} for the operation and response shape.
 *
 * Values are validated before dispatch.
 *
 * @see https://docs.anilist.co/reference/object/sitestatistics
 */
export interface SiteStatisticsVariables {
    /**
     * `usersSort` is a string representing the sort order of the users.
     */
    usersSort?: SiteTrendSort[];

    /**
     * `usersPage` is a number representing the page number of the users.
     */
    usersPage?: number;

    /**
     * `usersPerPage` is a number representing the number of users per page.
     */
    usersPerPage?: number;

    /**
     * `animeSort` is a string representing the sort order of the anime.
     */
    animeSort?: SiteTrendSort[];

    /**
     * `animePage` is a number representing the page number of the anime.
     */
    animePage?: number;

    /**
     * `animePerPage` is a number representing the number of anime per page.
     */
    animePerPage?: number;

    /**
     * `mangaSort` is a string representing the sort order of the manga.
     */
    mangaSort?: SiteTrendSort[];

    /**
     * `mangaPage` is a number representing the page number of the manga.
     */
    mangaPage?: number;

    /**
     * `mangaPerPage` is a number representing the number of manga per page.
     */
    mangaPerPage?: number;

    /**
     * `charactersSort` is a string representing the sort order of the characters.
     */
    charactersSort?: SiteTrendSort[];

    /**
     * `charactersPage` is a number representing the page number of the characters.
     */
    charactersPage?: number;

    /**
     * `charactersPerPage` is a number representing the number of characters per page.
     */
    charactersPerPage?: number;

    /**
     * `staffSort` is a string representing the sort order of the staff.
     */
    staffSort?: SiteTrendSort[];

    /**
     * `staffPage` is a number representing the page number of the staff.
     */
    staffPage?: number;

    /**
     * `staffPerPage` is a number representing the number of staff per page.
     */
    staffPerPage?: number;

    /**
     * `studiosSort` is a string representing the sort order of the studios.
     */
    studiosSort?: SiteTrendSort[];

    /**
     * `studiosPage` is a number representing the page number of the studios.
     */
    studiosPage?: number;

    /**
     * `studiosPerPage` is a number representing the number of studios per page.
     */
    studiosPerPage?: number;

    /**
     * `reviewsSort` is a string representing the sort order of the reviews.
     */
    reviewsSort?: SiteTrendSort[];

    /**
     * `reviewsPage` is a number representing the page number of the reviews.
     */
    reviewsPage?: number;

    /**
     * `reviewsPerPage` is a number representing the number of reviews per page.
     */
    reviewsPerPage?: number;
}

/**
 * Validation metadata maps variables to runtime types for the {@link SiteStatisticsQuery.siteStatistics} operation.
 *
 * Hoisted to module scope so repeated calls do not rebuild the same
 * validation metadata on every request.
 */
const SiteStatisticsMappings = {
    usersSort: SiteTrendSortMappings,
    usersPage: "number",
    usersPerPage: "number",
    animeSort: SiteTrendSortMappings,
    animePage: "number",
    animePerPage: "number",
    mangaSort: SiteTrendSortMappings,
    mangaPage: "number",
    mangaPerPage: "number",
    charactersSort: SiteTrendSortMappings,
    charactersPage: "number",
    charactersPerPage: "number",
    staffSort: SiteTrendSortMappings,
    staffPage: "number",
    staffPerPage: "number",
    studiosSort: SiteTrendSortMappings,
    studiosPage: "number",
    studiosPerPage: "number",
    reviewsSort: SiteTrendSortMappings,
    reviewsPage: "number",
    reviewsPerPage: "number",
};

/**
 * {@link SiteStatisticsQuery} executes the AniList site-statistics query through {@link AniListOperation}.
 * Its public operation is {@link SiteStatisticsQuery.siteStatistics}.
 * @see https://docs.anilist.co/reference/object/sitestatistics
 */
export class SiteStatisticsQuery extends AniListOperation {
    /**
     * {@link SiteStatisticsQuery.siteStatistics} sends a query request to get site statistics data.
     *
     * @param variables - Optional values from {@link SiteStatisticsVariables}; defaults to an empty object.
     * @returns The {@link SiteStatisticsResponse} returned by the query.
     * @see https://docs.anilist.co/reference/object/sitestatistics
     * @param options - Optional {@link RequestOptions} merged over the instance-level settings for this call only.
     * @example
     * ```typescript
     * const result = await new SiteStatisticsQuery().siteStatistics({});
     * ```
     */
    async siteStatistics(
        variables: SiteStatisticsVariables = {},
        options?: RequestOptions
    ): Promise<SiteStatisticsResponse> {
        const query = `
      query ($usersSort: [SiteTrendSort], $usersPage: Int, $usersPerPage: Int, $animeSort: [SiteTrendSort], $animePage: Int, $animePerPage: Int, $mangaSort: [SiteTrendSort], $mangaPage: Int, $mangaPerPage: Int, $charactersSort: [SiteTrendSort], $charactersPage: Int, $charactersPerPage: Int, $staffSort: [SiteTrendSort], $staffPage: Int, $staffPerPage: Int, $studiosSort: [SiteTrendSort], $studiosPage: Int, $studiosPerPage: Int, $reviewsSort: [SiteTrendSort], $reviewsPage: Int, $reviewsPerPage: Int) {
        SiteStatistics {
          ${SiteStatisticsSchema}
        }
      }
    `;
        return await this.execute<SiteStatisticsResponse>(query, variables, {
            mappings: SiteStatisticsMappings,
            transportOptions: options,
        });
    }
}
