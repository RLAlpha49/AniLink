import { describe, expect, test } from "vitest";
import { composeDocument } from "../src/apis/graphql/anilist/schemas/selection/composeSelection";
import { AniLinkValidationError } from "../src/base/AniLinkError";

describe("composeDocument structure failures", () => {
    test("throws when fields is set but the document has no braces", () => {
        const malformed = "not a graphql document";
        expect(() => composeDocument(malformed, ["id"], [])).toThrow(AniLinkValidationError);
    });

    test("throws when fields is set but the root field selection cannot be located", () => {
        // A single brace pair: the operation definition with no root field body.
        const malformed = "query { Media(id: $id) }";
        expect(() => composeDocument(malformed, ["id"], [])).toThrow(AniLinkValidationError);
    });

    test("returns the maximal document unchanged when fields is undefined, even for malformed input", () => {
        const malformed = "not a graphql document";
        expect(composeDocument(malformed, undefined, [])).toBe(malformed);
    });

    test("rejects fields: null instead of silently sending the maximal document", () => {
        const maximal = "query ($id: Int) { Media (id: $id) { id } }";
        expect(() => composeDocument(maximal, null as unknown as string[], [])).toThrow(
            AniLinkValidationError
        );
    });

    test("rejects a same-line open-and-close selection instead of dropping its children", () => {
        // `title { romaji }` on one line would pop the stack before the field
        // attaches, silently rendering `title` as a scalar. The parser must
        // reject the shape loudly.
        const malformed = ["query { Media (id: $id) {", "  title { romaji }", "}", "}"].join("\n");
        expect(() => composeDocument(malformed, ["title"], [])).toThrow(AniLinkValidationError);
        expect(() => composeDocument(malformed, ["title"], [])).toThrow(
            /cannot parse the document line/
        );
    });

    test("repeated composition of the same document is stable (parse cache)", () => {
        const maximal = [
            "query ($id: Int) { Media (id: $id) {",
            "  id",
            "  title {",
            "    romaji",
            "  }",
            "}",
            "}",
        ].join("\n");
        const first = composeDocument(maximal, ["title.romaji"], []);
        const second = composeDocument(maximal, ["id"], []);
        expect(first).toContain("title");
        expect(first).toContain("romaji");
        expect(second).toContain("id");
        expect(second).not.toContain("romaji");
    });

    test("keeps the root field's argument list when the operation declares no variables", () => {
        // With no variable declarations, the first paren in the header is the
        // root field's argument list, not a declaration list. It must survive
        // composition verbatim: treating it as declarations would excise the
        // root arguments from the usage scope and strip them from every
        // composed document built from this one.
        const withVariableRef = [
            "query {",
            "  Media (id: $id) {",
            "    id",
            "    title {",
            "      romaji",
            "    }",
            "  }",
            "}",
        ].join("\n");
        expect(composeDocument(withVariableRef, ["title.romaji"], [])).toMatch(
            /Media\s*\(id:\s*\$id\)/
        );

        // Literal arguments (valid GraphQL without declarations) must also
        // survive.
        const withLiteralArgs = withVariableRef.replace("(id: $id)", "(id: 1)");
        expect(composeDocument(withLiteralArgs, ["title.romaji"], [])).toMatch(
            /Media\s*\(id:\s*1\)/
        );
    });

    test("rejects a non-array fields value with a clear message", () => {
        const maximal = [
            "query ($id: Int) { Media (id: $id) {",
            "  id",
            "  title {",
            "    romaji",
            "  }",
            "}",
            "}",
        ].join("\n");
        // A JS caller passing a string would otherwise be rejected with a
        // character-spread "Unknown field(s): i, d" message.
        expect(() => composeDocument(maximal, "id" as unknown as readonly string[], [])).toThrow(
            /must be an array/
        );
    });

    test("structure failures do not claim the request variables are invalid", () => {
        // A document-structure failure (unparseable line, unlocatable root
        // selection) has nothing to do with the caller's variables; the
        // generic `AniLinkValidationError` prefix — "Request variables are
        // invalid" — would send them hunting through variables they never
        // misused. The structure errors carry their own prefix.
        const malformed = ["query { Media (id: $id) {", "  title { romaji }", "}", "}"].join("\n");
        expect(() => composeDocument(malformed, ["title"], [])).toThrow(
            /The GraphQL document is invalid/
        );
        expect(() => composeDocument(malformed, ["title"], [])).not.toThrow(
            /Request variables are invalid/
        );

        const noBraces = "not a graphql document";
        expect(() => composeDocument(noBraces, ["id"], [])).toThrow(
            /The GraphQL document is invalid/
        );
    });

    test("reports an invalid always-selected key as an internal error, not a caller error", () => {
        const maximal = [
            "query ($id: Int) { Media (id: $id) {",
            "  id",
            "  title {",
            "    romaji",
            "  }",
            "}",
            "}",
        ].join("\n");
        // A typo in an operation's always-keys constant is a library bug;
        // the error must say so instead of blaming the caller's fields. It
        // still surfaces as an AniLinkValidationError so the documented
        // `instanceof AniLinkError` classifier catches it.
        expect(() => composeDocument(maximal, ["title.romaji"], ["idma"])).toThrow(
            AniLinkValidationError
        );
        expect(() => composeDocument(maximal, ["title.romaji"], ["idma"])).toThrow(
            /always-selected/
        );
        expect(() => composeDocument(maximal, ["title.romaji"], ["idma"])).toThrow(/library bug/);
        // The prefix must not blame the caller's variables: the detail text
        // exonerates them, so the header contradicting it would misroute
        // triage toward a variables bug.
        expect(() => composeDocument(maximal, ["title.romaji"], ["idma"])).toThrow(
            /The operation's always-selected fields are invalid/
        );
        expect(() => composeDocument(maximal, ["title.romaji"], ["idma"])).not.toThrow(
            /Request variables are invalid/
        );
    });
});
