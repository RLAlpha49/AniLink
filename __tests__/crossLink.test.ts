import { describe, expect, test } from "vitest";
import { crossLink } from "../src/apis/graphql/anilist/helpers/crossLink";
import { buildAniListApi } from "../src/apis/graphql/anilist/facade";

/**
 * Direct tests for the `crossLink` cross-provider helper.
 *
 * `crossLink` is a pure function over AniList media entries carrying `idMal`;
 * these tests pin the map construction, the unmapped-entry collection, and
 * the facade exposure wired in `wiring.ts` (also covered by the HELPER_MEMBERS
 * parity list in `facade-groups.test.ts`).
 */
describe("crossLink", () => {
    test("builds both lookup maps from entries carrying idMal", () => {
        const result = crossLink([
            { id: 1, idMal: 21 },
            { id: 2, idMal: 30 },
        ]);

        expect(result.anilistToMal.get(1)).toBe(21);
        expect(result.anilistToMal.get(2)).toBe(30);
        expect(result.malToAnilist.get(21)).toBe(1);
        expect(result.malToAnilist.get(30)).toBe(2);
        expect(result.unmapped).toEqual([]);
    });

    test("collects entries without a MAL id into unmapped in input order", () => {
        const nullEntry = { id: 3, idMal: null };
        const missingEntry = { id: 4 };

        const result = crossLink([{ id: 1, idMal: 21 }, nullEntry, missingEntry]);

        expect(result.anilistToMal.size).toBe(1);
        expect(result.malToAnilist.size).toBe(1);
        expect(result.unmapped).toEqual([nullEntry, missingEntry]);
    });

    test("returns empty maps for an empty batch", () => {
        const result = crossLink([]);

        expect(result.anilistToMal.size).toBe(0);
        expect(result.malToAnilist.size).toBe(0);
        expect(result.unmapped).toEqual([]);
    });

    test("keeps the last entry when several entries share a MAL id", () => {
        const result = crossLink([
            { id: 1, idMal: 21 },
            { id: 2, idMal: 21 },
        ]);

        expect(result.malToAnilist.get(21)).toBe(2);
        expect(result.anilistToMal.get(1)).toBe(21);
        expect(result.anilistToMal.get(2)).toBe(21);
    });

    test("accepts AniList media responses with extra fields", () => {
        const media = [
            {
                id: 1,
                idMal: 21,
                title: { romaji: "Fullmetal Alchemist" },
                type: "ANIME",
            },
            {
                id: 2,
                idMal: null,
                title: { romaji: "Unmapped Entry" },
                type: "ANIME",
            },
        ];

        const result = crossLink(media);

        expect(result.anilistToMal.get(1)).toBe(21);
        expect(result.unmapped).toHaveLength(1);
        expect(result.unmapped[0]?.title).toEqual({ romaji: "Unmapped Entry" });
    });

    test("is exposed on the anilist facade and returns the lookup maps", () => {
        const api = buildAniListApi("token");

        const result = api.crossLink([{ id: 1, idMal: 21 }]);

        expect(result.anilistToMal.get(1)).toBe(21);
        expect(result.malToAnilist.get(21)).toBe(1);
    });
});
