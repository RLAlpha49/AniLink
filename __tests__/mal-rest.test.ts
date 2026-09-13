import { beforeEach, describe, expect, test, vi } from "vitest";
import {
    AniLinkApiError,
    AniLinkAuthError,
    AniLinkRestError,
    AniLinkValidationError,
} from "../src/base/AniLinkError";
import { DEFAULT_MAL_ANIME_FIELDS } from "../src/apis/rest/mal/constants";
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

        await expect(api.anime.get({ id: 21 }, { fields: ["id", "title"] })).resolves.toEqual({
            id: 21,
            title: "Fullmetal Alchemist",
        });

        expect(lastConfig().url).toBe("https://api.myanimelist.net/v2/anime/21?fields=id%2Ctitle");
        expect(lastConfig().method).toBe("GET");
        expect(lastConfig().headers.Authorization).toBeUndefined();
    });

    test("sends the default anime fields when no fields are selected", async () => {
        const api = buildMyAnimeListApi();

        await api.anime.get({ id: 21 });

        expect(lastConfig().url).toBe(
            "https://api.myanimelist.net/v2/anime/21?fields=" +
                encodeURIComponent(DEFAULT_MAL_ANIME_FIELDS.join(","))
        );
    });

    test("an explicit fields override wins over the default anime fields", async () => {
        const api = buildMyAnimeListApi();

        await api.anime.get({ id: 21 }, { fields: ["id", "title"] });

        expect(lastConfig().url).toBe("https://api.myanimelist.net/v2/anime/21?fields=id%2Ctitle");
    });

    test("sends the MAL client ID on public requests when configured", async () => {
        const api = buildMyAnimeListApi({ clientId: "mal-client-id" });

        await api.anime.get({ id: 21 });

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

        await expect(apiForTest().anime.get({ id: 999_999 }, { retry: false })).rejects.toSatisfy(
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
                tags: [],
            },
        });

        const status = await api.anime.updateMyListStatus({ id: 21, ...payload });

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
            tags: [],
        });
    });

    test("updateMyListStatus joins array tags into a comma-separated form field", async () => {
        const api = buildMyAnimeListApi({ accessToken: "mal-access-token" });
        mocks.request.mockResolvedValueOnce({ data: { status: "watching" } });

        await api.anime.updateMyListStatus({
            id: 21,
            status: "watching",
            tags: ["rewatch", "favorite"],
        });

        expect(lastConfig().data).toBe("status=watching&tags=rewatch%2Cfavorite");
    });

    test("updateMyListStatus sends fields as a query parameter when provided", async () => {
        const api = buildMyAnimeListApi({ accessToken: "mal-access-token" });
        mocks.request.mockResolvedValueOnce({ data: { status: "watching" } });

        await api.anime.updateMyListStatus(
            { id: 21, status: "watching" },
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

        await api.anime.updateMyListStatus(
            { id: 21, status: "watching" },
            { fields: "status,score" }
        );

        expect(lastConfig().url).toBe(
            "https://api.myanimelist.net/v2/anime/21/my_list_status?fields=status%2Cscore"
        );
    });

    test("updateMyListStatus rejects without a MAL access token", async () => {
        const api = buildMyAnimeListApi({ clientId: "mal-client-id" });

        await expect(
            api.anime.updateMyListStatus({ id: 21, status: "watching" })
        ).rejects.toBeInstanceOf(AniLinkAuthError);
        expect(mocks.request).not.toHaveBeenCalled();
    });

    test("updateMyListStatus rejects a payload with no list-status field to change", async () => {
        const api = buildMyAnimeListApi({ accessToken: "mal-access-token" });

        await expect(api.anime.updateMyListStatus({ id: 21 })).rejects.toBeInstanceOf(
            AniLinkValidationError
        );
        expect(mocks.request).not.toHaveBeenCalled();
    });

    test("updateMyListStatus normalizes MAL HTTP failures through the shared error surface", async () => {
        mocks.request.mockRejectedValueOnce(makeAxiosResponseError(400));

        await expect(
            buildMyAnimeListApi({ accessToken: "mal-access-token" }).anime.updateMyListStatus(
                { id: 21, score: 11 },
                { retry: false }
            )
        ).rejects.toSatisfy(
            (error: unknown) => error instanceof AniLinkApiError && error.status === 400
        );
    });

    test("updateMyListStatus drops excess properties instead of form-encoding them", async () => {
        const api = buildMyAnimeListApi({ accessToken: "mal-access-token" });
        mocks.request.mockResolvedValueOnce({ data: { status: "watching" } });

        // A typo'd field name from a JavaScript caller must stay off the wire.
        await api.anime.updateMyListStatus({
            id: 21,
            status: "watching",
            num_watched_episode: 10,
        } as unknown as Parameters<typeof api.anime.updateMyListStatus>[0]);

        expect(lastConfig().data).toBe("status=watching");
    });

    test("deleteFromList sends a DELETE with the bearer token to the list-status URL", async () => {
        const api = buildMyAnimeListApi({ accessToken: "mal-access-token" });
        mocks.request.mockResolvedValueOnce({ data: null });

        await expect(api.anime.deleteFromList({ id: 21 })).resolves.toBeUndefined();

        expect(lastConfig().url).toBe("https://api.myanimelist.net/v2/anime/21/my_list_status");
        expect(lastConfig().method).toBe("DELETE");
        expect(lastConfig().headers.Authorization).toBe("Bearer mal-access-token");
        expect(lastConfig().data).toBeUndefined();
    });

    test("deleteFromList rejects without a MAL access token", async () => {
        const api = buildMyAnimeListApi({ clientId: "mal-client-id" });

        await expect(api.anime.deleteFromList({ id: 21 })).rejects.toBeInstanceOf(AniLinkAuthError);
        expect(mocks.request).not.toHaveBeenCalled();
    });

    test("deleteFromList normalizes MAL HTTP failures through the shared error surface", async () => {
        mocks.request.mockRejectedValueOnce(makeAxiosResponseError(404));

        await expect(
            buildMyAnimeListApi({ accessToken: "mal-access-token" }).anime.deleteFromList(
                { id: 21 },
                {
                    retry: false,
                }
            )
        ).rejects.toSatisfy(
            (error: unknown) => error instanceof AniLinkApiError && error.status === 404
        );
    });
});

