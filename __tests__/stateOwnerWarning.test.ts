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

    test("emits a structured record to the console in the default warn mode", async () => {
        const { sendRequest } = await importFreshRequestHandler();
        primeActiveStub();
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        const options = { retry: false, circuitBreaker: { threshold: 2, cooldownMs: 1_000 } };

        await sendRequest("https://graphql.anilist.co", "POST", { query: "query" }, undefined, {
            requiresAuth: false,
            options,
        });
        expect(warn).toHaveBeenCalledTimes(1);
        const record = JSON.parse(warn.mock.calls[0][0] as string);
        expect(record).toEqual({
            source: "anilink",
            kind: "state-owner",
            hookName: "stateOwner",
            message: expect.stringContaining("stateOwner"),
        });
        warn.mockRestore();
    });

    test("attaches the structured record as the error cause on the observer path", async () => {
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
        const [, error] = onHookError.mock.calls[0];
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).cause).toEqual({
            source: "anilink",
            kind: "state-owner",
            hookName: "stateOwner",
            message: expect.stringContaining("stateOwner"),
        });
        warn.mockRestore();
    });

    test("stays silent in diagnostics mode silent", async () => {
        const { sendRequest } = await importFreshRequestHandler();
        primeActiveStub();
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        const options = {
            retry: false,
            circuitBreaker: { threshold: 2, cooldownMs: 1_000 },
            diagnostics: "silent",
        } as const;

        await sendRequest("https://graphql.anilist.co", "POST", { query: "query" }, undefined, {
            requiresAuth: false,
            options,
        });
        expect(warn).not.toHaveBeenCalled();
        warn.mockRestore();
    });

    test("never touches the console in diagnostics mode hook without an observer", async () => {
        const { sendRequest } = await importFreshRequestHandler();
        primeActiveStub();
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        const options = {
            retry: false,
            circuitBreaker: { threshold: 2, cooldownMs: 1_000 },
            diagnostics: "hook",
        } as const;

        await sendRequest("https://graphql.anilist.co", "POST", { query: "query" }, undefined, {
            requiresAuth: false,
            options,
        });
        expect(warn).not.toHaveBeenCalled();
        warn.mockRestore();
    });

    test("a silent first request does not consume the one-shot warning for later warn-mode requests", async () => {
        // The one-shot gate must only mark the warning as spent when
        // something was actually emitted. A first triggering request in
        // `silent` mode suppresses its own emission — it must not also
        // permanently suppress the warning for every later `warn`-mode
        // request, or a mixed-mode client silently loses the only notice
        // that its transport state is keyed per request.
        const { sendRequest } = await importFreshRequestHandler();
        primeActiveStub();
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        const silentOptions = {
            retry: false,
            circuitBreaker: { threshold: 2, cooldownMs: 1_000 },
            diagnostics: "silent",
        } as const;
        const warnOptions = {
            retry: false,
            circuitBreaker: { threshold: 2, cooldownMs: 1_000 },
        } as const;

        // First trigger: silent mode suppresses the emission.
        await sendRequest("https://graphql.anilist.co", "POST", { query: "query" }, undefined, {
            requiresAuth: false,
            options: silentOptions,
        });
        expect(warn).not.toHaveBeenCalled();

        // Second trigger: default warn mode still emits — the silent
        // first request did not burn the one-shot.
        await sendRequest("https://graphql.anilist.co", "POST", { query: "query" }, undefined, {
            requiresAuth: false,
            options: warnOptions,
        });
        expect(warn).toHaveBeenCalledTimes(1);
        expect(warn.mock.calls[0][0]).toContain("stateOwner");

        // Third trigger: now the one-shot is spent.
        await sendRequest("https://graphql.anilist.co", "POST", { query: "query" }, undefined, {
            requiresAuth: false,
            options: warnOptions,
        });
        expect(warn).toHaveBeenCalledTimes(1);
        warn.mockRestore();
    });

    test("a silent-mode first request with an observer does not consume the one-shot warning", async () => {
        // The gap the other one-shot tests miss: silent mode with an observer
        // configured. The observer is present, so a re-derived "would emit"
        // gate consumes the one-shot — but reportDiagnostic's own routing
        // suppresses the observer (silent mode, no rawError) and the console
        // (not warn mode), so nothing is emitted. The one-shot must stay
        // available for a later request that would actually emit, or a
        // mixed-mode client silently loses the only notice that its
        // transport state is keyed per request.
        const { sendRequest } = await importFreshRequestHandler();
        primeActiveStub();
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        const onHookError = vi.fn();
        const silentOptions = {
            retry: false,
            circuitBreaker: { threshold: 2, cooldownMs: 1_000 },
            diagnostics: "silent",
            onHookError,
        } as const;
        const warnOptions = {
            retry: false,
            circuitBreaker: { threshold: 2, cooldownMs: 1_000 },
        } as const;

        // First trigger: silent mode with an observer emits nothing — the
        // state-owner record is unsolicited output, and silent mode gates
        // exactly that, observer or not.
        await sendRequest("https://graphql.anilist.co", "POST", { query: "query" }, undefined, {
            requiresAuth: false,
            options: silentOptions,
        });
        expect(warn).not.toHaveBeenCalled();
        expect(onHookError).not.toHaveBeenCalledWith("stateOwner", expect.anything());

        // Second trigger: default warn mode still emits — the silent first
        // request did not burn the one-shot.
        await sendRequest("https://graphql.anilist.co", "POST", { query: "query" }, undefined, {
            requiresAuth: false,
            options: warnOptions,
        });
        expect(warn).toHaveBeenCalledTimes(1);
        warn.mockRestore();
    });

    test("a hook-mode first request without an observer does not consume the one-shot warning", async () => {
        // Same rule for `hook` mode with no observer configured: nothing
        // was emitted, so the one-shot stays available for a later
        // request that would actually emit.
        const { sendRequest } = await importFreshRequestHandler();
        primeActiveStub();
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        const hookOptions = {
            retry: false,
            circuitBreaker: { threshold: 2, cooldownMs: 1_000 },
            diagnostics: "hook",
        } as const;
        const warnOptions = {
            retry: false,
            circuitBreaker: { threshold: 2, cooldownMs: 1_000 },
        } as const;

        await sendRequest("https://graphql.anilist.co", "POST", { query: "query" }, undefined, {
            requiresAuth: false,
            options: hookOptions,
        });
        expect(warn).not.toHaveBeenCalled();

        await sendRequest("https://graphql.anilist.co", "POST", { query: "query" }, undefined, {
            requiresAuth: false,
            options: warnOptions,
        });
        expect(warn).toHaveBeenCalledTimes(1);
        warn.mockRestore();
    });
});
