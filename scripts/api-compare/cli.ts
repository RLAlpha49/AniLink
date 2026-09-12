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
import { providerConfigs, resolveProvider, type ProviderConfig } from "./providers";
import { REST_PROVIDER_MAPPINGS, discoverRestContracts } from "./rest-contracts";
import {
    compareRestContracts,
    fetchOpenApiDocument,
    loadOpenApiDocument,
    writeOpenApiDocument,
    type RestEndpointMapping,
} from "../../lib/api-compare/openapi";

/** Reduced comparison result consumed by the CLI orchestration layer. */
export interface CliComparisonResult {
    /** Discrepancies that may affect the command's exit status. */
    discrepancies: Array<{ severity: string; category: string; message: string }>;
    /** Number of package operations discovered, when the comparison provides it. */
    implementedOperations?: number;
    /** Number of package types verified, for OpenAPI comparisons. */
    verifiedTypes?: number;
    /** Spec endpoints the package wraps, for OpenAPI comparisons. */
    implementedEndpoints?: string[];
    /** Spec endpoints no package type maps to, for OpenAPI comparisons. */
    unimplementedEndpoints?: string[];
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
        const providerName = valueAfter(options.argv, "--provider");
        if (!providerName) {
            throw new Error(
                `Missing --provider flag. Pass one of: ${Object.keys(providerConfigs).join(", ")}`
            );
        }
        const provider = resolveProvider(providerName);
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
        if (provider.protocol === "openapi") {
            return await runOpenApiComparison(options.argv, provider, log, options.compare);
        }
        const strict = options.argv.includes("--strict");
        if (strict) {
            log("Strict mode enabled: any discrepancy will fail the comparison");
        }
        const result = await (options.compare ?? runComparison)(options.argv, provider);
        const relevantDiscrepancies = result.discrepancies.filter(
            (discrepancy) => discrepancy.category !== "unimplemented-operation"
        );
        const hasErrors = strict
            ? relevantDiscrepancies.length > 0
            : relevantDiscrepancies.some((discrepancy) => discrepancy.severity === "error");
        log(`Implemented operations: ${result.implementedOperations ?? "unknown"}`);
        log(`Discrepancies found: ${result.discrepancies.length}`);
        log(
            relevantDiscrepancies.length
                ? "Actionable discrepancies require review"
                : "No actionable discrepancies found"
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
 * Run the OpenAPI (REST) contract comparison for a provider.
 *
 * Loads (or live-fetches) the provider's OpenAPI snapshot, extracts the
 * package's REST type contracts, compares every mapped response interface
 * against the spec in both directions, and writes the same report.md and
 * report.json artifacts as the GraphQL pipeline.
 *
 * @param argv - Comparison flags, including `--live`, `--schema`, and `--report-dir`.
 * @param provider - OpenAPI provider configuration selected by the CLI.
 * @param log - Progress logger.
 * @param compare - Optional comparison implementation used by tests or alternate
 *   runners; defaults to the real snapshot comparison.
 * @returns Exit status: `0` clean, `1` discrepancies, `2` orchestration failure.
 */
async function runOpenApiComparison(
    argv: string[],
    provider: ProviderConfig,
    log: (message: string) => void,
    compare?: (argv: string[], provider: ProviderConfig) => Promise<CliComparisonResult>
): Promise<CliResult> {
    const mappings = REST_PROVIDER_MAPPINGS[provider.name];
    if (!mappings) {
        throw new Error(
            `No REST endpoint mappings configured for provider "${provider.name}"; add them in scripts/api-compare/rest-contracts.ts`
        );
    }
    const live = argv.includes("--live");
    const root = process.cwd();
    const schemaPath = resolve(root, valueAfter(argv, "--schema") ?? provider.schemaPath);
    const reportDirectory = resolve(
        root,
        valueAfter(argv, "--report-dir") ?? provider.reportDirectory
    );
    const result = compare
        ? await compare(argv, provider)
        : await runRestComparison(argv, provider, mappings, schemaPath);

    const strict = argv.includes("--strict");
    // Unimplemented endpoints are warnings, never gate failures: an unwrapped
    // upstream endpoint is expected work-in-progress, not a defect. It stays
    // visible in the output and reports; only real contract drift (missing
    // fields, wrong types, removed endpoints) affects the exit status.
    const relevantDiscrepancies = result.discrepancies.filter(
        (discrepancy) => discrepancy.category !== "unimplemented-endpoint"
    );
    const hasErrors = strict
        ? relevantDiscrepancies.length > 0
        : relevantDiscrepancies.some((discrepancy) => discrepancy.severity === "error");
    const implementedEndpoints = result.implementedEndpoints ?? [];
    const unimplementedEndpoints = result.unimplementedEndpoints ?? [];
    log(`Verified types: ${result.verifiedTypes ?? "unknown"}`);
    log(`Implemented endpoints: ${implementedEndpoints.length}`);
    log(`Unimplemented endpoints: ${unimplementedEndpoints.length}`);
    log(`Discrepancies found: ${result.discrepancies.length}`);
    log(
        relevantDiscrepancies.length
            ? "Actionable discrepancies require review"
            : "No actionable discrepancies found"
    );

    const schemaSource = live ? "live" : relative(root, schemaPath);
    await mkdir(reportDirectory, { recursive: true });
    const report = {
        schemaSource,
        provider: provider.name,
        discrepancies: result.discrepancies,
        verifiedTypes: result.verifiedTypes,
        implementedEndpoints,
        unimplementedEndpoints,
    };
    await writeFile(
        resolve(reportDirectory, "report.md"),
        renderRestMarkdown(report, provider),
        "utf8"
    );
    await writeFile(resolve(reportDirectory, "report.json"), renderRestJson(report), "utf8");
    log(`Reports: ${provider.reportDirectory}/report.md, ${provider.reportDirectory}/report.json`);
    return { exitCode: hasErrors ? 1 : 0 };
}

/**
 * Load (or live-fetch) the provider's OpenAPI document and run the real
 * REST contract comparison.
 *
 * @param argv - Comparison flags, including `--live` and `--schema`.
 * @param provider - OpenAPI provider configuration selected by the CLI.
 * @param mappings - The provider's endpoint mappings and ignore list.
 * @param schemaPath - Resolved snapshot path.
 * @returns The full comparison result used for logging and exit-status decisions.
 * @throws {Error} When the document cannot be loaded, fetched, or compared.
 */
async function runRestComparison(
    argv: string[],
    provider: ProviderConfig,
    mappings: { endpoints: RestEndpointMapping[]; ignoredEndpoints: Record<string, string> },
    schemaPath: string
): Promise<ReturnType<typeof compareRestContracts>> {
    const live = argv.includes("--live");
    const root = process.cwd();
    const document = live
        ? await fetchOpenApiDocument(fetch, provider.openApiUrl!)
        : await loadOpenApiDocument(schemaPath);
    const contracts = await discoverRestContracts(root, provider.name);
    return compareRestContracts({
        document,
        contracts,
        endpoints: mappings.endpoints,
        ignoredEndpoints: mappings.ignoredEndpoints,
    });
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
    if (provider.protocol === "openapi") {
        if (!provider.openApiUrl) {
            throw new Error(
                `Provider "${provider.name}" has no openApiUrl to fetch a snapshot from`
            );
        }
        const document = await fetchOpenApiDocument(fetch, provider.openApiUrl);
        await writeOpenApiDocument(resolve(process.cwd(), provider.schemaPath), document);
        return;
    }
    const schema = await fetchSchema(fetch, { url: provider.graphqlUrl });
    await writeSchema(resolve(process.cwd(), provider.schemaPath), schema);
}

/**
 * Render the REST comparison result as a markdown report.
 *
 * @param report - The comparison result and its schema source.
 * @param provider - The provider the report was generated for.
 * @returns The markdown document written to `report.md`.
 */
function renderRestMarkdown(
    report: {
        schemaSource: string;
        verifiedTypes?: number;
        implementedEndpoints: string[];
        unimplementedEndpoints: string[];
        discrepancies: Array<{ severity: string; category: string; message: string }>;
    },
    provider: ProviderConfig
): string {
    const lines = [
        `# ${provider.label} API Comparison`,
        "",
        `Schema source: ${report.schemaSource}`,
        "",
        `- Verified types: ${report.verifiedTypes ?? "unknown"}`,
        `- Implemented endpoints: ${report.implementedEndpoints.length}`,
        `- Unimplemented endpoints: ${report.unimplementedEndpoints.length}`,
        `- Discrepancies: ${report.discrepancies.length}`,
        "",
    ];
    if (report.unimplementedEndpoints.length) {
        lines.push("## Unimplemented endpoints", "");
        for (const endpoint of report.unimplementedEndpoints) lines.push(`- \`${endpoint}\``);
        lines.push("");
    }
    if (!report.discrepancies.length) {
        lines.push("No discrepancies found.");
        return `${lines.join("\n")}\n`;
    }
    lines.push("## Discrepancies", "");
    for (const discrepancy of report.discrepancies) {
        lines.push(
            `### ${discrepancy.severity}: ${discrepancy.category}`,
            `- ${discrepancy.message}`,
            ""
        );
    }
    return `${lines.join("\n")}\n`;
}

/**
 * Render the REST comparison result as a JSON report.
 *
 * @param report - The comparison result and its schema source.
 * @returns The JSON document written to `report.json`.
 */
function renderRestJson(report: unknown): string {
    return `${JSON.stringify(report, null, 2)}\n`;
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
        // The GraphQL comparison is injected only for GraphQL providers; the
        // OpenAPI path runs its own comparison and must not receive it.
        const providerName = valueAfter(argv, "--provider");
        const compare =
            providerName && providerConfigs[providerName]?.protocol === "graphql"
                ? runComparison
                : undefined;
        void runCli({ argv, compare }).then(({ exitCode, error }) => {
            if (error) console.error(error);
            process.exitCode = exitCode;
        });
    }
}
