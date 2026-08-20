import type { AniLink as AniLinkClient, AniLinkOptions } from "../../src/AniLink";
import { beforeEach, vi } from "vitest";
import { AniLink } from "../../src/AniLink";

export interface RecordedRequest {
    url: string;
    method: "GET" | "POST";
    data?: object;
    token?: string;
}

const requestMock = vi.hoisted(() =>
    vi.fn(async () => ({
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

export const createTestClient = (token = "test-token"): AniLinkClient => new AniLink(token);
export const createTestClientWithOptions = (options: AniLinkOptions): AniLinkClient =>
    new AniLink("test-token", options);
export const createTestClientWithoutToken = (): AniLinkClient => new AniLink();

export const getLastRequest = (): RecordedRequest | undefined => {
    const lastCall = mockSendRequest.mock.calls.at(-1) as
        [string, "GET" | "POST", object?, string?] | undefined;
    const [url, method, data, token] = lastCall ?? [];
    return url === undefined || method === undefined ? undefined : { url, method, data, token };
};

beforeEach(() => {
    vi.clearAllMocks();
});
