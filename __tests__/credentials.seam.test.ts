import { beforeEach, describe, expect, test, vi } from "vitest";
import { AniLink } from "../src/AniLink";
import { resolveAniListCredentials, resolveMalCredentials } from "../src/base/credentials";
import { getAxiosStub } from "./helpers/axiosStub";

/**
 * Per-provider credentials seam suite.
 *
 * Each provider owns its own credential shape: AniList takes a bearer token
 * (plus optional transport settings), while a REST provider such as
 * MyAnimeList supplies its own credentials object. The constructor must route
 * whichever shape was given to that provider's operations only — an AniList
 * token must never leak into MAL requests and vice versa.
 */

vi.mock("axios", async () => {
    const { createAxiosStub: build, stashAxiosStub } = await import("./helpers/axiosStub");
    const stub = build({ data: { data: { Media: { id: 1 } } } });
    stashAxiosStub(stub);
    return stub.module;
});

const mocks = getAxiosStub();

/** The Axios config captured from the most recent request call. */
interface CapturedAxiosConfig {
    url: string;
    method: string;
    headers: Record<string, string>;
}

const lastConfig = (): CapturedAxiosConfig =>
    mocks.request.mock.calls.at(-1)?.[0] as CapturedAxiosConfig;

beforeEach(() => {
    vi.clearAllMocks();
});

describe("AniList credentials", () => {
    test("keeps AniList authentication separate from shared transport settings", () => {
        expect(resolveAniListCredentials({ authToken: "anilist-token", timeout: 9_000 })).toEqual({
            auth: "anilist-token",
            options: { timeout: 9_000 },
        });
    });

    test("legacy positional (authToken, options) still reaches AniList operations", async () => {
        const client = new AniLink("legacy-token", { timeout: 5_000 });

        await client.anilist.query.media({ id: 1, type: "ANIME" });

        const config = lastConfig();
        expect(config.headers.Authorization).toBe("Bearer legacy-token");
    });

    test("anilist credentials object carries the bearer token and options", async () => {
        const client = new AniLink({
            anilist: { authToken: "object-token", timeout: 9_000 },
        });

        await client.anilist.query.media({ id: 1, type: "ANIME" });

        const config = lastConfig();
        expect(config.headers.Authorization).toBe("Bearer object-token");
        expect(config.timeout).toBe(9_000);
    });
});

describe("per-provider credential isolation", () => {
    test("removes MAL-only authentication fields before shared transport construction", () => {
        expect(
            resolveMalCredentials({
                accessToken: "mal-token",
                clientId: "mal-client",
                clientSecret: "mal-secret",
                refreshToken: "mal-refresh",
                timeout: 7_000,
            })
        ).toEqual({
            auth: { token: "mal-token", headers: { "X-MAL-CLIENT-ID": "mal-client" } },
            options: { timeout: 7_000 },
        });
    });

    test("mal credentials do not leak into anilist requests", async () => {
        const client = new AniLink({
            anilist: { authToken: "anilist-token" },
            mal: { accessToken: "mal-token" },
        });

        await client.anilist.query.media({ id: 1, type: "ANIME" });

        const config = lastConfig();
        expect(config.headers.Authorization).toBe("Bearer anilist-token");
        expect(mocks.request).toHaveBeenCalledTimes(1);
    });

    test("mal credentials reach the public MAL facade", async () => {
        const client = new AniLink({ mal: { accessToken: "mal-token" } });

        await client.mal.user.me();

        const config = lastConfig();
        expect(config.url).toBe("https://api.myanimelist.net/v2/users/@me");
        expect(config.headers.Authorization).toBe("Bearer mal-token");
    });

    test("anilist-only credentials still construct a public MAL provider surface", () => {
        const client = new AniLink({ anilist: { authToken: "only-anilist" } });

        expect(client.anilist).toBeDefined();
        expect(client.mal).toBeDefined();
    });
});
