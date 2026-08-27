import { AniListOperation } from "../AniListOperation";
import type { RequestOptions } from "../../../../base/RequestHandler";

/**
 * {@link UpdateAniChartSettingsVariables} contains variables for the {@link UpdateAniChartSettingsMutation} operation.
 *
 * See {@link UpdateAniChartSettingsMutation} for the operation. The mutation returns the updated AniChart settings string.
 *
 * @see https://docs.anilist.co/reference/object/anichartuser
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
 * Validation metadata maps {@link UpdateAniChartSettingsVariables} to runtime types for the
 * `updateAniChartSettings` operation.
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
 * {@link UpdateAniChartSettingsMutation} executes the AniList mutation through {@link AniListOperation}.
 * Its public operation is {@link UpdateAniChartSettingsMutation.updateAniChartSettings}; variables use
 * {@link UpdateAniChartSettingsVariables}; validation metadata is kept local to the operation.
 * @see https://docs.anilist.co/reference/object/anichartuser
 */
export class UpdateAniChartSettingsMutation extends AniListOperation {
    /**
     * {@link UpdateAniChartSettingsMutation.updateAniChartSettings} sends a mutation request to update the AniChart settings.
     *
     * @param variables - Values from {@link UpdateAniChartSettingsVariables} for the mutation.
     * @returns The updated AniChart settings string returned by the mutation.
     * @throws Throws if no authentication token is configured, a setting has an invalid type, or the mutation request fails.
     * @see https://docs.anilist.co/reference/object/anichartuser
     * @param options - Optional {@link RequestOptions} merged over the instance-level settings for this call only.
     * @example
     * ```typescript
     * const result = await new UpdateAniChartSettingsMutation("your-token").updateAniChartSettings({ titleLanguage: "romaji", outgoingLinkProvider: "ANILIST", theme: "dark", sort: "POPULARITY" });
     * ```
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
