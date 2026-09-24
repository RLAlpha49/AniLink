import { beforeEach, describe, expect, test, vi } from "vitest";
import { AniLink } from "../src/AniLink";
import { mapExternalIds } from "../src/apis/graphql/anilist/helpers/mapExternalIds";
import { getAxiosStub, makeAxiosResponseError } from "./helpers/axiosStub";

vi.mock("axios", async () => {
    const { createAxiosStub: build, stashAxiosStub } = await import("./helpers/axiosStub");
    const stub = build();
    stashAxiosStub(stub);
    return stub.module;
});

const mocks = getAxiosStub();

beforeEach(() => {
    vi.clearAllMocks();
});

describe("mapExternalIds", () => {
    test("returns empty maps without making a request for empty input", async () => {
        const result = await mapExternalIds("anilist", []);

        expect(result.anilistToMal.size).toBe(0);
        expect(result.malToAnilist.size).toBe(0);
        expect(result.unmapped).toEqual([]);
        expect(mocks.request).not.toHaveBeenCalled();
    });

    test("maps IDs in both directions and keeps unmapped input IDs", async () => {
        mocks.request.mockResolvedValueOnce({
            data: [{ anilist: 1, myanimelist: 21 }, null, { anilist: 3, myanimelist: 23 }],
        });

        const result = await mapExternalIds("anilist", [1, 2, 3]);

        expect(result.anilistToMal.get(1)).toBe(21);
        expect(result.anilistToMal.get(3)).toBe(23);
        expect(result.malToAnilist.get(21)).toBe(1);
        expect(result.malToAnilist.get(23)).toBe(3);
        expect(result.unmapped).toEqual([2]);
    });

    test("maps MyAnimeList inputs back to AniList IDs", async () => {
        mocks.request.mockResolvedValueOnce({
            data: [{ anilist: 1, myanimelist: 21 }, null],
        });

        const result = await mapExternalIds("myanimelist", [21, 22]);

        expect(result.anilistToMal.get(1)).toBe(21);
        expect(result.malToAnilist.get(21)).toBe(1);
        expect(result.unmapped).toEqual([22]);
    });

    test("splits requests at ARM's 100-ID limit", async () => {
        mocks.request
            .mockResolvedValueOnce({
                data: Array.from({ length: 100 }, (_value, index) => ({
                    anilist: index + 1,
                    myanimelist: index + 1001,
                })),
            })
            .mockResolvedValueOnce({ data: [{ anilist: 101, myanimelist: 1101 }] });

        const result = await mapExternalIds(
            "anilist",
            Array.from({ length: 101 }, (_value, index) => index + 1)
        );

        expect(mocks.request).toHaveBeenCalledTimes(2);
        expect((mocks.request.mock.calls[0]?.[0] as { data: unknown }).data).toHaveLength(100);
        expect((mocks.request.mock.calls[1]?.[0] as { data: unknown }).data).toHaveLength(1);
        expect(result.anilistToMal.get(101)).toBe(1101);
    });

    test("uses AniLink transport options and runs request hooks through the public facade", async () => {
        const signal = new AbortController().signal;
        const onRequestStart = vi.fn();
        const client = new AniLink("token", {
            timeout: 1_234,
            signal,
            retry: false,
            onRequestStart,
        });
        mocks.request
            .mockResolvedValueOnce({ data: [{ anilist: 1, myanimelist: 21 }] })
            .mockResolvedValueOnce({ data: [{ anilist: 2, myanimelist: 22 }] });

        await client.anilist.mapExternalIds("anilist", [1]);
        const callSignal = new AbortController().signal;
        await client.anilist.mapExternalIds("anilist", [2], {
            timeout: 4_321,
            signal: callSignal,
        });

        expect(mocks.request.mock.calls[0]?.[0]).toEqual(
            expect.objectContaining({ timeout: 1_234, signal })
        );
        expect(mocks.request.mock.calls[1]?.[0]).toEqual(
            expect.objectContaining({ timeout: 4_321, signal: callSignal })
        );
        const config = mocks.request.mock.calls[1]?.[0] as {
            headers?: Record<string, string>;
        };
        expect(config.headers?.Authorization).toBeUndefined();
        expect(onRequestStart).toHaveBeenCalledTimes(2);
    });

    test("normalizes HTTP and network failures through AniLink errors", async () => {
        mocks.request.mockRejectedValueOnce(makeAxiosResponseError(503));
        await expect(mapExternalIds("anilist", [1], { retry: false })).rejects.toMatchObject({
            name: "AniLinkRestError",
            code: "REST_ERROR",
            status: 503,
        });

        mocks.request.mockRejectedValueOnce({
            isAxiosError: true,
            code: "ENOTFOUND",
            config: {},
        });
        await expect(mapExternalIds("anilist", [1], { retry: false })).rejects.toMatchObject({
            name: "AniLinkNetworkError",
            code: "NETWORK_ERROR",
        });
    });

    test("preserves configured timeout metadata when ARM times out", async () => {
        const client = new AniLink("token", { timeout: 500, retry: false });
        mocks.request.mockRejectedValueOnce({
            isAxiosError: true,
            code: "ECONNABORTED",
            config: {},
        });

        await expect(client.anilist.mapExternalIds("anilist", [1])).rejects.toMatchObject({
            name: "AniLinkNetworkError",
            code: "TIMEOUT_ERROR",
            timeoutMs: 500,
        });
    });

    test("rejects malformed ARM response cardinality", async () => {
        mocks.request.mockResolvedValueOnce({ data: [] });

        await expect(mapExternalIds("anilist", [1])).rejects.toThrow(TypeError);
    });
});
