import type { IntrospectionQuery } from "graphql";

export interface VariableDefinition {
    name: string;
    type: string;
    required: boolean;
}

/**
 * A field in a package selection set. Inline fragments are represented as
 * synthetic nodes whose `name` is `…on <TypeCondition>` so union selections
 * keep their member-specific fields visible to contract comparisons.
 */
export interface SelectionNode {
    name: string;
    alias?: string;
    arguments: string[];
    /** Type condition of an inline fragment (`... on X`); absent for fields. */
    typeCondition?: string;
    selection: SelectionNode[];
}

/** Discriminates inline-fragment nodes from regular field nodes. */
export const INLINE_FRAGMENT_NAME = "…on";

export interface PackageOperation {
    sourcePath: string;
    kind: "query" | "mutation";
    exportName: string;
    rootField: string;
    variables: VariableDefinition[];
    arguments: string[];
    selection: SelectionNode[];
    variableTypeName?: string;
    responseTypeName?: string;
}

export type DiscrepancySeverity = "error" | "warning";

export interface Discrepancy {
    severity: DiscrepancySeverity;
    category: string;
    operation?: string;
    sourcePath?: string;
    packageValue?: unknown;
    apiValue?: unknown;
    message: string;
}

export interface ComparisonResult {
    discrepancies: Discrepancy[];
    implementedOperations: number;
    unimplementedOperations: string[];
    removedOperations: string[];
    deprecatedOperations: string[];
    warnings: Discrepancy[];
}

export type Schema = IntrospectionQuery;
