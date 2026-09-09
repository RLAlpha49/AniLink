/**
 * Property-based tests for the retry/backoff and circuit-breaker invariants.
 *
 * These suites complement the example-based tests in
 * `requestHandler.retry.test.ts` by exercising whole input classes with
 * `fast-check`: the attempt-count bound, Retry-After header precedence over
 * computed backoff, and circuit-breaker fast-fail while open.
 *
 * The `numRuns` is kept low (25) to keep CI time stable. Set the
 * `ANILINK_PROPERTY_RUNS` environment variable to raise it for thorough local
 * runs, for example `ANILINK_PROPERTY_RUNS=200 npx vitest run`.
 */
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import fc from "fast-check";
import { AniLinkApiError } from "../src/base/AniLinkError";
import { type RequestOptions, sendRequest } from "../src/base/RequestHandler";
import { getAxiosStub, makeAxiosResponseError as apiError } from "./helpers/axiosStub";

vi.mock("axios", async () => {
    const { createAxiosStub: build, stashAxiosStub } = await import("./helpers/axiosStub");
    const stub = build();
    stashAxiosStub(stub);
    return stub.module;
});

const mocks = getAxiosStub();

const URL = "https://graphql.anilist.co";

let pendingOptions: RequestOptions | undefined;
const callSendRequest = (): Promise<unknown> =>
    sendRequest(URL, "POST", { query: "query" }, undefined, {
        requiresAuth: false,
        options: pendingOptions,
    });

/** Number of fast-check runs; low for CI, raisable via env for thorough runs. */
const NUM_RUNS = Number(process.env.ANILINK_PROPERTY_RUNS ?? 25);

beforeEach(() => {
    vi.clearAllMocks();
    mocks.request.mockImplementation(async () => ({ data: { data: { Media: { id: 1 } } } }));
    vi.useFakeTimers();
});

afterEach(() => {
    vi.useRealTimers();
});

/**
 * Drives fake timers forward enough to settle any pending retry backoff and
 * resolve or reject the supplied promise. The cap is generous so high
 * `maxRetries` / `maxDelayMs` combinations still settle.
 */
const settle = async (promise: Promise<unknown>, capMs = 120_000): Promise<void> => {
    promise.catch(() => {});
    await vi.advanceTimersByTimeAsync(capMs);
    await promise.catch(() => {});
};

describe("retry attempt-count bound (property-based)", () => {
    test("a consistently failing transport is called at most maxRetries + 1 times", async () => {
        await fc.assert(
            fc.asyncProperty(fc.integer({ min: 0, max: 5 }), async (maxRetries) => {
                mocks.request.mockReset();
                mocks.request.mockRejectedValue(apiError(500));
                pendingOptions = {
                    retry: { maxRetries, baseDelayMs: 1, maxDelayMs: 1, jitter: false },
                };

                const promise = callSendRequest();
                await settle(promise);
                await expect(promise).rejects.toBeInstanceOf(AniLinkApiError);

                // The initial attempt plus at most `maxRetries` retries.
                expect(mocks.request).toHaveBeenCalledTimes(maxRetries + 1);
            }),
            { numRuns: NUM_RUNS }
        );
    });
});

describe("Retry-After header precedence (property-based)", () => {
    test("observed delays never precede the Retry-After value for monotonic 429 sequences", async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.array(fc.integer({ min: 0, max: 30 }), { maxLength: 4 }),
                async (retryAfterSeconds) => {
                    mocks.request.mockReset();
                    const onRetry = vi.fn();
                    // Each failure carries a Retry-After header (in seconds).
                    for (const seconds of retryAfterSeconds) {
                        mocks.request.mockRejectedValueOnce(
                            apiError(429, { "retry-after": String(seconds) })
                        );
                    }
                    // A trailing success so the promise resolves.
                    mocks.request.mockResolvedValueOnce({ data: { data: { Media: { id: 1 } } } });

                    pendingOptions = {
                        retry: {
                            maxRetries: Math.max(retryAfterSeconds.length, 1),
                            baseDelayMs: 1,
                            maxDelayMs: 5_000,
                        },
                        onRetry,
                    };

                    const promise = callSendRequest();
                    await vi.advanceTimersByTimeAsync(120_000);
                    await expect(promise).resolves.toEqual({ id: 1 });

                    // Each reported nextDelayMs must be at least the header
                    // value (in ms) the server dictated for that attempt.
                    const calls = onRetry.mock.calls as Array<[unknown, { nextDelayMs: number }]>;
                    expect(calls.length).toBe(retryAfterSeconds.length);
                    for (let i = 0; i < calls.length; i += 1) {
                        const headerMs = retryAfterSeconds[i] * 1_000;
                        expect(calls[i][1].nextDelayMs).toBeGreaterThanOrEqual(headerMs);
                    }
                }
            ),
            { numRuns: NUM_RUNS }
        );
    });
});

