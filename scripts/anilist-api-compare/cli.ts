import { mkdir, readFile, writeFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
    comparePackageToSchema,
    findIgnoredOperationsMissingReviewNote,
} from "../../lib/api-compare/compare";
import { discoverPackageContracts, discoverPackageOperations } from "./package-inventory";
import { renderJson, renderMarkdown, renderCoverageSections } from "../../lib/api-compare/report";
import { fetchSchema, loadSchema, writeSchema } from "../../lib/api-compare/schema";
import type { ComparisonResult } from "../../lib/api-compare/types";
import { resolveProvider, type ProviderConfig } from "./providers";

/** Reduced comparison result consumed by the CLI orchestration layer. */
export interface CliComparisonResult {
    /** Discrepancies that may affect the command's exit status. */
    discrepancies: Array<{ severity: string; category: string; message: string }>;
    /** Number of package operations discovered, when the comparison provides it. */
    implementedOperations?: number;
}

/** Injectable dependencies and command-line arguments for {@link runCli}. */
export interface CliOptions {
    /** Command name followed by its flags and values. */
    argv: string[];
    /** Optional comparison implementation used by tests or alternate runners. */
    compare?: (argv: string[], provider: ProviderConfig) => Promise<CliComparisonResult>;
    /** Optional schema-update implementation used by tests or alternate runners. */
    updateSchema?: (provider: ProviderConfig) => Promise<void>;
    /** Logger used for progress and result messages. */
    log?: (message: string) => void;
}

/** Process result returned by the testable CLI core. */
export interface CliResult {
    /** `0` for success, `1` for relevant discrepancies, or `2` for an exception. */
    exitCode: number;
    /** Human-readable exception text when the command could not complete. */
    error?: string;
}

/**
 * Runs the comparison command and keeps process termination outside the testable core.
 *
 * @param options - Arguments, injectable operations, and output logger.
 * @returns Exit status and an error message when orchestration failed.
 */
export async function runCli(options: CliOptions): Promise<CliResult> {
    const log = options.log ?? console.log;
    try {
        const provider = resolveProvider(valueAfter(options.argv, "--provider"));
        log(
            options.argv[0] === "update-schema"
                ? `${provider.label} schema snapshot update started`
                : `${provider.label} API comparison started`
        );
        if (options.argv[0] === "update-schema") {
            await (options.updateSchema ?? updateSchema)(provider);
            log(`${provider.label} schema snapshot updated: ${provider.schemaPath}`);
            return { exitCode: 0 };
        }
        const strict = options.argv.includes("--strict");
        if (strict) {
            log("Strict mode enabled: any discrepancy will fail the comparison");
        }
        // `--ignore-unimplemented` supports incremental development: while
        // operations are being wrapped one at a time, their absence is
        // expected work-in-progress rather than a defect, so CI stays green.
        // Real contract drift (missing fields, wrong types) still fails.
        // Operations that can never be wrapped belong in
        // `IGNORED_UNIMPLEMENTED_OPERATIONS` instead and are never reported.
        const ignoreUnimplemented = options.argv.includes("--ignore-unimplemented");
        if (ignoreUnimplemented) {
            log("Ignoring unimplemented-operation warnings");
        }
        const result = await (options.compare ?? runComparison)(options.argv, provider);
        const relevantDiscrepancies = ignoreUnimplemented
            ? result.discrepancies.filter(
                  (discrepancy) => discrepancy.category !== "unimplemented-operation"
              )
            : result.discrepancies;
        const hasErrors = strict
            ? relevantDiscrepancies.length > 0
            : relevantDiscrepancies.some((discrepancy) => discrepancy.severity === "error");
        log(`Implemented operations: ${result.implementedOperations ?? "unknown"}`);
        log(`Discrepancies found: ${result.discrepancies.length}`);
        log(
            result.discrepancies.length
                ? "Actionable discrepancies require review"
                : "No discrepancies found"
        );
        log(
            `Reports: ${provider.reportDirectory}/report.md, ${provider.reportDirectory}/report.json`
        );
        return { exitCode: hasErrors ? 1 : 0 };
    } catch (error) {
        return {
            exitCode: 2,
            error: error instanceof Error ? error.message : String(error),
        };
    }
}

