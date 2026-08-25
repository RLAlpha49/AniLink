/**
 * Response interfaces generated from the schema fragments under
 * `src/apis/anilist/schemas/` and the committed AniList schema snapshot.
 * Run `npm run interfaces:generate` after changing a fragment;
 * do not edit the generated block by hand.
 */
// @generated-start
// Content between the generation markers is produced by scripts/generate-interfaces.ts; do not edit by hand.

/**
 * `StreamingEpisode` — a streaming episode of a media on a provider site.
 *
 * Generated from the schema fragments; do not edit by hand.
 * @see https://docs.anilist.co/reference/object/mediastreamingepisode
 */
export interface StreamingEpisode {
    /**
     * Title of the episode
     */
    title: string;

    /**
     * Url of episode image thumbnail
     */
    thumbnail: string;

    /**
     * The url of the episode
     */
    url: string;

    /**
     * The site location of the streaming episodes
     */
    site: string;
}

// @generated-end
