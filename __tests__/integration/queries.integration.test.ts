import { AniLink } from "../../src/AniLink";
import { AniLinkApiError } from "../../src/base/AniLinkError";
import { beforeEach, describe, expect, test } from "vitest";

/**
 * Live integration tests for every AniList query operation.
 *
 * These tests run real requests against https://graphql.anilist.co and are
 * therefore skipped unless `ANILIST_TOKEN` is set. Only queries are exercised —
 * never mutations — so the authenticated account stays read-only.
 *
 * Run with: `npm run test:integration`
 */

const token = process.env.ANILIST_TOKEN;

/**
 * AniList allows 30 requests per minute. Each test issues one or two requests,
 * so sleeping briefly before every test keeps the suite under that ceiling.
 */
const RATE_LIMIT_SPACING_MS = 2_100;

/** Shared client; only created when a token is present. */
const client = () => new AniLink(token!);

beforeEach(async () => {
    if (!token) return;
    await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_SPACING_MS));
});

/** Well-known public ids that are stable in the AniList database. */
const FIXTURES = {
    mediaId: 1, // Cowboy Bebop
    characterSearch: "Spike Spiegel",
    staffId: 95011, // Yamadera Kouichi
    studioId: 1, // Sunrise
    userId: 542244, // Alpha49
    threadId: 2,
    threadCommentId: 1,
    activityReplyId: 1,
    activityTypeText: "TEXT" as const,
    animeType: "ANIME" as const,
};

/** Ids far beyond the current AniList id space, so lookups miss. */
const NONEXISTENT_MEDIA_ID = 999_999_999;
const NONEXISTENT_CHARACTER_ID = 999_999_999;

