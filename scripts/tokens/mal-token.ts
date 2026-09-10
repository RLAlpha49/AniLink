/**
 * Interactive helper that obtains a MyAnimeList OAuth2 access token and writes
 * it to `.env` as `MAL_TOKEN`, the key the live integration suite gates on.
 *
 * Two modes:
 *   default          — full PKCE authorization-code flow in the browser
 *   --refresh        — exchange a previously stored `MAL_REFRESH_TOKEN`
 *
 * The flow reuses the shipped auth helpers (`buildMalAuthorizationUrl`,
 * `getMalAccessToken`, `refreshMalAccessToken`) so the CLI exercises the same
 * code paths the library users will.
 *
 * Web-type MAL clients (registered at myanimelist.net/apiconfig) issue a
 * Client Secret and reject secretless token exchanges with 401 invalid_client;
 * pass it via --client-secret, MAL_CLIENT_SECRET, or a stored .env entry.
 * Mobile-type clients need no secret — PKCE authenticates the client id alone.
 *
 * Usage:
 *   npx tsx scripts/tokens/mal-token.ts [--client-id <id>] [--client-secret <secret>]
 *   npx tsx scripts/tokens/mal-token.ts --refresh
 *
 * The access token is never printed to the console; only its expiry is shown.
 * Credentials land in `.env`, which is gitignored.
 */
import { randomBytes } from "node:crypto";
import {
    buildMalAuthorizationUrl,
    getMalAccessToken,
    getMalTokenExpiry,
    refreshMalAccessToken,
    type MalTokenResponse,
} from "../../src/apis/rest/mal/auth";
import {
    ENV_PATH,
    flagValue,
    loadStoredEnvValue,
    promptForCode,
    resolveCredential,
    resolveOptionalCredential,
    runCliEntry,
    saveEnvEntry,
} from "./token-cli";

/** Keys this script manages inside `.env`. */
const ENV_KEYS = {
    clientId: "MAL_CLIENT_ID",
    secret: "MAL_CLIENT_SECRET",
    token: "MAL_TOKEN",
    refreshToken: "MAL_REFRESH_TOKEN",
} as const;

/** Where MAL client applications are created. */
const CREATE_URL = "https://myanimelist.net/apiconfig";

/**
 * Generates the PKCE pair MAL expects: a random verifier and its challenge.
 *
 * MAL's authorization server supports only the plain PKCE method, so the
 * challenge is the verifier itself — no SHA-256 step. An S256 challenge is
 * accepted at the authorize step but fails the token exchange with 400.
 */
function createPkcePair(): { verifier: string; challenge: string } {
    const verifier = randomBytes(48).toString("base64url");
    return { verifier, challenge: verifier };
}

/**
 * Runs the browser-based PKCE flow: build the authorize URL, let the user
 * approve it, then exchange the pasted authorization code for tokens.
 */
async function runAuthorizationFlow(
    clientId: string,
    clientSecret?: string
): Promise<MalTokenResponse> {
    const { verifier, challenge } = createPkcePair();
    const state = randomBytes(16).toString("hex");
    const authorizeUrl = buildMalAuthorizationUrl(clientId, challenge, state);
    const code = await promptForCode(authorizeUrl, "MAL", state);
    return getMalAccessToken({ clientId, code, codeVerifier: verifier, clientSecret });
}

/**
 * Renews a stored access token using the refresh token from a prior run.
 *
 * Fails with a pointer to the browser flow when no refresh token was saved.
 */
async function runRefreshFlow(clientId: string, clientSecret?: string): Promise<MalTokenResponse> {
    const refreshToken = await loadStoredEnvValue(ENV_KEYS.refreshToken);
    if (refreshToken === undefined) {
        throw new Error(
            `No ${ENV_KEYS.refreshToken} in ${ENV_PATH}. Run the default flow first to store one.`
        );
    }
    return refreshMalAccessToken({ clientId, refreshToken, clientSecret });
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
            "MAL_CLIENT_ID",
            ENV_KEYS.clientId,
            "client id",
            CREATE_URL
        );
        const clientSecret = await resolveOptionalCredential(
            flagValue(argv, "--client-secret"),
            "MAL_CLIENT_SECRET",
            ENV_KEYS.secret
        );

        // Remember the client identity so future runs (and --refresh) can find it.
        await saveEnvEntry(ENV_KEYS.clientId, clientId);
        if (clientSecret !== undefined) {
            await saveEnvEntry(ENV_KEYS.secret, clientSecret);
        }

        const response = refresh
            ? await runRefreshFlow(clientId, clientSecret)
            : await runAuthorizationFlow(clientId, clientSecret);

        await saveEnvEntry(ENV_KEYS.token, response.access_token);
        if (response.refresh_token !== undefined) {
            await saveEnvEntry(ENV_KEYS.refreshToken, response.refresh_token);
        }

        const expiresAt = getMalTokenExpiry(response);
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
