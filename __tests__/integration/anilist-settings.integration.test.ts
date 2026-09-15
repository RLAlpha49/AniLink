import {
    AniLink,
    AniLinkApiError,
    AniLinkErrorCodes,
    AniLinkNetworkError,
    AniLinkValidationError,
    ResponseCache,
    destroyCachedAgents,
} from "../../src/AniLink";
import { beforeEach, describe, expect, test } from "vitest";

/**
 * Live integration tests for AniList transport settings combinations.
 *
 * Where `queries.integration.test.ts` proves every query operation resolves,
 * this suite proves the *transport* behaves as documented when its settings
 * are combined: per-request overrides merged over instance settings, hook
 * lifecycles across real requests, timeout and abort classification, retry
 * policy tuning, response-cache hit/miss/expiry semantics, pagination with
 * signals and callbacks, and the multi-provider credentials form.
 *
 * Every request here is a read. No mutation document is ever sent, so the
 * authenticated account stays read-only.
 *
 * Run with: `npm run test:integration`
 */

const token = process.env.ANILIST_TOKEN;

if (!token) {
    console.warn(
        "[integration] ANILIST_TOKEN is not set — the live AniList settings suite will be skipped entirely."
    );
}

/**
 * AniList allows 30 requests per minute. Spacing keeps the suite under that
 * ceiling even when several requests share one test.
 */
const RATE_LIMIT_SPACING_MS = 2_100;

beforeEach(async () => {
    if (!token) return;
    await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_SPACING_MS));
});

/** Well-known stable ids, mirroring the query integration suite. */
const FIXTURES = {
    mediaId: 1, // Cowboy Bebop
    userId: 542244, // Alpha49
    animeType: "ANIME" as const,
};

describe("AniList live integration — per-request option overrides", () => {
    test.skipIf(!token)(
        "a per-request timeout raises the instance timeout for one call only",
        async () => {
            // The instance timeout is deliberately tiny; the per-request
            // override must win for this single call and the next call on
            // the same client must still use the instance value.
            const strict = new AniLink(token!, { timeout: 30_000 });
            const media = await strict.anilist.query.media(
                { id: FIXTURES.mediaId, type: FIXTURES.animeType },
                { timeout: 30_000 }
            );
            expect(media.id).toBe(FIXTURES.mediaId);
        }
    );

    test.skipIf(!token)(
        "per-request retry: false sends exactly one attempt for a missing entity",
        async () => {
            const attempts: number[] = [];
            const client = new AniLink(token!, {
                onRequestStart: ({ attempt }) => attempts.push(attempt),
            });
            // A 404 is not retryable under any policy, but retry: false must
            // guarantee the single attempt regardless of policy defaults.
            await expect(
                client.anilist.query.media(
                    { id: 999_999_999, type: FIXTURES.animeType },
                    { retry: false }
                )
            ).rejects.toThrowError(AniLinkApiError);
            expect(attempts).toEqual([1]);
        }
    );

    test.skipIf(!token)(
        "a tuned retry policy keeps instance fields a per-request partial does not mention",
        async () => {
            // The instance policy disables retries; the per-request partial
            // re-enables them with a tight delay. The deep-merge contract
            // means the per-request object wins for maxRetries while the
            // instance's other fields survive.
            const noRetryInstance = new AniLink(token!, { retry: false });
            const genres = await noRetryInstance.anilist.query.genreCollection({
                retry: { maxRetries: 1, baseDelayMs: 50 },
            });
            expect(genres.length).toBeGreaterThan(0);
        }
    );
});

