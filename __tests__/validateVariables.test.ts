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

    test("rejects unknown variables by default", () => {
        let caught: unknown;
        try {
            validateVariables({ id: 1, unknownField: "ignored" }, mappings);
        } catch (error) {
            caught = error;
        }

        const validationError = caught as AniLinkValidationError;
        expect(validationError).toBeInstanceOf(AniLinkValidationError);
        expect(validationError.details).toContain("Unknown variable: unknownField");
    });

    test("rejects a primitive with the wrong type", () => {
        expect(() => validateVariables({ id: "not-a-number" }, mappings)).toThrow(
            AniLinkValidationError
        );
    });

    test("reports circular invalid values without failing while formatting the error", () => {
        const circular: Record<string, unknown> = {};
        circular.self = circular;

        expect(() => validateVariables({ id: circular }, mappings)).toThrow("[object]");
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

    test("aggregates every problem into the error message", () => {
        let caught: unknown;
        try {
            validateVariables({ id: "nope", name: 42, status: "DROPPED" }, mappings);
        } catch (error) {
            caught = error;
        }

        const validationError = caught as AniLinkValidationError;
        expect(validationError).toBeInstanceOf(AniLinkValidationError);
        expect(validationError.details).toHaveLength(3);
        expect(validationError.message).toContain("Request variables are invalid:");
        for (const detail of validationError.details) {
            expect(validationError.message).toContain(detail);
        }
    });

    test("reports the index of each invalid enum-array element", () => {
        let caught: unknown;
        try {
            validateVariables({ sort: ["ID", "NOPE", "ALSO_BAD"] }, mappings);
        } catch (error) {
            caught = error;
        }

        const validationError = caught as AniLinkValidationError;
        expect(validationError.details).toHaveLength(2);
        expect(validationError.details[0]).toContain("sort[1]");
        expect(validationError.details[0]).toContain("Expected one of: ID, ID_DESC");
        expect(validationError.details[1]).toContain("sort[2]");
    });

    describe("strict mode", () => {
        test("rejects an unknown top-level variable", () => {
            let caught: unknown;
            try {
                validateVariables({ id: 1, progressVolmes: 3 }, mappings, {
                    rejectUnknownKeys: true,
                });
            } catch (error) {
                caught = error;
            }

            const validationError = caught as AniLinkValidationError;
            expect(validationError).toBeInstanceOf(AniLinkValidationError);
            expect(validationError.details).toContain("Unknown variable: progressVolmes");
            expect(validationError.message).toContain("Unknown variable: progressVolmes");
        });

        test("reports every unknown variable together", () => {
            let caught: unknown;
            try {
                validateVariables({ typoOne: 1, typoTwo: 2 }, mappings, {
                    rejectUnknownKeys: true,
                });
            } catch (error) {
                caught = error;
            }

            const validationError = caught as AniLinkValidationError;
            expect(validationError.details).toHaveLength(2);
            expect(validationError.details).toContain("Unknown variable: typoOne");
            expect(validationError.details).toContain("Unknown variable: typoTwo");
        });

        test("still validates known keys while rejecting unknown ones", () => {
            let caught: unknown;
            try {
                validateVariables({ id: "nope", typoKey: 1 }, mappings, {
                    rejectUnknownKeys: true,
                });
            } catch (error) {
                caught = error;
            }

            const validationError = caught as AniLinkValidationError;
            expect(validationError.details).toHaveLength(2);
            expect(validationError.details[0]).toContain("Invalid id");
            expect(validationError.details[1]).toBe("Unknown variable: typoKey");
        });

        test("accepts all-valid keys under strict mode", () => {
            expect(() =>
                validateVariables({ id: 1, status: "COMPLETED" }, mappings, {
                    rejectUnknownKeys: true,
                })
            ).not.toThrow();
        });

        test("rejects an unknown property of a nested object", () => {
            let caught: unknown;
            try {
                validateVariables({ startedAt: { year: 1998, month: 4, dayy: 3 } }, mappings, {
                    rejectUnknownKeys: true,
                });
            } catch (error) {
                caught = error;
            }

            const validationError = caught as AniLinkValidationError;
            expect(validationError).toBeInstanceOf(AniLinkValidationError);
            expect(validationError.details).toContain("Unknown property: startedAt.dayy");
        });

        test("ignores an unknown nested property when rejectUnknownKeys is false", () => {
            expect(() =>
                validateVariables({ startedAt: { year: 1998, month: 4, dayy: 3 } }, mappings, {
                    rejectUnknownKeys: false,
                })
            ).not.toThrow();
        });

        test("stays lenient when rejectUnknownKeys is explicitly false", () => {
            expect(() =>
                validateVariables({ id: 1, unknownField: "ignored" }, mappings, {
                    rejectUnknownKeys: false,
                })
            ).not.toThrow();
        });
    });

    test("redacts values whose key looks like credential material", () => {
        let caught: unknown;
        try {
            validateVariables({ clientSecret: "hunter2-value" }, { clientSecret: "number" });
        } catch (error) {
            caught = error;
        }

        const validationError = caught as AniLinkValidationError;
        expect(validationError.details[0]).toContain("[REDACTED]");
        expect(validationError.details[0]).not.toContain("hunter2-value");
    });

    test("redacts allowlist array items whose path looks like credential material", () => {
        let caught: unknown;
        try {
            validateVariables(
                { apiTokens: ["token-a", "wrong"] },
                { apiTokens: ["token-a", "token-b"] }
            );
        } catch (error) {
            caught = error;
        }

        const validationError = caught as AniLinkValidationError;
        expect(validationError.details[0]).toContain("[REDACTED]");
        expect(validationError.details[0]).not.toContain("wrong");
        // The offending index is still reported.
        expect(validationError.details[0]).toContain("apiTokens[1]");
    });

    test("redacts nested credential-shaped keys when the parent path is not sensitive", () => {
        let caught: unknown;
        try {
            validateVariables({ settings: { apiToken: "hunter2-value" } }, { settings: "number" });
        } catch (error) {
            caught = error;
        }

        const validationError = caught as AniLinkValidationError;
        expect(validationError.details[0]).toContain("[REDACTED]");
        expect(validationError.details[0]).not.toContain("hunter2-value");
    });

    test("redacts credential-shaped keys inside array elements under a non-sensitive path", () => {
        let caught: unknown;
        try {
            validateVariables({ pages: [{ apiKey: "key-value" }] }, { pages: "number" });
        } catch (error) {
            caught = error;
        }

        const validationError = caught as AniLinkValidationError;
        expect(validationError.details[0]).toContain("[REDACTED]");
        expect(validationError.details[0]).not.toContain("key-value");
    });

    test("redacts credential-shaped keys on class instances under a non-sensitive path", () => {
        // A class instance is not a plain object, but JSON.stringify still
        // renders its own enumerable properties — the credential must be
        // redacted through that path too.
        class Settings {
            apiKey = "instance-secret-value";
            name = "x";
        }
        let caught: unknown;
        try {
            validateVariables({ settings: new Settings() }, { settings: "number" });
        } catch (error) {
            caught = error;
        }

        const validationError = caught as AniLinkValidationError;
        expect(validationError.details[0]).toContain("[REDACTED]");
        expect(validationError.details[0]).not.toContain("instance-secret-value");
    });

    test("redacts credential-shaped keys on class instances inside arrays", () => {
        class Item {
            clientSecret = "array-instance-secret";
        }
        let caught: unknown;
        try {
            validateVariables({ items: [new Item()] }, { items: "number" });
        } catch (error) {
            caught = error;
        }

        const validationError = caught as AniLinkValidationError;
        expect(validationError.details[0]).toContain("[REDACTED]");
        expect(validationError.details[0]).not.toContain("array-instance-secret");
    });

    test("redacts values under session, passphrase, and otp keys", () => {
        const cases: [string, unknown][] = [
            ["sessionId", "session-secret-value"],
            ["passphrase", "passphrase-secret-value"],
            ["otpCode", "otp-secret-value"],
        ];
        for (const [key, value] of cases) {
            let caught: unknown;
            try {
                validateVariables({ [key]: value }, { [key]: "number" });
            } catch (error) {
                caught = error;
            }

            const validationError = caught as AniLinkValidationError;
            expect(validationError.details[0]).toContain("[REDACTED]");
            expect(validationError.details[0]).not.toContain(String(value));
        }
    });

    test("does not redact real AniList variable names that merely contain pattern fragments", () => {
        // `pinned` (ToggleActivityPin) and `private` (SaveMediaListEntry) are
        // real AniList variables; the redaction pattern must not swallow
        // their values in validation errors.
        let caught: unknown;
        try {
            validateVariables({ pinned: true, private: true }, { pinned: "number" });
        } catch (error) {
            caught = error;
        }

        const validationError = caught as AniLinkValidationError;
        expect(validationError.details[0]).toContain("true");
    });
});
