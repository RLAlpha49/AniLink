import { APIWrapper } from "../APIWrapper";
import type { RequestOptions } from "../../../base/RequestHandler";

/**
 * `UpdateAniChartSettingsVariables` is an interface that contains the variables that are required to update the AniChart settings.
 * @see https://docs.anilist.co/reference/mutation
 */
export interface UpdateAniChartSettingsVariables {
    /**
     * `titleLanguage` is a string representing the language of the title.
     */
    titleLanguage: string;

    /**
     * `outgoingLinkProvider` is a string representing the outgoing link provider.
     */
    outgoingLinkProvider: string;

    /**
     * `theme` is a string representing the theme of the AniChart.
     */
    theme: string;

    /**
     * `sort` is a string representing the sort order of the AniChart.
     */
    sort: string;
}

/**
 * The variable type mappings for the `updateAniChartSettings` operation.
 *
 * Hoisted to module scope so repeated calls do not rebuild the same
 * validation metadata on every request.
 */
const UpdateAniChartSettingsMappings = {
    titleLanguage: "string",
    outgoingLinkProvider: "string",
    theme: "string",
    sort: "string",
};

/**
 * `UpdateAniChartSettingsMutation` is a class that represents a mutation to update the AniChart settings.
 * @see https://docs.anilist.co/reference/object/anichartuser
 */
export class UpdateAniChartSettingsMutation extends APIWrapper {
    /**
     * `updateAniChartSettings` is a method that sends a mutation request to update the AniChart settings.
     *
     * @param variables - An object of type `UpdateAniChartSettingsVariables` representing the variables for the mutation.
     * @returns A Promise that resolves to the updated AniChart settings string.
     * @throws Will throw an error if the mutation request fails or if the provided variables do not pass the validation checks.
     * @see https://docs.anilist.co/reference/object/anichartuser
     * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
     */
    async updateAniChartSettings(
        variables: UpdateAniChartSettingsVariables,
        options?: RequestOptions
    ): Promise<string> {
        const mutation = `
      mutation ($titleLanguage: String, $outgoingLinkProvider: String, $theme: String, $sort: String) {
        UpdateAniChartSettings (titleLanguage: $titleLanguage, outgoingLinkProvider: $outgoingLinkProvider, theme: $theme, sort: $sort)
      }
    `;
        return await this.execute<string>(mutation, variables, {
            mappings: UpdateAniChartSettingsMappings,
            requiresAuth: true,
            transportOptions: options,
        });
    }
}
