import { beforeEach, describe, expect, test, vi } from "vitest";
import { getAxiosStub } from "./helpers/axiosStub";

vi.mock("axios", async () => {
    const { createAxiosStub: build, stashAxiosStub } = await import("./helpers/axiosStub");
    const stub = build();
    stashAxiosStub(stub);
    return stub.module;
});

/**
 * Imports a fresh RequestHandler module. `warnedOptionsKeyedState` lives at
 * module scope, so a test that must exercise the warning gate from a clean
 * slate resets the module registry first and then re-imports.
 *
 * `vi.resetModules()` re-runs the `vi.mock("axios")` factory, which builds
 * and stashes a NEW stub. The fresh RequestHandler serves requests from
 * that new stub, so every test must re-fetch the active stub via
 * `getAxiosStub()` and wire its `request` implementation there — never
 * through a module-scope constant captured before the reset.
 */
const importFreshRequestHandler = async () => {
    vi.resetModules();
    return await import("../src/base/RequestHandler");
};

/**
 * Wires the default success response onto the currently-stashed stub. The
 * axios mock factory runs lazily on the first import of the mocked module,
 * so the stub only exists after `importFreshRequestHandler` has re-run it —
 * never call this from `beforeEach`.
 */
const primeActiveStub = () => {
    getAxiosStub().request.mockImplementation(async () => ({
        data: { data: { Media: { id: 1 } } },
    }));
};

beforeEach(() => {
    vi.clearAllMocks();
});

describe("options-keyed transport state warning", () => {
    test("warns once when breaker state would be keyed by per-request options", async () => {
        const { sendRequest } = await importFreshRequestHandler();
        primeActiveStub();
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        const options = { retry: false, circuitBreaker: { threshold: 2, cooldownMs: 1_000 } };

        await sendRequest("https://graphql.anilist.co", "POST", { query: "query" }, undefined, {
            requiresAuth: false,
            options,
        });
        expect(warn).toHaveBeenCalledTimes(1);
        expect(warn.mock.calls[0][0]).toContain("stateOwner");

        // Once per process, not once per call.
        await sendRequest("https://graphql.anilist.co", "POST", { query: "query" }, undefined, {
            requiresAuth: false,
            options,
        });
        expect(warn).toHaveBeenCalledTimes(1);
        warn.mockRestore();
    });

    test("warns when only a retry budget is configured", async () => {
        const { sendRequest } = await importFreshRequestHandler();
        primeActiveStub();
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        const options = {
            retry: false,
            retryBudget: { maxRetriesPerWindow: 5, windowMs: 60_000 },
        };

        await sendRequest("https://graphql.anilist.co", "POST", { query: "query" }, undefined, {
            requiresAuth: false,
            options,
        });
        expect(warn).toHaveBeenCalledTimes(1);
        expect(warn.mock.calls[0][0]).toContain("stateOwner");
        warn.mockRestore();
    });

    test("stays silent when a stateOwner is passed", async () => {
        const { sendRequest } = await importFreshRequestHandler();
        primeActiveStub();
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        const options = { retry: false, circuitBreaker: { threshold: 2, cooldownMs: 1_000 } };

        await sendRequest("https://graphql.anilist.co", "POST", { query: "query" }, undefined, {
            requiresAuth: false,
            options,
            stateOwner: {},
        });
        expect(warn).not.toHaveBeenCalled();
        warn.mockRestore();
    });

    test("routes the warning through the onHookError logger when configured", async () => {
        const { sendRequest } = await importFreshRequestHandler();
        primeActiveStub();
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        const onHookError = vi.fn();
        const options = {
            retry: false,
            circuitBreaker: { threshold: 2, cooldownMs: 1_000 },
            onHookError,
        };

        await sendRequest("https://graphql.anilist.co", "POST", { query: "query" }, undefined, {
            requiresAuth: false,
            options,
        });
        expect(warn).not.toHaveBeenCalled();
        expect(onHookError).toHaveBeenCalledTimes(1);
        expect(onHookError.mock.calls[0]?.[0]).toBe("stateOwner");
        expect(String(onHookError.mock.calls[0]?.[1])).toContain("stateOwner");

        // The one-time flag applies on the onHookError path too.
        await sendRequest("https://graphql.anilist.co", "POST", { query: "query" }, undefined, {
            requiresAuth: false,
            options,
        });
        expect(onHookError).toHaveBeenCalledTimes(1);
        warn.mockRestore();
    });

    test("swallows a throwing onHookError observer during the warning", async () => {
        const { sendRequest } = await importFreshRequestHandler();
        primeActiveStub();
        const onHookError = vi.fn(() => {
            throw new Error("observer exploded");
        });
        const options = {
            retry: false,
            circuitBreaker: { threshold: 2, cooldownMs: 1_000 },
            onHookError,
        };

        await expect(
            sendRequest("https://graphql.anilist.co", "POST", { query: "query" }, undefined, {
                requiresAuth: false,
                options,
            })
        ).resolves.toEqual({ id: 1 });
        expect(onHookError).toHaveBeenCalledTimes(1);
    });
});
