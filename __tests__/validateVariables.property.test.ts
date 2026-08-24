/**
 * Property-based tests for `validateVariables` invariants.
 *
 * These suites complement the example-based tests in `validateVariables.test.ts`
 * by exercising whole input classes with `fast-check`: primitive/array/allowlist/
 * nested-object dispatch, unknown-key rejection, and error aggregation. They
 * prove the validator throws precisely when a value violates its mapping and
 * collects every offending path into `AniLinkValidationError.details`.
 */
import { describe, expect, test } from "vitest";
import fc from "fast-check";
import { AniLinkValidationError } from "../src/base/AniLinkError";
import { validateVariables } from "../src/base/ValidateVariables";

/** Shared mapping fixture mirroring the example-based suite. */
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

/** Capture a thrown validation error or return `undefined` when none is thrown. */
function catchValidation(fn: () => void): AniLinkValidationError | undefined {
    try {
        fn();
        return undefined;
    } catch (error) {
        if (error instanceof AniLinkValidationError) return error;
        throw error;
    }
}

/**
 * Names inherited from `Object.prototype`. The validator resolves expected
 * types with plain property access (`mapping[prop]`), so a value key that
 * collides with one of these is matched against an inherited function rather
 * than `undefined` and is therefore outside the unknown-key contract. Property
 * tests for unknown keys avoid these names so they exercise the documented
 * behaviour, not the prototype-resolution quirk.
 */
const PROTOTYPE_KEYS = new Set<string>(Object.getOwnPropertyNames(Object.prototype));

/** Arbitrary for a string key that is not an `Object.prototype` member. */
const nonPrototypeKey = fc.string({ minLength: 1 }).filter((key) => !PROTOTYPE_KEYS.has(key));

/** Keys declared by the shared `mappings` fixture. */
const MAPPING_KEYS = new Set<string>(Object.keys(mappings));

/** Arbitrary for a key that is neither an `Object.prototype` member nor a fixture key. */
const unknownKey = nonPrototypeKey.filter((key) => !MAPPING_KEYS.has(key));

