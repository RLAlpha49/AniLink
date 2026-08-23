import { requireVariables, validateVariables } from "../../../base/ValidateVariables";
import { APIWrapper } from "../../../base/APIWrapper";

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
 * `UpdateAniChartHighlightsMutation` is a class that represents a mutation to update the AniChart highlights.
 * @see https://docs.anilist.co/reference/object/anichartuser
 */
export class UpdateAniChartHighlightsMutation extends APIWrapper {
    /**
     * `updateAniChartHighlights` is a method that sends a mutation request to update the AniChart highlights.
     *
     * @param variables - An object of type `UpdateAniChartHighlightsVariables` representing the variables for the mutation.
     * @returns A Promise that resolves to the updated AniChart highlights string.
     * @throws Will throw an error if the mutation request fails or if the provided variables do not pass the validation checks.
     * @see https://docs.anilist.co/reference/object/anichartuser
     */
    async updateAniChartHighlights(variables: UpdateAniChartHighlightsVariables): Promise<string> {
        requireVariables(
            variables,
            { kind: "all", names: ["highlights"] },
            "The UpdateAniChartHighlights mutation requires a highlights variable."
        );
        const variableTypeMappings = {
            highlights: {
                mediaId: "number",
                highlight: "boolean",
            },
        };

        validateVariables(variables, variableTypeMappings);

        const mutation = `
      mutation ($highlights: [AniChartHighlightInput]) {
        UpdateAniChartHighlights (highlights: $highlights)
      }
    `;
        return await this.request(mutation, variables, true);
    }
}
