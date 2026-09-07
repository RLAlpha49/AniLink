import { beforeEach, describe, expect, test, vi } from "vitest";
import { AniLinkApiError, AniLinkAuthError } from "../src/base/AniLinkError";
import { buildMyAnimeListApi } from "../src/apis/rest/mal/wiring";
import { getAxiosStub, makeAxiosResponseError } from "./helpers/axiosStub";

vi.mock("axios", async () => {
    const { createAxiosStub: build, stashAxiosStub } = await import("./helpers/axiosStub");
    const stub = build({ data: { id: 21, title: "Fullmetal Alchemist" } });
    stashAxiosStub(stub);
    return stub.module;
});

const mocks = getAxiosStub();

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

describe("MyAnimeList REST provider", () => {
    test("gets anime details with encoded fields and returns the REST body verbatim", async () => {
        const api = buildMyAnimeListApi();

        await expect(api.anime.get(21, { fields: ["id", "title"] })).resolves.toEqual({
            id: 21,
            title: "Fullmetal Alchemist",
        });

        expect(lastConfig().url).toBe("https://api.myanimelist.net/v2/anime/21?fields=id%2Ctitle");
        expect(lastConfig().method).toBe("GET");
        expect(lastConfig().headers.Authorization).toBeUndefined();
    });

    test("sends the MAL client ID on public requests when configured", async () => {
        const api = buildMyAnimeListApi({ clientId: "mal-client-id" });

        await api.anime.get(21);

        expect(lastConfig().headers["X-MAL-CLIENT-ID"]).toBe("mal-client-id");
        expect(lastConfig().headers.Authorization).toBeUndefined();
    });

    test("sends the MAL access token only to authenticated user requests", async () => {
        const api = buildMyAnimeListApi({ accessToken: "mal-access-token" });

        await api.user.me();

        expect(lastConfig().url).toBe("https://api.myanimelist.net/v2/users/@me");
        expect(lastConfig().headers.Authorization).toBe("Bearer mal-access-token");
    });

    test("rejects an authenticated request without a MAL access token", async () => {
        const api = buildMyAnimeListApi({ clientId: "mal-client-id" });

        await expect(api.user.me()).rejects.toBeInstanceOf(AniLinkAuthError);
        expect(mocks.request).not.toHaveBeenCalled();
    });

    test("normalizes MAL HTTP failures through the shared error surface", async () => {
        mocks.request.mockRejectedValueOnce(makeAxiosResponseError(404));

        await expect(apiForTest().anime.get(999_999, { retry: false })).rejects.toSatisfy(
            (error: unknown) => error instanceof AniLinkApiError && error.status === 404
        );
    });
});