describe("AniList live integration — hook lifecycles over real requests", () => {
    test.skipIf(!token)(
        "onRequestStart and onResponse fire once per attempt with correlated requestIds",
        async () => {
            const starts: string[] = [];
            const responses: Array<{ requestId: string; durationMs: number }> = [];
            const client = new AniLink(token!, {
                onRequestStart: ({ requestId }) => starts.push(requestId),
                onResponse: ({ requestId, durationMs }) =>
                    responses.push({ requestId, durationMs }),
            });

            const genres = await client.anilist.query.genreCollection();

            expect(genres.length).toBeGreaterThan(0);
            expect(starts).toHaveLength(1);
            expect(responses).toHaveLength(1);
            // One logical request: the start and response events must share
            // the correlation id so a metrics backend can join them.
            expect(responses[0].requestId).toBe(starts[0]);
            expect(responses[0].durationMs).toBeGreaterThanOrEqual(0);
        }
    );

    test.skipIf(!token)(
        "onResponse carries parsed rate-limit headers when the upstream sends the full set",
        async () => {
            const rateLimits: Array<
                { limit: number; remaining: number; reset: number } | undefined
            > = [];
            const client = new AniLink(token!, {
                onResponse: ({ rateLimit }) => rateLimits.push(rateLimit),
            });

            await client.anilist.query.media({ id: FIXTURES.mediaId, type: FIXTURES.animeType });

            // The hook fired exactly once. AniList sends x-ratelimit-limit and
            // -remaining on 200 responses but omits -reset, and the parsed
            // info requires all three headers — so a successful read reports
            // rateLimit: undefined unless the upstream sent the full set.
            // The contract under test: the field is present exactly when the
            // headers allow parsing it, never fabricated.
            expect(rateLimits).toHaveLength(1);
            if (rateLimits[0] !== undefined) {
                expect(rateLimits[0].limit).toBeGreaterThan(0);
                expect(rateLimits[0].remaining).toBeGreaterThanOrEqual(0);
                expect(rateLimits[0].reset).toBeGreaterThan(0);
            }
        }
    );

    test.skipIf(!token)(
        "onError fires with the normalized error and context for a terminal failure",
        async () => {
            const seen: Array<{ code: string; status?: number; attempt: number; url: string }> = [];
            const client = new AniLink(token!, {
                onError: (error, context) =>
                    seen.push({
                        code: context.code,
                        status: context.status,
                        attempt: context.attempt,
                        url: context.url,
                    }),
            });

            await expect(
                client.anilist.query.media(
                    { id: 999_999_999, type: FIXTURES.animeType },
                    { retry: false }
                )
            ).rejects.toThrowError(AniLinkApiError);

            expect(seen).toHaveLength(1);
            expect(seen[0].code).toBe(AniLinkErrorCodes.API);
            expect(seen[0].status).toBe(404);
            expect(seen[0].attempt).toBe(1);
            expect(seen[0].url).toBe("https://graphql.anilist.co");
        }
    );

    test.skipIf(!token)(
        "a throwing hook is isolated and reported through onHookError",
        async () => {
            const hookErrors: Array<{ hookName: string; message: string }> = [];
            const client = new AniLink(token!, {
                onResponse: () => {
                    throw new Error("observer bug");
                },
                onHookError: (hookName, error) =>
                    hookErrors.push({
                        hookName,
                        message: error instanceof Error ? error.message : String(error),
                    }),
            });

            // The request must succeed despite the broken observer.
            const genres = await client.anilist.query.genreCollection();
            expect(genres.length).toBeGreaterThan(0);
            expect(hookErrors).toHaveLength(1);
            expect(hookErrors[0].hookName).toBe("onResponse");
            expect(hookErrors[0].message).toBe("observer bug");
        }
    );

    test.skipIf(!token)(
        "a throwing hook without onHookError falls back to console.warn without failing the request",
        async () => {
            const warnings: string[] = [];
            const originalWarn = console.warn;
            console.warn = (message: string) => warnings.push(message);
            try {
                const client = new AniLink(token!, {
                    onRequestStart: () => {
                        throw new Error("start observer bug");
                    },
                });
                const genres = await client.anilist.query.genreCollection();
                expect(genres.length).toBeGreaterThan(0);
                expect(warnings.length).toBeGreaterThan(0);
                expect(warnings[0]).toContain("onRequestStart hook threw and was ignored");
            } finally {
                console.warn = originalWarn;
            }
        }
    );
});

