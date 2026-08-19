import axios, { type AxiosResponse } from "axios";

/**
 * A GraphQL response envelope as returned by the AniList API.
 * The `data` field holds the root selection set of the operation.
 */
export interface GraphQLResponseEnvelope {
    data?: unknown;
    errors?: Array<{ message: string }>;
}

/**
 * Unwraps the single root field of a GraphQL response envelope.
 *
 * The AniList API returns every operation's result inside a `{ data }` envelope.
 * For operations whose selection set has exactly one root field (for example
 * `User`, `Media`, or `MediaListCollection`), this helper returns the bare
 * field value. For responses with multiple root fields, or responses without
 * a `data` object (for example GraphQL errors), the full envelope is returned
 * unchanged.
 *
 * @param response - The full GraphQL response envelope.
 * @returns The unwrapped single-root-field value, or the envelope as-is.
 */
export const unwrapGraphQLResponse = <T>(response: unknown): T => {
    const envelope = response as GraphQLResponseEnvelope | null | undefined;
    const queryData = envelope?.data;

    if (queryData && typeof queryData === "object") {
        const fields = Object.keys(queryData);

        if (fields.length === 1) {
            return (queryData as Record<string, T>)[fields[0]];
        }
    }

    return response as T;
};

/**
 * Sends a request to the specified URL.
 * @param url - The URL to send the request to.
 * @param method - The HTTP method to use ('GET' or 'POST').
 * @param data - The data to send with the request.
 * @param token - The authentication token to include in the request headers.
 * @returns The unwrapped response data. For operations with a single root
 * field this is the bare field value; otherwise it is the full `{ data }`
 * envelope. Use {@link unwrapGraphQLResponse} to apply the same rule to a
 * response yourself.
 * @throws An error if the request fails.
 */
export const sendRequest = async <T = unknown>(
    url: string,
    method: "GET" | "POST",
    data?: object,
    token?: string
): Promise<T> => {
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "application/json",
    };

    if (token !== null && token !== undefined && token !== "") {
        headers.Authorization = `Bearer ${token}`;
    }

    const response: AxiosResponse = await axios({
        url,
        method,
        data,
        headers,
    });

    return unwrapGraphQLResponse<T>(response.data);
};
