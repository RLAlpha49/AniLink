/**
 * Vitest configuration for the integration suite.
 *
 * Loads mode-specific environment variables before running only integration
 * tests, which may take longer than the unit suite's default timeout.
 */
import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), "");
    Object.assign(process.env, env);

    return {
        test: {
            include: ["__tests__/integration/**/*.test.ts"],
            // A rate-limited request legitimately waits out the provider's
            // rate-limit window before dispatch (pacing) or between attempts
            // (server-dictated 429 delays); AniList's window is a full minute.
            // The budget therefore covers one window reset plus the request.
            testTimeout: 90_000,
            // The live suites pace themselves with a per-test delay to stay
            // under the providers' rate ceilings. Running test files in
            // parallel multiplies the request rate by the file count and
            // trips 429s (plus the pacing waits they induce), so the files
            // run sequentially to keep one shared request rhythm.
            fileParallelism: false,
        },
    };
});
