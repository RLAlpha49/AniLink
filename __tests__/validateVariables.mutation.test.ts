import { describe, expect, test } from "vitest";
import { AniLinkValidationError } from "../src/base/AniLinkError";
import { requireVariables, validateVariables } from "../src/base/ValidateVariables";

/**
 * Mutation-killing tests for `validateVariables` and `requireVariables`.
 *
 * Each test pins an observable behaviour that the broader suite only
 * asserted loosely (for example `toThrow(...)` without the message), which
 * let message-formatting and guard-logic mutants survive earlier runs.
 */

const mappings = {
    id: "number",
    name: "string",
    active: "boolean",
    tags: "string[]",
    status: ["COMPLETED", "CURRENT", "PLANNING"],
    startedAt: { year: "number", month: "number", day: "number" },
} as const;

const catchValidation = (run: () => void): AniLinkValidationError => {
    try {
        run();
    } catch (error) {
        return error as AniLinkValidationError;
    }
    throw new Error("expected validateVariables to throw, but it did not");
};

describe("validateVariables error message precision", () => {
    test("primitive mismatches name the variable, the received value, and the expected type", () => {
        const error = catchValidation(() => validateVariables({ id: "nope" }, mappings));
        expect(error.details).toHaveLength(1);
        expect(error.details[0]).toBe("Invalid id: nope. Expected type: number");
    });

    test("boolean mismatches render the received value verbatim", () => {
        const error = catchValidation(() => validateVariables({ active: "yes" }, mappings));
        expect(error.details[0]).toBe("Invalid active: yes. Expected type: boolean");
    });

    test("array mismatches name the expected array type", () => {
        const error = catchValidation(() => validateVariables({ tags: "action" }, mappings));
        expect(error.details[0]).toBe("Invalid tags: action. Expected type: string[]");
    });

    test("array element mismatches report the serialized array value", () => {
        const error = catchValidation(() => validateVariables({ tags: ["action", 42] }, mappings));
        expect(error.details[0]).toBe('Invalid tags: ["action",42]. Expected type: string[]');
    });

    test("allowlist mismatches list the accepted values in declaration order", () => {
        const error = catchValidation(() => validateVariables({ status: "DROPPED" }, mappings));
        expect(error.details[0]).toBe(
            "Invalid status: DROPPED. Expected one of: COMPLETED, CURRENT, PLANNING"
        );
    });

    test("allowlist array mismatches keep the index and the accepted values", () => {
        const error = catchValidation(() =>
            validateVariables({ status: ["COMPLETED", "DROPPED"] }, mappings)
        );
        expect(error.details).toHaveLength(1);
        expect(error.details[0]).toBe(
            "Invalid status[1]: DROPPED. Expected one of: COMPLETED, CURRENT, PLANNING"
        );
    });

    test("object mismatches describe the received value and expect an object", () => {
        const error = catchValidation(() =>
            validateVariables({ startedAt: "not-an-object" }, mappings)
        );
        expect(error.details[0]).toBe("Invalid startedAt: not-an-object. Expected an object.");
    });

    test("null values for object mappings are described as null, not as an object", () => {
        const error = catchValidation(() => validateVariables({ startedAt: null }, mappings));
        expect(error.details[0]).toBe("Invalid startedAt: null. Expected an object.");
    });

    test("nested property mismatches carry the full property path", () => {
        const error = catchValidation(() =>
            validateVariables({ startedAt: { year: "1998", month: 4, day: 3 } }, mappings)
        );
        expect(error.details).toHaveLength(1);
        expect(error.details[0]).toBe("Invalid startedAt.year: 1998. Expected type: number");
    });

    test("nested unknown properties carry the full property path", () => {
        const error = catchValidation(() =>
            validateVariables({ startedAt: { year: 1998, month: 4, dayy: 3 } }, mappings, {
                rejectUnknownKeys: true,
            })
        );
        expect(error.details).toContain("Unknown property: startedAt.dayy");
    });

    test("nested object arrays report the element index in the property path", () => {
        const error = catchValidation(() =>
            validateVariables(
                {
                    startedAt: [
                        { year: 1998, month: 4, day: 3 },
                        { year: "bad", month: 1, day: 1 },
                    ],
                } as unknown as Record<string, unknown>,
                { startedAt: { year: "number", month: "number", day: "number" } } as const
            )
        );
        expect(error.details).toHaveLength(1);
        expect(error.details[0]).toBe("Invalid startedAt[1].year: bad. Expected type: number");
    });
});

describe("requireVariables guard precision", () => {
    test("kind one treats a false or 0 value as set", () => {
        expect(() =>
            requireVariables({ page: 0, asHtml: false }, { kind: "one" }, "needs one")
        ).not.toThrow();
    });

    test("kind all rejects when a listed variable is null", () => {
        expect(() =>
            requireVariables(
                { likeableId: 1, type: null },
                { kind: "all", names: ["likeableId", "type"] },
                "needs both"
            )
        ).toThrow("needs both");
    });

    test("kind all accepts when every listed variable is a non-null falsy value", () => {
        expect(() =>
            requireVariables(
                { page: 0, perPage: 0 },
                { kind: "all", names: ["page", "perPage"] },
                "needs both"
            )
        ).not.toThrow();
    });

    test("kind any rejects when every listed variable is undefined", () => {
        expect(() =>
            requireVariables(
                { id: undefined, activityId: undefined },
                { kind: "any", names: ["id", "activityId"] },
                "needs either"
            )
        ).toThrow("needs either");
    });

    test("kind any accepts a falsy but defined listed variable", () => {
        expect(() =>
            requireVariables(
                { page: 0 },
                { kind: "any", names: ["page", "activityId"] },
                "needs either"
            )
        ).not.toThrow();
    });

    test("kind notOnly rejects when only excluded variables are set", () => {
        expect(() =>
            requireVariables(
                { asHtml: true },
                { kind: "notOnly", names: ["asHtml"] },
                "needs a filter"
            )
        ).toThrow("needs a filter");
    });

    test("kind notOnly rejects when no variable is set at all", () => {
        expect(() =>
            requireVariables({}, { kind: "notOnly", names: ["asHtml"] }, "needs a filter")
        ).toThrow("needs a filter");
    });

    test("kind notOnly rejects when the only set variable is null", () => {
        expect(() =>
            requireVariables(
                { id: null, asHtml: true },
                { kind: "notOnly", names: ["asHtml"] },
                "needs a filter"
            )
        ).toThrow("needs a filter");
    });

    test("kind notOnly accepts when a non-excluded variable is set alongside excluded ones", () => {
        expect(() =>
            requireVariables(
                { id: 1, asHtml: true },
                { kind: "notOnly", names: ["asHtml"] },
                "needs a filter"
            )
        ).not.toThrow();
    });

    test("rejections expose the guard message as the single error detail", () => {
        const error = catchValidation(() =>
            requireVariables({}, { kind: "one" }, "the guard message")
        );
        expect(error).toBeInstanceOf(AniLinkValidationError);
        expect(error.details).toEqual(["the guard message"]);
    });
});
