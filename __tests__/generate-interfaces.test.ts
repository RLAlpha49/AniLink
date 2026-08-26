import { describe, expect, it } from "vitest";
import {
    parseSelectionSet,
    spliceBareInterpolations,
    stripOperationWrapper,
} from "../lib/interfaces-codegen/parse";
import {
    resolveExportSpec,
    type ExportSpec,
    type SchemaIndex,
} from "../lib/interfaces-codegen/model";
import { applyGeneratedRegion, renderTypeDeclaration } from "../lib/interfaces-codegen/emit";
import { buildGeneratedFiles } from "../lib/interfaces-codegen/run";

describe("parseSelectionSet", () => {
    it("parses a flat field list and strips arguments", () => {
        const nodes = parseSelectionSet(`
            id
            text (asHtml: $asHtml)
            likeCount
        `);
        expect(nodes).toEqual([
            { kind: "field", name: "id", children: [] },
            { kind: "field", name: "text", children: [] },
            { kind: "field", name: "likeCount", children: [] },
        ]);
    });

    it("uses the alias as the property name when present", () => {
        const nodes = parseSelectionSet("ThreadUserId: userId");
        expect(nodes).toEqual([{ kind: "field", name: "ThreadUserId", children: [] }]);
    });

    it("parses nested selections with braces", () => {
        const nodes = parseSelectionSet(`
            user {
                id
                name
            }
            isLocked
        `);
        expect(nodes).toEqual([
            {
                kind: "field",
                name: "user",
                children: [
                    { kind: "field", name: "id", children: [] },
                    { kind: "field", name: "name", children: [] },
                ],
            },
            { kind: "field", name: "isLocked", children: [] },
        ]);
    });

    it("parses inline fragments with their type condition", () => {
        const nodes = parseSelectionSet(`
            ... on TextActivity {
                id
                type
            }
            ... on ListActivity {
                id
                status
            }
        `);
        expect(nodes).toEqual([
            {
                kind: "fragment",
                typeCondition: "TextActivity",
                children: [
                    { kind: "field", name: "id", children: [] },
                    { kind: "field", name: "type", children: [] },
                ],
            },
            {
                kind: "fragment",
                typeCondition: "ListActivity",
                children: [
                    { kind: "field", name: "id", children: [] },
                    { kind: "field", name: "status", children: [] },
                ],
            },
        ]);
    });
});

describe("spliceBareInterpolations", () => {
    const constants = new Map([
        ["TitleSchema", "title {\n  romaji\n  english\n}"],
        ["BasicUserSchema", "id\nname"],
    ]);

    it("keeps brace-contained interpolation markers for named-reference detection", () => {
        const nodes = spliceBareInterpolations(
            parseSelectionSet("id\nstartDate {\n  ${BasicUserSchema}\n}"),
            constants
        );
        expect(nodes).toEqual([
            { kind: "field", name: "id", children: [] },
            {
                kind: "field",
                name: "startDate",
                children: [{ kind: "interpolation", constant: "BasicUserSchema" }],
            },
        ]);
    });

    it("splices bare top-level interpolations as sibling fields", () => {
        const nodes = spliceBareInterpolations(
            parseSelectionSet("id\n${TitleSchema}\nseason"),
            constants
        );
        expect(nodes).toEqual([
            { kind: "field", name: "id", children: [] },
            {
                kind: "field",
                name: "title",
                children: [
                    { kind: "field", name: "romaji", children: [] },
                    { kind: "field", name: "english", children: [] },
                ],
                sourceConstant: "TitleSchema",
            },
            { kind: "field", name: "season", children: [] },
        ]);
    });

    it("splices bare interpolations recursively inside referenced constants", () => {
        const nested = new Map([
            ["InnerSchema", "alpha"],
            ["OuterSchema", "${InnerSchema}\nbeta"],
        ]);
        const nodes = spliceBareInterpolations(parseSelectionSet("${OuterSchema}"), nested);
        expect(nodes).toEqual([
            { kind: "field", name: "alpha", children: [], sourceConstant: "InnerSchema" },
            { kind: "field", name: "beta", children: [] },
        ]);
    });

    it("throws on unresolvable interpolation references", () => {
        expect(() =>
            spliceBareInterpolations(parseSelectionSet("${MissingSchema}"), constants)
        ).toThrow(/MissingSchema/);
    });

    it("throws on cyclic interpolation", () => {
        const cyclic = new Map([
            ["ASchema", "${BSchema}"],
            ["BSchema", "${ASchema}"],
        ]);
        expect(() => spliceBareInterpolations(parseSelectionSet("${ASchema}"), cyclic)).toThrow(
            /[Cc]yclic|cycle/
        );
    });
});