describe("AniList live integration — root queries", () => {
    test.skipIf(!token)("user resolves by id", async () => {
        const user = await client().anilist.query.user({ id: FIXTURES.userId });
        expect(user.id).toBe(FIXTURES.userId);
        expect(user.name).toBeTruthy();
    });

    test.skipIf(!token)("media resolves by id", async () => {
        const media = await client().anilist.query.media({
            id: FIXTURES.mediaId,
            type: FIXTURES.animeType,
        });
        expect(media.id).toBe(FIXTURES.mediaId);
        expect(media.title).toBeDefined();
    });

    test.skipIf(!token)("mediaTrend resolves by mediaId", async () => {
        const trend = await client().anilist.query.mediaTrend({ mediaId: FIXTURES.mediaId });
        expect(trend.mediaId).toBe(FIXTURES.mediaId);
    });

    test.skipIf(!token)("airingSchedule resolves by episode", async () => {
        // Any single argument satisfies the "at least 1 argument" rule.
        const schedule = await client().anilist.query.airingSchedule({ id: 395112 });
        expect(schedule.id).toBeGreaterThan(0);
    });

    test.skipIf(!token)("character resolves by search", async () => {
        const character = await client().anilist.query.character({
            search: FIXTURES.characterSearch,
        });
        expect(character.id).toBeGreaterThan(0);
        expect(character.name).toBeDefined();
    });

    test.skipIf(!token)("staff resolves by id", async () => {
        const staff = await client().anilist.query.staff({ id: FIXTURES.staffId });
        expect(staff.id).toBe(FIXTURES.staffId);
    });

    test.skipIf(!token)("mediaList resolves with mediaId alone", async () => {
        const list = await client().anilist.query.mediaList({ mediaId: FIXTURES.mediaId });
        expect(list.mediaId).toBe(FIXTURES.mediaId);
    });

    test.skipIf(!token)("mediaListCollection requires type alongside userId", async () => {
        const collection = await client().anilist.query.mediaListCollection({
            userId: FIXTURES.userId,
            type: FIXTURES.animeType,
            chunk: 1,
            perChunk: 500,
        });
        expect(Array.isArray(collection.lists)).toBe(true);
        expect(typeof collection.hasNextChunk).toBe("boolean");
    });

    test.skipIf(!token)("genreCollection returns a non-empty list", async () => {
        const genres = await client().anilist.query.genreCollection();
        expect(genres.length).toBeGreaterThan(0);
    });

    test.skipIf(!token)("mediaTagCollection returns tags", async () => {
        const tags = (await client().anilist.query.mediaTagCollection()) as unknown as Array<{
            id: number;
            name: string;
        }>;
        expect(tags.length).toBeGreaterThan(0);
        expect(tags[0].name).toBeTruthy();
    });

    test.skipIf(!token)("viewer returns the authenticated account", async () => {
        const viewer = await client().anilist.query.viewer();
        expect(viewer.id).toBeGreaterThan(0);
        expect(viewer.name).toBeTruthy();
    });

    test.skipIf(!token)("notification accepts empty variables when authenticated", async () => {
        const notification = await client().anilist.query.notification({});
        expect(notification).toBeDefined();
    });

    test.skipIf(!token)("studio resolves by id and by search", async () => {
        const studio = await client().anilist.query.studio({ id: FIXTURES.studioId });
        expect(studio.id).toBe(FIXTURES.studioId);
        expect(studio.name).toBeTruthy();

        const searched = await client().anilist.query.studio({ search: "Sunrise" });
        expect(searched.id).toBeGreaterThan(0);
    });

    test.skipIf(!token)("review resolves by id", async () => {
        const review = await client().anilist.query.review({ id: 32759 });
        expect(review.id).toBe(32759);
    });

    test.skipIf(!token)("activity resolves with type TEXT alone", async () => {
        const activity = await client().anilist.query.activity({
            type: FIXTURES.activityTypeText,
        });
        expect(activity).toBeDefined();
    });

    test.skipIf(!token)("activityReply resolves by id", async () => {
        const reply = await client().anilist.query.activityReply({
            id: FIXTURES.activityReplyId,
        });
        expect(reply).toBeDefined();
    });

    test.skipIf(!token)("following and follower require userId", async () => {
        // Following/Follower return the first user related to userId, not userId itself.
        const following = await client().anilist.query.following({ userId: FIXTURES.userId });
        expect(following.id).toBeGreaterThan(0);
        expect(following.name).toBeTruthy();

        const follower = await client().anilist.query.follower({ userId: FIXTURES.userId });
        expect(follower.id).toBeGreaterThan(0);
        expect(follower.name).toBeTruthy();
    });

    test.skipIf(!token)("thread resolves by id", async () => {
        const thread = await client().anilist.query.thread({ id: FIXTURES.threadId });
        expect(thread.id).toBe(FIXTURES.threadId);
    });

    test.skipIf(!token)("threadComment resolves by id", async () => {
        const comments = (await client().anilist.query.threadComment({
            id: FIXTURES.threadCommentId,
        })) as unknown as Array<{ id: number; threadId: number }>;
        expect(comments[0].id).toBe(FIXTURES.threadCommentId);
    });

    test.skipIf(!token)("recommendation resolves by id", async () => {
        const recommendation = await client().anilist.query.recommendation({ id: 1370 });
        expect(recommendation.id).toBe(1370);
    });

    test.skipIf(!token)("markdown renders html from markdown input", async () => {
        // The API wraps the rendered markup in a Markdown object; read `html` from it.
        const result = (await client().anilist.query.markdown({
            markdown: "**bold**",
        })) as unknown as { html?: string };
        expect(result.html ?? String(result)).toContain("<strong>bold</strong>");
    });

    test.skipIf(!token)("aniChartUser returns settings for the viewer", async () => {
        const aniChartUser = await client().anilist.query.aniChartUser();
        expect(aniChartUser.user.id).toBeGreaterThan(0);
        expect(aniChartUser.settings).toBeDefined();
    });

    test.skipIf(!token)("siteStatistics returns trend connections", async () => {
        const stats = await client().anilist.query.siteStatistics();
        expect(stats.users).toBeDefined();
    });

    test.skipIf(!token)("externalLinkSourceCollection returns link sources", async () => {
        const sources = await client().anilist.query.externalLinkSourceCollection();
        expect(sources).toBeDefined();
    });
});

