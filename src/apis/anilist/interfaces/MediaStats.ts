/**
 * Response interfaces generated from the schema fragments under
 * `src/apis/anilist/schemas/` and the committed AniList schema snapshot.
 * Run `npm run interfaces:generate` after changing a fragment;
 * do not edit the generated block by hand.
 */
// @generated-start
// Content between the generation markers is produced by scripts/generate-interfaces.ts; do not edit by hand.
import { type ScoreDistribution, type StatusDistribution } from "./Distribution";
/**
 * `MediaStats` — aggregate score and status distributions for a media.
 *
 * Generated from the schema fragments; do not edit by hand.
 * @see https://docs.anilist.co/reference/object/mediastats
 */
export interface MediaStats {
    /**
     * `statusDistribution` is a list of `StatusDistribution` entries representing the status distribution.
     */
    statusDistribution: StatusDistribution[];

    /**
     * `scoreDistribution` is a list of `ScoreDistribution` entries representing the score distribution.
     */
    scoreDistribution: ScoreDistribution[];
}

// @generated-end
