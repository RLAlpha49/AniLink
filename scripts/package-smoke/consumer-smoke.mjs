/**
 * Real-usage smoke test for the packaged `anilink-api-wrapper` tarball.
 *
 * This file is copied into an isolated consumer project that installs the
 * packed `.tgz`, then executed with plain `node` — no tsx, no vitest, no
 * workspace source. It proves the published artifact (ESM entry, exports map,
 * bundled code) works end-to-end against the live AniList API.
 *
 * Queries only. No mutation operation is ever invoked, so the authenticated
 * account stays read-only even if a token is provided.
 *
 * Run via: `npm run test:package` (see scripts/test-packaged-package.mjs).
 */
import { AniLink } from "anilink-api-wrapper";
import { buildMalAuthorizationUrl } from "anilink-api-wrapper/mal";

/** Well-known public fixtures that are stable in the AniList database. */
const FIXTURES = {
    mediaId: 1, // Cowboy Bebop
    characterSearch: "Spike Spiegel",
    staffId: 95011,
    studioId: 1, // Sunrise
    userId: 542244,
};

const token = process.env.ANILIST_TOKEN;
const client = new AniLink(token);

/** AniList allows 30 requests per minute; space calls to stay under it. */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const RATE_LIMIT_SPACING_MS = 2_100;

/**
 * One named live check with its own spacing and assertion message.
 *
 * @param {string} name - Human-readable check name printed on failure.
 * @param {() => Promise<void>} fn - The assertions for this check.
 */
async function check(name, fn) {
    await sleep(RATE_LIMIT_SPACING_MS);
    try {
        await fn();
        console.log(`  ok   ${name}`);
    } catch (error) {
        console.error(`  FAIL ${name}`);
        throw error;
    }
}

/**
 * Assert a condition, throwing a concise error otherwise.
 *
 * @param {unknown} condition - Falsy values fail the check.
 * @param {string} message - Assertion description used in the thrown error.
 */
function assert(condition, message) {
    if (!condition) throw new Error(`assertion failed: ${message}`);
}

console.log(`anilink-api-wrapper packaged smoke test (token: ${token ? "present" : "absent"})`);

const malAuthorizeUrl = buildMalAuthorizationUrl("mal-client", "pkce-challenge");
assert(
    malAuthorizeUrl.startsWith("https://myanimelist.net/v1/oauth2/authorize?"),
    "MAL subpath should resolve"
);
console.log("  ok   MAL subpath exports resolve");

await check("media resolves by id", async () => {
    const media = await client.anilist.query.media({ id: FIXTURES.mediaId, type: "ANIME" });
    assert(media.id === FIXTURES.mediaId, `expected id ${FIXTURES.mediaId}, got ${media.id}`);
    assert(Boolean(media.title), "media.title should be defined");
});

await check("user resolves by id", async () => {
    const user = await client.anilist.query.user({ id: FIXTURES.userId });
    assert(user.id === FIXTURES.userId, `expected id ${FIXTURES.userId}, got ${user.id}`);
    assert(typeof user.name === "string" && user.name.length > 0, "user.name should be non-empty");
});

await check("character resolves by search", async () => {
    const character = await client.anilist.query.character({ search: FIXTURES.characterSearch });
    assert(character.id > 0, "character.id should be positive");
    assert(Boolean(character.name), "character.name should be defined");
});

await check("staff resolves by id", async () => {
    const staff = await client.anilist.query.staff({ id: FIXTURES.staffId });
    assert(staff.id === FIXTURES.staffId, `expected id ${FIXTURES.staffId}, got ${staff.id}`);
});

await check("studio resolves by id", async () => {
    const studio = await client.anilist.query.studio({ id: FIXTURES.studioId });
    assert(studio.id === FIXTURES.studioId, `expected id ${FIXTURES.studioId}, got ${studio.id}`);
    assert(
        typeof studio.isAnimationStudio === "boolean",
        "studio.isAnimationStudio should be boolean"
    );
});

await check("genreCollection returns a non-empty list", async () => {
    const genres = await client.anilist.query.genreCollection();
    assert(Array.isArray(genres) && genres.length > 0, "genreCollection should return entries");
});

await check("page.medias paginates with type filter", async () => {
    const page = await client.anilist.query.page.medias({ page: 1, perPage: 5, type: "ANIME" });
    assert(page.pageInfo.currentPage === 1, "pageInfo.currentPage should be 1");
    assert(page.media.length > 0 && page.media.length <= 5, "media page should have entries");
});

if (token) {
    await check("viewer returns the authenticated account", async () => {
        const viewer = await client.anilist.query.viewer();
        assert(viewer.id > 0, "viewer.id should be positive");
        assert(typeof viewer.name === "string" && viewer.name.length > 0, "viewer.name required");
    });
} else {
    console.log("  skip viewer (no ANILIST_TOKEN)");
}

console.log("\nAll packaged-package smoke checks passed.");
