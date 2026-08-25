import { readFile, readdir } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const ANILIST_API_REFERENCE_PREFIX = "https://docs.anilist.co/reference/";

/**
 * The set of real, non-404 AniList API reference pages.
 * Generated from the docs site's own navigation (see scripts/reference-pages.json).
 */
let referencePages: Set<string> | undefined;

/**
 * Per-operation mapping to the most specific AniList reference page available.
 * Operations whose subject has no dedicated page fall back to the generic
 * `/reference/query` or `/reference/mutation` index. Loaded from the
 * `operationReferences` field of scripts/reference-pages.json.
 */
let operationReferences: Map<string, string> | undefined;

interface ReferencePagesFile {
    pages: string[];
    operationReferences?: Record<string, string>;
}

async function loadReferencePages(): Promise<Set<string>> {
    if (referencePages) return referencePages;

    const pagesPath = join(import.meta.dirname, "reference-pages.json");
    const raw = await readFile(pagesPath, "utf8");
    const parsed = JSON.parse(raw) as ReferencePagesFile;
    referencePages = new Set(parsed.pages);
    operationReferences = new Map(Object.entries(parsed.operationReferences ?? {}));
    return referencePages;
}

/**
 * Resolves the specific reference page mapped to an operation, if any.
 * Returns `undefined` for operations with no entry in the mapping (they are
 * allowed to link to the generic query/mutation index).
 */
async function expectedOperationReference(operation: string): Promise<string | undefined> {
    await loadReferencePages();
    return operationReferences!.get(operation);
}

function normalizeReferencePath(reference: string): string | undefined {
    if (!reference.startsWith(ANILIST_API_REFERENCE_PREFIX)) {
        return undefined;
    }

    let suffix = reference.slice(ANILIST_API_REFERENCE_PREFIX.length);
    const queryIndex = suffix.indexOf("?");
    const hashIndex = suffix.indexOf("#");
    let fragmentIndex = -1;

    if (queryIndex !== -1 && (hashIndex === -1 || queryIndex < hashIndex)) {
        fragmentIndex = queryIndex;
    } else if (hashIndex !== -1) {
        fragmentIndex = hashIndex;
    }

    if (fragmentIndex !== -1) {
        suffix = suffix.slice(0, fragmentIndex);
    }

    while (suffix.endsWith("/")) {
        suffix = suffix.slice(0, -1);
    }

    if (suffix.length === 0 || suffix.includes(" ")) {
        return undefined;
    }

    // Return the full path (e.g. "/reference/query") to match the allowlist.
    return `/reference/${suffix}`;
}

async function isActualAniListApiReference(reference: string): Promise<boolean> {
    const suffix = normalizeReferencePath(reference);
    if (!suffix) return false;

    const pages = await loadReferencePages();
    return pages.has(suffix);
}

export interface JsdocIssue {
    file: string;
    line: number;
    tag: string;
    message: string;
}

interface DocumentationBlock {
    text: string;
}

interface SourceLine {
    text: string;
    start: number;
}