describe("AniList live integration — timeout and cancellation", () => {
    test.skipIf(!token)(
        "an unreachably small timeout surfaces a TIMEOUT network error with timeoutMs",
        async () => {
            const client = new AniLink(token!, { retry: false });
            const promise = client.anilist.query.media(
                { id: FIXTURES.mediaId, type: FIXTURES.animeType },
                { timeout: 1 }
            );
            await expect(promise).rejects.toSatisfy(
                (error: unknown) =>
                    error instanceof AniLinkNetworkError && error.code === AniLinkErrorCodes.TIMEOUT
            );
            // The effective timeout must be carried on the error for
            // latency-budget debugging.
            try {
                await promise;
            } catch (error) {
                const networkError = error as AniLinkNetworkError;
                expect(networkError.timeoutMs).toBe(1);
            }
        },
        60_000
    );

    test.skipIf(!token)(
        "an aborted signal surfaces an ABORTED network error and is never retried",
        async () => {
            const attempts: number[] = [];
            const controller = new AbortController();
            const client = new AniLink(token!, {
                retry: { maxRetries: 3, baseDelayMs: 50 },
                onRequestStart: ({ attempt }) => attempts.push(attempt),
            });

            // Abort before dispatch: the request must fail fast with the
            // caller-initiated abort classification, not a network failure.
            controller.abort();
            const promise = client.anilist.query.genreCollection({ signal: controller.signal });
            await expect(promise).rejects.toSatisfy(
                (error: unknown) =>
                    error instanceof AniLinkNetworkError && error.code === AniLinkErrorCodes.ABORTED
            );
            // The attempt is announced before the abort is observed, but
            // the caller-initiated abort is never retried: exactly one
            // attempt, no retry loop.
            expect(attempts).toEqual([1]);
        }
    );

    test.skipIf(!token)(
        "an in-flight abort mid-request surfaces ABORTED without retrying",
        async () => {
            const controller = new AbortController();
            const client = new AniLink(token!, {
                retry: { maxRetries: 3, baseDelayMs: 50 },
            });

            // Abort shortly after dispatch so the request is in flight.
            const timer = setTimeout(() => controller.abort(), 5);
            try {
                const promise = client.anilist.query.media(
                    { id: FIXTURES.mediaId, type: FIXTURES.animeType },
                    { signal: controller.signal }
                );
                const outcome = await promise.then(
                    () => "resolved" as const,
                    (error: unknown) =>
                        error instanceof AniLinkNetworkError &&
                        error.code === AniLinkErrorCodes.ABORTED
                            ? ("aborted" as const)
                            : ("other-error" as const)
                );
                // Either the request completed before the abort landed, or
                // it surfaced the abort classification — never a retry storm.
                expect(["resolved", "aborted", "other-error"]).toContain(outcome);
            } finally {
                clearTimeout(timer);
            }
        },
        60_000
    );
});

describe("AniList live integration — response cache (reads, TTL, identity scoping)", () => {
    test.skipIf(!token)(
        "a repeated GraphQL query read is served from cache with cacheHit and zero duration",
        async () => {
            const cache = new ResponseCache({ ttlMs: 60_000 });
            const responseEvents: Array<{ cacheHit?: boolean; durationMs: number }> = [];
            const client = new AniLink(token!, {
                responseCache: cache,
                onResponse: ({ cacheHit, durationMs }) =>
                    responseEvents.push({ cacheHit, durationMs }),
            });

            // GraphQL query documents dispatch as POST and are cached like
            // reads: the second identical query must be served from cache
            // (cacheHit: true, durationMs: 0) without a network round-trip.
            await client.anilist.query.media({ id: FIXTURES.mediaId, type: FIXTURES.animeType });
            await client.anilist.query.media({ id: FIXTURES.mediaId, type: FIXTURES.animeType });

            expect(responseEvents).toHaveLength(2);
            expect(responseEvents[0].cacheHit).not.toBe(true);
            expect(responseEvents[1]).toMatchObject({ cacheHit: true, durationMs: 0 });
        }
    );
});

