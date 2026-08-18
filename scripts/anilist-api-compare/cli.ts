import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { comparePackageToSchema } from "./compare";
import { discoverPackageContracts, discoverPackageOperations } from "./package-inventory";
import { renderJson, renderMarkdown } from "./report";
import { fetchSchema, loadSchema, writeSchema } from "./schema";
import type { ComparisonResult } from "./types";

export interface CliComparisonResult {
    discrepancies: Array<{ severity: string; category: string; message: string }>;
    implementedOperations?: number;
}

export interface CliOptions {
    argv: string[];
    compare?: (argv: string[]) => Promise<CliComparisonResult>;
    updateSchema?: () => Promise<void>;
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
        log(
            options.argv[0] === "update-schema"
                ? "AniList schema snapshot update started"
                : "AniList API comparison started"
        );
        if (options.argv[0] === "update-schema") {
            await (options.updateSchema ?? updateSchema)();
            log("AniList schema snapshot updated: scripts/anilist-api-compare/anilist-schema.json");
            return { exitCode: 0 };
        }
        const result = await (options.compare ?? runComparison)(options.argv);
        const hasErrors = result.discrepancies.some(
            (discrepancy) => discrepancy.severity === "error"
        );
        log(`Implemented operations: ${result.implementedOperations ?? "unknown"}`);
        log(`Discrepancies found: ${result.discrepancies.length}`);
        log(
            result.discrepancies.length
                ? "Actionable discrepancies require review"
                : "No discrepancies found"
        );
        log(
            "Reports: artifacts/anilist-api-compare/report.md, artifacts/anilist-api-compare/report.json"
        );
        return { exitCode: hasErrors ? 1 : 0 };
    } catch (error) {
        return {
            exitCode: 2,
            error: error instanceof Error ? error.message : String(error),
        };
    }
}

async function runComparison(argv: string[]): Promise<ComparisonResult> {
    const live = argv.includes("--live");
    const root = process.cwd();
    const schemaPath = resolve(
        root,
        valueAfter(argv, "--schema") ?? "scripts/anilist-api-compare/anilist-schema.json"
    );
    const reportDirectory = resolve(
        root,
        valueAfter(argv, "--report-dir") ?? "artifacts/anilist-api-compare"
    );
    const schema = live ? await fetchSchema() : await loadSchema(schemaPath);
    const sourceRoot = resolve(root, "src/apis/anilist");
    const operations = await discoverPackageOperations(sourceRoot);
    const contracts = await discoverPackageContracts(sourceRoot);
    const result = comparePackageToSchema({ schema, operations, contracts });
    await mkdir(reportDirectory, { recursive: true });
    await writeFile(
        resolve(reportDirectory, "report.md"),
        renderMarkdown(result, { schemaSource: live ? "live" : schemaPath }),
        "utf8"
    );
    await writeFile(
        resolve(reportDirectory, "report.json"),
        renderJson(result, { schemaSource: live ? "live" : schemaPath }),
        "utf8"
    );
    return result;
}

async function updateSchema(): Promise<void> {
    const schema = await fetchSchema();
    await writeSchema(
        resolve(process.cwd(), "scripts/anilist-api-compare/anilist-schema.json"),
        schema
    );
}

function valueAfter(argv: string[], flag: string): string | undefined {
    const index = argv.indexOf(flag);
    return index >= 0 ? argv[index + 1] : undefined;
}

if (require.main === module) {
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
