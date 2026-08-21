import type { AniLink as AniLinkClient, AniLinkOptions } from "../../src/AniLink";
import { beforeEach, vi } from "vitest";
import { AniLink } from "../../src/AniLink";

export interface RecordedRequest {
    url: string;
    method: "GET" | "POST";
    data?: object;
    token?: string;
    requiresAuth?: boolean;
}

const requestMock = vi.hoisted(() =>
    vi.fn(async (): Promise<unknown> => ({
        __typename: "MockResponse",
    }))
);
const configureRequestOptionsMock = vi.hoisted(() => vi.fn());

vi.mock("../../src/base/RequestHandler", () => ({
    sendRequest: requestMock,
    configureRequestOptions: configureRequestOptionsMock,
}));

export const mockSendRequest = requestMock;
export const mockConfigureRequestOptions = configureRequestOptionsMock;

/**
 * Configures what the mocked transport resolves with for subsequent requests.
 *
 * Pass a plain value (for example a GraphQL envelope such as
 * `{ data: { Media: { id: 1 } } }`) to make every call resolve with it, or a
 * factory that receives the recorded request and returns the response. This
 * lets tests assert on returned data instead of only on request arguments.
 */
export const setMockResponse = (
    response: unknown | ((request: RecordedRequest) => unknown)
): void => {
    if (typeof response === "function") {
        const factory = response as (request: RecordedRequest) => unknown;
        mockSendRequest.mockImplementation(async (url, method, data, token, requiresAuth) =>
            factory({ url, method, data, token, requiresAuth })
        );
        return;
    }
    mockSendRequest.mockImplementation(async () => response);
};

export const createTestClient = (token = "test-token"): AniLinkClient => new AniLink(token);
export const createTestClientWithOptions = (options: AniLinkOptions): AniLinkClient =>
    new AniLink("test-token", options);
export const createTestClientWithoutToken = (): AniLinkClient => new AniLink();

export const getLastRequest = (): RecordedRequest | undefined => {
    const lastCall = mockSendRequest.mock.calls.at(-1) as
        [string, "GET" | "POST", object?, string?, boolean?] | undefined;
    const [url, method, data, token, requiresAuth] = lastCall ?? [];
    return url === undefined || method === undefined
        ? undefined
        : { url, method, data, token, requiresAuth };
};

beforeEach(() => {
    vi.clearAllMocks();
    // Restore the default response so per-test `setMockResponse` values never leak.
    requestMock.mockImplementation(async () => ({
        __typename: "MockResponse",
    }));
});