describe("stripOperationWrapper", () => {
    it("removes a query wrapper and its variable declarations", () => {
        const body = stripOperationWrapper(
            "query ($userId: Int) {\n  MediaListCollection (userId: $userId) {\n    hasNextChunk\n  }\n}"
        );
        expect(body).toBe("MediaListCollection (userId: $userId) {\n    hasNextChunk\n  }");
    });

    it("returns plain selection bodies unchanged", () => {
        expect(stripOperationWrapper("id\nname")).toBe("id\nname");
    });
});

function schemaIndex(entries: Record<string, object>): SchemaIndex {
    return new Map(Object.entries(entries));
}

describe("resolveExportSpec", () => {
    const baseSpec: ExportSpec = {
        exportedName: "MediaListEntry",
        see: "https://docs.anilist.co/reference/object/medialist",
        summary: "An entry in a media list.",
        graphqlType: "MediaList",
        source: { constant: "MediaListEntrySchema" },
    };

    const mediaListFields = {
        id: { name: "id", type: { kind: "NON_NULL", ofType: { kind: "SCALAR", name: "Int" } } },
        status: {
            name: "status",
            type: { kind: "ENUM", name: "MediaListStatus" },
        },
    };

    it("maps Int/String/Boolean scalars to number/string/boolean", () => {
        const schema = schemaIndex({
            MediaList: {
                kind: "OBJECT",
                name: "MediaList",
                fields: Object.values(mediaListFields),
            },
        });
        const result = resolveExportSpec(baseSpec, {
            constants: new Map([["MediaListEntrySchema", "id\nstatus"]]),
            schema,
        });
        expect(result.properties.map((property) => `${property.name}: ${property.tsType}`)).toEqual(
            ["id: number", "status: string"]
        );
    });

    it("maps list-typed fields to array types", () => {
        const schema = schemaIndex({
            User: {
                kind: "OBJECT",
                name: "User",
                fields: [
                    {
                        name: "bans",
                        type: {
                            kind: "LIST",
                            ofType: {
                                kind: "NON_NULL",
                                ofType: { kind: "SCALAR", name: "String" },
                            },
                        },
                    },
                ],
            },
        });
        const result = resolveExportSpec(
            {
                ...baseSpec,
                exportedName: "User",
                graphqlType: "User",
                source: { constant: "UserSchema" },
            },
            { constants: new Map([["UserSchema", "bans"]]), schema }
        );
        expect(result.properties[0].tsType).toBe("string[]");
    });

    it("honors nested field type overrides for enums", () => {
        const schema = schemaIndex({
            User: {
                kind: "OBJECT",
                name: "User",
                fields: [{ name: "options", type: { kind: "OBJECT", name: "UserOptions" } }],
            },
            UserOptions: {
                kind: "OBJECT",
                name: "UserOptions",
                fields: [
                    { name: "titleLanguage", type: { kind: "ENUM", name: "UserTitleLanguage" } },
                ],
            },
        });
        const result = resolveExportSpec(
            {
                ...baseSpec,
                exportedName: "UserResponse",
                graphqlType: "User",
                source: { constant: "UserSchema" },
                fieldTypes: { "options.titleLanguage": { tsType: "UserTitleLanguage" } },
            },
            { constants: new Map([["UserSchema", "options {\n  titleLanguage\n}"]]), schema }
        );
        expect(result.properties[0].tsType).toContain("titleLanguage: UserTitleLanguage");
    });

    it("emits a named reference when a sub-selection is a single interpolated constant", () => {
        const schema = schemaIndex({
            Media: {
                kind: "OBJECT",
                name: "Media",
                fields: [{ name: "startDate", type: { kind: "OBJECT", name: "FuzzyDate" } }],
            },
        });
        const result = resolveExportSpec(
            {
                ...baseSpec,
                exportedName: "MediaResponse",
                graphqlType: "Media",
                source: { constant: "MediaWithRelationsSchema" },
            },
            {
                constants: new Map([
                    ["FuzzyDateSchema", "year\nmonth\nday"],
                    ["MediaWithRelationsSchema", "startDate {\n  ${FuzzyDateSchema}\n}"],
                ]),
                exportsByConstant: new Map([["FuzzyDateSchema", "FuzzyDate"]]),
                schema,
            }
        );
        expect(result.referencedTypes).toContain("FuzzyDate");
        expect(result.properties[0].tsType).toBe("FuzzyDate");
    });

    it("inlines ad-hoc sub-selections as nested object literals", () => {
        const schema = schemaIndex({
            AiringNotification: {
                kind: "OBJECT",
                name: "AiringNotification",
                fields: [{ name: "media", type: { kind: "OBJECT", name: "Media" } }],
            },
            Media: {
                kind: "OBJECT",
                name: "Media",
                fields: [
                    {
                        name: "id",
                        type: { kind: "NON_NULL", ofType: { kind: "SCALAR", name: "Int" } },
                    },
                    { name: "title", type: { kind: "OBJECT", name: "MediaTitle" } },
                ],
            },
            MediaTitle: {
                kind: "OBJECT",
                name: "MediaTitle",
                fields: [
                    { name: "romaji", type: { kind: "SCALAR", name: "String" } },
                    { name: "english", type: { kind: "SCALAR", name: "String" } },
                ],
            },
        });
        const result = resolveExportSpec(
            {
                ...baseSpec,
                exportedName: "AiringNotification",
                graphqlType: "AiringNotification",
                source: { constant: "AiringNotificationSchema" },
            },
            {
                constants: new Map([
                    ["AiringNotificationSchema", "media {\n  id\n  title {\n    romaji\n  }\n}"],
                ]),
                schema,
            }
        );
        expect(result.properties[0].tsType).toContain("id: number;");
        expect(result.properties[0].tsType).toContain("title:");
        expect(result.properties[0].tsType).toContain("romaji: string");
    });

    it("wraps bare interpolated constants in their GraphQL list type", () => {
        const schema = schemaIndex({
            Media: {
                kind: "OBJECT",
                name: "Media",
                fields: [
                    {
                        name: "externalLinks",
                        type: {
                            kind: "LIST",
                            ofType: {
                                kind: "NON_NULL",
                                ofType: { kind: "OBJECT", name: "MediaExternalLink" },
                            },
                        },
                    },
                ],
            },
        });
        const result = resolveExportSpec(
            {
                ...baseSpec,
                exportedName: "MediaResponse",
                graphqlType: "Media",
                source: { constant: "MediaWithRelationsSchema" },
            },
            {
                constants: new Map([
                    ["ExternalLinkSchema", "externalLinks {\n  id\n  url\n}"],
                    ["MediaWithRelationsSchema", "${ExternalLinkSchema}"],
                ]),
                exportsByConstant: new Map([["ExternalLinkSchema", "ExternalLink"]]),
                schema,
            }
        );
        expect(result.properties[0].tsType).toBe("ExternalLink[]");
    });

    it("synthesizes a property description when the snapshot has none", () => {
        const schema = schemaIndex({
            SiteStatistics: {
                kind: "OBJECT",
                name: "SiteStatistics",
                fields: [
                    {
                        name: "users",
                        description: null,
                        type: { kind: "OBJECT", name: "SiteTrendConnection" },
                    },
                ],
            },
        });
        const result = resolveExportSpec(
            {
                ...baseSpec,
                exportedName: "SiteStatisticsResponse",
                graphqlType: "SiteStatistics",
                source: { constant: "SiteStatisticsSchema" },
            },
            {
                constants: new Map([
                    ["SiteStatisticsSchema", "users {\n  ${SiteTrendConnectionSchema}\n}"],
                ]),
                exportsByConstant: new Map([["SiteTrendConnectionSchema", "SiteTrendConnection"]]),
                schema,
            }
        );
        expect(result.properties[0].description).toContain("`users`");
        expect(result.properties[0].description).toContain("SiteTrendConnection");
    });

    it("unwraps wrapped-mode constants to their inner selection", () => {
        const schema = schemaIndex({
            MediaTitle: {
                kind: "OBJECT",
                name: "MediaTitle",
                fields: [
                    {
                        name: "romaji",
                        type: { kind: "NON_NULL", ofType: { kind: "SCALAR", name: "String" } },
                    },
                ],
            },
        });
        const result = resolveExportSpec(
            {
                ...baseSpec,
                exportedName: "Title",
                graphqlType: "MediaTitle",
                source: { constant: "TitleSchema", wrapped: true },
            },
            { constants: new Map([["TitleSchema", "title {\n  romaji\n}"]]), schema }
        );
        expect(result.properties.map((property) => property.name)).toEqual(["romaji"]);
    });

    it("extracts one fragment member by type condition", () => {
        const schema = schemaIndex({
            AiringNotification: {
                kind: "OBJECT",
                name: "AiringNotification",
                fields: [
                    {
                        name: "id",
                        type: { kind: "NON_NULL", ofType: { kind: "SCALAR", name: "Int" } },
                    },
                    { name: "type", type: { kind: "ENUM", name: "NotificationType" } },
                ],
            },
        });
        const result = resolveExportSpec(
            {
                ...baseSpec,
                exportedName: "AiringNotification",
                graphqlType: "AiringNotification",
                source: { constant: "NotificationSchema", condition: "AiringNotification" },
                fieldTypes: { type: { tsType: '"AIRING"' } },
            },
            {
                constants: new Map([
                    ["NotificationSchema", "... on AiringNotification {\n  id\n  type\n}"],
                ]),
                schema,
            }
        );
        expect(result.properties.map((property) => property.name)).toEqual(["id", "type"]);
        expect(result.properties[1].tsType).toBe('"AIRING"');
    });

    it("honors named-reference overrides pointing at handwritten types", () => {
        const schema = schemaIndex({
            MediaStatsShape: {
                kind: "OBJECT",
                name: "MediaStatsShape",
                fields: [
                    {
                        name: "scoreDistribution",
                        type: { kind: "OBJECT", name: "ScoreDistribution" },
                    },
                ],
            },
        });
        const result = resolveExportSpec(
            {
                ...baseSpec,
                exportedName: "MediaResponse",
                graphqlType: "MediaStatsShape",
                source: { constant: "MediaSchema" },
                fieldTypes: { stats: { refType: "MediaStats" } },
            },
            {
                constants: new Map([
                    ["MediaSchema", "stats {\n  scoreDistribution {\n    score\n  }\n}"],
                ]),
                schema,
            }
        );
        expect(result.properties[0].tsType).toBe("MediaStats");
        expect(result.referencedTypes).toContain("MediaStats");
    });

    it("throws when an override key matches no selected property", () => {
        const schema = schemaIndex({
            Media: {
                kind: "OBJECT",
                name: "Media",
                fields: [
                    {
                        name: "id",
                        type: { kind: "NON_NULL", ofType: { kind: "SCALAR", name: "Int" } },
                    },
                ],
            },
        });
        expect(() =>
            resolveExportSpec(
                {
                    ...baseSpec,
                    exportedName: "MediaResponse",
                    graphqlType: "Media",
                    source: { constant: "MediaSchema" },
                    fieldTypes: {
                        id: { tsType: "number" },
                        typoField: { refType: "Whatever" },
                    },
                },
                { constants: new Map([["MediaSchema", "id"]]), schema }
            )
        ).toThrow(/typoField/);
    });

    it("resolves a selection from an inline operation document", () => {
        const schema = schemaIndex({
            Page: {
                kind: "OBJECT",
                name: "Page",
                fields: [
                    {
                        name: "pageInfo",
                        type: { kind: "OBJECT", name: "PageInfo" },
                    },
                    {
                        name: "likes",
                        type: { kind: "LIST", ofType: { kind: "OBJECT", name: "User" } },
                    },
                ],
            },
            User: {
                kind: "OBJECT",
                name: "User",
                fields: [
                    {
                        name: "id",
                        type: { kind: "NON_NULL", ofType: { kind: "SCALAR", name: "Int" } },
                    },
                ],
            },
        });
        const result = resolveExportSpec(
            {
                ...baseSpec,
                exportedName: "LikesPageResponse",
                graphqlType: "Page",
                source: {
                    operation: { file: "src/apis/graphql/anilist/query/page/Likes.ts" },
                    wrapped: true,
                },
                fieldTypes: { pageInfo: { refType: "PageInfo" } },
            },
            {
                constants: new Map(),
                operations: new Map([
                    [
                        "src/apis/graphql/anilist/query/page/Likes.ts",
                        "query ($page: Int) {\n  Page (page: $page) {\n    pageInfo {\n      total\n    }\n    likes {\n      id\n    }\n  }\n}",
                    ],
                ]),
                exportsByConstant: new Map([["UserSchema", "UserResponse"]]),
                schema,
            }
        );
        expect(result.properties.map((property) => property.name)).toEqual(["pageInfo", "likes"]);
        expect(result.properties[0].tsType).toBe("PageInfo");
        expect(result.properties[1].tsType.startsWith("Array<{")).toBe(true);
        expect(result.properties[1].tsType).toContain("id: number");
    });

    it("marks optional properties listed in optionalFields", () => {
        const schema = schemaIndex({
            Media: {
                kind: "OBJECT",
                name: "Media",
                fields: [{ name: "episodes", type: { kind: "SCALAR", name: "Int" } }],
            },
        });
        const result = resolveExportSpec(
            {
                ...baseSpec,
                exportedName: "MediaResponse",
                graphqlType: "Media",
                source: { constant: "MediaSchema" },
                optionalFields: ["episodes"],
            },
            { constants: new Map([["MediaSchema", "episodes"]]), schema }
        );
        expect(result.properties[0].optional).toBe(true);
    });

    it("throws when a selected field does not exist on the GraphQL type", () => {
        const schema = schemaIndex({
            Media: {
                kind: "OBJECT",
                name: "Media",
                fields: [],
            },
        });
        expect(() =>
            resolveExportSpec(
                {
                    ...baseSpec,
                    exportedName: "MediaResponse",
                    graphqlType: "Media",
                    source: { constant: "MediaSchema" },
                },
                { constants: new Map([["MediaSchema", "nonExistentField"]]), schema }
            )
        ).toThrow(/nonExistentField/);
    });
});

