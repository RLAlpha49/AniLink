import { beforeEach, describe, expect, test, vi } from "vitest";
import { buildProviderClients } from "../src/providers/registry";
import { getAxiosStub } from "./helpers/axiosStub";

vi.mock("axios", async () => {
    const { createAxiosStub: build, stashAxiosStub } = await import("./helpers/axiosStub");
    const stub = build({ data: { data: { Media: { id: 1 } } } });
    stashAxiosStub(stub);
    return stub.module;
});

const mocks = getAxiosStub();

beforeEach(() => {
    vi.clearAllMocks();
    mocks.request.mockResolvedValue({ data: { data: { Media: { id: 1 } } } });
});

describe("provider registry", () => {
    test("builds typed AniList and MAL clients from independent credential slots", async () => {
        const clients = buildProviderClients({
            anilist: { authToken: "anilist-token", timeout: 1_000 },
            mal: { accessToken: "mal-token", timeout: 2_000 },
        });

        await clients.anilist.query.media({ id: 1, type: "ANIME" });
        expect(mocks.request.mock.calls[0][0]).toMatchObject({
            timeout: 1_000,
            headers: { Authorization: "Bearer anilist-token" },
        });

        await clients.mal.user.me();
        expect(mocks.request.mock.calls[1][0]).toMatchObject({
            timeout: 2_000,
            headers: { Authorization: "Bearer mal-token" },
        });
    });

    test("applies legacy transport options only to the legacy AniList construction path", async () => {
        const clients = buildProviderClients({}, { timeout: 1_500 });

        await clients.anilist.query.media({ id: 1, type: "ANIME" });

        expect(mocks.request.mock.calls[0][0]).toMatchObject({ timeout: 1_500 });
    });
});
