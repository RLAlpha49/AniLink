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
            testTimeout: 30000,
        },
    };
});