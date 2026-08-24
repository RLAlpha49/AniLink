import { beforeEach, describe, expect, test, vi } from "vitest";
import { AniLink } from "../src/AniLink";

/**
 * Per-request transport option overrides.
 *
 * These tests exercise the real `APIWrapper` merge logic and the real
 * `sendRequest` pipeline against a stubbed Axios layer, so they prove that a
 * per-call options object reaches the transport merged over the instance-level
 * settings — not just that arguments are passed through.
 */

const mocks = vi.hoisted(() => {
    const request = vi.fn(async () => ({ data: { data: { Media: { id: 1 } } } }));
    const create = vi.fn(() => request);
    const isAxiosError = vi.fn(() => false);
    const isCancel = vi.fn(() => false);
    return { request, create, isAxiosError, isCancel };
});

vi.mock("axios", () => ({
    default: Object.assign(vi.fn(), {
        create: mocks.create,
        isAxiosError: mocks.isAxiosError,
        isCancel: mocks.isCancel,
    }),
}));

beforeEach(() => {
    vi.clearAllMocks();
});

describe("per-request transport option overrides", () => {
    test("instance settings apply when no per-request options are given", async () => {
        const client = new AniLink("token", { timeout: 5_000 });

        await client.anilist.query.media({ id: 1, type: "ANIME" });

        expect(mocks.request).toHaveBeenCalledWith(expect.objectContaining({ timeout: 5_000 }));
    });

    test("a per-request timeout overrides the instance timeout for one call", async () => {
        const client = new AniLink("token", { timeout: 5_000 });

        await client.anilist.query.mediaListCollection(
            { userId: 542244, type: "ANIME" },
            { timeout: 30_000 }
        );

        expect(mocks.request).toHaveBeenCalledWith(expect.objectContaining({ timeout: 30_000 }));
    });

    test("the override is not sticky across calls", async () => {
        const client = new AniLink("token", { timeout: 5_000 });

        await client.anilist.query.mediaListCollection(
            { userId: 542244, type: "ANIME" },
            { timeout: 30_000 }
        );
        await client.anilist.query.mediaListCollection({ userId: 542244, type: "ANIME" });

        const timeouts = mocks.request.mock.calls.map(
            (call) => (call[0] as { timeout?: number }).timeout
        );
        expect(timeouts).toEqual([30_000, 5_000]);
    });

    test("unset fields keep the instance value while overridden fields win", async () => {
        const client = new AniLink("token", { timeout: 5_000 });
        const controller = new AbortController();

        await client.anilist.query.mediaListCollection(
            { userId: 542244, type: "ANIME" },
            { signal: controller.signal }
        );

        // The merged settings keep the instance timeout but take the call signal.
        expect(mocks.request).toHaveBeenCalledWith(
            expect.objectContaining({ timeout: 5_000, signal: controller.signal })
        );
    });

    test("a per-request AbortSignal reaches Axios without instance options", async () => {
        const client = new AniLink("token");
        const controller = new AbortController();

        await client.anilist.query.media({ id: 1, type: "ANIME" }, { signal: controller.signal });

        expect(mocks.request).toHaveBeenCalledWith(
            expect.objectContaining({ signal: controller.signal })
        );
    });

    test("page queries forward per-request options through execute", async () => {
        const client = new AniLink("token");

        await client.anilist.query.page.medias(
            { page: 1, perPage: 50, type: "ANIME" },
            { timeout: 60_000 }
        );

        expect(mocks.request).toHaveBeenCalledWith(expect.objectContaining({ timeout: 60_000 }));
    });

    test("mutations forward per-request options through execute", async () => {
        const client = new AniLink("token");

        await client.anilist.mutation.saveMediaListEntry(
            { mediaId: 1, status: "COMPLETED" },
            { timeout: 45_000 }
        );

        expect(mocks.request).toHaveBeenCalledWith(expect.objectContaining({ timeout: 45_000 }));
    });

    test("custom requests accept per-request options", async () => {
        const client = new AniLink("token");

        await client.anilist.custom("query { Viewer { id } }", {}, { timeout: 12_345 });

        expect(mocks.request).toHaveBeenCalledWith(expect.objectContaining({ timeout: 12_345 }));
    });

    test("an empty per-request object leaves instance settings untouched", async () => {
        const client = new AniLink("token", { timeout: 7_777 });

        await client.anilist.query.media({ id: 1, type: "ANIME" }, {});

        expect(mocks.request).toHaveBeenCalledWith(expect.objectContaining({ timeout: 7_777 }));
    });
});
