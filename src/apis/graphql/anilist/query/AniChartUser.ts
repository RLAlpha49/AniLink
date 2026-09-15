import { AniListOperation } from "../AniListOperation";
import type { RequestOptions } from "../../../../base/RequestHandler";
import { type AniChartUserResponse } from "../interfaces/responses/query/AniChartUser";
import { BasicUserSchema } from "../schemas/Basic";

/**
 * {@link AniChartUserQuery} executes the authenticated AniChart-user query through {@link AniListOperation}.
 * Its public operation is {@link AniChartUserQuery.aniChartUser}.
 * @see https://docs.anilist.co/reference/object/anichartuser
 */
export class AniChartUserQuery extends AniListOperation {
    /**
     * {@link AniChartUserQuery.aniChartUser} sends a query request to get the authenticated user's AniChart
     * data. Requires an auth token.
     *
     * @returns The {@link AniChartUserResponse} with the viewer's AniChart settings and highlights.
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