export async function checkAniLinkSource(source: string, file: string): Promise<JsdocIssue[]> {
    const issues: JsdocIssue[] = [];
    const lines = getSourceLines(source);

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const line = lines[lineIndex];
        // Operation properties live at 8-space indent (query/mutation) or
        // 12-space indent (page) inside the AniListApi interface. Match either
        // leading-whitespace shape; group 2 holds the operation name.
        const property = /^( {8}| {12})([A-Za-z]\w*): *\(/.exec(line.text);
        if (!property) continue;

        const index = line.start + line.text.indexOf(property[2]);
        const documentation = findDocumentation(source, index);
        const signature = getPropertySignature(lines, lineIndex);
        const openParen = signature.indexOf("(");
        const closeParen = signature.indexOf(")", openParen + 1);
        let parameterBlock = signature;
        if (openParen !== -1) {
            parameterBlock = signature.slice(
                openParen + 1,
                closeParen === -1 ? signature.length : closeParen
            );
        }
        const parameters = [...parameterBlock.matchAll(/(?:^|,)\s*([A-Za-z]\w*) *:/g)].map(
            (match) => match[1]
        );

        for (const parameter of parameters) {
            requireTag(
                issues,
                source,
                file,
                index,
                documentation,
                String.raw`@param\s+(?:{[^}]+}\s+)?${parameter}`,
                `AniLink operation ${property[2]} must document its ${parameter} parameter`
            );
        }

        requireTag(
            issues,
            source,
            file,
            index,
            documentation,
            "@returns",
            `AniLink operation ${property[2]} must document its return value`
        );
        requireTag(
            issues,
            source,
            file,
            index,
            documentation,
            "@example",
            `AniLink operation ${property[2]} must include an executable usage example`
        );
        await requireSpecificApiReference(
            issues,
            source,
            file,
            index,
            documentation,
            `AniLink operation ${property[2]}`,
            property[2]
        );
    }

    return issues;
}

export async function checkOperationSource(source: string, file: string): Promise<JsdocIssue[]> {
    const issues: JsdocIssue[] = [];
    await checkOperationDeclarations(source, file, issues);
    await checkOperationMembers(source, file, /[\\/]mutation[\\/]/.test(file), issues);
    return issues;
}

async function checkOperationDeclarations(
    source: string,
    file: string,
    issues: JsdocIssue[]
): Promise<void> {
    for (const line of getSourceLines(source)) {
        const trimmed = line.text.trim();
        const declaration = /^export (interface|class) ([A-Za-z]\w*)/.exec(trimmed);
        if (!declaration) continue;

        const index = line.start + line.text.indexOf("export");
        const documentation = requireDocumentation(
            issues,
            source,
            file,
            index,
            `Export ${declaration[2]} must have JSDoc`
        );
        await requireApiReference(
            issues,
            source,
            file,
            index,
            documentation,
            `Export ${declaration[2]}`
        );
    }
}

async function checkOperationMembers(
    source: string,
    file: string,
    mutation: boolean,
    issues: JsdocIssue[]
): Promise<void> {
    for (const line of getSourceLines(source)) {
        checkAuthTokenDocumentation(source, file, line, issues);

        const trimmed = line.text.trim();
        const constructor = /^constructor *\(([^)]*)\)/.exec(trimmed);
        if (constructor) checkConstructorDocumentation(source, file, line, issues);

        const method = /^async +([A-Za-z]\w*) *\(([^)]*)\)/.exec(trimmed);
        if (!method) continue;

        await checkMethodDocumentation(source, file, line, method, mutation, issues);
    }
}

function checkAuthTokenDocumentation(
    source: string,
    file: string,
    line: SourceLine,
    issues: JsdocIssue[]
): void {
    const field = "private readonly authToken";
    const fieldIndex = line.text.indexOf(field);
    if (fieldIndex === -1) return;

    requireDocumentation(
        issues,
        source,
        file,
        line.start + fieldIndex,
        "The authToken field must have JSDoc"
    );
}

function checkConstructorDocumentation(
    source: string,
    file: string,
    line: SourceLine,
    issues: JsdocIssue[]
): void {
    const index = line.start + line.text.indexOf("constructor");
    const documentation = requireDocumentation(
        issues,
        source,
        file,
        index,
        "Constructors must have JSDoc"
    );
    if (!documentation) return;

    requireTag(
        issues,
        source,
        file,
        index,
        documentation,
        String.raw`@param\s+(?:{[^}]+}\s+)?authToken`,
        "Constructors must document the authToken parameter"
    );
}