describe("MyAnimeList REST anime discovery reads", () => {
    test("seasonal gets a season's anime with encoded fields and returns the REST body verbatim", async () => {
        const api = buildMyAnimeListApi();

        await expect(
            api.anime.seasonal({ year: 2024, season: "winter" }, { fields: ["id", "title"] })
        ).resolves.toEqual({ id: 21, title: "Fullmetal Alchemist" });

        expect(lastConfig().url).toBe(
            "https://api.myanimelist.net/v2/anime/season/2024/winter?fields=id%2Ctitle"
        );
        expect(lastConfig().method).toBe("GET");
        expect(lastConfig().headers.Authorization).toBeUndefined();
    });

    test("seasonal omits the fields query parameter when no fields are selected", async () => {
        const api = buildMyAnimeListApi();

        await api.anime.seasonal({ year: 2024, season: "winter" });

        expect(lastConfig().url).toBe("https://api.myanimelist.net/v2/anime/season/2024/winter");
        expect(lastConfig().method).toBe("GET");
    });

    test("seasonal accepts fields as a comma-separated string", async () => {
        const api = buildMyAnimeListApi();

        await api.anime.seasonal({ year: 2024, season: "spring" }, { fields: "id,title" });

        expect(lastConfig().url).toBe(
            "https://api.myanimelist.net/v2/anime/season/2024/spring?fields=id%2Ctitle"
        );
    });

    test("ranking sends the ranking type before fields and returns the REST body verbatim", async () => {
        const api = buildMyAnimeListApi();

        await expect(
            api.anime.ranking({ rankingType: "airing" }, { fields: ["id", "title"] })
        ).resolves.toEqual({
            id: 21,
            title: "Fullmetal Alchemist",
        });

        expect(lastConfig().url).toBe(
            "https://api.myanimelist.net/v2/anime/ranking?ranking_type=airing&fields=id%2Ctitle"
        );
        expect(lastConfig().method).toBe("GET");
        expect(lastConfig().headers.Authorization).toBeUndefined();
    });

    test("ranking omits the fields query parameter when no options are given", async () => {
        const api = buildMyAnimeListApi();

        await api.anime.ranking({ rankingType: "airing" });

        expect(lastConfig().url).toBe(
            "https://api.myanimelist.net/v2/anime/ranking?ranking_type=airing"
        );
        expect(lastConfig().method).toBe("GET");
    });

    test("ranking accepts fields as a comma-separated string", async () => {
        const api = buildMyAnimeListApi();

        await api.anime.ranking({ rankingType: "favorite" }, { fields: "id,title" });

        expect(lastConfig().url).toBe(
            "https://api.myanimelist.net/v2/anime/ranking?ranking_type=favorite&fields=id%2Ctitle"
        );
    });

    test("suggestions sends the bearer token with encoded fields", async () => {
        const api = buildMyAnimeListApi({ accessToken: "mal-access-token" });

        await api.anime.suggestions({ fields: ["id", "title"] });

        expect(lastConfig().url).toBe(
            "https://api.myanimelist.net/v2/anime/suggestions?fields=id%2Ctitle"
        );
        expect(lastConfig().method).toBe("GET");
        expect(lastConfig().headers.Authorization).toBe("Bearer mal-access-token");
    });

    test("suggestions omits the fields query parameter when no fields are selected", async () => {
        const api = buildMyAnimeListApi({ accessToken: "mal-access-token" });

        await api.anime.suggestions();

        expect(lastConfig().url).toBe("https://api.myanimelist.net/v2/anime/suggestions");
        expect(lastConfig().method).toBe("GET");
        expect(lastConfig().headers.Authorization).toBe("Bearer mal-access-token");
    });

    test("suggestions accepts fields as a comma-separated string", async () => {
        const api = buildMyAnimeListApi({ accessToken: "mal-access-token" });

        await api.anime.suggestions({ fields: "id,title" });

        expect(lastConfig().url).toBe(
            "https://api.myanimelist.net/v2/anime/suggestions?fields=id%2Ctitle"
        );
    });

    test("suggestions rejects without a MAL access token", async () => {
        const api = buildMyAnimeListApi({ clientId: "mal-client-id" });

        await expect(api.anime.suggestions()).rejects.toBeInstanceOf(AniLinkAuthError);
        expect(mocks.request).not.toHaveBeenCalled();
    });

    test("seasonal normalizes MAL HTTP failures through the shared error surface", async () => {
        mocks.request.mockRejectedValueOnce(makeAxiosResponseError(404));

        await expect(
            buildMyAnimeListApi().anime.seasonal({ year: 2024, season: "winter" }, { retry: false })
        ).rejects.toSatisfy(
            (error: unknown) => error instanceof AniLinkRestError && error.status === 404
        );
    });

    test("ranking normalizes MAL HTTP failures through the shared error surface", async () => {
        mocks.request.mockRejectedValueOnce(makeAxiosResponseError(500));

        await expect(
            buildMyAnimeListApi().anime.ranking({ rankingType: "airing" }, { retry: false })
        ).rejects.toSatisfy(
            (error: unknown) => error instanceof AniLinkRestError && error.status === 500
        );
    });

    test("suggestions normalizes MAL HTTP failures through the shared error surface", async () => {
        mocks.request.mockRejectedValueOnce(makeAxiosResponseError(401));

        await expect(
            buildMyAnimeListApi({ accessToken: "mal-access-token" }).anime.suggestions({
                retry: false,
            })
        ).rejects.toSatisfy(
            (error: unknown) => error instanceof AniLinkRestError && error.status === 401
        );
    });
});

