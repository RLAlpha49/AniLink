/**
 * Shared transport mock for AniLink test suites.
 *
 * Replaces {@link sendRequest} from `src/base/RequestHandler` with a `vi.fn`
 * so suites assert on the request arguments and drive responses through
 * {@link setMockResponse} instead of touching the network. The mock is
 * hoisted so it is installed before any suite imports {@link AniLink}.
 */
import type { AniLink as AniLinkClient, AniLinkOptions } from "../../src/AniLink";
import { beforeEach, vi } from "vitest";
import { AniLink } from "../../src/AniLink";
import type { SendRequestOptions } from "../../src/base/RequestHandler";

/**
 * The request arguments captured by {@link mockSendRequest}, mirroring the
 * parameters of {@link sendRequest}.
 */
export interface RecordedRequest {
    /** The absolute endpoint URL passed to the transport. */
    url: string;
    /** The HTTP method the operation selected. */
    method: "GET" | "POST";
    /** The serialized request body, when the operation sent one. */
    data?: object;
    /** The auth token forwarded for the request, if any. */
    token?: string;
    /** Whether the operation required an authenticated token. */
    requiresAuth?: boolean;
    /** The named trailing options object forwarded by the caller. */
    sendOptions?: SendRequestOptions;
}

const requestMock = vi.hoisted(() =>
    vi.fn(async (): Promise<unknown> => ({
        __typename: "MockResponse",
    }))
);

vi.mock("../../src/base/RequestHandler", () => ({
    sendRequest: requestMock,
}));

/**
 * The mocked {@link sendRequest} transport. Inspect {@link mockSendRequest.mock.calls}
 * directly, or use {@link getLastRequest} for the most recent call as a
 * {@link RecordedRequest}.
 */
export const mockSendRequest = requestMock;

/**
 * Configures what the mocked transport resolves with for subsequent requests.
 *
 * Pass a plain value (for example a GraphQL envelope such as
 * `{ data: { Media: { id: 1 } } }`) to make every call resolve with it, or a
 * factory that receives the recorded request and returns the response. This
 * lets tests assert on returned data instead of only on request arguments.
 *
 * @param response - Fixed response value or request-aware factory for subsequent calls.
 * @returns Nothing; installs the response behavior on {@link mockSendRequest}.
 */
export const setMockResponse = (
    response: unknown | ((request: RecordedRequest) => unknown)
): void => {
    if (typeof response === "function") {
        const factory = response as (request: RecordedRequest) => unknown;
        mockSendRequest.mockImplementation(async (url, method, data, token, sendOptions) =>
            factory({
                url,
                method,
                data,
                token,
                requiresAuth: sendOptions?.requiresAuth,
                sendOptions,
            })
        );
        return;
    }
    mockSendRequest.mockImplementation(async () => response);
};

/**
 * Builds an {@link AniLink} client wired to the mocked transport with a fixed
 * token, for the common case where a test only cares about request shape.
 *
 * @param token - The auth token the client sends; defaults to `"test-token"`.
 * @returns A client whose requests flow through {@link mockSendRequest}.
 */
export const createTestClient = (token = "test-token"): AniLinkClient => new AniLink(token);

/**
 * Builds an {@link AniLink} client with explicit transport options, for tests
 * that assert option forwarding (timeout, signal, retry policy, hooks).
 *
 * @param options - {@link AniLinkOptions} transport settings passed straight to {@link AniLink}.
 * @returns A client whose requests flow through {@link mockSendRequest}.
 */
export const createTestClientWithOptions = (options: AniLinkOptions): AniLinkClient =>
    new AniLink("test-token", options);

/**
 * Builds an {@link AniLink} client with no token, for tests of public
 * operations and no-token construction paths.
 *
 * @returns A tokenless client whose requests flow through {@link mockSendRequest}.
 */
export const createTestClientWithoutToken = (): AniLinkClient => new AniLink();

/**
 * Returns the most recent call to {@link mockSendRequest} as a
 * {@link RecordedRequest}, or `undefined` when no request has run yet.
 *
 * @returns The last recorded request, or `undefined` before any call.
 */
export const getLastRequest = (): RecordedRequest | undefined => {
    const lastCall = mockSendRequest.mock.calls.at(-1) as
        [string, "GET" | "POST", object?, string?, SendRequestOptions?] | undefined;
    const [url, method, data, token, sendOptions] = lastCall ?? [];
    return url === undefined || method === undefined
        ? undefined
        : {
              url,
              method,
              data,
              token,
              requiresAuth: sendOptions?.requiresAuth,
              sendOptions,
          };
};

beforeEach(() => {
    vi.clearAllMocks();
    // Restore the default response so per-test `setMockResponse` values never leak.
    requestMock.mockImplementation(async () => ({
        __typename: "MockResponse",
    }));
});
