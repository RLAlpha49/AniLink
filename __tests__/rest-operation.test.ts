import { beforeEach, describe, expect, test, vi } from "vitest";
import { AniLinkRestError, AniLinkValidationError } from "../src/base/AniLinkError";
import {
    RestOperation,
    buildQueryString,
    type RestExecuteOptions,
} from "../src/apis/rest/RestOperation";
import { getAxiosStub } from "./helpers/axiosStub";

vi.mock("axios", async () => {
    const { createAxiosStub: build, stashAxiosStub } = await import("./helpers/axiosStub");
    const stub = build({ data: { id: 1, title: "Test Anime" } });
    stashAxiosStub(stub);
    return stub.module;
});

const mocks = getAxiosStub();

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
        expect(error.code).toBe("REST_ERROR");
        expect(error.name).toBe("AniLinkRestError");
        expect(error).toBeInstanceOf(AniLinkRestError);
    });
});

/**
 * A concrete REST operation exposing the protected `execute` pipeline so
 * the missing-path-parameter contract can be driven directly.
 */
class GetAnimeOperation extends RestOperation {
    protected readonly baseUrl = "https://api.example.test/v2";

    /** Test-only exposure of the protected pipeline. */
    async executePublic(path: string, options?: RestExecuteOptions): Promise<unknown> {
        return await this.execute(path, options);
    }
}

describe("RestOperation path placeholder validation", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test("throws AniLinkValidationError naming the placeholder and operation before any request", async () => {
        const operation = new GetAnimeOperation();

        const outcome = await operation.executePublic("/anime/{id}").then(
            () => null,
            (error: unknown) => error
        );

        expect(outcome).toBeInstanceOf(AniLinkValidationError);
        const error = outcome as AniLinkValidationError;
        expect(error.details).toEqual([
            "Missing path parameter: id",
            "Operation: GetAnimeOperation",
        ]);
        expect(error.message).toContain("Missing path parameter: id");
        expect(error.message).toContain("Operation: GetAnimeOperation");
        // The placeholder is caught before the URL is assembled, so no HTTP
        // request may have been dispatched.
        expect(mocks.request).not.toHaveBeenCalled();
    });

    test("omits the operation detail when no label is available", async () => {
        // An anonymous class expression has no inferred constructor name, so
        // resolveOperationLabel returns undefined and the error keeps only
        // the missing-parameter detail.
        const operation = new (class extends GetAnimeOperation {})();

        const outcome = await operation.executePublic("/anime/{id}").then(
            () => null,
            (error: unknown) => error
        );

        expect(outcome).toBeInstanceOf(AniLinkValidationError);
        expect((outcome as AniLinkValidationError).details).toEqual(["Missing path parameter: id"]);
        expect(mocks.request).not.toHaveBeenCalled();
    });
});
