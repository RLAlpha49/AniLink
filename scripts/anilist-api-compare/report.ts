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
        `- Discrepancies: ${result.discrepancies.length}`,
        "",
    ];

    if (!result.discrepancies.length) {
        lines.push("No discrepancies found.");
        return `${lines.join("\n")}\n`;
    }

    lines.push("## Discrepancies", "");
    for (const discrepancy of result.discrepancies) {
        lines.push(`### ${discrepancy.severity}: ${discrepancy.category}`);
        lines.push(`- Operation: ${discrepancy.operation ?? "n/a"}`);
        lines.push(`- Source: ${discrepancy.sourcePath ?? "n/a"}`);
        lines.push(`- ${discrepancy.message}`);
        if (discrepancy.packageValue !== undefined)
            lines.push(`- Package value: \`${JSON.stringify(discrepancy.packageValue)}\``);
        if (discrepancy.apiValue !== undefined)
            lines.push(`- API value: \`${JSON.stringify(discrepancy.apiValue)}\``);
        lines.push("");
    }
    return `${lines.join("\n")}\n`;
}

export function renderJson(result: ComparisonResult, metadata: ReportMetadata): string {
    return `${JSON.stringify({ ...metadata, ...result }, null, 2)}\n`;
}
