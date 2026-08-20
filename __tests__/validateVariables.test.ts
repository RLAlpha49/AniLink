import { describe, expect, test } from "vitest";
import { AniLinkValidationError } from "../src/base/AniLinkError";
import { validateVariables } from "../src/base/ValidateVariables";

const mappings = {
    id: "number",
    name: "string",
    active: "boolean",
    tags: "string[]",
    scores: "number[]",
    status: ["COMPLETED", "CURRENT", "PLANNING"],
    sort: ["ID", "ID_DESC"],
    startedAt: { year: "number", month: "number", day: "number" },
} as const;

describe("validateVariables", () => {
    test("accepts valid primitive values", () => {
        expect(() =>
            validateVariables({ id: 1, name: "Cowboy Bebop", active: true }, mappings)
        ).not.toThrow();
    });

    test("treats an empty variables object as a valid no-op", () => {
        expect(() => validateVariables({}, mappings)).not.toThrow();
    });

    test("ignores unknown variables", () => {
        expect(() => validateVariables({ id: 1, unknownField: "ignored" }, mappings)).not.toThrow();
    });

    test("rejects a primitive with the wrong type", () => {
        expect(() => validateVariables({ id: "not-a-number" }, mappings)).toThrow(
            AniLinkValidationError
        );
    });

    test("throws AniLinkValidationError with a stable code and details", () => {
        let caught: unknown;
        try {
            validateVariables({ id: "nope" }, mappings);
        } catch (error) {
            caught = error;
        }

        expect(caught).toBeInstanceOf(AniLinkValidationError);
        expect(caught).toMatchObject({ name: "AniLinkValidationError", code: "VALIDATION_ERROR" });
        expect((caught as AniLinkValidationError).details).toHaveLength(1);
        expect((caught as AniLinkValidationError).details[0]).toContain("id");
    });

    test("collects every invalid variable into details", () => {
        let caught: unknown;
        try {
            validateVariables({ id: "nope", name: 42 }, mappings);
        } catch (error) {
            caught = error;
        }

        expect(caught).toBeInstanceOf(AniLinkValidationError);
        expect((caught as AniLinkValidationError).details).toHaveLength(2);
    });

    test("accepts an array of the expected element type", () => {
        expect(() => validateVariables({ tags: ["action", "sci-fi"] }, mappings)).not.toThrow();
    });

    test("rejects an array with a wrong element type", () => {
        expect(() => validateVariables({ tags: ["action", 42] }, mappings)).toThrow(
            AniLinkValidationError
        );
    });

    test("rejects a non-array value for an array type", () => {
        expect(() => validateVariables({ tags: "action" }, mappings)).toThrow(
            AniLinkValidationError
        );
    });

    test("accepts a value from the allowlist", () => {
        expect(() => validateVariables({ status: "COMPLETED" }, mappings)).not.toThrow();
    });

    test("rejects a value outside the allowlist", () => {
        expect(() => validateVariables({ status: "DROPPED" }, mappings)).toThrow(
            AniLinkValidationError
        );
    });

    test("accepts an array of allowlisted values", () => {
        expect(() => validateVariables({ sort: ["ID", "ID_DESC"] }, mappings)).not.toThrow();
    });

    test("rejects an array containing a value outside the allowlist", () => {
        expect(() => validateVariables({ sort: ["ID", "NOPE"] }, mappings)).toThrow(
            AniLinkValidationError
        );
    });

    test("accepts a nested object mapping", () => {
        expect(() =>
            validateVariables({ startedAt: { year: 1998, month: 4, day: 3 } }, mappings)
        ).not.toThrow();
    });

    test("rejects a nested object with an invalid property", () => {
        expect(() =>
            validateVariables({ startedAt: { year: "1998", month: 4, day: 3 } }, mappings)
        ).toThrow(AniLinkValidationError);
    });

    test("accepts an array of nested objects", () => {
        const listMappings = {
            dates: { year: "number", month: "number", day: "number" },
        } as const;

        expect(() =>
            validateVariables(
                {
                    dates: [
                        { year: 1998, month: 4, day: 3 },
                        { year: 2001, month: 1, day: 1 },
                    ],
                },
                listMappings
            )
        ).not.toThrow();
    });

    test("rejects a nested object array with an invalid element", () => {
        const listMappings = {
            dates: { year: "number", month: "number", day: "number" },
        } as const;

        expect(() =>
            validateVariables(
                {
                    dates: [
                        { year: 1998, month: 4, day: 3 },
                        { year: "bad", month: 1, day: 1 },
                    ],
                },
                listMappings
            )
        ).toThrow(AniLinkValidationError);
    });

    test("rejects a non-object value for an object mapping", () => {
        expect(() => validateVariables({ startedAt: "not-an-object" }, mappings)).toThrow(
            AniLinkValidationError
        );
    });
});
