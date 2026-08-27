import { beforeEach, describe, expect, test, vi } from "vitest";
import {
    AniLinkApiError,
    AniLinkAuthError,
    AniLinkErrorCodes,
    AniLinkGraphQLError,
    AniLinkNetworkError,
} from "../src/base/AniLinkError";
import { ANILIST_GRAPHQL_URL } from "../src/apis/graphql/anilist/AniListOperation";
import { AniLink } from "../src/AniLink";
import { getAxiosStub, makeAxiosResponseError } from "./helpers/axiosStub";

/**
 * Real wiring-to-Axios seam suite.
 *
 * Unlike the facade suites (which replace `sendRequest` wholesale through
 * `helpers/mockRequestHandler`) and the transport suites (which call
 * `sendRequest` directly), this file drives the real composition —
 * {@link AniLink} → operation classes → `sendRequest` → the shared Axios instance —
 * with only axios itself doubled. Header construction, envelope unwrapping,
 * and error normalization are therefore exercised exactly as production wires
 * them, without needing a live token.
 */

vi.mock("axios", async () => {
    const { createAxiosStub: build, stashAxiosStub } = await import("./helpers/axiosStub");
    const stub = build();
    stashAxiosStub(stub);
    return stub.module;
});

const mocks = getAxiosStub();

/** The outgoing request body of the single call each test inspects. */
let sentBody: { query?: string; variables?: unknown } | undefined;

/** The Axios config captured from the most recent request call. */
interface CapturedAxiosConfig {
    url: string;
    method: string;
    data?: { query?: string; variables?: unknown };
    headers: Record<string, string>;
    timeout?: number;
}

const lastConfig = (): CapturedAxiosConfig =>
    mocks.request.mock.calls.at(-1)?.[0] as CapturedAxiosConfig;

beforeEach(() => {
    vi.clearAllMocks();
    sentBody = undefined;
    mocks.request.mockImplementation(async (config: { data?: unknown }) => {
        sentBody = config.data as typeof sentBody;
        return {
            status: 200,
            data: { data: { Media: { id: 1 } } },
        };
    });
});

describe("facade-to-Axios seam", () => {
    test("a public query reaches Axios unauthenticated and unwraps the root field", async () => {
        const client = new AniLink();

        const media = await client.anilist.query.media({ id: 1, type: "ANIME" });

        expect(media).toEqual({ id: 1 });
        expect(mocks.request).toHaveBeenCalledTimes(1);

        const config = lastConfig();
        expect(config.url).toBe(ANILIST_GRAPHQL_URL);
        expect(config.method).toBe("POST");
        expect(config.headers["Content-Type"]).toBe("application/json");
        expect(config.headers.Accept).toBe("application/json");
        expect(config.headers.Authorization).toBeUndefined();
        expect(sentBody?.query).toContain("query");
        expect(sentBody?.variables).toEqual({ id: 1, type: "ANIME" });
        expect(typeof config.timeout).toBe("number");
    });

    test("an authenticated mutation forwards the bearer token and typed variables", async () => {
        const client = new AniLink("seam-token");

        await client.anilist.mutation.updateUser({ about: "seam" });

        const config = lastConfig();
        expect(config.headers.Authorization).toBe("Bearer seam-token");
        expect(sentBody?.query).toContain("mutation");
        expect(sentBody?.variables).toEqual({ about: "seam" });
    });

    test("an HTTP failure response surfaces as AniLinkApiError with the upstream status", async () => {
        mocks.request.mockRejectedValueOnce(makeAxiosResponseError(500));

        const outcome = await new AniLink().anilist.query.media({ id: 1 }, { retry: false }).then(
            () => null,
            (error: unknown) => error
        );

        expect(outcome).toBeInstanceOf(AniLinkApiError);
        expect((outcome as AniLinkApiError).status).toBe(500);
        expect((outcome as AniLinkApiError).code).toBe(AniLinkErrorCodes.API);
    });

    test("an HTTP 200 GraphQL-errors envelope surfaces as AniLinkGraphQLError", async () => {
        mocks.request.mockResolvedValueOnce({
            status: 200,
            data: { data: null, errors: [{ message: "Not Found.", status: 404 }] },
        });

        const outcome = await new AniLink().anilist.query.media({ id: 999999999 }).then(
            () => null,
            (error: unknown) => error
        );

        expect(outcome).toBeInstanceOf(AniLinkGraphQLError);
        expect((outcome as AniLinkGraphQLError).graphqlErrors).toEqual([
            { message: "Not Found.", status: 404 },
        ]);
    });

    test("a transport-level crash surfaces as AniLinkNetworkError", async () => {
        // Real connection failures arrive as axios errors without a response;
        // a plain Error would be classified as UNKNOWN by design.
        mocks.request.mockRejectedValueOnce({
            isAxiosError: true,
            code: "ECONNREFUSED",
            message: "connect ECONNREFUSED 104.18.35.34:443",
            config: {},
        });

        const outcome = await new AniLink().anilist.query.media({ id: 1 }, { retry: false }).then(
            () => null,
            (error: unknown) => error
        );

        expect(outcome).toBeInstanceOf(AniLinkNetworkError);
        expect((outcome as AniLinkNetworkError).code).toBe(AniLinkErrorCodes.NETWORK);
    });

    test("an auth mutation without a token fails fast before any HTTP attempt", async () => {
        const outcome = await new AniLink().anilist.mutation.updateUser({ about: "no token" }).then(
            () => null,
            (error: unknown) => error
        );

        expect(outcome).toBeInstanceOf(AniLinkAuthError);
        expect(mocks.request).not.toHaveBeenCalled();
    });
});
