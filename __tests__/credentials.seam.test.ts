import { beforeEach, describe, expect, test, vi } from "vitest";
import { AniLink } from "../src/AniLink";
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

    test("anilist-only credentials leave the mal slot undefined for future wiring", () => {
        const client = new AniLink({ anilist: { authToken: "only-anilist" } });

        // The `mal` namespace does not exist yet; the important contract is
        // that construction succeeds and the AniList surface is present.
        expect(client.anilist).toBeDefined();
        expect(client.mal).toBeUndefined();
    });
});
