#!/usr/bin/env node
/**
 * Packages the library, installs the tarball into an isolated consumer
 * project, and runs a real-usage smoke test against the live AniList API.
 *
 * Pipeline:
 *   1. `npm run build` — produce `dist/`
 *   2. `npm pack`      — produce the publishable `.tgz`
 *   3. Scaffold a throwaway project in a temp dir with the tarball installed
 *   4. Execute `consumer-smoke.mjs` there with plain `node`
 *
 * The temp project is deleted afterwards unless `--keep` is passed, which
 * prints its path for manual inspection.
 *
 * Queries only: the consumer script never invokes a mutation operation.
 *
 * Usage:
 *   node scripts/package-smoke/run.mjs [--keep] [--skip-build]
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync, copyFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import process from "node:process";

const repoRoot = path.resolve(
    path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")),
    "..",
    ".."
);
const args = new Set(process.argv.slice(2));
const keep = args.has("--keep");
const skipBuild = args.has("--skip-build");

/**
 * Hardened environment for child processes: PATH restricted to fixed,
 * unwriteable system directories so spawned npm/node cannot be shadowed by
 * a writable directory on Windows.
 */
const SAFE_PATH =
    process.platform === "win32"
        ? String.raw`C:\Windows\System32;C:\Windows;C:\Program Files\nodejs`
        : "/usr/bin:/bin:/usr/local/bin";
const safeEnv = { ...process.env, PATH: SAFE_PATH };

/**
 * Run a command with the hardened environment.
 *
 * `npm` needs a shell on Windows (`npm.cmd`); bare executables with absolute
 * paths (e.g. `process.execPath`) must NOT use one, or spaces in
 * `C:\Program Files\...` break quoting.
 *
 * @param {string} command - Executable to spawn.
 * @param {string[]} commandArgs - Argument list passed verbatim.
 * @param {object} [options] - Extra `execFileSync` options; `quiet` captures
 *   stdout instead of streaming it and is returned to the caller. Set
 *   `noShell: true` to spawn directly without a shell.
 * @returns {string} Child stdout when `options.quiet` is set, otherwise `""`.
 */
function run(command, commandArgs, options) {
    console.log(`> ${command} ${commandArgs.join(" ")}`);
    const { noShell, ...rest } = options ?? {};
    return execFileSync(command, commandArgs, {
        stdio: ["ignore", rest?.quiet ? "pipe" : "inherit", "inherit"],
        shell: noShell ? false : process.platform === "win32",
        env: safeEnv,
        ...rest,
    });
}

console.log("=== 1/3 Building package ===");
if (skipBuild) {
    console.log("Skipped (--skip-build): assuming dist/ is current.");
} else {
    run("npm", ["run", "build"], { cwd: repoRoot });
}

console.log("\n=== 2/3 Packing tarball ===");
const packOutput = run("npm", ["pack", "--json"], {
    cwd: repoRoot,
    quiet: true,
    encoding: "utf8",
});
const tarballPath = JSON.parse(packOutput)[0]?.filename;
if (!tarballPath) throw new Error("npm pack --json returned no filename");
const tarballAbs = path.join(repoRoot, tarballPath);
console.log(`Packed: ${tarballAbs}`);

const scratch = mkdtempSync(path.join(tmpdir(), "anilink-package-smoke-"));
let exitCode = 0;
try {
    console.log(`\n=== 3/3 Installing into isolated project (${scratch}) ===`);
    const consumerDir = path.join(scratch, "consumer");
    mkdirSync(consumerDir);
    writeFileSync(
        path.join(consumerDir, "package.json"),
        JSON.stringify(
            {
                name: "anilink-package-smoke-consumer",
                private: true,
                type: "module",
                version: "0.0.0",
            },
            null,
            2
        )
    );
    copyFileSync(
        path.join(repoRoot, "scripts", "package-smoke", "consumer-smoke.mjs"),
        path.join(consumerDir, "consumer-smoke.mjs")
    );

    // Install only the tarball plus nothing else; axios is bundled as the sole
    // runtime dependency of the wrapper and comes along transitively.
    run("npm", ["install", "--no-audit", "--no-fund", tarballAbs], { cwd: consumerDir });

    console.log("\n=== Running packaged smoke test ===");
    run(process.execPath, ["consumer-smoke.mjs"], { cwd: consumerDir, noShell: true });
    const cleanupNote = keep ? "" : " (scratch dir removed)";
    console.log(`\nPackaged package smoke test PASSED${cleanupNote}`);
} catch (error) {
    exitCode = 1;
    console.error(`\nPackaged package smoke test FAILED: ${error.message}`);
} finally {
    if (keep) {
        console.log(`Kept scratch dir for inspection: ${scratch}`);
    } else {
        rmSync(scratch, { recursive: true, force: true });
    }
    rmSync(tarballAbs, { force: true });
}

process.exit(exitCode);
