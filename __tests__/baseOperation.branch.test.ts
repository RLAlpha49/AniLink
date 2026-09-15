/**
 * Branch-coverage tests for {@link BaseOperation} and {@link resolveOperationLabel}.
 *
 * These pin the uncovered branches reported by the lcov: the `token` getter
 * branch where `requestAuth` is a structured `RequestAuthInput` object
 * (not a string), and the `resolveOperationLabel` branch where the constructor
 * name is empty or not a string.
 */
import { describe, expect, test } from "vitest";
import { BaseOperation, mergeOptions, resolveOperationLabel } from "../src/base/BaseOperation";
import type { RequestOptions } from "../src/base/RequestHandler";

/**
 * A concrete subclass used only to exercise the protected `token` getter.
 * `BaseOperation` is abstract, so a minimal subclass exposes the getter.
 */
class TestOperation extends BaseOperation {
    public get exposedToken(): string | undefined {
        return this.token;
    }
}

describe("resolveOperationLabel", () => {
    test("returns the constructor name for a plain object", () => {
        expect(resolveOperationLabel(new TestOperation())).toBe("TestOperation");
    });

    test("returns undefined when the constructor name is an empty string", () => {
        // An object whose constructor name is empty must fall through to the
        // `undefined` return so the auth error keeps its generic message.
        const emptyName = { constructor: { name: "" } };
        expect(resolveOperationLabel(emptyName as object)).toBeUndefined();
    });

    test("returns undefined when the constructor name is not a string", () => {
        // A non-string constructor name (for example a number) must fall through
        // to the `undefined` return instead of returning a non-string label.
        const nonStringName = { constructor: { name: 42 } };
        expect(resolveOperationLabel(nonStringName as object)).toBeUndefined();
    });

    test("returns undefined when the constructor is undefined", () => {
        // `Object.create(null)` has no prototype, so `operation.constructor`
        // is undefined; the optional chain must short-circuit to `undefined`.
        const noConstructor = Object.create(null);
        expect(resolveOperationLabel(noConstructor)).toBeUndefined();
    });
});

describe("BaseOperation token getter", () => {
    test("returns the bearer token when requestAuth is a string", () => {
        const operation = new TestOperation("bearer-token");
        expect(operation.exposedToken).toBe("bearer-token");
    });

    test("returns the structured token when requestAuth is a RequestAuth object", () => {
        // Covers the `this.requestAuth?.token` branch of the getter: a
        // structured RequestAuthInput carries the bearer token on `.token`.
        const operation = new TestOperation({ token: "structured-token" });
        expect(operation.exposedToken).toBe("structured-token");
    });

    test("returns undefined when requestAuth is a RequestAuth object with no token", () => {
        // A structured auth object without a `token` field (for example one
        // carrying only explicit headers) must resolve to `undefined`.
        const operation = new TestOperation({ headers: { "X-API-Key": "key" } });
        expect(operation.exposedToken).toBeUndefined();
    });

    test("returns undefined when no auth material is configured", () => {
        const operation = new TestOperation(undefined, undefined as RequestOptions | undefined);
        expect(operation.exposedToken).toBeUndefined();
    });
});

describe("mergeOptions nested-object deep merge", () => {
    test("a partial per-request retry policy keeps the instance fields it does not mention", () => {
        const base: RequestOptions = {
            timeout: 5_000,
            retry: {
                maxRetries: 3,
                baseDelayMs: 750,
                maxDelayMs: 10_000,
                retryOnStatus: [429, 500],
            },
        };
        const overrides: RequestOptions = { retry: { maxRetries: 0 } };

        const merged = mergeOptions(base, overrides);

        // The override wins for the field it sets; every other nested field
        // keeps the instance value instead of silently falling back to the
        // library defaults.
        expect(merged?.retry).toEqual({
            maxRetries: 0,
            baseDelayMs: 750,
            maxDelayMs: 10_000,
            retryOnStatus: [429, 500],
        });
    });

    test("deep-merges circuitBreaker and retryBudget the same way", () => {
        const base: RequestOptions = {
            circuitBreaker: { threshold: 5, cooldownMs: 30_000 },
            retryBudget: { maxRetriesPerWindow: 10, windowMs: 60_000 },
        };
        const overrides: RequestOptions = {
            circuitBreaker: { threshold: 5, cooldownMs: 1_000 },
            retryBudget: { maxRetriesPerWindow: 2, windowMs: 60_000 },
        };

        const merged = mergeOptions(base, overrides);

        expect(merged?.circuitBreaker).toEqual({ threshold: 5, cooldownMs: 1_000 });
        expect(merged?.retryBudget).toEqual({ maxRetriesPerWindow: 2, windowMs: 60_000 });
    });

    test("retry: false replaces the instance policy entirely (disable is whole-value)", () => {
        const base: RequestOptions = { retry: { maxRetries: 3, baseDelayMs: 750 } };

        const merged = mergeOptions(base, { retry: false });

        expect(merged?.retry).toBe(false);
    });

    test("shallow-merges every other field as before", () => {
        const base: RequestOptions = { timeout: 5_000, signal: undefined };
        const overrides: RequestOptions = { timeout: 1_000 };

        const merged = mergeOptions(base, overrides);

        expect(merged).toEqual({ timeout: 1_000, signal: undefined });
    });

    test("returns the defined input unchanged when only one side exists", () => {
        const base: RequestOptions = { timeout: 5_000 };
        const overrides: RequestOptions = { timeout: 1_000 };

        expect(mergeOptions(base, undefined)).toBe(base);
        expect(mergeOptions(undefined, overrides)).toBe(overrides);
    });
});