describe("emit", () => {
    it("renders an interface declaration with JSDoc and @see", () => {
        const rendered = renderTypeDeclaration({
            name: "FuzzyDate",
            see: "https://docs.anilist.co/reference/object/fuzzydate",
            summary: "A fuzzy date.",
            kind: "interface",
            properties: [
                { name: "year", tsType: "number", optional: false },
                { name: "month", tsType: "number", optional: true },
            ],
        });
        expect(rendered).toContain("export interface FuzzyDate {");
        expect(rendered).toContain("@see https://docs.anilist.co/reference/object/fuzzydate");
        expect(rendered).toContain("year: number;");
        expect(rendered).toContain("month?: number;");
    });

    it("renders union declarations", () => {
        const rendered = renderTypeDeclaration({
            name: "Activity",
            see: "https://docs.anilist.co/reference/union/activityunion",
            summary: "A single activity.",
            kind: "union",
            members: ["TextActivity", "ListActivity", "MessageActivity"],
        });
        expect(rendered).toContain(
            "export type Activity = TextActivity | ListActivity | MessageActivity;"
        );
    });

    it("replaces the generated region while preserving handwritten content", () => {
        const existing = [
            "// @generated-start — managed by scripts/generate-interfaces.ts",
            "export interface Old { id: number }",
            "// @generated-end",
            "",
            "export interface Handwritten { id: number }",
        ].join("\n");
        const applied = applyGeneratedRegion(existing, "export interface New { id: number }");
        expect(applied).toContain("export interface New { id: number }");
        expect(applied).not.toContain("Old");
        expect(applied).toContain("export interface Handwritten { id: number }");
    });

    it("creates marker-wrapped content for files without markers", () => {
        const applied = applyGeneratedRegion("", "export interface Fresh { id: number }");
        expect(applied).toContain("@generated-start");
        expect(applied).toContain("@generated-end");
        expect(applied).toContain("export interface Fresh { id: number }");
    });
});

