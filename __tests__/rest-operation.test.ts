import { describe, expect, test } from "vitest";
import { AniLinkRestError } from "../src/base/AniLinkError";
import { buildQueryString } from "../src/apis/rest/RestOperation";

describe("buildQueryString", () => {
    test("returns an empty string for an empty record", () => {
        expect(buildQueryString({})).toBe("");
    });

    test("encodes single parameters with a leading question mark", () => {
        expect(buildQueryString({ q: "cowboy bebop", limit: 5 })).toBe("?q=cowboy%20bebop&limit=5");
    });

    test("skips undefined and null values entirely", () => {
        expect(buildQueryString({ a: 1, b: undefined, c: null, d: "x" })).toBe("?a=1&d=x");
    });

    test("expands arrays into repeated keys", () => {
        expect(buildQueryString({ genres: [1, 2], q: "x" })).toBe("?genres=1&genres=2&q=x");
    });

    test("percent-encodes keys and values", () => {
        expect(buildQueryString({ "a key": "a&value" })).toBe("?a%20key=a%26value");
    });
});

describe("AniLinkRestError", () => {
    test("is an AniLinkApiError carrying status and data", () => {
        const error = new AniLinkRestError(404, { message: "not found" });
        expect(error.status).toBe(404);
        expect(error.data).toEqual({ message: "not found" });
        expect(error.code).toBe("API_ERROR");
        expect(error.name).toBe("AniLinkApiError");
        expect(error).toBeInstanceOf(AniLinkRestError);
    });
});