describe("validateVariables (property-based)", () => {
    describe("primitive mappings", () => {
        test("accepts any value whose typeof matches the primitive mapping", () => {
            fc.assert(
                fc.property(fc.oneof(fc.string(), fc.integer(), fc.boolean()), (value) => {
                    const mapping = { v: typeof value as "string" | "number" | "boolean" };
                    expect(() => validateVariables({ v: value }, mapping)).not.toThrow();
                }),
                { numRuns: 200 }
            );
        });

        test("rejects any value whose typeof differs from the primitive mapping", () => {
            fc.assert(
                fc.property(
                    fc.constantFrom("string", "number", "boolean"),
                    fc.oneof(
                        fc.string(),
                        fc.integer(),
                        fc.boolean(),
                        fc.double(),
                        fc.constant(null)
                    ),
                    (expected, value) => {
                        fc.pre(typeof value !== expected);
                        const error = catchValidation(() =>
                            validateVariables({ v: value }, { v: expected })
                        );
                        expect(error).toBeInstanceOf(AniLinkValidationError);
                        expect(error!.details).toHaveLength(1);
                        expect(error!.details[0]).toContain("Invalid v");
                        expect(error!.details[0]).toContain(`Expected type: ${expected}`);
                    }
                ),
                { numRuns: 200 }
            );
        });
    });

    describe("array mappings", () => {
        test("accepts arrays where every element matches the declared element type", () => {
            fc.assert(
                fc.property(
                    fc.constantFrom("string", "number", "boolean"),
                    fc.array(fc.anything()),
                    (elementType, raw) => {
                        const value = raw.map((item) => {
                            if (elementType === "string") return String(item);
                            if (elementType === "number") return Number(item);
                            return Boolean(item);
                        });
                        const mapping = { v: `${elementType}[]` as const };
                        expect(() => validateVariables({ v: value }, mapping)).not.toThrow();
                    }
                ),
                { numRuns: 200 }
            );
        });

        test("rejects non-arrays for an array mapping", () => {
            fc.assert(
                fc.property(
                    fc.constantFrom("string", "number", "boolean"),
                    fc.oneof(
                        fc.string(),
                        fc.integer(),
                        fc.boolean(),
                        fc.double(),
                        fc.constant(null)
                    ),
                    (elementType, value) => {
                        fc.pre(!Array.isArray(value));
                        const mapping = { v: `${elementType}[]` as const };
                        const error = catchValidation(() =>
                            validateVariables({ v: value }, mapping)
                        );
                        expect(error).toBeInstanceOf(AniLinkValidationError);
                        expect(error!.details[0]).toContain("Invalid v");
                        expect(error!.details[0]).toContain(`Expected type: ${elementType}[]`);
                    }
                ),
                { numRuns: 200 }
            );
        });

        test("rejects arrays containing at least one element of the wrong type", () => {
            fc.assert(
                fc.property(
                    fc.constantFrom("string", "number", "boolean"),
                    fc.array(fc.oneof(fc.string(), fc.integer(), fc.boolean()), { minLength: 1 }),
                    fc.nat(),
                    (elementType, raw, badIndex) => {
                        const value = raw.map((item) => {
                            if (elementType === "string") return String(item);
                            if (elementType === "number") return Number(item);
                            return Boolean(item);
                        });
                        const index = badIndex % value.length;
                        // Inject a value whose type differs from the element type.
                        value[index] =
                            elementType === "string" ? 42 : elementType === "number" ? "x" : 42;
                        fc.pre(typeof value[index] !== elementType);
                        const mapping = { v: `${elementType}[]` as const };
                        const error = catchValidation(() =>
                            validateVariables({ v: value }, mapping)
                        );
                        expect(error).toBeInstanceOf(AniLinkValidationError);
                        expect(error!.details[0]).toContain("Invalid v");
                        expect(error!.details[0]).toContain(`Expected type: ${elementType}[]`);
                    }
                ),
                { numRuns: 200 }
            );
        });
    });

    describe("allowlist mappings", () => {
        test("accepts any single value drawn from the allowlist", () => {
            fc.assert(
                fc.property(
                    fc.uniqueArray(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 8 }),
                    fc.nat(),
                    (allowlist, index) => {
                        const value = allowlist[index % allowlist.length];
                        const mapping = { v: [...allowlist] as readonly string[] };
                        expect(() => validateVariables({ v: value }, mapping)).not.toThrow();
                    }
                ),
                { numRuns: 200 }
            );
        });

        test("accepts arrays whose every element is drawn from the allowlist", () => {
            fc.assert(
                fc.property(
                    fc.uniqueArray(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 8 }),
                    fc.array(fc.nat(), { maxLength: 10 }),
                    (allowlist, indices) => {
                        const value = indices.map((i) => allowlist[i % allowlist.length]);
                        const mapping = { v: [...allowlist] as readonly string[] };
                        expect(() => validateVariables({ v: value }, mapping)).not.toThrow();
                    }
                ),
                { numRuns: 200 }
            );
        });

        test("rejects a scalar value outside the allowlist", () => {
            fc.assert(
                fc.property(
                    fc.uniqueArray(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 8 }),
                    fc.string({ minLength: 1 }),
                    (allowlist, value) => {
                        fc.pre(!allowlist.includes(value));
                        const mapping = { v: [...allowlist] as readonly string[] };
                        const error = catchValidation(() =>
                            validateVariables({ v: value }, mapping)
                        );
                        expect(error).toBeInstanceOf(AniLinkValidationError);
                        expect(error!.details[0]).toContain("Invalid v");
                        expect(error!.details[0]).toContain("Expected one of:");
                    }
                ),
                { numRuns: 200 }
            );
        });

        test("reports the index of each invalid array element outside the allowlist", () => {
            fc.assert(
                fc.property(
                    fc.uniqueArray(fc.string({ minLength: 1 }), { minLength: 2, maxLength: 6 }),
                    fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 6 }),
                    (allowlist, raw) => {
                        const badIndices: number[] = [];
                        const value = raw.map((item, i) => {
                            if (allowlist.includes(item)) return item;
                            badIndices.push(i);
                            return item;
                        });
                        fc.pre(badIndices.length > 0);
                        const mapping = { v: [...allowlist] as readonly string[] };
                        const error = catchValidation(() =>
                            validateVariables({ v: value }, mapping)
                        );
                        expect(error).toBeInstanceOf(AniLinkValidationError);
                        expect(error!.details).toHaveLength(badIndices.length);
                        badIndices.forEach((idx, n) => {
                            expect(error!.details[n]).toContain(`v[${idx}]`);
                        });
                    }
                ),
                { numRuns: 200 }
            );
        });
    });

    describe("nested object mappings", () => {
        const dateMapping = { year: "number", month: "number", day: "number" } as const;

        test("accepts a nested object whose every property matches its primitive mapping", () => {
            fc.assert(
                fc.property(fc.integer(), fc.integer(), fc.integer(), (year, month, day) => {
                    expect(() =>
                        validateVariables(
                            { startedAt: { year, month, day } },
                            { startedAt: dateMapping }
                        )
                    ).not.toThrow();
                }),
                { numRuns: 200 }
            );
        });

        test("rejects a nested object when any property has the wrong primitive type", () => {
            fc.assert(
                fc.property(
                    fc.constantFrom("year", "month", "day"),
                    fc.oneof(fc.string(), fc.boolean(), fc.constant(null)),
                    (badKey, badValue) => {
                        const value = { year: 1998, month: 4, day: 3, [badKey]: badValue };
                        const error = catchValidation(() =>
                            validateVariables({ startedAt: value }, { startedAt: dateMapping })
                        );
                        expect(error).toBeInstanceOf(AniLinkValidationError);
                        expect(error!.details[0]).toContain(`startedAt.${badKey}`);
                        expect(error!.details[0]).toContain("Expected type: number");
                    }
                ),
                { numRuns: 200 }
            );
        });

        test("rejects a non-object value for an object mapping", () => {
            fc.assert(
                fc.property(
                    fc.oneof(fc.string(), fc.integer(), fc.boolean(), fc.constant(null)),
                    (value) => {
                        fc.pre(typeof value !== "object" || value === null);
                        const error = catchValidation(() =>
                            validateVariables({ startedAt: value }, { startedAt: dateMapping })
                        );
                        expect(error).toBeInstanceOf(AniLinkValidationError);
                        expect(error!.details[0]).toContain("Invalid startedAt");
                        expect(error!.details[0]).toContain("Expected an object.");
                    }
                ),
                { numRuns: 200 }
            );
        });

        test("accepts an array of nested objects all matching the mapping", () => {
            fc.assert(
                fc.property(
                    fc.array(
                        fc.record({ year: fc.integer(), month: fc.integer(), day: fc.integer() }),
                        { maxLength: 5 }
                    ),
                    (dates) => {
                        expect(() =>
                            validateVariables({ dates }, { dates: dateMapping })
                        ).not.toThrow();
                    }
                ),
                { numRuns: 200 }
            );
        });
    });

    describe("unknown keys", () => {
        test("rejects every unknown top-level variable under strict mode", () => {
            fc.assert(
                fc.property(
                    fc.uniqueArray(unknownKey, { minLength: 1, maxLength: 6 }),
                    (unknownKeys) => {
                        const variables = Object.fromEntries(unknownKeys.map((k) => [k, 1]));
                        const error = catchValidation(() =>
                            validateVariables(variables, mappings, { rejectUnknownKeys: true })
                        );
                        expect(error).toBeInstanceOf(AniLinkValidationError);
                        expect(error!.details).toHaveLength(unknownKeys.length);
                        for (const key of unknownKeys) {
                            expect(error!.details).toContain(`Unknown variable: ${key}`);
                        }
                    }
                ),
                { numRuns: 200 }
            );
        });

        test("ignores every unknown top-level variable when rejectUnknownKeys is false", () => {
            fc.assert(
                fc.property(
                    fc.uniqueArray(unknownKey, { minLength: 1, maxLength: 6 }),
                    (unknownKeys) => {
                        const variables = Object.fromEntries(unknownKeys.map((k) => [k, 1]));
                        expect(() =>
                            validateVariables(variables, mappings, { rejectUnknownKeys: false })
                        ).not.toThrow();
                    }
                ),
                { numRuns: 200 }
            );
        });

        test("rejects unknown nested properties under strict mode", () => {
            fc.assert(
                fc.property(
                    fc.uniqueArray(nonPrototypeKey, { minLength: 1, maxLength: 4 }),
                    (unknownProps) => {
                        const nested: Record<string, unknown> = { year: 1998, month: 4, day: 3 };
                        for (const p of unknownProps) nested[p] = 1;
                        const error = catchValidation(() =>
                            validateVariables({ startedAt: nested }, mappings, {
                                rejectUnknownKeys: true,
                            })
                        );
                        expect(error).toBeInstanceOf(AniLinkValidationError);
                        for (const p of unknownProps) {
                            expect(error!.details).toContain(`Unknown property: startedAt.${p}`);
                        }
                    }
                ),
                { numRuns: 200 }
            );
        });
    });

    describe("error aggregation", () => {
        test("collects one detail per offending variable and embeds each in the message", () => {
            fc.assert(
                fc.property(
                    fc.uniqueArray(fc.constantFrom("id", "name", "active", "status"), {
                        minLength: 1,
                        maxLength: 4,
                    }),
                    (badKeys) => {
                        const badValues: Record<string, unknown> = {
                            id: "not-a-number",
                            name: 42,
                            active: "not-a-boolean",
                            status: "DROPPED",
                        };
                        const variables = Object.fromEntries(badKeys.map((k) => [k, badValues[k]]));
                        const error = catchValidation(() => validateVariables(variables, mappings));
                        expect(error).toBeInstanceOf(AniLinkValidationError);
                        expect(error!.details).toHaveLength(badKeys.length);
                        for (const detail of error!.details) {
                            expect(error!.message).toContain(detail);
                        }
                        expect(error!.message).toContain("AniList request variables are invalid:");
                    }
                ),
                { numRuns: 200 }
            );
        });

        test("treats an empty variables object as a valid no-op regardless of strictness", () => {
            fc.assert(
                fc.property(fc.boolean(), (strict) => {
                    expect(() =>
                        validateVariables({}, mappings, { rejectUnknownKeys: strict })
                    ).not.toThrow();
                }),
                { numRuns: 50 }
            );
        });
    });
});