async function checkMethodDocumentation(
    source: string,
    file: string,
    line: SourceLine,
    method: RegExpExecArray,
    mutation: boolean,
    issues: JsdocIssue[]
): Promise<void> {
    const index = line.start + line.text.indexOf("async");
    const documentation = requireDocumentation(
        issues,
        source,
        file,
        index,
        `Operation ${method[1]} must have JSDoc`
    );
    if (!documentation) return;

    await requireApiReference(issues, source, file, index, documentation, `Operation ${method[1]}`);

    requireTag(
        issues,
        source,
        file,
        index,
        documentation,
        "@returns",
        `Operation ${method[1]} must document its return value`
    );
    if (method[2].includes("variables")) {
        requireTag(
            issues,
            source,
            file,
            index,
            documentation,
            String.raw`@param\s+(?:{[^}]+}\s+)?variables`,
            `Operation ${method[1]} must document its variables parameter`
        );
    }
    if (mutation) {
        requireTag(
            issues,
            source,
            file,
            index,
            documentation,
            "@throws",
            `Mutation ${method[1]} must document authentication and validation errors`
        );
    }
}

export async function checkTypeSource(source: string, file: string): Promise<JsdocIssue[]> {
    const issues: JsdocIssue[] = [];

    for (const line of getSourceLines(source)) {
        const declaration = /^export (type|const) ([A-Za-z]\w*)/.exec(line.text.trim());
        if (!declaration) continue;

        const index = line.start + line.text.indexOf("export");
        const documentation = requireDocumentation(
            issues,
            source,
            file,
            index,
            `Export ${declaration[2]} must have JSDoc`
        );
        await requireApiReference(
            issues,
            source,
            file,
            index,
            documentation,
            `Export ${declaration[2]}`
        );
    }

    return issues;
}

export async function checkJsdoc(projectRoot = process.cwd()): Promise<JsdocIssue[]> {
    const issues: JsdocIssue[] = [];
    const sourceRoot = resolve(projectRoot, "src");
    const apiTypeFiles = [
        ...(await collectTypeScriptFiles(join(sourceRoot, "apis/anilist/facade"))),
    ].sort((left, right) => left.localeCompare(right));
    for (const relativePath of [
        "AniLink.ts",
        ...apiTypeFiles.map((f) => relative(sourceRoot, f)),
    ]) {
        const filePath = join(sourceRoot, relativePath);
        const source = await readFile(filePath, "utf8");
        issues.push(...(await checkAniLinkSource(source, relative(projectRoot, filePath))));
    }

    for (const directory of ["apis/anilist/query", "apis/anilist/mutation"]) {
        for (const file of await collectTypeScriptFiles(join(sourceRoot, directory))) {
            const source = await readFile(file, "utf8");
            issues.push(...(await checkOperationSource(source, relative(projectRoot, file))));
        }
    }

    const typeDirectory = join(sourceRoot, "apis/anilist/types");
    for (const file of await collectTypeScriptFiles(typeDirectory)) {
        const source = await readFile(file, "utf8");
        issues.push(...(await checkTypeSource(source, relative(projectRoot, file))));
    }

    return issues;
}

async function collectTypeScriptFiles(directory: string): Promise<string[]> {
    const files: string[] = [];
    const entries = (await readdir(directory, { withFileTypes: true })).sort((left, right) =>
        left.name.localeCompare(right.name)
    );

    for (const entry of entries) {
        const file = join(directory, entry.name);
        if (entry.isDirectory()) {
            files.push(...(await collectTypeScriptFiles(file)));
        } else if (entry.name.endsWith(".ts")) {
            files.push(file);
        }
    }

    return files;
}

function getSourceLines(source: string): SourceLine[] {
    const lines: SourceLine[] = [];
    let start = 0;
    const newline = /\r?\n/g;
    let match: RegExpExecArray | null;
    let lastIndex = 0;

    while ((match = newline.exec(source)) !== null) {
        lines.push({ text: source.slice(lastIndex, match.index), start });
        start = match.index + match[0].length;
        lastIndex = start;
    }

    if (lastIndex < source.length) {
        lines.push({ text: source.slice(lastIndex), start });
    }

    return lines;
}

