/**
 * Response interfaces generated from the schema fragments under
 * `src/apis/anilist/schemas/` and the committed AniList schema snapshot.
 * Run `npm run interfaces:generate` after changing a fragment;
 * do not edit the generated block by hand.
 */
// @generated-start
// Content between the generation markers is produced by scripts/generate-interfaces.ts; do not edit by hand.
import { type BasicUser } from "../../Basic";
/**
 * `AniChartUserResponse` — a user's AniChart integration data.
 *
 * Generated from the schema fragments; do not edit by hand.
 * @see https://docs.anilist.co/reference/object/anichartuser
 */
export interface AniChartUserResponse {
    /**
     * `user` is an instance of `BasicUser` representing the user.
     */
    user: BasicUser;

    /**
     * `settings` is a unknown value representing the settings.
     */
    settings: unknown;

    /**
     * `highlights` is a unknown value representing the highlights.
     */
    highlights: unknown;
}

// @generated-end
