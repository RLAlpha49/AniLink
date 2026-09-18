import { describe, expect, test, vi } from "vitest";
import { buildSchema, Kind, parse, validate, type SelectionNode } from "graphql";
import { AniLinkValidationError } from "../src/base/AniLinkError";
import { createTestClient, getLastRequest } from "./helpers/mockRequestHandler";
import { ANILIST_OPERATION_REGISTRY } from "../src/apis/graphql/anilist/registry";
import * as selectionComposer from "../src/apis/graphql/anilist/schemas/selection/composeSelection";
import type {
    DeepPick,
    FieldPath,
} from "../src/apis/graphql/anilist/schemas/selection/fieldsSelection";
import type { MediaResponse } from "../src/apis/graphql/anilist/interfaces/responses/query/Media";
import type { MediasPageResponse } from "../src/apis/graphql/anilist/interfaces/responses/page/Medias";
import type { Activity } from "../src/apis/graphql/anilist/interfaces/Activity";
import { composeDocument } from "../src/apis/graphql/anilist/schemas/selection/composeSelection";
import { ActivityWithRepliesSchema } from "../src/apis/graphql/anilist/schemas/Activity";

/**
 * Field-selection tests for the AniList surface.
 *
 * The `fields` option composes a document from only the requested selections
 * of the maximal one — at any nesting depth, with dot paths. Omitting it must
 * keep the maximal document byte-identical (the api-compare gate validates
 * that document against the live schema).
 */

/** The GraphQL request body captured by the mock transport. */
type GraphQLRequestBody = { query?: string; variables?: unknown };

/** The document of the most recent request, as sent to the transport. */
const lastDocumentOf = (): string => {
    const data = getLastRequest()?.data as GraphQLRequestBody | undefined;
    if (typeof data?.query !== "string") {
        throw new Error("No GraphQL document captured by the mock transport.");
    }
    return data.query;
};

/** Asserts a document parses as syntactically valid GraphQL. */
const expectParses = (document: string): void => {
    expect(() => parse(document), `document must parse as GraphQL:\n${document}`).not.toThrow();
};

/** Asserts a document declares no variable it never uses (spec: All Variables Used). */
const expectNoUnusedVariables = (document: string): void => {
    const schema = buildSchema("type Query { _: Int }");
    const errors = validate(schema, parse(document)).filter((error) =>
        error.message.includes("never used")
    );
    expect(
        errors,
        `unused variable declarations:\n${errors.map((error) => error.message).join("\n")}`
    ).toEqual([]);
};

/** The root field's selection body: text between the root field's argument list and its matching `}`. */
const rootSelectionOf = (document: string): string => {
    // The root field is the first field after the operation definition's `{`.
    // Its selection opens at the next `{` and closes at the matching brace.
    const opOpen = document.indexOf("{");
    const rootOpen = document.indexOf("{", opOpen + 1);
    if (rootOpen === -1) return document;
    let depth = 0;
    const lines = document.slice(rootOpen + 1).split("\n");
    const out: string[] = [];
    for (const line of lines) {
        depth += (line.match(/\{/g) ?? []).length - (line.match(/\}/g) ?? []).length;
        if (depth < 0) break;
        out.push(line);
    }
    return out.join("\n");
};

/** Top-level lines of a selection body: fields at brace depth zero. */
const topLevelLinesOf = (body: string): string[] => {
    const lines: string[] = [];
    let depth = 0;
    for (const line of body.split("\n")) {
        if (line.trim() === "") continue;
        if (depth === 0) lines.push(line.trim());
        depth += (line.match(/\{/g) ?? []).length - (line.match(/\}/g) ?? []).length;
    }
    return lines;
};

