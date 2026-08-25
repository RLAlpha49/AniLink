import type { ComparisonResult } from "./types";

export interface ReportMetadata {
    schemaSource: string;
}

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
 * operations) as visible markdown sections so consumers can see what the
 * package does and does not wrap without opening the JSON artifact.
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

export function renderJson(result: ComparisonResult, metadata: ReportMetadata): string {
    return `${JSON.stringify({ ...metadata, ...result }, null, 2)}\n`;
}
