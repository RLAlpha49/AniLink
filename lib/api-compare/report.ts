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

export function renderJson(result: ComparisonResult, metadata: ReportMetadata): string {
    return `${JSON.stringify({ ...metadata, ...result }, null, 2)}\n`;
}