describe("buildGeneratedFiles", () => {
    it("produces complete file contents for a small manifest", () => {
        const schema = {
            __schema: {
                types: [
                    {
                        kind: "OBJECT",
                        name: "FuzzyDate",
                        fields: [
                            { name: "year", type: { kind: "SCALAR", name: "Int" } },
                            { name: "month", type: { kind: "SCALAR", name: "Int" } },
                            { name: "day", type: { kind: "SCALAR", name: "Int" } },
                        ],
                    },
                ],
            },
        };
        const files = buildGeneratedFiles({
            schemas: {
                FuzzyDateSchema: "\n  year\n  month\n  day\n",
            },
            schemaJson: schema,
            outputs: [
                {
                    path: "src/apis/graphql/anilist/interfaces/FuzzyDate.ts",
                    exports: [
                        {
                            exportedName: "FuzzyDate",
                            see: "https://docs.anilist.co/reference/object/fuzzydate",
                            summary: "A fuzzy date.",
                            graphqlType: "FuzzyDate",
                            source: { constant: "FuzzyDateSchema" },
                        },
                    ],
                },
            ],
        });
        const content = files.get("src/apis/graphql/anilist/interfaces/FuzzyDate.ts") ?? "";
        expect(content).toContain("@generated-start");
        expect(content).toContain("@generated-end");
        expect(content).toContain("export interface FuzzyDate {");
        expect(content).toContain("year: number;");
    });
});
