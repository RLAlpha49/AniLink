import { beforeEach, describe, expect, test, vi } from "vitest";
import { AniLinkAuthError } from "../src/base/AniLinkError";
import { RestOperation, type RestExecuteOptions } from "../src/apis/rest/RestOperation";
import { getAxiosStub, makeAxiosResponseError } from "./helpers/axiosStub";

vi.mock("axios", async () => {
    const { createAxiosStub: build, stashAxiosStub } = await import("./helpers/axiosStub");
    const stub = build({ data: { id: 1, title: "Test Anime" } });
    stashAxiosStub(stub);
    return stub.module;
});

const mocks = getAxiosStub();

/**
 * A concrete REST operation mirroring the shape a future MyAnimeList
 * operation class will take: base URL, path templates, and thin methods over
 * the shared `execute` pipeline.
 */
class TestAnimeOperation extends RestOperation {
    protected readonly baseUrl = "https://api.example.test/v2";

    async getAnime(id: number, options?: RestExecuteOptions): Promise<unknown> {
        return await this.execute(`/anime/${id}`, options);
    }

    async searchAnime(params: Record<string, unknown>): Promise<unknown> {
        return await this.execute("/anime", { method: "GET" }, params);
    }

    async updateListing(id: number, body: object): Promise<unknown> {
        return await this.execute(
            "/anime/{id}/my_list_status",
            { method: "PUT", requiresAuth: true },
            undefined,
            body,
            { id }
        );
    }
}

/** The Axios config captured from the most recent request call. */
interface CapturedAxiosConfig {
    url: string;
    method: string;
    data?: unknown;
    headers: Record<string, string>;
}

const lastConfig = (): CapturedAxiosConfig =>
    mocks.request.mock.calls.at(-1)?.[0] as CapturedAxiosConfig;

beforeEach(() => {
    vi.clearAllMocks();
});

describe("REST transport seam", () => {
    test("a public GET reaches Axios with the full URL and no auth header", async () => {
        const operation = new TestAnimeOperation();

        const result = await operation.getAnime(1);

        expect(result).toEqual({ id: 1, title: "Test Anime" });
        const config = lastConfig();
        expect(config.url).toBe("https://api.example.test/v2/anime/1");
        expect(config.method).toBe("GET");
        expect(config.headers.Authorization).toBeUndefined();
    });

    test("query parameters are appended as an encoded query string", async () => {
        await new TestAnimeOperation().searchAnime({ q: "cowboy bebop", limit: 5 });

        const config = lastConfig();
        expect(config.url).toBe("https://api.example.test/v2/anime?q=cowboy%20bebop&limit=5");
        expect(config.method).toBe("GET");
    });

    test("path placeholders are substituted and percent-encoded", async () => {
        await new TestAnimeOperation().getAnime(42);

        expect(lastConfig().url).toBe("https://api.example.test/v2/anime/42");
    });

    test("PUT sends a JSON body with the substituted path", async () => {
        const operation = new TestAnimeOperation("rest-token");

        await operation.updateListing(7, { status: "watching", score: 9 });

        const config = lastConfig();
        expect(config.url).toBe("https://api.example.test/v2/anime/7/my_list_status");
        expect(config.method).toBe("PUT");
        expect(config.headers["Content-Type"]).toBe("application/json");
        expect(config.headers.Authorization).toBe("Bearer rest-token");
        expect(config.data).toEqual({ status: "watching", score: 9 });
    });

    test("an authenticated call without a token fails fast before any HTTP attempt", async () => {
        const operation = new TestAnimeOperation();

        const outcome = await operation.updateListing(7, { status: "watching" }).then(
            () => null,
            (error: unknown) => error
        );

        expect(outcome).toBeInstanceOf(AniLinkAuthError);
        expect(mocks.request).not.toHaveBeenCalled();
    });

    test("responses are returned verbatim with no GraphQL envelope unwrapping", async () => {
        mocks.request.mockResolvedValueOnce({
            status: 200,
            // A body that would be mangled by single-root-field unwrapping.
            data: { data: { nested: true }, paging: { next: "cursor" } },
        });

        const result = await new TestAnimeOperation().getAnime(1);

        expect(result).toEqual({ data: { nested: true }, paging: { next: "cursor" } });
    });

    test("an HTTP failure surfaces as AniLinkRestError with the upstream status", async () => {
        mocks.request.mockRejectedValueOnce(makeAxiosResponseError(404));

        const outcome = await new TestAnimeOperation().getAnime(999999).then(
            () => null,
            (error: unknown) => error
        );

        expect(outcome).toBeInstanceOf(Error);
        expect((outcome as { status?: number }).status).toBe(404);
        expect((outcome as { name?: string }).name).toBe("AniLinkApiError");
    });
});