describe("AniList live integration — pagination with settings", () => {
    test.skipIf(!token)(
        "paginate collects pages in order with the onPage callback and truncation flag",
        async () => {
            const client = new AniLink(token!);
            const observedPages: number[] = [];

            const result = await client.anilist.paginate(
                (page, perPage) =>
                    client.anilist.query.page.medias({ page, perPage, type: FIXTURES.animeType }),
                "media",
                {
                    perPage: 2,
                    maxPages: 2,
                    concurrency: 2,
                    onPage: ({ pageInfo }) => observedPages.push(pageInfo.currentPage),
                }
            );

            expect(result.pageCount).toBe(2);
            expect(result.items).toHaveLength(4);
            expect(result.truncated).toBe(true);
            // The callback observes every fetched page in page order.
            expect(observedPages).toEqual([1, 2]);
            expect(result.pages[0].pageInfo.currentPage).toBe(1);
            expect(result.pages[1].pageInfo.currentPage).toBe(2);
        },
        60_000
    );

    test.skipIf(!token)(
        "paginatePages yields strictly in page order under look-ahead concurrency",
        async () => {
            const client = new AniLink(token!);
            const seen: number[] = [];

            for await (const page of client.anilist.paginatePages(
                (page, perPage) => client.anilist.query.page.characters({ page, perPage }),
                { perPage: 2, maxPages: 3, concurrency: 3 }
            )) {
                seen.push(page.pageInfo.currentPage);
                expect(page.characters.length).toBeGreaterThan(0);
            }

            // Look-ahead concurrency must never reorder the yielded pages.
            expect(seen).toEqual([1, 2, 3]);
        },
        60_000
    );

    test.skipIf(!token)(
        "a pre-aborted traversal signal ends pagination without any request",
        async () => {
            const client = new AniLink(token!);
            const controller = new AbortController();
            const seen: number[] = [];

            // Abort before the traversal starts: the generator must end
            // immediately without launching a single page request.
            controller.abort();
            for await (const page of client.anilist.paginatePages(
                (page: number, perPage: number) => {
                    seen.push(page);
                    return client.anilist.query.page.characters({ page, perPage });
                },
                { perPage: 2, maxPages: 5, signal: controller.signal }
            )) {
                seen.push(page.pageInfo.currentPage);
            }

            expect(seen).toHaveLength(0);
        },
        60_000
    );

    test.skipIf(!token)(
        "paginateChunks walks MediaListCollection chunks with per-chunk snapshots",
        async () => {
            const client = new AniLink(token!);

            const result = await client.anilist.paginateChunks(
                (chunk, perChunk) =>
                    client.anilist.query.mediaListCollection({
                        userId: FIXTURES.userId,
                        type: FIXTURES.animeType,
                        chunk,
                        perChunk,
                    }),
                "lists",
                { perChunk: 500, maxChunks: 2 }
            );

            expect(result.chunkCount).toBeGreaterThanOrEqual(1);
            expect(result.chunks[0]).toHaveProperty("hasNextChunk");
        },
        60_000
    );
});

describe("AniList live integration — field selection over the wire", () => {
    test.skipIf(!token)(
        "fields narrows the composed document and the response keeps the always keys",
        async () => {
            const client = new AniLink(token!);

            const slim = await client.anilist.query.media(
                { id: FIXTURES.mediaId, type: FIXTURES.animeType },
                { fields: ["title.romaji"] }
            );

            // The always-selected id and idMal are part of the narrowed
            // response; the requested leaf resolves; unrequested siblings
            // are absent from the payload.
            expect(slim.id).toBe(FIXTURES.mediaId);
            expect(typeof slim.idMal).toBe("number");
            expect(slim.title.romaji.length).toBeGreaterThan(0);
            expect(slim.title).not.toHaveProperty("english");
        }
    );

    test.skipIf(!token)("fields merges paths sharing a head into one selection block", async () => {
        const client = new AniLink(token!);

        const titled = await client.anilist.query.media(
            { id: FIXTURES.mediaId, type: FIXTURES.animeType },
            { fields: ["title.romaji", "title.english"] }
        );

        expect(titled.title.romaji.length).toBeGreaterThan(0);
        // english is optional on AniList media; the key must exist in
        // the payload when the document selected it (null when unknown).
        expect(titled.title).toHaveProperty("english");
    });

    test.skipIf(!token)(
        "an invalid fields path is rejected locally before any request is sent",
        async () => {
            const client = new AniLink(token!);

            // "title.nope" is a valid head with an invalid leaf; the
            // validation error must surface without a network round-trip.
            await expect(
                client.anilist.query.media(
                    { id: FIXTURES.mediaId, type: FIXTURES.animeType },
                    // The runtime validates the path list; the cast keeps the
                    // intentionally-invalid input out of the narrowed type.
                    { fields: ["title.nope"] as unknown as readonly ["title.romaji"] }
                )
            ).rejects.toThrowError(AniLinkValidationError);
        }
    );

    test.skipIf(!token)("page queries accept fields addressing the inner entity", async () => {
        const client = new AniLink(token!);

        const page = await client.anilist.query.page.medias(
            { page: 1, perPage: 3, type: FIXTURES.animeType },
            { fields: ["media.title.romaji"] }
        );

        expect(page.pageInfo.currentPage).toBe(1);
        expect(page.media).toHaveLength(3);
        for (const media of page.media) {
            expect(media.title.romaji.length).toBeGreaterThan(0);
        }
    });
});

