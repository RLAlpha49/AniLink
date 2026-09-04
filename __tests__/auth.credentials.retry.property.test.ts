/**
 * Property-based tests for the auth URL builders, credential isolation, and
 * retry-delay computation.
 *
 * These suites complement the example-based tests by exercising whole input
 * classes with `fast-check`: arbitrary redirect-URI encoding, jitter boundary
 * values, `Retry-After` header formats, and credential-slot field isolation
 * under arbitrary key sets.
 */
import { describe, expect, test } from "vitest";
import fc from "fast-check";
import { buildAuthorizationUrl } from "../src/apis/graphql/anilist/auth";
import { buildMalAuthorizationUrl } from "../src/apis/rest/mal/auth";
import { resolveMalCredentials } from "../src/base/credentials";
import {
    applyJitter,
    getBackoffDelay,
    parseRetryAfter,
    type RetryPolicy,
} from "../src/base/RequestHandler";

/** The maximum `Retry-After` delay the transport honors, mirrored from RequestHandler.ts. */
const MAX_RETRY_AFTER_MS = 60_000;

/** A minimal retry policy for backoff/jitter tests. */
const makePolicy = (overrides: Partial<RetryPolicy> = {}): RetryPolicy => ({
    maxRetries: 3,
    baseDelayMs: 250,
    maxDelayMs: 5_000,
    retryOnStatus: [429, 500, 502, 503, 504],
    retryOnNetworkError: true,
    jitter: true,
    ...overrides,
});

describe("buildAuthorizationUrl property tests", () => {
    test("round-trips clientId, redirectUri, and state through URL parsing", () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
                fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
                fc.option(fc.string({ minLength: 1, maxLength: 30 })),
                (clientId, redirectUri, state) => {
                    const url = buildAuthorizationUrl(clientId, redirectUri, state ?? undefined);
                    const parsed = new URL(url);

                    expect(parsed.searchParams.get("client_id")).toBe(clientId);
                    expect(parsed.searchParams.get("redirect_uri")).toBe(redirectUri);
                    expect(parsed.searchParams.get("response_type")).toBe("code");
                    if (state !== null) {
                        expect(parsed.searchParams.get("state")).toBe(state);
                    } else {
                        expect(parsed.searchParams.has("state")).toBe(false);
                    }
                }
            )
        );
    });

    test("always targets the AniList authorization endpoint", () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 1, maxLength: 20 }),
                fc.string({ minLength: 1, maxLength: 50 }),
                (clientId, redirectUri) => {
                    const url = new URL(buildAuthorizationUrl(clientId, redirectUri));
                    expect(url.origin + url.pathname).toBe(
                        "https://anilist.co/api/v2/oauth/authorize"
                    );
                }
            )
        );
    });
});

describe("buildMalAuthorizationUrl property tests", () => {
    test("round-trips clientId, codeChallenge, and state through URL parsing", () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
                fc.string({ minLength: 1, maxLength: 80 }).filter((s) => s.trim().length > 0),
                fc.option(fc.string({ minLength: 1, maxLength: 30 })),
                (clientId, codeChallenge, state) => {
                    const url = buildMalAuthorizationUrl(
                        clientId,
                        codeChallenge,
                        state ?? undefined
                    );
                    const parsed = new URL(url);

                    expect(parsed.searchParams.get("client_id")).toBe(clientId);
                    expect(parsed.searchParams.get("code_challenge")).toBe(codeChallenge);
                    expect(parsed.searchParams.get("code_challenge_method")).toBe("S256");
                    expect(parsed.searchParams.get("response_type")).toBe("code");
                    if (state !== null) {
                        expect(parsed.searchParams.get("state")).toBe(state);
                    } else {
                        expect(parsed.searchParams.has("state")).toBe(false);
                    }
                }
            )
        );
    });

    test("always targets the MAL authorization endpoint", () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 1, maxLength: 20 }),
                fc.string({ minLength: 1, maxLength: 50 }),
                (clientId, codeChallenge) => {
                    const url = new URL(buildMalAuthorizationUrl(clientId, codeChallenge));
                    expect(url.origin + url.pathname).toBe(
                        "https://myanimelist.net/v1/oauth2/authorize"
                    );
                }
            )
        );
    });
});