function getPropertySignature(lines: SourceLine[], lineIndex: number): string {
    let signature = lines[lineIndex].text;

    while (!signature.includes("=>") && lineIndex + 1 < lines.length) {
        lineIndex++;
        signature += ` ${lines[lineIndex].text}`;
    }

    return signature;
}

function findDocumentation(source: string, index: number): DocumentationBlock | undefined {
    const prefix = source.slice(0, index);
    const closeIndex = prefix.lastIndexOf("*/");
    if (closeIndex === -1) return undefined;

    const openIndex = prefix.lastIndexOf("/**", closeIndex);
    if (openIndex === -1) return undefined;

    return { text: prefix.slice(openIndex, closeIndex + 2) };
}

function requireDocumentation(
    issues: JsdocIssue[],
    source: string,
    file: string,
    index: number,
    message: string
): DocumentationBlock | undefined {
    const documentation = findDocumentation(source, index);
    if (!documentation) {
        issues.push(createIssue(source, file, index, "JSDoc", message));
    }
    return documentation;
}

function requireTag(
    issues: JsdocIssue[],
    source: string,
    file: string,
    index: number,
    documentation: DocumentationBlock | undefined,
    tag: string,
    message: string
): void {
    if (!documentation || !new RegExp(tag).test(documentation.text)) {
        issues.push(createIssue(source, file, index, tag.startsWith("@") ? tag : "JSDoc", message));
    }
}

async function requireApiReference(
    issues: JsdocIssue[],
    source: string,
    file: string,
    index: number,
    documentation: DocumentationBlock | undefined,
    subject: string
): Promise<void> {
    if (!documentation) return;

    const reference = /@see\s+(\S+)/.exec(documentation.text)?.[1];
    if (!reference || !(await isActualAniListApiReference(reference))) {
        issues.push(
            createIssue(
                source,
                file,
                index,
                "@see",
                `${subject} must link to an actual AniList API reference page`
            )
        );
    }
}

/**
 * Like {@link requireApiReference}, but additionally enforces that the `@see`
 * link points at the specific reference page mapped for the operation (see the
 * `operationReferences` field in scripts/reference-pages.json) when one exists.
 * Operations without a specific page mapping may still link to the generic
 * `/reference/query` or `/reference/mutation` index.
 */
async function requireSpecificApiReference(
    issues: JsdocIssue[],
    source: string,
    file: string,
    index: number,
    documentation: DocumentationBlock | undefined,
    subject: string,
    operation: string
): Promise<void> {
    if (!documentation) return;

    const reference = /@see\s+(\S+)/.exec(documentation.text)?.[1];
    if (!reference || !(await isActualAniListApiReference(reference))) {
        issues.push(
            createIssue(
                source,
                file,
                index,
                "@see",
                `${subject} must link to an actual AniList API reference page`
            )
        );
        return;
    }

    const expected = await expectedOperationReference(operation);
    if (expected === undefined) return;

    const actual = normalizeReferencePath(reference);
    if (actual !== expected) {
        issues.push(
            createIssue(
                source,
                file,
                index,
                "@see",
                `${subject} must link to the specific reference page ${expected} (got ${
                    actual ?? reference
                })`
            )
        );
    }
}

function createIssue(
    source: string,
    file: string,
    index: number,
    tag: string,
    message: string
): JsdocIssue {
    return {
        file,
        line: source.slice(0, index).split(/\r?\n/).length,
        tag,
        message,
    };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
    void checkJsdoc()
        .then((issues) => {
            if (issues.length === 0) {
                console.log("JSDoc check passed.");
                return;
            }

            console.error(`JSDoc check found ${issues.length} issue(s):`);
            for (const issue of issues) {
                console.error(`${issue.file}:${issue.line} [${issue.tag}] ${issue.message}`);
            }
            process.exitCode = 1;
        })
        .catch((error: unknown) => {
            console.error(error instanceof Error ? error.message : String(error));
            process.exitCode = 2;
        });
}
