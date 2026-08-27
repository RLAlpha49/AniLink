import { AniListOperation } from "../AniListOperation";
import type { RequestOptions } from "../../../../base/RequestHandler";

/**
 * {@link UpdateAniChartHighlightsVariables} contains variables for the {@link UpdateAniChartHighlightsMutation} operation.
 *
 * See {@link UpdateAniChartHighlightsMutation} for the operation. The mutation returns the updated AniChart highlights string.
 *
 * @see https://docs.anilist.co/reference/object/anichartuser
 */
export interface UpdateAniChartHighlightsVariables {
    /**
     * `highlights` is an object that contains the media ID and the highlight status.
     */
    highlights: {
        /**
         * `mediaId` is a number representing the media ID.
         */
        mediaId: number;

        /**
         * `highlight` is a boolean representing the highlight status.
         */
        highlight: boolean;
    };
}

/**
 * Validation metadata maps {@link UpdateAniChartHighlightsVariables} to runtime types for the
 * `updateAniChartHighlights` operation.
 *
 * Hoisted to module scope so repeated calls do not rebuild the same
 * validation metadata on every request.
 */
const UpdateAniChartHighlightsMappings = {
    highlights: {
        mediaId: "number",
        highlight: "boolean",
    },
};

/**
 * {@link UpdateAniChartHighlightsMutation} executes the AniList mutation through {@link AniListOperation}.
 * Its public operation is {@link UpdateAniChartHighlightsMutation.updateAniChartHighlights}; variables use
 * {@link UpdateAniChartHighlightsVariables}; validation metadata is kept local to the operation.
 * @see https://docs.anilist.co/reference/object/anichartuser
 */
export class UpdateAniChartHighlightsMutation extends AniListOperation {
    /**
     * {@link UpdateAniChartHighlightsMutation.updateAniChartHighlights} sends a mutation request to update the AniChart highlights.
     *
     * @param variables - Values from {@link UpdateAniChartHighlightsVariables} for the mutation.
     * @returns The updated AniChart highlights string returned by the mutation.
     * @throws Throws if no authentication token is configured, `highlights` is missing or invalid, or the mutation request fails.
     * @see https://docs.anilist.co/reference/object/anichartuser
     * @param options - Optional {@link RequestOptions} merged over the instance-level settings for this call only.
     * @example
     * ```typescript
     * const result = await new UpdateAniChartHighlightsMutation("your-token").updateAniChartHighlights({ highlights: { mediaId: 1, highlight: true } });
     * ```
     */
    async updateAniChartHighlights(
        variables: UpdateAniChartHighlightsVariables,
        options?: RequestOptions
    ): Promise<string> {
        const mutation = `
      mutation ($highlights: [AniChartHighlightInput]) {
        UpdateAniChartHighlights (highlights: $highlights)
      }
    `;
        return await this.execute<string>(mutation, variables, {
            requirements: [
                {
                    kind: "all",
                    names: ["highlights"],
                    message:
                        "The UpdateAniChartHighlights mutation requires a highlights variable.",
                },
            ],
            mappings: UpdateAniChartHighlightsMappings,
            requiresAuth: true,
            transportOptions: options,
        });
    }
}
