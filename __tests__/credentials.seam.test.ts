import { beforeEach, describe, expect, test, vi } from "vitest";
import { AniLink } from "../src/AniLink";
import { AniLinkAuthError } from "../src/base/AniLinkError";
import {
    type AniListCredentials,
    resolveAniListCredentials,
    resolveMalCredentials,
} from "../src/base/credentials";
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
    timeout?: number;
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
            // The client-ID header is suppressed when a bearer token is
            // present: it is only for client-ID-only access to public
            // endpoints.
            auth: { token: "mal-token", headers: undefined },
            options: { timeout: 7_000 },
        });
    });

    test("attaches the client-ID header only when no access token is configured", () => {
        expect(resolveMalCredentials({ clientId: "mal-client" })).toEqual({
            auth: { token: undefined, headers: { "X-MAL-CLIENT-ID": "mal-client" } },
            options: undefined,
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

    test("anilist-only credentials still construct a public MAL provider surface", async () => {
        const client = new AniLink({ anilist: { authToken: "only-anilist" } });

        // The AniList token must drive real requests on the anilist slot...
        await client.anilist.query.media({ id: 1, type: "ANIME" });
        expect(lastConfig().headers.Authorization).toBe("Bearer only-anilist");

        // ...while the MAL surface stays usable: its authenticated calls fail
        // fast with an auth error instead of leaking the AniList token.
        await expect(client.mal.user.me()).rejects.toBeInstanceOf(AniLinkAuthError);
        expect(mocks.request).toHaveBeenCalledTimes(1);
    });
});

describe("strict credential-key validation", () => {
    test("throws a TypeError naming an unknown credential key", () => {
        expect(() =>
            resolveAniListCredentials({
                authToken: "t",
                bogusKey: 1,
            } as unknown as Parameters<typeof resolveAniListCredentials>[0])
        ).toThrow(TypeError);
        expect(() =>
            resolveAniListCredentials({
                authToken: "t",
                bogusKey: 1,
            } as unknown as Parameters<typeof resolveAniListCredentials>[0])
        ).toThrow(/bogusKey/);
    });

    test("the TypeError message lists the valid transport and auth fields", () => {
        expect(() =>
            resolveAniListCredentials({
                authToken: "t",
                accesstoken: "lowercase-typo",
            } as unknown as Parameters<typeof resolveAniListCredentials>[0])
        ).toThrow(/Unknown credential key "accesstoken"/);
    });

    test("rejects an unknown key at client construction", () => {
        expect(
            () =>
                new AniLink({
                    anilist: {
                        authToken: "t",
                        customThing: true,
                    } as unknown as AniListCredentials,
                })
        ).toThrow(TypeError);
    });
});
describe("client-level diagnostics default", () => {
    test("applies the client-level diagnostics to every slot that does not define its own", async () => {
        // The docs promise instance-level `diagnostics`; the credentials
        // form must honor that: the client-level value reaches both
        // provider slots unless a slot overrides it.
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        const client = new AniLink({
            anilist: { authToken: "anilist-token" },
            mal: { accessToken: "mal-token" },
            diagnostics: "silent",
        });

        // A throwing onResponse hook on each provider would emit the
        // hook-failure fallback in warn mode; the client-level `silent`
        // default must suppress it for both slots.
        await client.anilist.query.media(
            { id: 1, type: "ANIME" },
            {
                onResponse: () => {
                    throw new Error("telemetry exploded");
                },
            }
        );
        await client.mal.user.me({
            onResponse: () => {
                throw new Error("metrics down");
            },
        });

        expect(warn).not.toHaveBeenCalled();
        warn.mockRestore();
    });

    test("a slot-level diagnostics value overrides the client-level default", async () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        const client = new AniLink({
            anilist: { authToken: "anilist-token", diagnostics: "warn" },
            mal: { accessToken: "mal-token" },
            diagnostics: "silent",
        });

        // The anilist slot keeps its own warn mode, so its hook failure
        // still reaches the console.
        await client.anilist.query.media(
            { id: 1, type: "ANIME" },
            {
                onResponse: () => {
                    throw new Error("telemetry exploded");
                },
            }
        );
        expect(warn).toHaveBeenCalledTimes(1);

        // The mal slot inherits the client-level silent default.
        await client.mal.user.me({
            onResponse: () => {
                throw new Error("metrics down");
            },
        });
        expect(warn).toHaveBeenCalledTimes(1);
        warn.mockRestore();
    });
});

describe("credentials form rejects a second options argument", () => {
    test("throws a TypeError naming the per-provider rule instead of silently dropping options", () => {
        expect(() => new AniLink({ anilist: { authToken: "t" } }, { timeout: 5_000 })).toThrow(
            TypeError
        );
    });

    test("the TypeError message points at the provider credentials slots", () => {
        expect(() => new AniLink({ anilist: { authToken: "t" } }, { timeout: 5_000 })).toThrow(
            /transport settings belong inside each provider's credentials slot/
        );
    });

    test("the credentials form without options and the legacy token form still construct", () => {
        expect(() => new AniLink({ anilist: { authToken: "t" } })).not.toThrow();
        expect(() => new AniLink("legacy-token", { timeout: 5_000 })).not.toThrow();
    });
});
