import type { IntrospectionQuery } from "graphql";

/**
 * `VariableDefinition` is one GraphQL variable of an operation: its name,
 * printed type (e.g. `[Int]`, `Int!`), and whether it is non-null.
 */
export interface VariableDefinition {
    /** Variable name as declared by the operation. */
    name: string;
    /** Printed GraphQL type, including list and non-null wrappers. */
    type: string;
    /** Whether the variable is non-null (`Int!`). */
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

/**
 * `PackageOperation` is one operation the package implements, reduced to the
 * facts the schema comparison needs: its source location, root field,
 * variables, and normalized selection.
 */
export interface PackageOperation {
    /** Repo-relative path of the operation module. */
    sourcePath: string;
    /** Operation kind. */
    kind: "query" | "mutation";
    /** Exported operation class name. */
    exportName: string;
    /** Root field the operation selects. */
    rootField: string;
    /** Declared variables. */
    variables: VariableDefinition[];
    /** Argument names passed to the root field. */
    arguments: string[];
    /** Normalized selection tree. */
    selection: SelectionNode[];
    /** Variables interface name, when the operation declares one. */
    variableTypeName?: string;
    /** Response interface name, when the operation declares one. */
    responseTypeName?: string;
}

/**
 * `DiscrepancySeverity` grades a comparison finding: `error` fails the run,
 * `warning` is reported but tolerated outside `--strict` mode.
 */
export type DiscrepancySeverity = "error" | "warning";

/**
 * `Discrepancy` is one comparison finding: the drift category, where it was
 * found, and the conflicting package and API values when applicable.
 */
export interface Discrepancy {
    /** Whether the finding fails the comparison. */
    severity: DiscrepancySeverity;
    /** Drift category, e.g. `missing-argument`. */
    category: string;
    /** Package export the finding concerns, when operation-specific. */
    operation?: string;
    /** Repo-relative source path of the offending operation. */
    sourcePath?: string;
    /** Value the package declares. */
    packageValue?: unknown;
    /** Value the API schema declares. */
    apiValue?: unknown;
    /** Human-readable description of the drift. */
    message: string;
}

/**
 * `ComparisonResult` is the outcome of comparing the package surface
 * against the provider schema: every finding plus the coverage lists.
 */
export interface ComparisonResult {
    /** Every finding, errors and warnings together. */
    discrepancies: Discrepancy[];
    /** Number of root fields the package implements. */
    implementedOperations: number;
    /** Schema operations the package does not wrap (`kind.field`). */
    unimplementedOperations: string[];
    /** Package operations whose root field no longer exists upstream. */
    removedOperations: string[];
    /** Package operations upstream has deprecated. */
    deprecatedOperations: string[];
    /** The `warning`-severity subset of `discrepancies`. */
    warnings: Discrepancy[];
}

/**
 * `Schema` is the committed GraphQL introspection snapshot the package is
 * compared against — an {@link IntrospectionQuery} as returned by introspection.
 */
export type Schema = IntrospectionQuery;
