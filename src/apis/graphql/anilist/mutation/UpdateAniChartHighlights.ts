import { AniListOperation } from "../AniListOperation";
import type { RequestOptions } from "../../../../base/RequestHandler";

/**
 * `UpdateAniChartHighlightsVariables` is an interface that contains the variables that are required to update the AniChart highlights.
 * @see https://docs.anilist.co/reference/mutation
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
 * The variable type mappings for the `updateAniChartHighlights` operation.
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
 * `UpdateAniChartHighlightsMutation` is a class that represents a mutation to update the AniChart highlights.
 * @see https://docs.anilist.co/reference/object/anichartuser
 */
export class UpdateAniChartHighlightsMutation extends AniListOperation {
    /**
     * `updateAniChartHighlights` is a method that sends a mutation request to update the AniChart highlights.
     *
     * @param variables - An object of type `UpdateAniChartHighlightsVariables` representing the variables for the mutation.
     * @returns A Promise that resolves to the updated AniChart highlights string.
     * @throws Will throw an error if the mutation request fails or if the provided variables do not pass the validation checks.
     * @see https://docs.anilist.co/reference/object/anichartuser
     * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
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