describe("circuit breaker fast-fail while open (property-based)", () => {
    test("never reaches the network while the breaker is open during cooldown", async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.integer({ min: 1, max: 4 }),
                fc.integer({ min: 1, max: 5 }),
                async (threshold, extraRequests) => {
                    mocks.request.mockReset();
                    mocks.request.mockRejectedValue(apiError(500));
                    const cooldownMs = 5_000;
                    pendingOptions = {
                        retry: false,
                        circuitBreaker: { threshold, cooldownMs },
                    };

                    // Trip the breaker with `threshold` failures.
                    for (let i = 0; i < threshold; i += 1) {
                        await expect(callSendRequest()).rejects.toBeInstanceOf(AniLinkApiError);
                    }
                    const networkCallsAfterTrip = mocks.request.mock.calls.length;
                    // The breaker must not trip before `threshold` failures;
                    // requiring exactly `threshold` network calls guards against
                    // an early trip silently passing the open-state checks below.
                    expect(networkCallsAfterTrip).toBe(threshold);

                    // While still inside the cooldown, every request must
                    // fast-fail without touching the network.
                    for (let i = 0; i < extraRequests; i += 1) {
                        await expect(callSendRequest()).rejects.toMatchObject({
                            code: "CIRCUIT_OPEN_ERROR",
                        });
                    }
                    expect(mocks.request.mock.calls.length).toBe(networkCallsAfterTrip);

                    // After the cooldown, the next request reserves the probe
                    // and reaches the network again.
                    await vi.advanceTimersByTimeAsync(cooldownMs);
                    const probe = callSendRequest();
                    probe.catch(() => {});
                    await vi.advanceTimersByTimeAsync(0);
                    expect(mocks.request.mock.calls.length).toBe(networkCallsAfterTrip + 1);
                    await settle(probe, 1_000);
                }
            ),
            { numRuns: NUM_RUNS }
        );
    });

    test("fast-fails concurrent requests while the post-cooldown probe is pending", async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.integer({ min: 2, max: 4 }),
                fc.integer({ min: 1, max: 4 }),
                async (threshold, concurrent) => {
                    mocks.request.mockReset();
                    mocks.request.mockRejectedValue(apiError(500));
                    const cooldownMs = 5_000;
                    pendingOptions = {
                        retry: false,
                        circuitBreaker: { threshold, cooldownMs },
                    };

                    // Trip the breaker.
                    for (let i = 0; i < threshold; i += 1) {
                        await expect(callSendRequest()).rejects.toBeInstanceOf(AniLinkApiError);
                    }
                    const callsAfterTrip = mocks.request.mock.calls.length;
                    // Require exactly `threshold` calls so an early trip cannot
                    // pass the open-state validation that follows.
                    expect(callsAfterTrip).toBe(threshold);

                    // Cooldown elapses; hold the probe pending.
                    await vi.advanceTimersByTimeAsync(cooldownMs);
                    let resolveProbe: (value: unknown) => void = () => {};
                    mocks.request.mockImplementationOnce(
                        () =>
                            new Promise((resolve) => {
                                resolveProbe = resolve;
                            })
                    );

                    const probe = callSendRequest();
                    probe.catch(() => {});
                    await vi.advanceTimersByTimeAsync(0);
                    expect(mocks.request.mock.calls.length).toBe(callsAfterTrip + 1);

                    // Concurrent requests while the probe is pending must
                    // fast-fail without reaching the network.
                    for (let i = 0; i < concurrent; i += 1) {
                        await expect(callSendRequest()).rejects.toMatchObject({
                            code: "CIRCUIT_OPEN_ERROR",
                        });
                    }
                    expect(mocks.request.mock.calls.length).toBe(callsAfterTrip + 1);

                    // Release the probe so the dangling promise settles.
                    resolveProbe({ data: { data: { Media: { id: 1 } } } });
                    await settle(probe, 1_000);
                }
            ),
            { numRuns: NUM_RUNS }
        );
    });
});