/**
 * Fetch or load a provider schema, compare it with package contracts, and write reports.
 *
 * @param argv - Comparison flags, including optional schema and report paths.
 * @param provider - Provider configuration selected by the CLI.
 * @returns The full comparison result used for logging and exit-status decisions.
 * @throws {Error} When schema loading, source discovery, comparison, or report writes fail.
 */
async function runComparison(argv: string[], provider: ProviderConfig): Promise<ComparisonResult> {
    const live = argv.includes("--live");
    const root = process.cwd();
    const schemaPath = resolve(root, valueAfter(argv, "--schema") ?? provider.schemaPath);
    const schemaSource = live ? "live" : relative(root, schemaPath);
    const reportDirectory = resolve(
        root,
        valueAfter(argv, "--report-dir") ?? provider.reportDirectory
    );
    const schema = live
        ? await fetchSchema(fetch, { url: provider.graphqlUrl })
        : await loadSchema(schemaPath);
    const sourceRoot = resolve(root, provider.sourceRoot);
    const operations = await discoverPackageOperations(sourceRoot);
    const contracts = await discoverPackageContracts(sourceRoot);
    const result = comparePackageToSchema({ schema, operations, contracts });
    await mkdir(reportDirectory, { recursive: true });
    await writeFile(
        resolve(reportDirectory, "report.md"),
        renderMarkdown(result, { schemaSource }) + renderCoverageSections(result),
        "utf8"
    );
    await writeFile(
        resolve(reportDirectory, "report.json"),
        renderJson(result, { schemaSource }),
        "utf8"
    );
    return result;
}

/**
 * Fetch the provider's live GraphQL schema and replace its committed snapshot.
 *
 * @param provider - Provider whose endpoint and snapshot path are used.
 * @returns Nothing; writes the refreshed schema snapshot to disk.
 * @throws {Error} When the endpoint cannot be fetched or the snapshot cannot be written.
 */
async function updateSchema(provider: ProviderConfig): Promise<void> {
    const schema = await fetchSchema(fetch, { url: provider.graphqlUrl });
    await writeSchema(resolve(process.cwd(), provider.schemaPath), schema);
}

/**
 * Warns when an entry in `IGNORED_UNIMPLEMENTED_OPERATIONS` lacks a dated
 * `review: YYYY-Qn` note, so the ignore list cannot grow silently.
 *
 * @param log - Destination for CI warning messages.
 * @returns Nothing; warnings are emitted for each undated ignored operation.
 */
export async function warnOnUndatedIgnoredOperations(
    log: (message: string) => void = console.warn
): Promise<void> {
    try {
        const source = await readFile(resolve(process.cwd(), "lib/api-compare/compare.ts"), "utf8");
        for (const operation of findIgnoredOperationsMissingReviewNote(source)) {
            log(
                `::warning::Ignored unimplemented operation "${operation}" has no dated review note (review: YYYY-Qn) in lib/api-compare/compare.ts`
            );
        }
    } catch {
        // The compare module is a repo file; absence only happens outside a checkout.
    }
}

function valueAfter(argv: string[], flag: string): string | undefined {
    const index = argv.indexOf(flag);
    return index >= 0 ? argv[index + 1] : undefined;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
    const argv = process.argv.slice(2);
    const command = argv.shift() ?? "compare";
    if (command === "update-schema") {
        void runCli({ argv: [command, ...argv], updateSchema }).then(({ exitCode, error }) => {
            if (error) console.error(error);
            process.exitCode = exitCode;
        });
    } else {
        void warnOnUndatedIgnoredOperations();
        void runCli({ argv, compare: runComparison }).then(({ exitCode, error }) => {
            if (error) console.error(error);
            process.exitCode = exitCode;
        });
    }
}
