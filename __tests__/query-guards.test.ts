import { AniLinkErrorCodes, AniLinkValidationError } from "../src/base/AniLinkError";
import { requireVariables } from "../src/base/ValidateVariables";
import {
    createTestClient,
    getLastRequest,
    mockSendRequest,
    setMockResponse,
} from "./helpers/mockRequestHandler";
import { describe, expect, test } from "vitest";

describe("requireVariables helper", () => {
    test("kind one passes when at least one variable is set", () => {
        expect(() =>
            requireVariables({ asHtml: true }, { kind: "one" }, "needs one")
        ).not.toThrow();
    });

    test("kind one throws when every variable is undefined or null", () => {
        expect(() =>
            requireVariables({ id: undefined, name: null }, { kind: "one" }, "needs one")
        ).toThrow(AniLinkValidationError);
    });

    test("kind one throws for an empty variables object", () => {
        expect(() => requireVariables({}, { kind: "one" }, "needs one")).toThrow("needs one");
    });

    test("kind all passes only when every listed variable is set", () => {
        expect(() =>
            requireVariables(
                { likeableId: 1, type: "ACTIVITY" },
                { kind: "all", names: ["likeableId", "type"] },
                "needs both"
            )
        ).not.toThrow();
        expect(() =>
            requireVariables(
                { likeableId: 1 },
                { kind: "all", names: ["likeableId", "type"] },
                "needs both"
            )
        ).toThrow(AniLinkValidationError);
    });

    test("kind any passes when one of the listed variables is set", () => {
        expect(() =>
            requireVariables(
                { activityId: 5 },
                { kind: "any", names: ["id", "activityId"] },
                "needs either"
            )
        ).not.toThrow();
        expect(() =>
            requireVariables(
                { asHtml: true },
                { kind: "any", names: ["id", "activityId"] },
                "needs either"
            )
        ).toThrow(AniLinkValidationError);
    });

    test("kind notOnly passes when a non-excluded variable is set", () => {
        expect(() =>
            requireVariables(
                { id: 1, asHtml: true },
                { kind: "notOnly", names: ["asHtml"] },
                "needs a filter"
            )
        ).not.toThrow();
        expect(() =>
            requireVariables({ id: 1 }, { kind: "notOnly", names: ["asHtml"] }, "needs a filter")
        ).not.toThrow();
    });
});

describe("custom() adversarial document guard", () => {
    const rejectedInputs: Array<[string, unknown]> = [
        // Keyword look-alikes that must not satisfy the operation requirement.
        [
            "a comment mentioning mutation but no real operation",
            "# this comment says mutation\n{ Viewer { id } }",
        ],
        ["a quoted 'query' inside a shorthand object", '{ text: "query" }'],
        ["a fragment-only document", "fragment ViewerFields on Viewer { id }"],
        ["an uppercase QUERY keyword (the guard is case-sensitive)", "QUERY { Viewer { id } }"],
        ["a keyword with no selection set after it", "query"],
        ["a template placeholder instead of a document", "${query}"],
        // Structural non-documents.
        ["an array of documents", ["query { Viewer { id } }"]],
        ["a boolean", true],
        ["undefined", undefined],
        ["a GraphQL-like document with only a closing brace", "query }"],
    ];

    test.each(rejectedInputs)(
        "%s is rejected with AniLinkValidationError",
        async (_name, input) => {
            const client = createTestClient("adversarial-token");

            const outcome = await client.anilist.custom(input as string).then(
                () => "resolved",
                (error: unknown) => error
            );

            expect(outcome).toBeInstanceOf(AniLinkValidationError);
            expect((outcome as AniLinkValidationError).code).toBe(AniLinkErrorCodes.VALIDATION);
            expect(mockSendRequest).not.toHaveBeenCalled();
        }
    );

    const acceptedInputs: Array<[string, string]> = [
        ["leading whitespace before the keyword", "\n\t  query { Viewer { id } }"],
        ["a byte-order mark ahead of the keyword", "﻿query { Viewer { id } }"],
        ["a named operation", "query ViewerQuery { Viewer { id } }"],
        ["a multi-root-field document", "query { Media(id: 1) { id } User(id: 1) { id } }"],
        [
            "a mutation whose strings contain the word query",
            'mutation { UpdateUser(about: "I like query") { id } }',
        ],
        [
            "a query containing a comment with the word mutation",
            "query { # mutation lives here\n  Viewer { id }\n}",
        ],
        ["a compact single-line document", "query{Viewer{id}}"],
    ];

    test.each(acceptedInputs)(
        "%s passes the guard and reaches the transport",
        async (_name, doc) => {
            setMockResponse({ data: { Viewer: { id: 542244 } } });
            const client = createTestClient("accepted-token");

            await client.anilist.custom(doc);

            expect(mockSendRequest).toHaveBeenCalledTimes(1);
            expect(getLastRequest()?.data).toEqual(expect.objectContaining({ query: doc }));
        }
    );

    test("rejections report the guard message verbatim", async () => {
        const client = createTestClient("message-token");

        const outcome = await client.anilist.custom("{ Viewer { id } }").then(
            () => "resolved",
            (error: unknown) => error
        );

        expect((outcome as AniLinkValidationError).details).toContain(
            "custom() requires a GraphQL document declaring a query or mutation operation"
        );
    });
});
