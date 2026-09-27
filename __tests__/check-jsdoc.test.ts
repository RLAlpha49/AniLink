import { describe, expect, test } from "vitest";
import { checkAniLinkSource, checkJsdoc, checkOperationSource } from "../scripts/check-jsdoc";

const viewerReference = "https://docs.anilist.co/reference/object/user?from=docs#user";
const mutationReference = "https://docs.anilist.co/reference/mutation";

function viewerFixture(reference: string, includeParameter = true): string {
    const parameter = includeParameter ? "         * @param id User ID.\n" : "";

    return `export interface AniListApi {
        /**
         * Fetches the current viewer.
${parameter}         * @returns The viewer.
         * @example await api.anilist.query.viewer({ id: 1 });
         * @see ${reference}
         */
        viewer: (id: number) => Promise<User>;
}`;
}

describe("check-jsdoc gate", () => {
    test("reports a public operation that omits a parameter tag", async () => {
        const issues = await checkAniLinkSource(
            viewerFixture(viewerReference, false),
            "src/AniLink.ts"
        );

        expect(issues).toContainEqual(
            expect.objectContaining({
                tag: expect.stringMatching(/^@param/),
                message: "AniLink operation viewer must document its id parameter",
            })
        );
    });

    test.each([
        "https://docs.anilist.co/reference/not-a-real-page",
        "https://example.com/reference/object/user",
    ])("rejects a @see URL outside the checked-in allowlist: %s", async (reference) => {
        const issues = await checkAniLinkSource(viewerFixture(reference), "src/AniLink.ts");

        expect(issues).toContainEqual(
            expect.objectContaining({
                tag: "@see",
                message:
                    "AniLink operation viewer must link to an actual AniList API reference page",
            })
        );
    });

    test("requires @throws on mutation methods", async () => {
        const source = `/**
 * Mutation operations.
 * @see ${mutationReference}
 */
export class UpdateMediaMutation {
    /**
     * Updates a media entry.
     * @returns The updated media entry.
     * @see ${mutationReference}
     */
    async update(): Promise<void> {}
}`;
        const issues = await checkOperationSource(
            source,
            "src/apis/graphql/anilist/mutation/UpdateMedia.ts"
        );

        expect(issues).toContainEqual(
            expect.objectContaining({
                tag: "@throws",
                message: "Mutation update must document authentication and validation errors",
            })
        );
    });

    test("accepts a public operation with complete documentation and an allowed reference", async () => {
        const issues = await checkAniLinkSource(viewerFixture(viewerReference), "src/AniLink.ts");

        expect(issues).toEqual([]);
    });

    test("passes the complete repository JSDoc gate", async () => {
        await expect(checkJsdoc()).resolves.toEqual([]);
    });
});