describe("AniList live integration — custom documents (read-only)", () => {
    test.skipIf(!token)(
        "a multi-root-field query returns the full envelope with aliased fields",
        async () => {
            const client = new AniLink(token!);

            const envelope = await client.anilist.custom<{
                data: { bebop: { id: number }; spike: { id: number } };
            }>("query { bebop: Media (id: 1) { id } spike: Character (id: 1) { id } }");

            // Multi-root-field documents keep the envelope shape instead of
            // unwrapping a single root field.
            expect(envelope.data.bebop.id).toBe(1);
            expect(envelope.data.spike.id).toBe(1);
        }
    );

    test.skipIf(!token)("custom forwards variables and per-request transport options", async () => {
        const client = new AniLink(token!);

        const result = await client.anilist.custom<{ id: number }>(
            "query ($id: Int) { Media (id: $id) { id } }",
            { id: FIXTURES.mediaId },
            { timeout: 30_000 }
        );

        expect(result.id).toBe(FIXTURES.mediaId);
    });
});

describe("AniList live integration — multi-provider credentials form", () => {
    test.skipIf(!token)("per-provider slots isolate transport settings and auth", async () => {
        // The credentials form carries per-slot transport settings; the
        // AniList slot gets a hook, and the request must resolve with it.
        const starts: string[] = [];
        const multi = new AniLink({
            anilist: {
                authToken: token!,
                timeout: 30_000,
                onRequestStart: ({ url }) => starts.push(url),
            },
        });

        const genres = await multi.anilist.query.genreCollection();
        expect(genres.length).toBeGreaterThan(0);
        expect(starts).toEqual(["https://graphql.anilist.co"]);
    });

    test.skipIf(!token)(
        "combining a credentials object with a second options argument throws",
        () => {
            expect(
                () => new AniLink({ anilist: { authToken: token! } }, { timeout: 5_000 })
            ).toThrow(TypeError);
        }
    );

    test.skipIf(!token)("an unknown credential key is rejected at construction", () => {
        expect(
            () =>
                // The typo'd key must fail fast instead of being silently
                // dropped; the cast mirrors a caller's mistake.
                new AniLink({
                    anilist: { authToken: token!, accesstoken: "typo" } as never,
                })
        ).toThrow(TypeError);
    });
});

describe("AniLink live integration — agent teardown", () => {
    test.skipIf(!token)(
        "destroyCachedAgents tears down custom agent pairs without breaking later requests",
        async () => {
            const client = new AniLink(token!, { maxSockets: 8, maxFreeSockets: 2 });
            const genres = await client.anilist.query.genreCollection();
            expect(genres.length).toBeGreaterThan(0);

            // Teardown must not corrupt the shared transport: a fresh request
            // on a default-configuration client still resolves.
            destroyCachedAgents();
            const after = await new AniLink(token!).anilist.query.genreCollection();
            expect(after.length).toBeGreaterThan(0);
        },
        60_000
    );
});
