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

const apiForTest = () => buildMyAnimeListApi();