describe("MyAnimeList REST list-status writes", () => {
    test("updateMyListStatus sends a form-urlencoded PATCH with the bearer token to the list-status URL", async () => {
        const api = buildMyAnimeListApi({ accessToken: "mal-access-token" });
        const payload = {
            status: "watching" as const,
            num_watched_episodes: 10,
            score: 9,
        };
        mocks.request.mockResolvedValueOnce({
            data: {
                status: "watching",
                num_episodes_watched: 10,
                score: 9,
                is_rewatching: false,
                num_times_rewatched: 0,
                rewatch_value: 0,
                priority: 0,
                tags: "",
            },
        });

        const status = await api.anime.updateMyListStatus(21, payload);

        expect(lastConfig().url).toBe("https://api.myanimelist.net/v2/anime/21/my_list_status");
        expect(lastConfig().method).toBe("PATCH");
        expect(lastConfig().headers.Authorization).toBe("Bearer mal-access-token");
        expect(lastConfig().headers["Content-Type"]).toBe("application/x-www-form-urlencoded");
        expect(lastConfig().data).toBe("status=watching&num_watched_episodes=10&score=9");
        expect(status).toEqual({
            status: "watching",
            num_episodes_watched: 10,
            score: 9,
            is_rewatching: false,
            num_times_rewatched: 0,
            rewatch_value: 0,
            priority: 0,
            tags: "",
        });
    });

    test("updateMyListStatus joins array tags into a comma-separated form field", async () => {
        const api = buildMyAnimeListApi({ accessToken: "mal-access-token" });
        mocks.request.mockResolvedValueOnce({ data: { status: "watching" } });

        await api.anime.updateMyListStatus(21, {
            status: "watching",
            tags: ["rewatch", "favorite"],
        });

        expect(lastConfig().data).toBe("status=watching&tags=rewatch%2Cfavorite");
    });

    test("updateMyListStatus sends fields as a query parameter when provided", async () => {
        const api = buildMyAnimeListApi({ accessToken: "mal-access-token" });
        mocks.request.mockResolvedValueOnce({ data: { status: "watching" } });

        await api.anime.updateMyListStatus(
            21,
            { status: "watching" },
            { fields: ["status", "score"] }
        );

        expect(lastConfig().url).toBe(
            "https://api.myanimelist.net/v2/anime/21/my_list_status?fields=status%2Cscore"
        );
        expect(lastConfig().method).toBe("PATCH");
    });

    test("updateMyListStatus accepts a pre-joined fields string", async () => {
        const api = buildMyAnimeListApi({ accessToken: "mal-access-token" });
        mocks.request.mockResolvedValueOnce({ data: { status: "watching" } });

        await api.anime.updateMyListStatus(21, { status: "watching" }, { fields: "status,score" });

        expect(lastConfig().url).toBe(
            "https://api.myanimelist.net/v2/anime/21/my_list_status?fields=status%2Cscore"
        );
    });

    test("updateMyListStatus rejects without a MAL access token", async () => {
        const api = buildMyAnimeListApi({ clientId: "mal-client-id" });

        await expect(
            api.anime.updateMyListStatus(21, { status: "watching" })
        ).rejects.toBeInstanceOf(AniLinkAuthError);
        expect(mocks.request).not.toHaveBeenCalled();
    });

    test("updateMyListStatus normalizes MAL HTTP failures through the shared error surface", async () => {
        mocks.request.mockRejectedValueOnce(makeAxiosResponseError(400));

        await expect(
            buildMyAnimeListApi({ accessToken: "mal-access-token" }).anime.updateMyListStatus(
                21,
                { score: 11 },
                { retry: false }
            )
        ).rejects.toSatisfy(
            (error: unknown) => error instanceof AniLinkApiError && error.status === 400
        );
    });

    test("deleteFromList sends a DELETE with the bearer token to the list-status URL", async () => {
        const api = buildMyAnimeListApi({ accessToken: "mal-access-token" });
        mocks.request.mockResolvedValueOnce({ data: null });

        await expect(api.anime.deleteFromList(21)).resolves.toBeUndefined();

        expect(lastConfig().url).toBe("https://api.myanimelist.net/v2/anime/21/my_list_status");
        expect(lastConfig().method).toBe("DELETE");
        expect(lastConfig().headers.Authorization).toBe("Bearer mal-access-token");
        expect(lastConfig().data).toBeUndefined();
    });

    test("deleteFromList rejects without a MAL access token", async () => {
        const api = buildMyAnimeListApi({ clientId: "mal-client-id" });

        await expect(api.anime.deleteFromList(21)).rejects.toBeInstanceOf(AniLinkAuthError);
        expect(mocks.request).not.toHaveBeenCalled();
    });

    test("deleteFromList normalizes MAL HTTP failures through the shared error surface", async () => {
        mocks.request.mockRejectedValueOnce(makeAxiosResponseError(404));

        await expect(
            buildMyAnimeListApi({ accessToken: "mal-access-token" }).anime.deleteFromList(21, {
                retry: false,
            })
        ).rejects.toSatisfy(
            (error: unknown) => error instanceof AniLinkApiError && error.status === 404
        );
    });
});

const apiForTest = () => buildMyAnimeListApi();