describe("composeDocument", () => {
    const activityDocument = `query ($asHtml: Boolean) {
        Activity {
            ${ActivityWithRepliesSchema}
        }
    }`;

    test("keeps a whole fragment and does not mutate the cached maximal selection", () => {
        const whole = composeDocument(activityDocument, ["TextActivity"], []);
        expectParses(whole);
        expect(whole).toContain("... on TextActivity {");
        expect(whole).toContain("replies {");
        expect(whole).not.toContain("... on ListActivity");
        composeDocument(activityDocument, ["TextActivity.text"], []);
        expect(composeDocument(activityDocument, ["TextActivity"], [])).toBe(whole);
        expect(composeDocument(activityDocument, undefined, [])).toBe(activityDocument);
    });

    test("prunes and merges fields inside type-qualified fragments", () => {
        const fields: FieldPath<Activity>[] = [
            "TextActivity.text",
            "TextActivity.id",
            "ListActivity.media.title.romaji",
        ];
        const document = composeDocument(activityDocument, fields, []);
        expectParses(document);
        expectNoUnusedVariables(document);
        expect(document.match(/\.\.\. on TextActivity/g)).toHaveLength(1);
        expect(document).toContain("text(asHtml: $asHtml)");
        expect(document).toContain("romaji");
        expect(document).not.toContain("english");
        expect(document).not.toContain("replies");
        expect(document).not.toContain("... on MessageActivity");
        type Slim = DeepPick<Activity, "TextActivity.text" | "TextActivity.id">;
        const value: Slim = { text: "selected", id: 1 };
        const unmatched: Slim = {};
        // @ts-expect-error Type conditions are scopes, not bare union response fields.
        const unqualified: FieldPath<Activity> = "text";
        // @ts-expect-error A valid fragment still rejects an unknown leaf.
        const invalid: FieldPath<Activity> = "TextActivity.nope";
        expect([value, unmatched, unqualified, invalid]).toHaveLength(4);
    });

    test("narrows a union pick by the selected field's presence", () => {
        // The union result keeps every member possible; a selected field is
        // read only after narrowing on its presence.
        type Slim = DeepPick<Activity, "TextActivity.text">;
        const value: Slim = { text: "selected" };
        const read: string | undefined = "text" in value ? value.text : undefined;
        expect(read).toBe("selected");
    });

    test("narrows a union pick by the `type` discriminant when it is selected", () => {
        // Selecting `type` on every member gives the union a discriminant;
        // narrowing on it exposes the matching member's picked fields.
        type Tagged = DeepPick<
            Activity,
            "TextActivity.type" | "TextActivity.text" | "ListActivity.type" | "MessageActivity.type"
        >;
        const text: Tagged = { type: "TEXT", text: "selected" };
        const read: string | undefined = text.type === "TEXT" ? text.text : undefined;
        expect(read).toBe("selected");
    });

    test.each([
        "UnknownActivity.text",
        "TextActivity.nope",
        "ListActivity.media.nope",
        "TextActivity.id.nope",
    ])("reports the full unknown type-qualified caller path %s", (path) => {
        const page = `query { Page {\nactivities {\n${ActivityWithRepliesSchema}\n}\n} }`;
        expect(() => composeDocument(page, [`activities.${path}`], [])).toThrow(
            `activities.${path}`
        );
    });

    test("retains whole always-selected fragments and rejects invalid always keys", () => {
        const document = composeDocument(activityDocument, ["TextActivity.text"], ["TextActivity"]);
        expect(document).toContain("replies {");
        expect(() => composeDocument(activityDocument, [], ["MissingActivity"])).toThrow(
            "The operation's always-selected fields are invalid"
        );
        expect(() =>
            composeDocument(
                "query { Activity {\n... on TextActivity { id }\n} }",
                ["TextActivity"],
                []
            )
        ).toThrow(AniLinkValidationError);
    });

    test("selects union fields through query and page facades", async () => {
        const client = createTestClient("fragment-query-token");
        await client.anilist.query.activity({ id: 1 }, { fields: ["TextActivity.text"] });
        expectParses(lastDocumentOf());
        expect(lastDocumentOf()).toContain("text(asHtml: $asHtml)");
        expect(lastDocumentOf()).not.toContain("... on ListActivity");

        await client.anilist.query.notification({}, { fields: ["AiringNotification.id"] });
        expectParses(lastDocumentOf());
        expectNoUnusedVariables(lastDocumentOf());
        expect(lastDocumentOf()).toContain("... on AiringNotification");
        expect(lastDocumentOf()).not.toContain("... on FollowingNotification");

        await client.anilist.query.page.activities(
            {},
            { fields: ["activities.TextActivity.text"] }
        );
        expectParses(lastDocumentOf());
        expect(lastDocumentOf()).toContain("pageInfo {");
        expect(lastDocumentOf()).not.toContain("... on ListActivity");

        await client.anilist.query.page.notifications(
            {},
            {
                fields: ["notifications.ActivityMentionNotification.activity.TextActivity.id"],
            }
        );
        expectParses(lastDocumentOf());
        expectNoUnusedVariables(lastDocumentOf());
        expect(lastDocumentOf()).toContain("pageInfo {");
        expect(lastDocumentOf()).toContain("... on ActivityMentionNotification");
        expect(lastDocumentOf()).toContain("... on TextActivity");
        expect(lastDocumentOf()).not.toContain("... on ListActivity");
    });

    test("selects activity and non-activity union fields through mutation facades", async () => {
        const client = createTestClient("fragment-mutation-token");
        await client.anilist.mutation.toggleActivityPin(
            { id: 1, pinned: true },
            {
                fields: ["TextActivity.text"],
            }
        );
        expectParses(lastDocumentOf());
        expect(lastDocumentOf()).toContain("... on TextActivity");
        expect(lastDocumentOf()).not.toContain("... on ListActivity");

        await client.anilist.mutation.toggleActivitySubscription(
            { activityId: 1, subscribe: true },
            {
                fields: ["ListActivity.media.title.romaji"],
            }
        );
        expectParses(lastDocumentOf());
        expectNoUnusedVariables(lastDocumentOf());
        expect(lastDocumentOf()).toContain("romaji");
        expect(lastDocumentOf()).not.toContain("... on TextActivity");

        await client.anilist.mutation.toggleLikeV2(
            { id: 1, type: "THREAD" },
            {
                fields: [
                    "Thread.title",
                    "Thread.ThreadUserId",
                    "Thread.ThreadReplyCount",
                    "ActivityReply.text",
                ],
            }
        );
        expectParses(lastDocumentOf());
        expectNoUnusedVariables(lastDocumentOf());
        expect(lastDocumentOf()).toContain("... on Thread {");
        expect(lastDocumentOf()).toContain("ThreadUserId: userId");
        expect(lastDocumentOf()).toContain("ThreadReplyCount: replyCount");
        expect(lastDocumentOf()).toContain("... on ActivityReply {");
        expect(lastDocumentOf()).not.toContain("... on TextActivity");
    });

    test("returns the maximal document unchanged when fields is undefined", async () => {
        const sent: string[] = [];
        const client = createTestClient("maximal-token");

        await client.anilist.query.media({ id: 1 });
        sent.push(lastDocumentOf());
        await client.anilist.query.media({ id: 1 }, { fields: undefined });
        sent.push(lastDocumentOf());

        expect(sent[1]).toBe(sent[0]);
    });

    test("keeps the root field and its arguments in a composed document", async () => {
        const client = createTestClient("root-token");

        await client.anilist.query.media({ id: 1 }, { fields: ["id", "title"] });

        const document = lastDocumentOf();
        // The root field with its argument list must survive composition.
        expect(document).toMatch(/Media\s*\(id:\s*\$id/);
        // And the document must remain a single-root GraphQL operation.
        expect(document).toMatch(/query\s*\(/);
    });

    test("sends a document selecting only the requested top-level fields", async () => {
        const client = createTestClient("partial-token");

        await client.anilist.query.media({ id: 1 }, { fields: ["id", "title"] });

        const body = rootSelectionOf(lastDocumentOf());
        expect(body).toContain("title");
        expect(topLevelLinesOf(body)).not.toContain("averageScore");
        expect(topLevelLinesOf(body)).not.toContain("tags");
    });

    test("sends the maximal document when fields is omitted", async () => {
        const client = createTestClient("default-token");

        await client.anilist.query.media({ id: 1 });

        const document = lastDocumentOf();
        expect(document).toContain("averageScore");
    });

    test("rejects unknown fields with a validation error before dispatch", async () => {
        const client = createTestClient("unknown-token");

        await expect(
            client.anilist.query.media({ id: 1 }, { fields: ["nope" as FieldPath<MediaResponse>] })
        ).rejects.toThrow(AniLinkValidationError);
    });

    test("selects nested fields inside an object", async () => {
        const client = createTestClient("nested-token");

        await client.anilist.query.media({ id: 1 }, { fields: ["id", "title.romaji"] });

        const body = rootSelectionOf(lastDocumentOf());
        expect(body).toContain("title");
        expect(body).toContain("romaji");
        expect(body).not.toContain("english");
    });

    test("selects nested fields inside a list of objects", async () => {
        const client = createTestClient("list-token");

        await client.anilist.query.media({ id: 1 }, { fields: ["tags.name"] });

        const body = rootSelectionOf(lastDocumentOf());
        expect(body).toContain("tags");
        expect(body).toContain("name");
        expect(body).not.toContain("rank");
    });

    test("selects whole objects and nested paths in the same call", async () => {
        const client = createTestClient("mixed-token");

        await client.anilist.query.media({ id: 1 }, { fields: ["coverImage", "title.romaji"] });

        const body = rootSelectionOf(lastDocumentOf());
        expect(body).toContain("coverImage");
        expect(body).toContain("extraLarge");
        expect(body).toContain("romaji");
        expect(body).not.toContain("english");
    });

    test("merges same-head nested paths into one selection", async () => {
        const client = createTestClient("merge-token");

        await client.anilist.query.media({ id: 1 }, { fields: ["title.romaji", "title.english"] });

        const document = lastDocumentOf();
        const body = rootSelectionOf(document);
        // One `title {` selection, carrying both romaji and english.
        expect(body.match(/title\s*\{/g)).toHaveLength(1);
        expect(body).toContain("romaji");
        expect(body).toContain("english");
    });

    test("rejects a nested path whose head is unknown", async () => {
        const client = createTestClient("nested-unknown-token");

        await expect(
            client.anilist.query.media(
                { id: 1 },
                { fields: ["nope.romaji" as FieldPath<MediaResponse>] }
            )
        ).rejects.toThrow(AniLinkValidationError);
    });

    test("rejects a nested path whose leaf is unknown", async () => {
        const client = createTestClient("leaf-unknown-token");

        await expect(
            client.anilist.query.media(
                { id: 1 },
                { fields: ["title.nope" as FieldPath<MediaResponse>] }
            )
        ).rejects.toThrow(AniLinkValidationError);
    });

    test("rejects drilling into a scalar field", async () => {
        const client = createTestClient("scalar-drill-token");

        await expect(
            client.anilist.query.media(
                { id: 1 },
                { fields: ["episodes.deeper" as FieldPath<MediaResponse>] }
            )
        ).rejects.toThrow(AniLinkValidationError);
    });

    test("composes documents for entities without id (MediaTrend)", async () => {
        const client = createTestClient("trend-token");

        await client.anilist.query.mediaTrend(
            { mediaId: 1 },
            { fields: ["trending", "media.title.romaji"] }
        );

        const document = lastDocumentOf();
        expectParses(document);
        const body = rootSelectionOf(document);
        expect(body).toContain("trending");
        expect(body).toContain("media");
        expect(body).toContain("romaji");
        expect(topLevelLinesOf(body)).not.toContain("averageScore");
    });

    test("composes documents for SiteStatistics", async () => {
        const client = createTestClient("stats-token");

        await client.anilist.query.siteStatistics({}, { fields: ["users"] });

        const document = lastDocumentOf();
        expectParses(document);
        const body = rootSelectionOf(document);
        expect(body).toContain("users");
        expect(topLevelLinesOf(body)).not.toContain("anime");
    });

    test("composes documents for MediaListCollection", async () => {
        const client = createTestClient("collection-token");

        await client.anilist.query.mediaListCollection(
            { userId: 1, type: "ANIME" },
            { fields: ["hasNextChunk"] }
        );

        const document = lastDocumentOf();
        expectParses(document);
        const body = rootSelectionOf(document);
        expect(body).toContain("hasNextChunk");
        expect(topLevelLinesOf(body)).not.toContain("lists");
    });
});

describe("composed documents are valid GraphQL", () => {
    const fieldsEnabledOperations = Object.entries(ANILIST_OPERATION_REGISTRY).flatMap(
        ([group, entries]) =>
            entries
                .filter((entry) => entry.fieldsEnabled === true)
                .map((entry) => ({ ...entry, group }))
    );

    test.each(fieldsEnabledOperations)(
        "$group / $name composes parseable selections from the registry",
        async ({ operationClass, methodName }) => {
            // Only execution is stubbed: the real method supplies its document and always-keys.
            // Variable requirements and auth checks run during execution, not composition.
            const operation = new operationClass() as unknown as Record<
                string,
                (
                    variables: Record<string, unknown>,
                    options?: { fields: string[] }
                ) => Promise<unknown>
            >;
            const execute = vi.fn<(document: string) => Promise<unknown>>().mockResolvedValue({});
            Object.defineProperty(operation, "execute", { value: execute });
            const composer = vi.spyOn(selectionComposer, "composeDocument");

            try {
                await operation[methodName]({});
                expect(composer).toHaveBeenCalledTimes(1);
                expect(execute).toHaveBeenCalledTimes(1);
                const [maximalDocument, , always] = composer.mock.calls[0];
                const definition = parse(maximalDocument).definitions[0];
                if (definition.kind !== Kind.OPERATION_DEFINITION) {
                    throw new Error("Expected an operation definition.");
                }
                expect(definition.selectionSet.selections).toHaveLength(1);
                const root = definition.selectionSet.selections[0];
                if (root.kind !== Kind.FIELD || !root.selectionSet) {
                    throw new Error("Expected a root field with a selection set.");
                }

                // Follow one leaf per branch, retaining aliases and inline-fragment type scopes.
                const firstLeafPath = (selection: SelectionNode): string => {
                    if (selection.kind === Kind.FRAGMENT_SPREAD) {
                        throw new Error(
                            "Named fragments need an explicit selection-path resolver."
                        );
                    }
                    const head =
                        selection.kind === Kind.INLINE_FRAGMENT
                            ? selection.typeCondition?.name.value
                            : (selection.alias ?? selection.name).value;
                    if (!head) throw new Error("Expected a named selection scope.");
                    const child = selection.selectionSet?.selections[0];
                    return child ? `${head}.${firstLeafPath(child)}` : head;
                };
                const paths = root.selectionSet.selections.map(firstLeafPath);
                const minimalFields = always.length > 0 ? [] : [paths[0]];
                for (const fields of [minimalFields, ...paths.map((path) => [path])]) {
                    execute.mockClear();
                    await operation[methodName]({}, { fields });
                    expect(execute).toHaveBeenCalledTimes(1);
                    expectParses(execute.mock.calls[0][0]);
                }
            } finally {
                composer.mockRestore();
            }
        }
    );

    test("every composed query document parses", async () => {
        const client = createTestClient("parse-query-token");

        await client.anilist.query.media({ id: 1 }, { fields: ["title.romaji", "averageScore"] });
        expectParses(lastDocumentOf());

        await client.anilist.query.media({ id: 1 }, { fields: ["tags.name"] });
        expectParses(lastDocumentOf());

        await client.anilist.query.media({ id: 1 }, { fields: ["id"] });
        expectParses(lastDocumentOf());
    });

    test("every composed page document parses", async () => {
        const client = createTestClient("parse-page-token");

        await client.anilist.query.page.medias({ page: 1 }, { fields: ["media.title.romaji"] });
        expectParses(lastDocumentOf());

        await client.anilist.query.page.medias({ page: 1 }, { fields: ["pageInfo.total"] });
        expectParses(lastDocumentOf());
    });

    test("every composed mutation document parses", async () => {
        const client = createTestClient("parse-mutation-token");

        await client.anilist.mutation.saveMediaListEntry(
            { mediaId: 21, status: "CURRENT" },
            { fields: ["id", "status"] }
        );
        expectParses(lastDocumentOf());

        await client.anilist.mutation.saveMediaListEntry(
            { mediaId: 21, status: "CURRENT" },
            { fields: ["startedAt.year"] }
        );
        expectParses(lastDocumentOf());
    });

    test("composed documents declare only the variables they use", async () => {
        const client = createTestClient("unused-vars-token");

        // Pruning `description` orphans `$asHtml`; the declaration must go too.
        await client.anilist.query.media({ id: 1 }, { fields: ["title.romaji"] });
        expectNoUnusedVariables(lastDocumentOf());

        await client.anilist.query.page.medias({ page: 1 }, { fields: ["media.title.romaji"] });
        expectNoUnusedVariables(lastDocumentOf());

        await client.anilist.mutation.saveMediaListEntry(
            { mediaId: 21, status: "CURRENT" },
            { fields: ["id"] }
        );
        expectNoUnusedVariables(lastDocumentOf());
    });

    test("rejects an empty fields list before dispatch", async () => {
        const client = createTestClient("empty-fields-token");

        // A mutation has no always-keys, so an empty list would compose an
        // empty selection set — invalid GraphQL. It must fail client-side.
        await expect(
            client.anilist.mutation.saveMediaListEntry(
                { mediaId: 21, status: "CURRENT" },
                { fields: [] }
            )
        ).rejects.toThrow(AniLinkValidationError);
    });

    test("an empty fields list on an always-key operation degrades to the always keys", async () => {
        const client = createTestClient("empty-fields-page-token");

        await client.anilist.query.page.medias({ page: 1 }, { fields: [] });

        const document = lastDocumentOf();
        expectParses(document);
        const body = rootSelectionOf(document);
        expect(body).toContain("pageInfo");
    });
});

describe("always-selected keys", () => {
    test("entity operations force-select id and idMal even when not requested", async () => {
        const client = createTestClient("always-entity-token");

        await client.anilist.query.media({ id: 1 }, { fields: ["title.romaji"] });

        const body = rootSelectionOf(lastDocumentOf());
        expect(topLevelLinesOf(body)).toContain("id");
        expect(topLevelLinesOf(body)).toContain("idMal");
    });

    test("page operations force-select pageInfo even when not requested", async () => {
        const client = createTestClient("always-page-token");

        await client.anilist.query.page.medias({ page: 1 }, { fields: ["media.title.romaji"] });

        const body = rootSelectionOf(lastDocumentOf());
        expect(topLevelLinesOf(body)).toContain("pageInfo {");
    });

    test("a requested path that extends an always key keeps the whole always block", async () => {
        const client = createTestClient("always-drill-token");

        await client.anilist.query.page.medias({ page: 1 }, { fields: ["pageInfo.total"] });

        const body = rootSelectionOf(lastDocumentOf());
        expect(body).toContain("pageInfo");
        expect(body).toContain("total");
        // The always-selected pageInfo stays whole (a superset), so the
        // paginate helpers keep their pagination metadata.
        expect(body).toContain("hasNextPage");
        expect(topLevelLinesOf(body)).not.toContain("media");
    });
});

describe("page queries with fields", () => {
    test("selects top-level page fields", async () => {
        const client = createTestClient("page-token");

        await client.anilist.query.page.medias({ page: 1 }, { fields: ["pageInfo.total"] });

        const body = rootSelectionOf(lastDocumentOf());
        expect(body).toContain("pageInfo");
        expect(body).toContain("total");
        // The always-selected pageInfo stays whole (a superset), so the
        // paginate helpers keep their pagination metadata.
        expect(body).toContain("hasNextPage");
        expect(topLevelLinesOf(body)).not.toContain("media");
    });

    test("selects nested paths into the page's inner entity", async () => {
        const client = createTestClient("page-nested-token");

        await client.anilist.query.page.medias({ page: 1 }, { fields: ["media.title.romaji"] });

        const body = rootSelectionOf(lastDocumentOf());
        expect(body).toContain("media");
        expect(body).toContain("title");
        expect(body).toContain("romaji");
        // The inner media's SELECTION is pruned; its filter ARGUMENT list
        // legitimately mentions filter names, so scope the exclusion to the
        // selection lines under media.
        const mediaSel = body.slice(body.indexOf("media"));
        expect(mediaSel).not.toMatch(/\n\s*averageScore\s*\n/);
    });

    test("keeps the Page root field and its pagination arguments", async () => {
        const client = createTestClient("page-root-token");

        await client.anilist.query.page.medias({ page: 1 }, { fields: ["pageInfo"] });

        const document = lastDocumentOf();
        expect(document).toMatch(/Page\s*\(page:\s*\$page,\s*perPage:\s*\$perPage\)/);
    });

    test("keeps the inner entity's filter arguments when composing", async () => {
        const client = createTestClient("page-args-token");

        await client.anilist.query.page.medias({ page: 1 }, { fields: ["media.id"] });

        const document = lastDocumentOf();
        // The inner media field carries its filter arguments; only its
        // selection narrows.
        expect(document).toMatch(/media\s*\(id:\s*\$id/);
    });

    test("sends the maximal page document when fields is omitted", async () => {
        const client = createTestClient("page-maximal-token");

        await client.anilist.query.page.medias({ page: 1 });

        const document = lastDocumentOf();
        expect(document).toContain("averageScore");
    });
});

describe("mutations with fields", () => {
    test("selects top-level mutation response fields", async () => {
        const client = createTestClient("mutation-token");

        await client.anilist.mutation.saveMediaListEntry(
            { mediaId: 21, status: "CURRENT" },
            { fields: ["id", "status"] }
        );

        const body = rootSelectionOf(lastDocumentOf());
        expect(body).toContain("id");
        expect(body).toContain("status");
        expect(topLevelLinesOf(body)).not.toContain("progress");
    });

    test("selects nested mutation response fields", async () => {
        const client = createTestClient("mutation-nested-token");

        await client.anilist.mutation.saveMediaListEntry(
            { mediaId: 21, status: "CURRENT" },
            { fields: ["startedAt.year"] }
        );

        const body = rootSelectionOf(lastDocumentOf());
        expect(body).toContain("startedAt");
        expect(body).toContain("year");
        // The sibling date fields are pruned.
        expect(body).not.toContain("completedAt");
        expect(body).not.toContain("progress");
    });

    test("keeps the mutation root field and its arguments", async () => {
        const client = createTestClient("mutation-root-token");

        await client.anilist.mutation.saveMediaListEntry(
            { mediaId: 21, status: "CURRENT" },
            { fields: ["id"] }
        );

        const document = lastDocumentOf();
        expect(document).toMatch(/SaveMediaListEntry\s*\(id:\s*\$id,\s*mediaId:\s*\$mediaId/);
    });

    test("sends the maximal mutation document when fields is omitted", async () => {
        const client = createTestClient("mutation-maximal-token");

        await client.anilist.mutation.saveMediaListEntry({ mediaId: 21, status: "CURRENT" });

        const document = lastDocumentOf();
        expect(document).toContain("progress");
    });
});

describe("FieldPath and DeepPick type helpers", () => {
    test("FieldPath accepts valid heads and rejects invalid ones at compile time", () => {
        const valid: Array<FieldPath<MediaResponse>> = [
            "id",
            "title",
            "title.romaji",
            "tags.name",
            "stats.scoreDistribution.score",
        ];
        expect(valid).toHaveLength(5);

        // @ts-expect-error — an unknown head is not a key of the response.
        const badHead: FieldPath<MediaResponse> = "nope";
        // @ts-expect-error — a valid head with an unknown leaf.
        const badLeaf: FieldPath<MediaResponse> = "title.nope";
        // @ts-expect-error — a scalar field cannot be traversed.
        const throughScalar: FieldPath<MediaResponse> = "episodes.deeper";
        expect([badHead, badLeaf, throughScalar]).toHaveLength(3);
    });

    test("DeepPick narrows nested paths", () => {
        type Actual = DeepPick<MediaResponse, "id" | "title.romaji">;
        type Expected = { id: number; title: { romaji: string } };
        const assert: Actual extends Expected ? (Expected extends Actual ? true : false) : false =
            true;
        expect(assert).toBe(true);
    });

    test("DeepPick unwraps arrays in the middle of a path", () => {
        type Actual = DeepPick<MediasPageResponse, "media.title.romaji">;
        type Expected = { media: { title: { romaji: string } }[] };
        const assert: Actual extends Expected ? (Expected extends Actual ? true : false) : false =
            true;
        expect(assert).toBe(true);
    });

    test("DeepPick merges same-head paths", () => {
        type Actual = DeepPick<MediaResponse, "title.romaji" | "title.english">;
        type Expected = { title: { romaji: string } & { english: string } };
        const assert: Actual extends Expected ? (Expected extends Actual ? true : false) : false =
            true;
        expect(assert).toBe(true);
    });

    test("DeepPick keeps whole objects when the path stops at the object", () => {
        type Actual = DeepPick<MediaResponse, "title">;
        type Expected = { title: MediaResponse["title"] };
        const assert: Actual extends Expected ? (Expected extends Actual ? true : false) : false =
            true;
        expect(assert).toBe(true);
    });
});

describe("operation classes with fields", () => {
    test("MediaQuery.media narrows the selected call and keeps the maximal one", async () => {
        const client = createTestClient("media-overload-token");

        // Maximal call: the full response type, no narrowing.
        const full = await client.anilist.query.media({ id: 1 });
        const fullId: number | undefined = full.id;
        expect(fullId).toBeUndefined();

        // Selected call: the narrowed type carries the requested paths plus
        // the always-selected id and idMal.
        const slim = await client.anilist.query.media({ id: 1 }, { fields: ["title.romaji"] });
        const romaji: string | undefined = slim.title?.romaji;
        const alwaysId: number | undefined = slim.id;
        const alwaysIdMal: number | undefined = slim.idMal;
        // @ts-expect-error — a path not selected is absent from the narrowed type.
        const absent: string | undefined = slim.bannerImage;
        expect([romaji, alwaysId, alwaysIdMal, absent]).toHaveLength(4);
    });

    test("MediasQuery.medias narrows the selected call and keeps the maximal one", async () => {
        const client = createTestClient("medias-overload-token");

        const full = await client.anilist.query.page.medias({ page: 1, type: "ANIME" });
        const fullMedia: MediaResponse[] | undefined = full.media;
        expect(fullMedia).toBeUndefined();

        const slim = await client.anilist.query.page.medias(
            { page: 1, type: "ANIME" },
            { fields: ["media.title.romaji"] }
        );
        const romaji: string | undefined = slim.media?.[0]?.title?.romaji;
        // The always-selected pageInfo joins the pick.
        const total: number | undefined = slim.pageInfo?.total;
        // @ts-expect-error — a path not selected is absent from the narrowed type.
        const absent: string | undefined = slim.media?.[0]?.bannerImage;
        expect([romaji, total, absent]).toHaveLength(3);
    });

    test("SaveMediaListEntryMutation.saveMediaListEntry narrows the selected call", async () => {
        const client = createTestClient("mutation-overload-token");

        const full = await client.anilist.mutation.saveMediaListEntry({
            mediaId: 21,
            status: "CURRENT",
        });
        const fullStatus: string | undefined = full.status;
        expect(fullStatus).toBeUndefined();

        const slim = await client.anilist.mutation.saveMediaListEntry(
            { mediaId: 21, status: "CURRENT" },
            { fields: ["status"] }
        );
        const status: string | undefined = slim.status;
        // @ts-expect-error — a path not selected is absent from the narrowed type.
        const absent: number | undefined = slim.progress;
        expect([status, absent]).toHaveLength(2);

        // The FieldPath bound is the maximal document's surface, so paths the
        // document never selects are rejected at compile time — and would
        // still be rejected at runtime by the composer.
        await expect(
            // @ts-expect-error — media is not selected by the maximal document.
            client.anilist.mutation.saveMediaListEntry(
                { mediaId: 21, status: "CURRENT" },
                { fields: ["media.title.romaji"] }
            )
        ).rejects.toThrow(AniLinkValidationError);
        await expect(
            // @ts-expect-error — userId is not selected by the maximal document.
            client.anilist.mutation.saveMediaListEntry(
                { mediaId: 21, status: "CURRENT" },
                { fields: ["userId"] }
            )
        ).rejects.toThrow(AniLinkValidationError);
    });

    test("a conditional fields value compiles and narrows", async () => {
        const client = createTestClient("conditional-token");
        const narrow = true;

        // The realistic pattern: fields computed at runtime, possibly absent.
        const slim = await client.anilist.query.media(
            { id: 1 },
            { fields: narrow ? ["title.romaji"] : undefined }
        );
        // The narrowed branch keeps property access typed.
        const romaji: string | undefined = slim.title?.romaji;
        expect(romaji).toBeUndefined();
    });
});
