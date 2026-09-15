import type { ComparisonResult } from "./types";

/**
 * `ReportMetadata` carries the provenance stamped into every rendered report:
 * where the compared schema snapshot came from.
 */
export interface ReportMetadata {
    /** Human-readable description of the schema source. */
    schemaSource: string;
}

/**
 * `renderMarkdown` renders a {@link ComparisonResult} as the human-readable
 * `report.md` document: a summary header followed by one section per
 * discrepancy.
 *
 * @param result - The comparison outcome to render.
 * @param metadata - Provenance stamped into the report header.
 * @returns The complete markdown document.
 */
export function renderMarkdown(result: ComparisonResult, metadata: ReportMetadata): string {
    const lines = [
        "# AniList API Comparison",
        "",
        `Schema source: ${metadata.schemaSource}`,
        "",
        `- Implemented operations: ${result.implementedOperations}`,
        `- Unimplemented operations: ${result.unimplementedOperations.length}`,
        `- Removed operations: ${result.removedOperations.length}`,
        `- Deprecated operations: ${result.deprecatedOperations.length}`,
        `- Discrepancies: ${result.discrepancies.length}`,
        "",
    ];

    if (!result.discrepancies.length) {
        lines.push("No discrepancies found.");
        return `${lines.join("\n")}\n`;
    }

    lines.push("## Discrepancies", "");
    for (const discrepancy of result.discrepancies) {
        lines.push(
            `### ${discrepancy.severity}: ${discrepancy.category}`,
            `- Operation: ${discrepancy.operation ?? "n/a"}`,
            `- Source: ${discrepancy.sourcePath ?? "n/a"}`,
            `- ${discrepancy.message}`,
            ...(discrepancy.packageValue !== undefined
                ? [`- Package value: \`${JSON.stringify(discrepancy.packageValue)}\``]
                : []),
            ...(discrepancy.apiValue !== undefined
                ? [`- API value: \`${JSON.stringify(discrepancy.apiValue)}\``]
                : []),
            ""
        );
    }
    return `${lines.join("\n")}\n`;
}

/**
 * Renders the upstream-coverage lists (unimplemented, removed, deprecated
 * operations) of a {@link ComparisonResult} as visible markdown sections so
 * consumers can see what the package does and does not wrap without opening
 * the JSON artifact.
 *
 * @param result - The comparison outcome whose coverage lists to render.
 * @returns The markdown sections, one per coverage list.
 */
export function renderCoverageSections(result: ComparisonResult): string {
    const lines: string[] = [];

    const section = (title: string, entries: string[], note?: string) => {
        lines.push(`## ${title}`, "");
        if (entries.length === 0) {
            lines.push("None.", "");
            return;
        }
        if (note) lines.push(`_${note}_`, "");
        for (const entry of entries) lines.push(`- \`${entry}\``);
        lines.push("");
    };

    section(
        "Unimplemented operations",
        result.unimplementedOperations,
        "Upstream operations AniLink does not wrap yet; use custom() as a bridge."
    );
    section(
        "Removed operations",
        result.removedOperations,
        "Operations AniLink wrapped that no longer exist upstream."
    );
    section(
        "Deprecated operations",
        result.deprecatedOperations,
        "Upstream deprecations; AniLink keeps wrapping these until AniList removes them."
    );

    return `${lines.join("\n")}\n`;
}

/**
 * `renderJson` renders a {@link ComparisonResult} as the machine-readable
 * `report.json` artifact: metadata and result merged into one pretty-printed
 * object.
 *
 * @param result - The comparison outcome to render.
 * @param metadata - Provenance merged into the JSON object.
 * @returns The pretty-printed JSON document.
 */
export function renderJson(result: ComparisonResult, metadata: ReportMetadata): string {
    return `${JSON.stringify({ ...metadata, ...result }, null, 2)}\n`;
}
