import { describe, it, expect } from "vitest";
import { generateManifest } from "../scripts/generate-explorer-manifest";

describe("generateManifest - discovery", () => {
    it("discovers the custom operation", () => {
        const manifest = generateManifest();
        const custom = manifest.operations.find((o) => o.category === "custom");
        expect(custom).toBeDefined();
        expect(custom?.name).toBe("custom");
        expect(custom?.anilinkCall).toBe("aniLink.anilist.custom(query, variables)");
        expect(custom?.fields).toEqual([]);
    });

    it("discovers query operations including media", () => {
        const manifest = generateManifest();
        const media = manifest.operations.find((o) => o.category === "query" && o.name === "media");
        expect(media).toBeDefined();
        expect(media?.variablesType).toBe("MediaVariables");
        expect(media?.responseType).toBe("MediaResponse");
        expect(media?.anilinkCall).toBe("aniLink.anilist.query.media(variables)");
        expect(media?.graphql).toMatch(/query/);
    });

    it("discovers mutation operations including saveMediaListEntry", () => {
        const manifest = generateManifest();
        const mut = manifest.operations.find(
            (o) => o.category === "mutation" && o.name === "saveMediaListEntry"
        );
        expect(mut).toBeDefined();
        expect(mut?.variablesType).toBe("SaveMediaListEntryVariables");
        expect(mut?.requiresAuth).toBe(true);
        expect(mut?.graphql).toMatch(/mutation/);
    });

    it("discovers page operations including medias", () => {
        const manifest = generateManifest();
        const medias = manifest.operations.find((o) => o.category === "page" && o.name === "medias");
        expect(medias).toBeDefined();
        expect(medias?.anilinkCall).toBe("aniLink.anilist.query.page.medias(variables)");
    });

    it("sets the anilist endpoint", () => {
        const manifest = generateManifest();
        expect(manifest.anilistEndpoint).toBe("https://graphql.anilist.co");
    });

    it("discovers a non-trivial number of operations", () => {
        const manifest = generateManifest();
        expect(manifest.operations.length).toBeGreaterThan(50);
    });
});

describe("field extraction", () => {
    it("extracts fields for MediaVariables with correct required flags", () => {
        const manifest = generateManifest();
        const media = manifest.operations.find(
            (o) => o.category === "query" && o.name === "media"
        )!;
        const idField = media.fields.find((f) => f.name === "id");
        expect(idField).toBeDefined();
        expect(idField?.type).toBe("number");
        expect(idField?.required).toBe(false);
        expect(idField?.description).toMatch(/id of the media/i);
    });

    it("marks required fields for SaveMediaListEntryVariables", () => {
        const manifest = generateManifest();
        const mut = manifest.operations.find(
            (o) => o.category === "mutation" && o.name === "saveMediaListEntry"
        )!;
        const mediaId = mut.fields.find((f) => f.name === "mediaId");
        expect(mediaId?.required).toBe(true);
        const score = mut.fields.find((f) => f.name === "score");
        expect(score?.required).toBe(false);
    });

    it("resolves enum fields with their values", () => {
        const manifest = generateManifest();
        const media = manifest.operations.find(
            (o) => o.category === "query" && o.name === "media"
        )!;
        const typeField = media.fields.find((f) => f.name === "type");
        expect(typeField?.type).toBe("enum");
        expect(typeField?.enumValues).toEqual(expect.arrayContaining(["ANIME", "MANGA"]));
    });

    it("resolves nested object fields like FuzzyDateInput", () => {
        const manifest = generateManifest();
        const save = manifest.operations.find(
            (o) => o.category === "mutation" && o.name === "saveMediaListEntry"
        )!;
        const startedAt = save.fields.find((f) => f.name === "startedAt");
        expect(startedAt?.type).toBe("object");
        expect(startedAt?.nestedFields?.map((f) => f.name)).toEqual(
            expect.arrayContaining(["year", "month", "day"])
        );
    });

    it("resolves array-of-enum fields", () => {
        const manifest = generateManifest();
        const medias = manifest.operations.find(
            (o) => o.category === "page" && o.name === "medias"
        )!;
        const formatIn = medias.fields.find((f) => f.name === "format_in");
        expect(formatIn?.type).toBe("enum[]");
        expect(formatIn?.enumValues?.length).toBeGreaterThan(0);
    });
});

describe("graphql and description extraction", () => {
    it("extracts the GraphQL string for media", () => {
        const manifest = generateManifest();
        const media = manifest.operations.find(
            (o) => o.category === "query" && o.name === "media"
        )!;
        expect(media.graphql).toMatch(/query\s*\(/);
        expect(media.graphql).toMatch(/Media\s*\(/);
    });

    it("extracts the GraphQL string for a mutation", () => {
        const manifest = generateManifest();
        const del = manifest.operations.find(
            (o) => o.category === "mutation" && o.name === "deleteCustomList"
        )!;
        expect(del.graphql).toMatch(/mutation\s*\(/);
        expect(del.graphql).toMatch(/DeleteCustomList/);
    });

    it("extracts the operation description from AniLink.ts JSDoc", () => {
        const manifest = generateManifest();
        const media = manifest.operations.find(
            (o) => o.category === "query" && o.name === "media"
        )!;
        expect(media.description).toMatch(/media data/i);
    });

    it("leaves graphql empty for custom", () => {
        const manifest = generateManifest();
        const custom = manifest.operations.find((o) => o.category === "custom")!;
        expect(custom.graphql).toBe("");
    });
});
