import { AniListOperation } from "../AniListOperation";
import type { RequestOptions } from "../../../../base/RequestHandler";
import { type AniChartUserResponse } from "../interfaces/responses/query/AniChartUser";
import { BasicUserSchema } from "../schemas/Basic";

/**
 * Fetches the authenticated user's AniChart data.
 *
 * Requires authentication.
 *
 * @param options - Optional per-request transport settings merged over the instance-level ones for this call only; see {@link RequestOptions}.
 * @returns The {@link AniChartUserResponse} for the viewer.
 * @see https://docs.anilist.co/reference/object/anichartuser
 */
export class AniChartUserQuery extends AniListOperation {
    /**
     * {@link AniChartUserQuery.aniChartUser} sends a query request to get AniChart users.
     *
     * @returns The {@link AniChartUserResponse} returned by the query.
     * @see https://docs.anilist.co/reference/object/anichartuser
     * @param options - Optional {@link RequestOptions} merged over the instance-level settings for this call only.
     * @example
     * ```typescript
     * const result = await new AniChartUserQuery("authToken").aniChartUser();
     * ```
     */
    async aniChartUser(options?: RequestOptions): Promise<AniChartUserResponse> {
        const query = `
      query {
        AniChartUser {
          user {
            ${BasicUserSchema}
          }
          settings
          highlights
        }
      }
    `;

        return await this.execute<AniChartUserResponse>(query, undefined, {
            requiresAuth: true,
            transportOptions: options,
        });
    }
}
