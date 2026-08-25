/**
 * Response interfaces generated from the schema fragments under
 * `src/apis/anilist/schemas/` and the committed AniList schema snapshot.
 * Run `npm run interfaces:generate` after changing a fragment;
 * do not edit the generated block by hand.
 */
// @generated-start
// Content between the generation markers is produced by scripts/generate-interfaces.ts; do not edit by hand.

/**
 * `DeleteMediaListEntryResponse` — the payload returned after deleting a media list entry.
 *
 * Generated from the schema fragments; do not edit by hand.
 * @see https://docs.anilist.co/reference/object/deleted
 */
export interface DeleteMediaListEntryResponse {
    /**
     * If an item has been successfully deleted
     */
    deleted: boolean;
}

// @generated-end
