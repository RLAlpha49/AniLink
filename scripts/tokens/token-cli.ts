/**
 * Shared plumbing for the per-provider token CLI scripts (`mal-token.ts`,
 * `anilist-token.ts`, and future providers with wrappable auth).
 *
 * Each provider script keeps only its flow-specific pieces — how the
 * authorize URL is built, how the code is exchanged — and gets the rest from
 * here: `.env` parsing and upserting, flag parsing, credential resolution,
 * the paste-the-redirect prompt, and the entry-point guard. Adding a provider
 * with OAuth auth means adding a thin script, not another copy of this file.
 */
import { readFile, rename, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import process from "node:process";

/** Path to the environment file the integration suite reads. */
export const ENV_PATH = ".env";

/**
 * Parses a `.env` file into key/value pairs.
 *
 * Hand-rolled instead of pulling in a dotenv dependency: the vitest
 * integration config already loads `.env` itself, so these scripts only need
 * enough to read their own keys and rewrite the file verbatim otherwise.
 */
export function parseEnv(content: string): Map<string, string> {
    const map = new Map<string, string>();
    for (const line of content.split(/\r?\n/)) {
        const match = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/.exec(line.trim());
        if (match) map.set(match[1], stripMatchingQuotes(match[2]));
    }
    return map;
}

/**
 * Removes one pair of matching surrounding quotes from a value.
 *
 * dotenv-style files often wrap values in quotes; the quotes are not part
 * of the value. Unquoted values and internal quote characters are untouched.
 */
function stripMatchingQuotes(value: string): string {
    if (
        value.length >= 2 &&
        ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'")))
    ) {
        return value.slice(1, -1);
    }
    return value;
}

/**
 * Replaces (or appends) one `KEY=value` entry, preserving every other line.
 *
 * A missing trailing newline is normalized so appending never glues two
 * entries together on one line.
 */
export function upsertEnvEntry(content: string, key: string, value: string): string {
    const pattern = new RegExp(`^${key}=.*$`, "gm");
    if (pattern.test(content)) {
        // Replacement callback: `$` and other replacement tokens in value
        // must be written literally, not interpreted by String.replace.
        return content.replace(pattern, () => `${key}=${value}`);
    }
    const prefix = content.length === 0 || content.endsWith("\n") ? "" : "\n";
    return `${content}${prefix}${key}=${value}\n`;
}

/** Reads `.env` if present; an absent file is not an error for a first run. */
export async function loadEnvFile(): Promise<string> {
    try {
        return await readFile(ENV_PATH, "utf8");
    } catch {
        return "";
    }
}

/**
 * Writes `.env` after applying one upsert, keeping unrelated entries intact.
 *
 * The new content lands in a sibling temp file that is renamed over `.env`,
 * so a crash mid-write cannot truncate the stored credentials (including the
 * refresh tokens `--refresh` depends on) and concurrent runs cannot leave a
 * half-written file behind.
 */
export async function saveEnvEntry(key: string, value: string): Promise<void> {
    const content = upsertEnvEntry(await loadEnvFile(), key, value);
    const tempPath = `${ENV_PATH}.${process.pid}.tmp`;
    await writeFile(tempPath, content, "utf8");
    await rename(tempPath, ENV_PATH);
}

/**
 * Reads a stored `.env` value for a key, ignoring the process environment.
 *
 * Used for values the script itself previously persisted (client ids, refresh
 * tokens) rather than user-provided ones, so a stale process environment
 * cannot shadow what the last run actually saved.
 */
export async function loadStoredEnvValue(key: string): Promise<string | undefined> {
    return parseEnv(await loadEnvFile()).get(key);
}

/**
 * Resolves a credential from a flag value, the process environment, or a
 * stored `.env` entry, in that order.
 *
 * @param flagValue - The value passed after the flag on the command line, if any.
 * @param flagName - The flag the script accepts for this credential.
 * @param envVar - The process environment variable name for the credential.
 * @param envKey - The `.env` key a previous run persisted the credential under.
 * @param label - Human-readable credential name for the missing-credential error.
 * @param createUrl - Where the user creates the credential, for the error text.
 * @returns The resolved credential value.
 * @throws When no source provides a value.
 */
export async function resolveCredential(
    flagValue: string | undefined,
    flagName: string,
    envVar: string,
    envKey: string,
    label: string,
    createUrl: string
): Promise<string> {
    if (flagValue !== undefined) return flagValue;
    const stored = process.env[envVar] ?? (await loadStoredEnvValue(envKey));
    if (stored === undefined) {
        throw new Error(
            `No ${label}. Pass ${flagName} <value>, set ${envVar}, or ` +
                `store ${envKey} in ${ENV_PATH}. Create one at ${createUrl}.`
        );
    }
    return stored;
}

/**
 * Resolves an optional credential the same way; absent is a valid answer.
 *
 * Providers whose apps may or may not use a client secret (MAL web vs mobile
 * type) use this so the flag simply stays unset when no source has a value.
 */
export async function resolveOptionalCredential(
    flagValue: string | undefined,
    envVar: string,
    envKey: string
): Promise<string | undefined> {
    if (flagValue !== undefined) return flagValue;
    return process.env[envVar] ?? (await loadStoredEnvValue(envKey));
}

/**
 * Returns the value following a flag, or undefined when the flag is absent.
 *
 * A value that is itself a flag (e.g. `--client-id --refresh`) or a missing
 * value resolves to undefined, so the credential falls through to the next
 * source instead of persisting a garbage value into `.env`.
 */
export function flagValue(argv: string[], flag: string): string | undefined {
    const index = argv.indexOf(flag);
    const value = index >= 0 ? argv[index + 1] : undefined;
    return value !== undefined && !value.startsWith("--") ? value : undefined;
}

/**
 * Decodes a percent-encoded component, treating malformed input as absent.
 *
 * A code truncated mid-escape (a trailing `%`) makes `decodeURIComponent`
 * throw; a bad paste should re-prompt, not crash the run.
 */
function safeDecode(component: string): string | undefined {
    try {
        return decodeURIComponent(component);
    } catch {
        return undefined;
    }
}

/**
 * Extracts the authorization `code` from whatever the user pastes back.
 *
 * Accepts the full redirect URL or a bare `code=...` fragment, since the
 * manual flow has no HTTP server catching the redirect.
 */
export function extractCode(pasted: string): string | undefined {
    const trimmed = pasted.trim();
    try {
        const url = new URL(trimmed);
        const code = url.searchParams.get("code");
        if (code) return code;
    } catch {
        // Not a URL; fall through to the bare-parameter form.
    }
    const match = /(?:^|[?&])code=([^&]+)/.exec(trimmed);
    return match ? safeDecode(match[1]) : undefined;
}

/**
 * Extracts the `state` parameter from a pasted redirect the same way
 * {@link extractCode} extracts the code.
 */
export function extractState(pasted: string): string | undefined {
    const trimmed = pasted.trim();
    try {
        const url = new URL(trimmed);
        const state = url.searchParams.get("state");
        if (state) return state;
    } catch {
        // Not a URL; fall through to the bare-parameter form.
    }
    const match = /(?:^|[?&])state=([^&]+)/.exec(trimmed);
    return match ? safeDecode(match[1]) : undefined;
}

/**
 * Prompts for the pasted redirect URL and returns the authorization code.
 *
 * When `expectedState` is passed, the pasted redirect's `state` parameter
 * must match it — the CSRF check the library's own docs prescribe — so the
 * full redirect URL is required, not just the `code=...` fragment.
 *
 * Iterating the interface ends on EOF, so a closed stdin (Ctrl+Z, piped
 * input) fails with a message instead of leaving a pending prompt behind.
 *
 * @param authorizeUrl - The URL the user was told to open; printed as a recap.
 * @param providerLabel - Provider name for the prompt text.
 * @param expectedState - The `state` sent in `authorizeUrl`, when the caller
 * generated one; a pasted redirect whose `state` differs is rejected.
 * @returns The authorization code parsed from the pasted line.
 * @throws When stdin closes before a code is received.
 */
export async function promptForCode(
    authorizeUrl: string,
    providerLabel: string,
    expectedState?: string
): Promise<string> {
    console.log("Open the following URL in a browser, log in, and approve access:");
    console.log(`\n  ${authorizeUrl}\n`);
    console.log(`${providerLabel} will redirect to your registered redirect URI. Paste the`);
    if (expectedState === undefined) {
        console.log("full redirect URL (or just the code=... part) here:");
    } else {
        console.log("full redirect URL here — its state parameter is validated, so the");
        console.log("whole URL is required, not just the code=... part:");
    }

    const rl = createInterface({ input, output });
    try {
        let code: string | undefined;
        for await (const line of rl) {
            code = extractCode(line);
            if (code === undefined) {
                console.log("No code parameter found — try pasting the whole URL.");
            } else if (expectedState !== undefined && extractState(line) !== expectedState) {
                code = undefined;
                console.log("State mismatch — paste the redirect from this run's authorize URL.");
            } else {
                break;
            }
        }
        if (code === undefined) {
            throw new Error("No input received — rerun and paste the redirect URL.");
        }
        return code;
    } finally {
        rl.close();
    }
}

/**
 * Runs a CLI core function and maps its outcome to a process exit code.
 *
 * The guard keeps the script importable for tests while still executing when
 * run directly through tsx or node. The caller's module URL must be passed
 * in: `import.meta.url` inside this shared module is the module's own URL, so
 * comparing it against the entry script's path would never match.
 *
 * @param run - The CLI core: takes argv, returns an exit code, never calls
 * process.exit itself.
 * @param callerModuleUrl - The `import.meta.url` of the calling script.
 */
export function runCliEntry(
    run: (argv: string[]) => Promise<number>,
    callerModuleUrl: string
): void {
    const entryPath = process.argv[1];
    if (entryPath === undefined) return;
    if (callerModuleUrl === pathToFileURL(entryPath).href) {
        void run(process.argv.slice(2))
            .then((exitCode) => {
                process.exitCode = exitCode;
            })
            .catch((error: unknown) => {
                // Mirror the CLI's own catch: message to stderr, exit code 1.
                console.error(error instanceof Error ? error.message : String(error));
                process.exitCode = 1;
            });
    }
}
