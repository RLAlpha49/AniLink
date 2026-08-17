import type { IntrospectionQuery } from 'graphql'

export interface VariableDefinition {
  name: string
  type: string
  required: boolean
}

export interface SelectionNode {
  name: string
  alias?: string
  arguments: string[]
  selection: SelectionNode[]
}

export interface PackageOperation {
  sourcePath: string
  kind: 'query' | 'mutation'
  exportName: string
  rootField: string
  variables: VariableDefinition[]
  arguments: string[]
  selection: SelectionNode[]
  variableTypeName?: string
  responseTypeName?: string
}

export type DiscrepancySeverity = 'error' | 'warning'

export interface Discrepancy {
  severity: DiscrepancySeverity
  category: string
  operation?: string
  sourcePath?: string
  packageValue?: unknown
  apiValue?: unknown
  message: string
}

export interface ComparisonResult {
  discrepancies: Discrepancy[]
  implementedOperations: number
  unimplementedOperations: string[]
  warnings: Discrepancy[]
}

export type Schema = IntrospectionQuery
