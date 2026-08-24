import { APIWrapper } from "../../../base/APIWrapper";
import type { RequestOptions } from "../../../base/RequestHandler";
import { type AniChartUserResponse } from "../interfaces/responses/query/AniChartUser";
import { BasicUserSchema } from "../schemas/Basic";

/**
 * `AniChartUserQuery` is a class representing a query for AniChart users.
 * It includes a method to get AniChart users.
 * @see https://docs.anilist.co/reference/object/anichartuser
 */
export class AniChartUserQuery extends APIWrapper {
    /**
     * `aniChartUser` is a method that sends a query request to get AniChart users.
     *
     * @returns The response from the query request.
     * @see https://docs.anilist.co/reference/object/anichartuser
     * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
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