describe("AniList live integration — page queries", () => {
    test.skipIf(!token)("users paginates without variables", async () => {
        const page = await client().anilist.query.page.users({ page: 1, perPage: 3 });
        expect(page.pageInfo.currentPage).toBe(1);
        expect(page.users).toHaveLength(3);
    });

    test.skipIf(!token)("medias paginates with type filter", async () => {
        const page = await client().anilist.query.page.medias({
            page: 1,
            perPage: 3,
            type: FIXTURES.animeType,
        });
        expect(page.pageInfo.hasNextPage).toBe(true);
        expect(page.media).toHaveLength(3);
    });

    test.skipIf(!token)("characters paginates", async () => {
        const page = await client().anilist.query.page.characters({ page: 1, perPage: 3 });
        expect(page.characters).toHaveLength(3);
    });

    test.skipIf(!token)("staffs paginates", async () => {
        const page = await client().anilist.query.page.staffs({ page: 1, perPage: 3 });
        expect(page.staff).toHaveLength(3);
    });

    test.skipIf(!token)("studios paginates", async () => {
        const page = await client().anilist.query.page.studios({ page: 1, perPage: 3 });
        expect(page.studios).toHaveLength(3);
    });

    test.skipIf(!token)("mediaLists paginates for a user", async () => {
        const page = await client().anilist.query.page.mediaLists({
            userId: FIXTURES.userId,
            page: 1,
            perPage: 3,
        });
        expect(page.pageInfo).toBeDefined();
        expect(Array.isArray(page.mediaList)).toBe(true);
    });

    test.skipIf(!token)("airingSchedules paginates", async () => {
        const page = await client().anilist.query.page.airingSchedules({ page: 1, perPage: 3 });
        expect(page.airingSchedules).toHaveLength(3);
    });

    test.skipIf(!token)("mediaTrends paginates", async () => {
        const page = await client().anilist.query.page.mediaTrends({ page: 1, perPage: 3 });
        expect(page.mediaTrends).toHaveLength(3);
    });

    test.skipIf(!token)("notifications paginates when authenticated", async () => {
        const page = await client().anilist.query.page.notifications({ page: 1, perPage: 3 });
        expect(page.pageInfo).toBeDefined();
        expect(Array.isArray(page.notifications)).toBe(true);
    });

    test.skipIf(!token)("followers requires userId and paginates", async () => {
        const page = await client().anilist.query.page.followers({
            userId: FIXTURES.userId,
            page: 1,
            perPage: 3,
        });
        expect(page.followers.length).toBeGreaterThan(0);
    });

    test.skipIf(!token)("following requires userId and paginates", async () => {
        const page = await client().anilist.query.page.following({
            userId: FIXTURES.userId,
            page: 1,
            perPage: 3,
        });
        expect(page.following.length).toBeGreaterThan(0);
    });

    test.skipIf(!token)("activities paginates", async () => {
        const result = (await client().anilist.query.page.activities({
            page: 1,
            perPage: 3,
            type: FIXTURES.activityTypeText,
        })) as unknown as { activities?: unknown[] };
        expect(result.activities?.length ?? 0).toBeGreaterThan(0);
    });

    test.skipIf(!token)("activityReplies paginates for an activity", async () => {
        const replies = (await client().anilist.query.page.activityReplies({
            activityId: 6,
            page: 1,
            perPage: 3,
        })) as unknown as { activityReplies?: unknown[] };
        expect(Array.isArray(replies.activityReplies)).toBe(true);
    });

    test.skipIf(!token)("threads paginates", async () => {
        const page = await client().anilist.query.page.threads({ page: 1, perPage: 3 });
        expect(page.threads).toHaveLength(3);
    });

    test.skipIf(!token)("threadComments requires threadId or userId", async () => {
        const page = await client().anilist.query.page.threadComments({
            threadId: FIXTURES.threadId,
            page: 1,
            perPage: 3,
        });
        expect(page.threadComments.length).toBeGreaterThan(0);
    });

    test.skipIf(!token)("reviews paginates", async () => {
        const page = await client().anilist.query.page.reviews({ page: 1, perPage: 3 });
        expect(page.reviews).toHaveLength(3);
    });

    test.skipIf(!token)("recommendations paginates", async () => {
        const page = await client().anilist.query.page.recommendations({ page: 1, perPage: 3 });
        expect(page.recommendations).toHaveLength(3);
    });

    test.skipIf(!token)("likes requires likeableId and type together", async () => {
        const likes = (await client().anilist.query.page.likes({
            likeableId: 6,
            type: "ACTIVITY",
            page: 1,
            perPage: 5,
        })) as unknown;
        expect(likes).toBeDefined();
    });
});

