/**
 * The AniList media fields {@link crossLink} reads to build its id maps.
 *
 * Both `query.media` results and the `media` array of a `page.medias`
 * response satisfy this shape.
 *
 * @see https://docs.anilist.co/reference/object/media
 */
export interface CrossLinkMedia {
    /** The AniList id of the media. */
    id: number;

    /**
     * The MyAnimeList id of the media, when AniList knows one. AniList
     * returns `null` for media without a MAL entry.
     */
    idMal?: number | null;
}

/**
 * The cross-provider lookup maps built by {@link crossLink}.
 *
 * @see https://docs.anilist.co/reference/object/media
 */
export interface CrossLinkResult<TMedia extends CrossLinkMedia = CrossLinkMedia> {
    /** AniList media id → MyAnimeList id, for entries that carry one. */
    anilistToMal: ReadonlyMap<number, number>;

    /**
     * MyAnimeList id → AniList media id, for entries that carry one. When
     * several entries share a MAL id, the last entry wins.
     */
    malToAnilist: ReadonlyMap<number, number>;

    /** The input entries that carry no MyAnimeList id, in input order. */
    unmapped: readonly TMedia[];
}

/**
 * Build bidirectional AniList↔MyAnimeList id lookup maps from AniList media entries.
 *
 * AniList media carries `idMal`, the MyAnimeList id of the same show or book.
 * This helper turns any batch of AniList media results into lookup maps, so a
 * cross-provider workflow becomes two map lookups instead of a hand-rolled
 * mapping: find the MAL id with `anilistToMal`, then call
 * `aniLink.mal.anime.get(malId)` (or `mal.manga.get`) with the result.
 * Entries without a MAL id are collected in `unmapped` instead of being
 * silently dropped.
 *
 * @param media - AniList media entries carrying `id` and `idMal`; e.g. the `media` array of a `page.medias` response, or a one-element array around a `query.media` result.
 * @returns The `anilistToMal` and `malToAnilist` lookup maps plus the `unmapped` entries without a MAL id; a {@link CrossLinkResult}.
 * @see https://docs.anilist.co/reference/object/media
 * @example
 * ```typescript
 * const page = await aniLink.anilist.query.page.medias({ page: 1, perPage: 50, type: "ANIME" });
 * const { anilistToMal, unmapped } = crossLink(page.media);
 *
 * const malId = anilistToMal.get(21);
 * if (malId !== undefined) {
 *     const malAnime = await aniLink.mal.anime.get(malId, { fields: ["id", "title"] });
 * }
 * ```
 */
export function crossLink<TMedia extends CrossLinkMedia>(
    media: readonly TMedia[]
): CrossLinkResult<TMedia> {
    const anilistToMal = new Map<number, number>();
    const malToAnilist = new Map<number, number>();
    const unmapped: TMedia[] = [];

    for (const entry of media) {
        if (typeof entry.idMal !== "number") {
            unmapped.push(entry);
            continue;
        }

        anilistToMal.set(entry.id, entry.idMal);
        malToAnilist.set(entry.idMal, entry.id);
    }

    return { anilistToMal, malToAnilist, unmapped };
}
