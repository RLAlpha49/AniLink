import { mkdir, writeFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { comparePackageToSchema } from "../../lib/api-compare/compare";
import { discoverPackageContracts, discoverPackageOperations } from "./package-inventory";
import { renderJson, renderMarkdown } from "../../lib/api-compare/report";
import { fetchSchema, loadSchema, writeSchema } from "../../lib/api-compare/schema";
import type { ComparisonResult } from "../../lib/api-compare/types";
import { resolveProvider, type ProviderConfig } from "./providers";

export interface CliComparisonResult {
    discrepancies: Array<{ severity: string; category: string; message: string }>;
    implementedOperations?: number;
}

export interface CliOptions {
    argv: string[];
    compare?: (argv: string[], provider: ProviderConfig) => Promise<CliComparisonResult>;
    updateSchema?: (provider: ProviderConfig) => Promise<void>;
    log?: (message: string) => void;
}

export interface CliResult {
    exitCode: number;
    error?: string;
}

/**
 * Runs the comparison command and keeps process termination outside the testable core.
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
        renderMarkdown(result, { schemaSource }),
        "utf8"
    );
    await writeFile(
        resolve(reportDirectory, "report.json"),
        renderJson(result, { schemaSource }),
        "utf8"
    );
    return result;
}

async function updateSchema(provider: ProviderConfig): Promise<void> {
    const schema = await fetchSchema(fetch, { url: provider.graphqlUrl });
    await writeSchema(resolve(process.cwd(), provider.schemaPath), schema);
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
        void runCli({ argv, compare: runComparison }).then(({ exitCode, error }) => {
            if (error) console.error(error);
            process.exitCode = exitCode;
        });
    }
}