describe("MyAnimeList REST user-list reads", () => {
    test("animeList builds the encoded URL with status, sort, limit, offset, and fields", async () => {
        const api = buildMyAnimeListApi({ accessToken: "mal-access-token" });

        await api.user.animeList(
            {
                username: "@me",
                status: "watching",
                sort: "list_score",
                limit: 5,
                offset: 10,
            },
            { fields: ["id", "title", "list_status"] }
        );
        // `@me` is sent as the literal path segment, matching `me` and the
        // MAL reference, instead of relying on server-side `%40` decoding.
        expect(lastConfig().url).toBe(
            "https://api.myanimelist.net/v2/users/@me/animelist?fields=id%2Ctitle%2Clist_status&status=watching&sort=list_score&limit=5&offset=10"
        );
        expect(lastConfig().method).toBe("GET");
        expect(lastConfig().headers.Authorization).toBe("Bearer mal-access-token");
    });

    test("animeList returns the list body verbatim with its paging node", async () => {
        const api = buildMyAnimeListApi({ accessToken: "mal-access-token" });
        const body = {
            data: [
                {
                    node: { id: 21, title: "Fullmetal Alchemist" },
                    list_status: { status: "watching", score: 9 },
                },
            ],
            paging: {
                previous: "https://api.myanimelist.net/v2/users/@me/animelist?offset=0",
                next: "https://api.myanimelist.net/v2/users/@me/animelist?offset=2",
            },
        };
        mocks.request.mockResolvedValueOnce({ data: body });

        await expect(
            api.user.animeList({ username: "@me" }, { fields: ["id", "title", "list_status"] })
        ).resolves.toEqual(body);
    });

    test("animeList omits absent optional query parameters", async () => {
        const api = buildMyAnimeListApi({ accessToken: "mal-access-token" });

        await api.user.animeList({ username: "@me" });

        expect(lastConfig().url).toBe("https://api.myanimelist.net/v2/users/@me/animelist");
        expect(lastConfig().method).toBe("GET");
    });

    test("mangaList builds the encoded mangalist URL with the reading status", async () => {
        const api = buildMyAnimeListApi({ accessToken: "mal-access-token" });

        await api.user.mangaList(
            { username: "@me", status: "reading" },
            { fields: ["id", "title", "list_status"] }
        );

        expect(lastConfig().url).toBe(
            "https://api.myanimelist.net/v2/users/@me/mangalist?fields=id%2Ctitle%2Clist_status&status=reading"
        );
        expect(lastConfig().method).toBe("GET");
        expect(lastConfig().headers.Authorization).toBe("Bearer mal-access-token");
    });

    test("animeList sends the client ID header without a bearer token when only a client ID is configured", async () => {
        const api = buildMyAnimeListApi({ clientId: "mal-client-id" });

        await api.user.animeList({ username: "some-user" });

        expect(lastConfig().headers["X-MAL-CLIENT-ID"]).toBe("mal-client-id");
        expect(lastConfig().headers.Authorization).toBeUndefined();
    });

    test("animeList fails fast with AniLinkAuthError on @me without an access token", async () => {
        const api = buildMyAnimeListApi();

        await expect(api.user.animeList({ username: "@me" })).rejects.toBeInstanceOf(
            AniLinkAuthError
        );
        // The guard fires before any request is sent.
        expect(mocks.request).not.toHaveBeenCalled();
    });

    test("mangaList fails fast with AniLinkAuthError on @me without an access token", async () => {
        const api = buildMyAnimeListApi({ clientId: "mal-client-id" });

        await expect(api.user.mangaList({ username: "@me" })).rejects.toBeInstanceOf(
            AniLinkAuthError
        );
        expect(mocks.request).not.toHaveBeenCalled();
    });

    test("animeList fails fast on @me variants like @ME and padded @me without an access token", async () => {
        const api = buildMyAnimeListApi();

        await expect(api.user.animeList({ username: "@ME" })).rejects.toBeInstanceOf(
            AniLinkAuthError
        );
        await expect(api.user.animeList({ username: " @me " })).rejects.toBeInstanceOf(
            AniLinkAuthError
        );
        // The guard fires before any request is sent for every variant.
        expect(mocks.request).not.toHaveBeenCalled();
    });

    test("mangaList fails fast on @me variants like @ME and padded @me without an access token", async () => {
        const api = buildMyAnimeListApi({ clientId: "mal-client-id" });

        await expect(api.user.mangaList({ username: "@ME" })).rejects.toBeInstanceOf(
            AniLinkAuthError
        );
        await expect(api.user.mangaList({ username: " @me " })).rejects.toBeInstanceOf(
            AniLinkAuthError
        );
        expect(mocks.request).not.toHaveBeenCalled();
    });

    test("animeList sends the literal @me path for normalized @me variants", async () => {
        const api = buildMyAnimeListApi({ accessToken: "mal-access-token" });

        await api.user.animeList({ username: " @me " });

        expect(lastConfig().url).toBe("https://api.myanimelist.net/v2/users/@me/animelist");
        expect(lastConfig().headers.Authorization).toBe("Bearer mal-access-token");
    });

    test("mangaList sends the literal @me path for normalized @me variants", async () => {
        const api = buildMyAnimeListApi({ accessToken: "mal-access-token" });

        await api.user.mangaList({ username: "@ME" });

        expect(lastConfig().url).toBe("https://api.myanimelist.net/v2/users/@me/mangalist");
        expect(lastConfig().headers.Authorization).toBe("Bearer mal-access-token");
    });

    test("animeList accepts a pre-joined fields string", async () => {
        const api = buildMyAnimeListApi({ accessToken: "mal-access-token" });

        await api.user.animeList({ username: "some-user" }, { fields: "id,title,list_status" });

        expect(lastConfig().url).toBe(
            "https://api.myanimelist.net/v2/users/some-user/animelist?fields=id%2Ctitle%2Clist_status"
        );
    });

    test("animeList percent-encodes the username path segment", async () => {
        const api = buildMyAnimeListApi();

        await api.user.animeList({ username: "some user" });

        expect(lastConfig().url).toBe("https://api.myanimelist.net/v2/users/some%20user/animelist");
    });

    test("animeList normalizes MAL HTTP failures through the shared error surface", async () => {
        mocks.request.mockRejectedValueOnce(makeAxiosResponseError(404));

        await expect(
            buildMyAnimeListApi({ accessToken: "mal-access-token" }).user.animeList(
                { username: "@me" },
                {
                    retry: false,
                }
            )
        ).rejects.toSatisfy(
            (error: unknown) => error instanceof AniLinkRestError && error.status === 404
        );
    });

    test("animeList fails fast with AniLinkValidationError on an empty username", async () => {
        const api = buildMyAnimeListApi({ accessToken: "mal-access-token" });

        await expect(api.user.animeList({ username: "" })).rejects.toBeInstanceOf(
            AniLinkValidationError
        );
        // The guard fires before any request is sent.
        expect(mocks.request).not.toHaveBeenCalled();
    });

    test("mangaList fails fast with AniLinkValidationError on a whitespace-only username", async () => {
        const api = buildMyAnimeListApi({ accessToken: "mal-access-token" });

        await expect(api.user.mangaList({ username: "   " })).rejects.toBeInstanceOf(
            AniLinkValidationError
        );
        expect(mocks.request).not.toHaveBeenCalled();
    });
});

