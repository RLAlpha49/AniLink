import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { extractOperationMetadata } from './graph'
import type { PackageOperation } from './types'

export async function discoverPackageOperations(sourceRoot: string): Promise<PackageOperation[]> {
  const operations: PackageOperation[] = []
  for (const directory of ['query', 'mutation']) {
    const directoryPath = join(sourceRoot, directory)
    for (const fileName of await readdir(directoryPath)) {
      if (!fileName.endsWith('.ts')) continue
      const sourcePath = join(directoryPath, fileName)
      try {
        operations.push(...parseOperationSource(sourcePath, await readFile(sourcePath, 'utf8')))
      } catch (error) {
        throw new Error(`Unable to parse ${sourcePath}: ${error instanceof Error ? error.message : String(error)}`, { cause: error })
      }
    }
  }
  return operations
}

export function parseOperationSource(sourcePath: string, sourceText: string): PackageOperation[] {
  const operations: PackageOperation[] = []
  const classMatch = /export class (\w+?)(Query|Mutation)\s+extends/.exec(sourceText)
  const variableTypeName = /export interface (\w+Variables)/.exec(sourceText)?.[1]
  const responseTypeName = /import\s+\{\s*type\s+(\w+Response)/.exec(sourceText)?.[1]
  const documentMatch = /(?:const\s+)?(?:query|mutation)\s*=\s*`([\s\S]*?)`/.exec(sourceText)
  if (!classMatch || !documentMatch) return operations

  const document = documentMatch[1]
  let metadata: ReturnType<typeof extractOperationMetadata>
  try {
    metadata = extractOperationMetadata(document)
  } catch {
    metadata = extractFallbackMetadata(document)
  }
  const root = metadata.selection[0]
  if (!root) return operations

  operations.push({
    sourcePath,
    kind: metadata.kind,
    exportName: classMatch[1] + classMatch[2],
    rootField: root.name,
    variables: metadata.variables,
    arguments: root.arguments,
    selection: root.selection,
    ...(variableTypeName ? { variableTypeName } : {}),
    ...(responseTypeName ? { responseTypeName } : {}),
  })
  return operations
}

function extractFallbackMetadata(document: string): ReturnType<typeof extractOperationMetadata> {
  const kind = /\bmutation\b/.test(document) ? 'mutation' : 'query'
  const variableText = /\b(?:query|mutation)\s*\(([^)]*)\)/.exec(document)?.[1] ?? ''
  const variables = [...variableText.matchAll(/\$(\w+)\s*:\s*([^,)]*)/g)].map((match) => ({
    name: match[1],
    type: match[2].trim(),
    required: match[2].trim().endsWith('!'),
  }))
  const rootMatch = /\{\s*(\w+)\s*(?:\(([^)]*)\))?/.exec(document)
  if (!rootMatch) throw new Error('GraphQL document contains no root field')
  return {
    kind,
    variables,
    selection: [{ name: rootMatch[1], arguments: [...(rootMatch[2]?.matchAll(/(\w+)\s*:/g) ?? [])].map((match) => match[1]), selection: [] }],
  }
}