describe("AniList live integration — pagination helpers", () => {
    test.skipIf(!token)(
        "paginate walks two pages of media and reports pageInfo",
        async () => {
            const result = await client().anilist.paginate(
                (page, perPage) =>
                    client().anilist.query.page.medias({ page, perPage, type: "ANIME" }),
                "media",
                { perPage: 2, maxPages: 2 }
            );
            expect(result.items).toHaveLength(4);
            expect(result.pageCount).toBe(2);
            expect(result.pages[0].pageInfo.currentPage).toBe(1);
            expect(result.pages[1].pageInfo.currentPage).toBe(2);
        },
        60_000
    );

    test.skipIf(!token)(
        "paginatePages yields each page in order",
        async () => {
            const seen: number[] = [];
            for await (const page of client().anilist.paginatePages(
                (page, perPage) => client().anilist.query.page.characters({ page, perPage }),
                { perPage: 2, maxPages: 2 }
            )) {
                seen.push(page.pageInfo.currentPage);
                expect(page.characters.length).toBeGreaterThan(0);
            }
            expect(seen).toEqual([1, 2]);
        },
        60_000
    );

    test.skipIf(!token)(
        "paginateChunks walks MediaListCollection chunks",
        async () => {
            const result = await client().anilist.paginateChunks(
                (chunk, perChunk) =>
                    client().anilist.query.mediaListCollection({
                        userId: FIXTURES.userId,
                        type: "ANIME",
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

describe("AniList live integration — transport behaviour", () => {
    test.skipIf(!token)(
        "retry-enabled client resolves queries end to end",
        async () => {
            // The full 429/backoff matrix is covered by unit tests against a mock
            // transport; here we prove a retry-configured client completes real
            // requests successfully.
            const retrying = new AniLink(token!, {
                retry: { maxRetries: 3, baseDelayMs: 250, maxDelayMs: 5_000 },
            });
            const genres = await retrying.anilist.query.genreCollection();
            expect(genres.length).toBeGreaterThan(0);
        },
        60_000
    );

    test.skipIf(!token)("unauthenticated client fails auth-required queries", async () => {
        const anonymous = new AniLink();
        await expect(anonymous.anilist.query.viewer()).rejects.toThrow();
    });

    test.skipIf(!token)("malformed variables surface a validation error envelope", async () => {
        // AniList answers a variable type mismatch with HTTP 400 and an
        // errors-only envelope, so the pipeline normalizes it to
        // AniLinkApiError instead of unwrapping data.
        const promise = client().anilist.custom<{ id: number }>(
            "query ($id: Int) { Media (id: $id) { id } }",
            { id: "not-a-number" }
        );
        await expect(promise).rejects.toThrowError(AniLinkApiError);
        try {
            await promise;
        } catch (error) {
            expect(error).toBeInstanceOf(AniLinkApiError);
            const apiError = error as AniLinkApiError;
            expect(apiError.status).toBe(400);
            expect(apiError.data).toMatchObject({ errors: [{}] });
        }
    });

    describe("negative paths — malformed GraphQL responses", () => {
        test.skipIf(!token)(
            "media query with nonexistent id rejects with the upstream error preserved",
            async () => {
                // A missing entity comes back as HTTP 404 whose body is a
                // GraphQL envelope carrying an `errors` array plus partial
                // `data`. Axios rejects before unwrapping, so the pipeline
                // normalizes it to AniLinkApiError while keeping the full
                // upstream envelope on `.data` — including the "Not Found."
                // message and the partial `{ Media: null }` payload.
                const promise = client().anilist.query.media({
                    id: NONEXISTENT_MEDIA_ID,
                    type: FIXTURES.animeType,
                });
                await expect(promise).rejects.toThrowError(AniLinkApiError);
                try {
                    await promise;
                } catch (error) {
                    expect(error).toBeInstanceOf(AniLinkApiError);
                    const apiError = error as AniLinkApiError;
                    expect(apiError.status).toBe(404);
                    const envelope = apiError.data as {
                        errors?: Array<{ message?: string }>;
                        data?: Record<string, unknown>;
                    };
                    expect(envelope.errors?.[0]?.message).toContain("Not Found");
                    expect(envelope.data).toMatchObject({ Media: null });
                }
            }
        );

        test.skipIf(!token)(
            "character query with nonexistent id preserves the upstream envelope",
            async () => {
                const promise = client().anilist.query.character({
                    id: NONEXISTENT_CHARACTER_ID,
                });
                await expect(promise).rejects.toThrowError(AniLinkApiError);
                try {
                    await promise;
                } catch (error) {
                    const apiError = error as AniLinkApiError;
                    expect(apiError.status).toBe(404);
                    const envelope = apiError.data as {
                        errors?: Array<{ message?: string }>;
                        data?: Record<string, unknown>;
                    };
                    expect(envelope.errors?.[0]?.message).toContain("Not Found");
                    expect(envelope.data).toMatchObject({ Character: null });
                }
            }
        );

        test.skipIf(!token)(
            "partial multi-root-field failure keeps the envelope in the error payload",
            async () => {
                // One aliased root field targets a real entity while the other
                // misses. AniList still answers HTTP 404 and nulls every root
                // field in `data`, so this pins down that partial results do
                // NOT survive: the whole envelope lands on `.data` of the
                // normalized error, with both fields nulled.
                const promise = client().anilist.custom<{
                    good: { id: number } | null;
                    bad: { id: number } | null;
                }>("query { good: Media (id: 1) { id } bad: Media (id: 999999999) { id } }");
                await expect(promise).rejects.toThrowError(AniLinkApiError);
                try {
                    await promise;
                } catch (error) {
                    const apiError = error as AniLinkApiError;
                    expect(apiError.status).toBe(404);
                    const envelope = apiError.data as {
                        errors?: Array<{ message?: string }>;
                        data?: Record<string, unknown>;
                    };
                    expect(envelope.errors?.[0]?.message).toContain("Not Found");
                    expect(envelope.data).toEqual({ good: null, bad: null });
                }
            }
        );
    });
});