describe("MyAnimeList REST manga namespace", () => {
    test("gets manga details with encoded fields and returns the REST body verbatim", async () => {
        const api = buildMyAnimeListApi();

        await expect(api.manga.get({ id: 1 }, { fields: ["id", "title"] })).resolves.toEqual({
            id: 21,
            title: "Fullmetal Alchemist",
        });

        expect(lastConfig().url).toBe("https://api.myanimelist.net/v2/manga/1?fields=id%2Ctitle");
        expect(lastConfig().method).toBe("GET");
        expect(lastConfig().headers.Authorization).toBeUndefined();
    });

    test("manga.updateMyListStatus sends a form-urlencoded PATCH with the bearer token to the manga list-status URL", async () => {
        const api = buildMyAnimeListApi({ accessToken: "mal-access-token" });
        const payload = {
            status: "reading" as const,
            num_chapters_read: 10,
            score: 9,
        };
        mocks.request.mockResolvedValueOnce({
            data: {
                status: "reading",
                num_chapters_read: 10,
                num_volumes_read: 0,
                score: 9,
                is_rereading: false,
                num_times_reread: 0,
                reread_value: 0,
                priority: 0,
                tags: [],
            },
        });

        const status = await api.manga.updateMyListStatus({ id: 1, ...payload });

        expect(lastConfig().url).toBe("https://api.myanimelist.net/v2/manga/1/my_list_status");
        expect(lastConfig().method).toBe("PATCH");
        expect(lastConfig().headers.Authorization).toBe("Bearer mal-access-token");
        expect(lastConfig().headers["Content-Type"]).toBe("application/x-www-form-urlencoded");
        expect(lastConfig().data).toBe("status=reading&num_chapters_read=10&score=9");
        expect(status).toEqual({
            status: "reading",
            num_chapters_read: 10,
            num_volumes_read: 0,
            score: 9,
            is_rereading: false,
            num_times_reread: 0,
            reread_value: 0,
            priority: 0,
            tags: [],
        });
    });

    test("manga.updateMyListStatus joins array tags into a comma-separated form field", async () => {
        const api = buildMyAnimeListApi({ accessToken: "mal-access-token" });
        mocks.request.mockResolvedValueOnce({ data: { status: "reading" } });

        await api.manga.updateMyListStatus({
            id: 1,
            status: "reading",
            tags: ["reread", "favorite"],
        });

        expect(lastConfig().data).toBe("status=reading&tags=reread%2Cfavorite");
    });

    test("manga.updateMyListStatus sends fields as a query parameter when provided", async () => {
        const api = buildMyAnimeListApi({ accessToken: "mal-access-token" });
        mocks.request.mockResolvedValueOnce({ data: { status: "reading" } });

        await api.manga.updateMyListStatus(
            { id: 1, status: "reading" },
            { fields: ["status", "score"] }
        );

        expect(lastConfig().url).toBe(
            "https://api.myanimelist.net/v2/manga/1/my_list_status?fields=status%2Cscore"
        );
        expect(lastConfig().method).toBe("PATCH");
    });

    test("manga.updateMyListStatus accepts a pre-joined fields string", async () => {
        const api = buildMyAnimeListApi({ accessToken: "mal-access-token" });
        mocks.request.mockResolvedValueOnce({ data: { status: "reading" } });

        await api.manga.updateMyListStatus(
            { id: 1, status: "reading" },
            { fields: "status,score" }
        );

        expect(lastConfig().url).toBe(
            "https://api.myanimelist.net/v2/manga/1/my_list_status?fields=status%2Cscore"
        );
    });

    test("manga.updateMyListStatus rejects without a MAL access token", async () => {
        const api = buildMyAnimeListApi({ clientId: "mal-client-id" });

        await expect(
            api.manga.updateMyListStatus({ id: 1, status: "reading" })
        ).rejects.toBeInstanceOf(AniLinkAuthError);
        expect(mocks.request).not.toHaveBeenCalled();
    });

    test("manga.updateMyListStatus rejects a payload with no list-status field to change", async () => {
        const api = buildMyAnimeListApi({ accessToken: "mal-access-token" });

        await expect(api.manga.updateMyListStatus({ id: 1 })).rejects.toBeInstanceOf(
            AniLinkValidationError
        );
        expect(mocks.request).not.toHaveBeenCalled();
    });

    test("manga.updateMyListStatus normalizes MAL HTTP failures through the shared error surface", async () => {
        mocks.request.mockRejectedValueOnce(makeAxiosResponseError(400));

        await expect(
            buildMyAnimeListApi({ accessToken: "mal-access-token" }).manga.updateMyListStatus(
                { id: 1, score: 11 },
                { retry: false }
            )
        ).rejects.toSatisfy(
            (error: unknown) => error instanceof AniLinkApiError && error.status === 400
        );
    });

    test("manga.updateMyListStatus drops excess properties instead of form-encoding them", async () => {
        const api = buildMyAnimeListApi({ accessToken: "mal-access-token" });
        mocks.request.mockResolvedValueOnce({ data: { status: "reading" } });

        // A typo'd field name from a JavaScript caller must stay off the wire.
        await api.manga.updateMyListStatus({
            id: 1,
            status: "reading",
            num_chapter_read: 10,
        } as unknown as Parameters<typeof api.manga.updateMyListStatus>[0]);

        expect(lastConfig().data).toBe("status=reading");
    });

    test("manga.deleteFromList sends a DELETE with the bearer token to the manga list-status URL", async () => {
        const api = buildMyAnimeListApi({ accessToken: "mal-access-token" });
        mocks.request.mockResolvedValueOnce({ data: null });

        await expect(api.manga.deleteFromList({ id: 1 })).resolves.toBeUndefined();

        expect(lastConfig().url).toBe("https://api.myanimelist.net/v2/manga/1/my_list_status");
        expect(lastConfig().method).toBe("DELETE");
        expect(lastConfig().headers.Authorization).toBe("Bearer mal-access-token");
        expect(lastConfig().data).toBeUndefined();
    });

    test("manga.deleteFromList rejects without a MAL access token", async () => {
        const api = buildMyAnimeListApi({ clientId: "mal-client-id" });

        await expect(api.manga.deleteFromList({ id: 1 })).rejects.toBeInstanceOf(AniLinkAuthError);
        expect(mocks.request).not.toHaveBeenCalled();
    });

    test("manga.deleteFromList normalizes MAL HTTP failures through the shared error surface", async () => {
        mocks.request.mockRejectedValueOnce(makeAxiosResponseError(404));

        await expect(
            buildMyAnimeListApi({ accessToken: "mal-access-token" }).manga.deleteFromList(
                { id: 1 },
                {
                    retry: false,
                }
            )
        ).rejects.toSatisfy(
            (error: unknown) => error instanceof AniLinkApiError && error.status === 404
        );
    });

    test("manga.get normalizes MAL HTTP failures through the shared error surface", async () => {
        mocks.request.mockRejectedValueOnce(makeAxiosResponseError(404));

        await expect(
            buildMyAnimeListApi().manga.get({ id: 999_999 }, { retry: false })
        ).rejects.toSatisfy(
            (error: unknown) => error instanceof AniLinkApiError && error.status === 404
        );
    });
});

const apiForTest = () => buildMyAnimeListApi();
