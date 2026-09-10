/**
 * Interactive helper that obtains an AniList OAuth2 access token and writes
 * it to `.env` as `ANILIST_TOKEN`, the key the live integration suite gates on.
 *
 * Two modes:
 *   default          — authorization-code flow in the browser
 *   --refresh        — exchange a previously stored `ANILIST_REFRESH_TOKEN`
 *
 * The flow reuses the shipped auth helpers (`buildAuthorizationUrl`,
 * `getAccessToken`, `refreshAccessToken`) so the CLI exercises the same
 * code paths the library users will.
 *
 * AniList apps always require a client secret (create one at
 * https://anilist.co/settings/developer). Unlike MAL there is no PKCE — the
 * secret authenticates the client — and the redirect URI must match what the
 * app registered, so it is passed at both the authorize and exchange steps.
 *
 * Usage:
 *   npx tsx scripts/tokens/anilist-token.ts --client-id <id> --client-secret <secret> --redirect-uri <uri>
 *   npx tsx scripts/tokens/anilist-token.ts --refresh
 *
 * The access token is never printed to the console; only its expiry is shown.
 * Credentials land in `.env`, which is gitignored.
 */
import { randomBytes } from "node:crypto";
import {
    buildAuthorizationUrl,
    getAccessToken,
    getTokenExpiry,
    refreshAccessToken,
    type AniListTokenResponse,
} from "../../src/apis/graphql/anilist/auth";
import {
    ENV_PATH,
    flagValue,
    loadStoredEnvValue,
    promptForCode,
    resolveCredential,
    runCliEntry,
    saveEnvEntry,
} from "./token-cli";

/** Keys this script manages inside `.env`. */
const ENV_KEYS = {
    clientId: "ANILIST_CLIENT_ID",
    secret: "ANILIST_CLIENT_SECRET",
    redirectUri: "ANILIST_REDIRECT_URI",
    token: "ANILIST_TOKEN",
    refreshToken: "ANILIST_REFRESH_TOKEN",
} as const;

/** Where AniList client applications are created. */
const CREATE_URL = "https://anilist.co/settings/developer";

/**
 * Runs the browser-based authorization-code flow: build the authorize URL,
 * let the user approve it, then exchange the pasted code for tokens.
 */
async function runAuthorizationFlow(
    clientId: string,
    clientSecret: string,
    redirectUri: string
): Promise<AniListTokenResponse> {
    const state = randomBytes(16).toString("hex");
    const authorizeUrl = buildAuthorizationUrl(clientId, redirectUri, state);
    const code = await promptForCode(authorizeUrl, "AniList", state);
    return getAccessToken(clientId, clientSecret, code, redirectUri);
}

/**
 * Renews a stored access token using the refresh token from a prior run.
 *
 * Fails with a pointer to the browser flow when no refresh token was saved.
 */
async function runRefreshFlow(
    clientId: string,
    clientSecret: string
): Promise<AniListTokenResponse> {
    const refreshToken = await loadStoredEnvValue(ENV_KEYS.refreshToken);
    if (refreshToken === undefined) {
        throw new Error(
            `No ${ENV_KEYS.refreshToken} in ${ENV_PATH}. Run the default flow first to store one.`
        );
    }
    return refreshAccessToken(clientId, clientSecret, refreshToken);
}

/**
 * CLI core, kept free of process side effects so it stays testable.
 *
 * @returns Exit code: 0 on success, 1 on a usage or token-flow failure.
 */
async function run(argv: string[]): Promise<number> {
    const refresh = argv.includes("--refresh");

    try {
        const clientId = await resolveCredential(
            flagValue(argv, "--client-id"),
            "--client-id",
            "ANILIST_CLIENT_ID",
            ENV_KEYS.clientId,
            "client id",
            CREATE_URL
        );
        const clientSecret = await resolveCredential(
            flagValue(argv, "--client-secret"),
            "--client-secret",
            "ANILIST_CLIENT_SECRET",
            ENV_KEYS.secret,
            "client secret",
            CREATE_URL
        );
        // The redirect URI is remembered after the first run; the authorize
        // and exchange steps must send the same value the app registered.
        const redirectUri =
            flagValue(argv, "--redirect-uri") ??
            process.env.ANILIST_REDIRECT_URI ??
            (await loadStoredEnvValue(ENV_KEYS.redirectUri));
        if (redirectUri === undefined) {
            throw new Error(
                "No redirect URI. Pass --redirect-uri <uri> or store " +
                    `${ENV_KEYS.redirectUri} in ${ENV_PATH}. It must match the app's registered redirect URI.`
            );
        }

        // Remember the client identity so future runs (and --refresh) can find it.
        await saveEnvEntry(ENV_KEYS.clientId, clientId);
        await saveEnvEntry(ENV_KEYS.secret, clientSecret);
        await saveEnvEntry(ENV_KEYS.redirectUri, redirectUri);

        const response = refresh
            ? await runRefreshFlow(clientId, clientSecret)
            : await runAuthorizationFlow(clientId, clientSecret, redirectUri);

        await saveEnvEntry(ENV_KEYS.token, response.access_token);
        if (response.refresh_token !== undefined) {
            await saveEnvEntry(ENV_KEYS.refreshToken, response.refresh_token);
        }

        const expiresAt = getTokenExpiry(response);
        console.log(`Access token written to ${ENV_PATH} as ${ENV_KEYS.token}.`);
        if (response.refresh_token !== undefined) {
            console.log(`Refresh token stored as ${ENV_KEYS.refreshToken}.`);
        }
        console.log(`The access token expires at ${expiresAt.toISOString()}.`);
        console.log("When it does, rerun with --refresh to renew it without the browser flow.");
        return 0;
    } catch (error) {
        console.error(error instanceof Error ? error.message : String(error));
        return 1;
    }
}

runCliEntry(run, import.meta.url);