describe("resolveMalCredentials property tests", () => {
    test("never leaks accessToken, refreshToken, clientId, or clientSecret into options", () => {
        fc.assert(
            fc.property(
                fc.record({
                    accessToken: fc.string({ minLength: 0, maxLength: 50 }),
                    refreshToken: fc.string({ minLength: 0, maxLength: 50 }),
                    clientId: fc.string({ minLength: 0, maxLength: 30 }),
                    clientSecret: fc.string({ minLength: 0, maxLength: 50 }),
                    timeout: fc.integer({ min: 1, max: 60_000 }),
                }),
                (creds) => {
                    const resolved = resolveMalCredentials(creds);
                    const options = resolved.options ?? {};

                    // The four provider-only fields must never appear in the
                    // shared transport options — they stay in the `auth` slot.
                    expect(options).not.toHaveProperty("accessToken");
                    expect(options).not.toHaveProperty("refreshToken");
                    expect(options).not.toHaveProperty("clientId");
                    expect(options).not.toHaveProperty("clientSecret");

                    // The access token reaches the auth slot, not the options.
                    expect(resolved.auth?.token).toBe(creds.accessToken);
                }
            )
        );
    });

    test("always routes clientId into the X-MAL-CLIENT-ID header, never into options", () => {
        fc.assert(
            fc.property(
                fc.record({
                    accessToken: fc.string({ minLength: 1, maxLength: 50 }),
                    clientId: fc.string({ minLength: 1, maxLength: 30 }),
                }),
                (creds) => {
                    const resolved = resolveMalCredentials(creds);
                    expect(resolved.auth?.headers?.["X-MAL-CLIENT-ID"]).toBe(creds.clientId);
                    expect(resolved.options ?? {}).not.toHaveProperty("clientId");
                }
            )
        );
    });

    test("returns empty auth when no accessToken and no clientId are given", () => {
        fc.assert(
            fc.property(
                fc.record({
                    timeout: fc.integer({ min: 100, max: 30_000 }),
                }),
                (creds) => {
                    const resolved = resolveMalCredentials(creds);
                    expect(resolved.auth).toBeUndefined();
                    expect(resolved.options).toEqual({ timeout: creds.timeout });
                }
            )
        );
    });
});

describe("parseRetryAfter property tests", () => {
    test("clamps a numeric Retry-After to [0, MAX_RETRY_AFTER_MS]", () => {
        fc.assert(
            fc.property(fc.integer({ min: 0, max: 1_000_000 }), (seconds) => {
                const delay = parseRetryAfter(String(seconds), Date.now());
                expect(delay).not.toBeNull();
                expect(delay).toBeGreaterThanOrEqual(0);
                expect(delay!).toBeLessThanOrEqual(MAX_RETRY_AFTER_MS);
                expect(delay).toBe(Math.min(seconds * 1000, MAX_RETRY_AFTER_MS));
            })
        );
    });

    test("clamps a large numeric Retry-After to exactly MAX_RETRY_AFTER_MS", () => {
        fc.assert(
            fc.property(fc.integer({ min: 61, max: 1_000_000 }), (seconds) => {
                const delay = parseRetryAfter(String(seconds), Date.now());
                expect(delay).toBe(MAX_RETRY_AFTER_MS);
            })
        );
    });

    test("clamps an HTTP-date Retry-After to [0, MAX_RETRY_AFTER_MS]", () => {
        fc.assert(
            fc.property(fc.integer({ min: 0, max: 600_000 }), (offsetMs) => {
                const now = Date.now();
                const date = new Date(now + offsetMs).toUTCString();
                const delay = parseRetryAfter(date, now);
                expect(delay).not.toBeNull();
                expect(delay).toBeGreaterThanOrEqual(0);
                expect(delay!).toBeLessThanOrEqual(MAX_RETRY_AFTER_MS);
            })
        );
    });

    test("returns null for an empty, undefined, or null header", () => {
        fc.assert(
            fc.property(fc.constantFrom("", undefined, null as unknown as undefined), (header) => {
                expect(parseRetryAfter(header, Date.now())).toBeNull();
            })
        );
    });

    test("returns null for a non-numeric, non-date string", () => {
        fc.assert(
            fc.property(
                fc
                    .string({ minLength: 1, maxLength: 20 })
                    .filter((s) => !Number.isFinite(Number(s)) && !Number.isFinite(Date.parse(s))),
                (header) => {
                    expect(parseRetryAfter(header, Date.now())).toBeNull();
                }
            )
        );
    });
});

describe("getBackoffDelay property tests", () => {
    test("never exceeds maxDelayMs and grows exponentially with the attempt", () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 1, max: 10_000 }),
                fc.integer({ min: 1, max: 100_000 }),
                fc.integer({ min: 0, max: 20 }),
                (baseDelayMs, maxDelayMs, attempt) => {
                    const policy = makePolicy({ baseDelayMs, maxDelayMs });
                    const cap = getBackoffDelay(attempt, policy);
                    expect(cap).toBeGreaterThanOrEqual(0);
                    expect(cap).toBeLessThanOrEqual(maxDelayMs);
                    expect(cap).toBe(Math.min(baseDelayMs * 2 ** attempt, maxDelayMs));
                }
            )
        );
    });
});

describe("applyJitter property tests", () => {
    test("with jitter enabled, the delay always falls in [0, cap]", () => {
        fc.assert(
            fc.property(fc.integer({ min: 0, max: 100_000 }), (cap) => {
                const policy = makePolicy({ jitter: true });
                const delay = applyJitter(cap, policy);
                expect(delay).toBeGreaterThanOrEqual(0);
                expect(delay).toBeLessThanOrEqual(cap);
            })
        );
    });

    test("with jitter disabled, the delay equals the cap exactly", () => {
        fc.assert(
            fc.property(fc.integer({ min: 0, max: 100_000 }), (cap) => {
                const policy = makePolicy({ jitter: false });
                const delay = applyJitter(cap, policy);
                expect(delay).toBe(cap);
            })
        );
    });

    test("a zero cap always yields zero regardless of jitter", () => {
        fc.assert(
            fc.property(fc.boolean(), (jitter) => {
                const policy = makePolicy({ jitter });
                expect(applyJitter(0, policy)).toBe(0);
            })
        );
    });
});
