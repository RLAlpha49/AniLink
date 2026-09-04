import { beforeEach, describe, expect, test, vi } from "vitest";
import { sendRequest, type RequestAuth } from "../src/base/RequestHandler";
import { getAxiosStub } from "./helpers/axiosStub";

vi.mock("axios", async () => {
    const { createAxiosStub: build, stashAxiosStub } = await import("./helpers/axiosStub");
    const stub = build({ data: { ok: true } });
    stashAxiosStub(stub);
    return stub.module;
});

const mocks = getAxiosStub();

beforeEach(() => {
    vi.clearAllMocks();
});

describe("provider-neutral request authentication", () => {
    test("accepts a structured auth value and preserves its explicit headers", async () => {
        const auth: RequestAuth = {
            token: "provider-token",
            headers: { "X-Provider-Key": "provider-key" },
        };

        await sendRequest("https://api.example.test/resource", "GET", undefined, auth, {
            requiresAuth: true,
            options: {},
            operation: undefined,
            contentType: "application/json",
        });

        const config = mocks.request.mock.calls[0][0] as { headers: Record<string, string> };
        expect(config.headers.Authorization).toBe("Bearer provider-token");
        expect(config.headers["X-Provider-Key"]).toBe("provider-key");
    });

    test("allows a provider to supply a non-bearer authorization header", async () => {
        const auth: RequestAuth = { headers: { Authorization: "Basic provider-credentials" } };

        await sendRequest("https://api.example.test/resource", "GET", undefined, auth, {
            requiresAuth: true,
            options: {},
            operation: undefined,
            contentType: "application/json",
        });

        const config = mocks.request.mock.calls[0][0] as { headers: Record<string, string> };
        expect(config.headers.Authorization).toBe("Basic provider-credentials");
    });
});
