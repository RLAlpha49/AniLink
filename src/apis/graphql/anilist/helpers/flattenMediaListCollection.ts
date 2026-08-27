import type { MediaListCollectionResponse } from "../interfaces/responses/query/MediaListCollectionResponse";

/**
 * A media-list entry flattened from {@link MediaListCollectionResponse}, retaining every list group that contains it.
 *
 * This local representation makes duplicate membership explicit through `listNames` and the custom-list flags.
 *
 * @see https://docs.anilist.co/reference/object/medialistcollection
 */
export interface FlattenedMediaListEntry {
    /** The id of the media list entry. */
    id: number;

    /** The id of the user who owns the entry. */
    userId: number;

    /** The id of the media the entry refers to. */
    mediaId: number;

    /** The status of the entry (e.g. `CURRENT`, `COMPLETED`). */
    status: string;

    /** The score the user assigned. */
    score: number;

    /** The progress (episodes or chapters watched/read). */
    progress: number;

    /** Every list group the entry belongs to (status list name plus any custom lists). */
    listNames: string[];

    /** `true` when the entry appears in at least one custom list group. */
    inCustomList: boolean;

    /** `true` when the entry appears in at least one split completed list group. */
    inSplitCompletedList: boolean;
}

/**
 * Flatten an AniList {@link MediaListCollectionResponse} into a single array of entries, deduplicated by id.
 *
 * AniList groups a user's list into multiple `lists` (one per status, plus any custom lists),
 * each carrying its own `entries` array. A single entry can appear in more than one group —
 * for example, in its status list and in one or more custom lists.
 *
 * This helper walks every group, collects every list name each entry belongs to, and emits one
 * entry per unique id with a `listNames` array recording every group it appeared in. `inCustomList`
 * and `inSplitCompletedList` are `true` when the entry appeared in any group flagged as such.
 *
 * @param response - The {@link MediaListCollectionResponse} returned by the query.
 * @returns A flat array of deduplicated {@link FlattenedMediaListEntry} values, each carrying its full list membership.
 * @see https://docs.anilist.co/reference/object/medialistcollection
 * @example
 * ```typescript
 * const collection = await aniLink.anilist.query.mediaListCollection({ userId: 542244, type: "ANIME" });
 * const entries = flattenMediaListCollection(collection);
 * console.log(entries.length, entries[0].listNames);
 * ```
 */
export function flattenMediaListCollection(
    response: MediaListCollectionResponse
): FlattenedMediaListEntry[] {
    if (!response || !Array.isArray(response.lists)) {
        return [];
    }

    const byId = new Map<number, FlattenedMediaListEntry>();

    for (const group of response.lists) {
        if (!Array.isArray(group.entries)) {
            continue;
        }
        for (const entry of group.entries) {
            mergeEntry(byId, entry, group.name, group.isCustomList, group.isSplitCompletedList);
        }
    }

    return Array.from(byId.values());
}

/** Insert or merge an entry into the dedup map, accumulating its list memberships. */
function mergeEntry(
    byId: Map<number, FlattenedMediaListEntry>,
    entry: MediaListCollectionResponse["lists"][number]["entries"][number],
    listName: string,
    isCustomList: boolean,
    isSplitCompletedList: boolean
): void {
    const existing = byId.get(entry.id);
    if (existing) {
        if (!existing.listNames.includes(listName)) {
            existing.listNames.push(listName);
        }
        if (isCustomList) existing.inCustomList = true;
        if (isSplitCompletedList) existing.inSplitCompletedList = true;
        return;
    }

    byId.set(entry.id, {
        id: entry.id,
        userId: entry.userId,
        mediaId: entry.mediaId,
        status: entry.status,
        score: entry.score,
        progress: entry.progress,
        listNames: [listName],
        inCustomList: isCustomList,
        inSplitCompletedList: isSplitCompletedList,
    });
}
