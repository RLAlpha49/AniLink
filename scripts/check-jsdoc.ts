import { readFile, readdir } from "node:fs/promises";
import { basename, join, relative, resolve } from "node:path";
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

/** JSON shape of the checked-in AniList reference-page allowlist. */
interface ReferencePagesFile {
    pages: string[];
    operationReferences?: Record<string, string>;
}

/** Load and cache the reference-page allowlist used by every link check. */
async function loadReferencePages(): Promise<Set<string>> {
    if (referencePages) return referencePages;

    const pagesPath = join(import.meta.dirname, "reference-pages.json");
    const raw = await readFile(pagesPath, "utf8");
    const parsed = JSON.parse(raw) as ReferencePagesFile;
    referencePages = new Set(parsed.pages);
    operationReferences = new Map(Object.entries(parsed.operationReferences ?? {}));
    return referencePages;
}

/** Return an operation-specific reference path when the allowlist defines one. */
async function expectedOperationReference(operation: string): Promise<string | undefined> {
    await loadReferencePages();
    return operationReferences!.get(operation);
}

/** Normalize an AniList reference URL to an allowlist path, ignoring query and hash suffixes. */
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

/** Check whether a JSDoc link names a real page in the checked-in allowlist. */
async function isActualAniListApiReference(reference: string): Promise<boolean> {
    const suffix = normalizeReferencePath(reference);
    if (!suffix) return false;

    const pages = await loadReferencePages();
    return pages.has(suffix);
}

const MAL_API_REFERENCE_PREFIX = "https://myanimelist.net/apiconfig/references/";

/**
 * Check whether a JSDoc link names a MyAnimeList reference page. MAL publishes
 * one OpenAPI spec, so any anchor under the reference prefix is valid.
 */
function isMalApiReference(reference: string): boolean {
    return reference.startsWith(MAL_API_REFERENCE_PREFIX);
}

/** Check whether a `@see` target is an internal `{@link ...}` cross-reference. */
function isInternalSeeLink(reference: string): boolean {
    return /^\{@link\s+[^}]+\}$/.test(reference);
}

/**
 * Extract the `@see` target from a documentation block, keeping
 * `{@link ...}` cross-references intact instead of stopping at the first
 * space inside the braces.
 */
function seeReference(documentation: DocumentationBlock): string | undefined {
    return /@see\s+(\{@link\s+[^}]+\}|\S+)/.exec(documentation.text)?.[1];
}

/** One diagnostic emitted by the repository JSDoc validator. */
export interface JsdocIssue {
    /** Repository-relative file containing the problem. */
    file: string;
    /** One-based source line for the problem. */
    line: number;
    /** Missing or invalid documentation tag. */
    tag: string;
    /** Human-readable explanation of the violated documentation contract. */
    message: string;
}

interface DocumentationBlock {
    text: string;
}

interface SourceLine {
    text: string;
    start: number;
}

/**
 * Validate AniLink facade operation properties and their required API links.
 *
 * @param source - Source text of an AniLink facade module.
 * @param file - Repository-relative file name used in diagnostics.
 * @returns All missing-tag and invalid-link diagnostics found in the source.
 */
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

/**
 * Validate exported operation classes and methods in a query or mutation module.
 *
 * @param source - Source text of the operation module.
 * @param file - Repository-relative file name used in diagnostics.
 * @returns All documentation diagnostics found in the source.
 */
export async function checkOperationSource(source: string, file: string): Promise<JsdocIssue[]> {
    const issues: JsdocIssue[] = [];
    await checkOperationDeclarations(source, file, issues);
    await checkOperationMembers(source, file, /[\\/]mutation[\\/]/.test(file), issues);
    return issues;
}

/** Check exported operation declarations before validating their members. */
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

/** Check auth fields, constructors, and async operation methods in one module. */
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

/** Require the private auth token field to explain its role in the client. */
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

/** Require a constructor to document the token it receives. */
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

/** Validate the documentation contract shared by query and mutation methods. */
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

/**
 * Validate exported type aliases and constants under the AniList types tree.
 *
 * @param source - Source text of a types module.
 * @param file - Repository-relative file name used in diagnostics.
 * @returns All missing-documentation and invalid-link diagnostics found.
 */
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

/**
 * Validate MyAnimeList facade operation properties and group interfaces.
 *
 * @param source - Source text of the MAL facade module.
 * @param file - Repository-relative file name used in diagnostics.
 * @returns All missing-tag and invalid-link diagnostics found in the source.
 */
export async function checkMalFacadeSource(source: string, file: string): Promise<JsdocIssue[]> {
    const issues: JsdocIssue[] = [];
    const lines = getSourceLines(source);

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const line = lines[lineIndex];
        const property = /^ {4}([A-Za-z]\w*): *\(/.exec(line.text);
        if (property) {
            const index = line.start + line.text.indexOf(property[1]);
            const documentation = findDocumentation(source, index);
            const signature = getPropertySignature(lines, lineIndex);

            for (const parameter of extractParameters(signature)) {
                requireTag(
                    issues,
                    source,
                    file,
                    index,
                    documentation,
                    String.raw`@param\s+(?:{[^}]+}\s+)?${parameter}`,
                    `MyAnimeList operation ${property[1]} must document its ${parameter} parameter`
                );
            }

            requireTag(
                issues,
                source,
                file,
                index,
                documentation,
                "@returns",
                `MyAnimeList operation ${property[1]} must document its return value`
            );
            requireTag(
                issues,
                source,
                file,
                index,
                documentation,
                "@example",
                `MyAnimeList operation ${property[1]} must include an executable usage example`
            );
            await requireProviderReference(
                issues,
                source,
                file,
                index,
                documentation,
                `MyAnimeList operation ${property[1]}`,
                isMalApiReference,
                "a MyAnimeList API reference page"
            );
            continue;
        }

        const declaration = /^export (interface|type|class) ([A-Za-z]\w*)/.exec(line.text.trim());
        if (!declaration) continue;

        const index = line.start + line.text.indexOf("export");
        const documentation = requireDocumentation(
            issues,
            source,
            file,
            index,
            `Export ${declaration[2]} must have JSDoc`
        );
        await requireProviderReference(
            issues,
            source,
            file,
            index,
            documentation,
            `Export ${declaration[2]}`,
            (reference) => isMalApiReference(reference) || isInternalSeeLink(reference),
            "a MyAnimeList API reference page or an internal link"
        );
    }

    return issues;
}

/**
 * Validate exported classes and async methods in a MAL operations module.
 *
 * @param source - Source text of the MAL operations module.
 * @param file - Repository-relative file name used in diagnostics.
 * @returns All documentation diagnostics found in the source.
 */
export async function checkMalOperationSource(source: string, file: string): Promise<JsdocIssue[]> {
    const issues: JsdocIssue[] = [];
    const lines = getSourceLines(source);

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const line = lines[lineIndex];
        const trimmed = line.text.trim();

        const declaration = /^export (?:abstract )?class ([A-Za-z]\w*)/.exec(trimmed);
        if (declaration) {
            const index = line.start + line.text.indexOf("export");
            const documentation = requireDocumentation(
                issues,
                source,
                file,
                index,
                `Export ${declaration[1]} must have JSDoc`
            );
            await requireProviderReference(
                issues,
                source,
                file,
                index,
                documentation,
                `Export ${declaration[1]}`,
                (reference) => isMalApiReference(reference) || isInternalSeeLink(reference),
                "a MyAnimeList API reference page or an internal link"
            );
            continue;
        }

        const method = /^(?:public |private |protected )?async +([A-Za-z]\w*) *\(/.exec(trimmed);
        if (!method) continue;

        const index = line.start + line.text.indexOf("async");
        const documentation = requireDocumentation(
            issues,
            source,
            file,
            index,
            `Operation ${method[1]} must have JSDoc`
        );
        if (!documentation) continue;

        await requireProviderReference(
            issues,
            source,
            file,
            index,
            documentation,
            `Operation ${method[1]}`,
            isMalApiReference,
            "a MyAnimeList API reference page"
        );

        requireTag(
            issues,
            source,
            file,
            index,
            documentation,
            "@returns",
            `Operation ${method[1]} must document its return value`
        );

        const signature = getMethodSignature(lines, lineIndex);
        for (const parameter of extractParameters(signature)) {
            requireTag(
                issues,
                source,
                file,
                index,
                documentation,
                String.raw`@param\s+(?:{[^}]+}\s+)?${parameter}`,
                `Operation ${method[1]} must document its ${parameter} parameter`
            );
        }
    }

    return issues;
}

/**
 * Validate exported declarations in the MAL surface outside the facade and
 * operations modules.
 *
 * @param source - Source text of the module.
 * @param file - Repository-relative file name used in diagnostics.
 * @returns All missing-documentation and invalid-link diagnostics found.
 */
export async function checkMalExportSource(source: string, file: string): Promise<JsdocIssue[]> {
    const issues: JsdocIssue[] = [];
    await checkExportedDeclarations(
        source,
        file,
        issues,
        (reference) => isMalApiReference(reference) || isInternalSeeLink(reference),
        "a MyAnimeList API reference page or an internal link"
    );
    return issues;
}

/**
 * Validate exported declarations in the provider-composition surface.
 *
 * @param source - Source text of the module.
 * @param file - Repository-relative file name used in diagnostics.
 * @returns All missing-documentation and invalid-link diagnostics found.
 */
export async function checkProviderSource(source: string, file: string): Promise<JsdocIssue[]> {
    const issues: JsdocIssue[] = [];
    await checkExportedDeclarations(
        source,
        file,
        issues,
        async (reference) =>
            (await isActualAniListApiReference(reference)) ||
            isMalApiReference(reference) ||
            isInternalSeeLink(reference),
        "an AniList or MyAnimeList API reference page or an internal link"
    );
    return issues;
}

/**
 * Check exported declarations for JSDoc and a `@see` link the surface allows.
 *
 * @param source - Source text of the module.
 * @param file - Repository-relative file name used in diagnostics.
 * @param issues - Diagnostics accumulator for the module.
 * @param isValidReference - Provider-specific `@see` validation.
 * @param expected - Description of the accepted `@see` targets.
 */
async function checkExportedDeclarations(
    source: string,
    file: string,
    issues: JsdocIssue[],
    isValidReference: (reference: string) => boolean | Promise<boolean>,
    expected: string
): Promise<void> {
    for (const line of getSourceLines(source)) {
        const declaration =
            /^export (?:abstract )?(interface|type|const|class|(?:async )?function) ([A-Za-z]\w*)/.exec(
                line.text.trim()
            );
        if (!declaration) continue;

        const index = line.start + line.text.indexOf("export");
        const documentation = requireDocumentation(
            issues,
            source,
            file,
            index,
            `Export ${declaration[2]} must have JSDoc`
        );
        await requireProviderReference(
            issues,
            source,
            file,
            index,
            documentation,
            `Export ${declaration[2]}`,
            isValidReference,
            expected
        );
    }
}

/**
 * Run the complete AniLink JSDoc audit against a repository root.
 *
 * @param projectRoot - Repository root containing `src/` and `scripts/`.
 * @returns All documentation diagnostics across the AniList, MyAnimeList, and provider-composition source trees.
 * @throws {Error} When a configured source directory or allowlist cannot be read.
 */
export async function checkJsdoc(projectRoot = process.cwd()): Promise<JsdocIssue[]> {
    const issues: JsdocIssue[] = [];
    const sourceRoot = resolve(projectRoot, "src");
    // Provider-scoped directories. Adding a new provider means adding its
    // facade/query/mutation/types paths here; the shared checks apply as-is.
    const apiTypeFiles = [
        ...(await collectTypeScriptFiles(join(sourceRoot, "apis/graphql/anilist/facade"))),
    ].sort((left, right) => left.localeCompare(right));
    for (const relativePath of [
        "AniLink.ts",
        ...apiTypeFiles.map((f) => relative(sourceRoot, f)),
    ]) {
        const filePath = join(sourceRoot, relativePath);
        const source = await readFile(filePath, "utf8");
        issues.push(...(await checkAniLinkSource(source, relative(projectRoot, filePath))));
    }

    for (const directory of ["apis/graphql/anilist/query", "apis/graphql/anilist/mutation"]) {
        for (const file of await collectTypeScriptFiles(join(sourceRoot, directory))) {
            const source = await readFile(file, "utf8");
            issues.push(...(await checkOperationSource(source, relative(projectRoot, file))));
        }
    }

    const typeDirectory = join(sourceRoot, "apis/graphql/anilist/types");
    for (const file of await collectTypeScriptFiles(typeDirectory)) {
        const source = await readFile(file, "utf8");
        issues.push(...(await checkTypeSource(source, relative(projectRoot, file))));
    }

    // MyAnimeList REST surface: the facade module carries the operation
    // properties, the operations modules carry the classes and methods, and
    // every remaining module is checked for documented exports.
    for (const file of await collectTypeScriptFiles(join(sourceRoot, "apis/rest/mal"))) {
        const source = await readFile(file, "utf8");
        const sourcePath = relative(sourceRoot, file);
        const repositoryPath = relative(projectRoot, file);
        if (basename(sourcePath) === "facade.ts") {
            issues.push(...(await checkMalFacadeSource(source, repositoryPath)));
        } else if (/[\\/]operations[\\/]/.test(sourcePath)) {
            issues.push(...(await checkMalOperationSource(source, repositoryPath)));
        } else {
            issues.push(...(await checkMalExportSource(source, repositoryPath)));
        }
    }

    // Provider-composition surface: documented exports with provider or
    // internal `@see` links.
    for (const file of await collectTypeScriptFiles(join(sourceRoot, "providers"))) {
        const source = await readFile(file, "utf8");
        issues.push(...(await checkProviderSource(source, relative(projectRoot, file))));
    }

    return issues;
}

/** Recursively collect TypeScript files in deterministic name order. */
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

/** Split source into lines while retaining each line's character offset. */
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

/** Join a possibly multiline facade property until its return arrow appears. */
function getPropertySignature(lines: SourceLine[], lineIndex: number): string {
    let signature = lines[lineIndex].text;

    while (!signature.includes("=>") && lineIndex + 1 < lines.length) {
        lineIndex++;
        signature += ` ${lines[lineIndex].text}`;
    }

    return signature;
}

/** Join a possibly multiline method signature until its parameter list closes. */
function getMethodSignature(lines: SourceLine[], lineIndex: number): string {
    let signature = lines[lineIndex].text;

    while (!/\)\s*[:{]/.test(signature) && lineIndex + 1 < lines.length) {
        lineIndex++;
        signature += ` ${lines[lineIndex].text.trim()}`;
    }

    return signature;
}

/** Extract parameter names from a joined signature's parameter list. */
function extractParameters(signature: string): string[] {
    const openParen = signature.indexOf("(");
    const closeParen = signature.indexOf(")", openParen + 1);
    let parameterBlock = signature;
    if (openParen !== -1) {
        parameterBlock = signature.slice(
            openParen + 1,
            closeParen === -1 ? signature.length : closeParen
        );
    }

    return [...parameterBlock.matchAll(/(?:^|,)\s*([A-Za-z]\w*)\s*\??\s*:/g)].map(
        (match) => match[1]
    );
}

/** Find the nearest preceding JSDoc block for a source position. */
function findDocumentation(source: string, index: number): DocumentationBlock | undefined {
    const prefix = source.slice(0, index);
    const closeIndex = prefix.lastIndexOf("*/");
    if (closeIndex === -1) return undefined;

    const openIndex = prefix.lastIndexOf("/**", closeIndex);
    if (openIndex === -1) return undefined;

    return { text: prefix.slice(openIndex, closeIndex + 2) };
}

/** Record a missing documentation block and return the block when present. */
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

/** Record a missing tag in a documentation block. */
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

/** Require any valid AniList API reference link in a documentation block. */
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
 * Like {@link requireApiReference}, but for provider surfaces whose `@see`
 * links may target either provider's reference pages or internal symbols.
 *
 * @param issues - Diagnostics accumulator for the module.
 * @param source - Source text of the module.
 * @param file - Repository-relative file name used in diagnostics.
 * @param index - Character index of the documented declaration.
 * @param documentation - Documentation block attached to the declaration.
 * @param subject - Human-readable name used in the diagnostic message.
 * @param isValidReference - Provider-specific `@see` validation.
 * @param expected - Description of the accepted `@see` targets.
 */
async function requireProviderReference(
    issues: JsdocIssue[],
    source: string,
    file: string,
    index: number,
    documentation: DocumentationBlock | undefined,
    subject: string,
    isValidReference: (reference: string) => boolean | Promise<boolean>,
    expected: string
): Promise<void> {
    if (!documentation) return;

    const reference = seeReference(documentation);
    if (!reference || !(await isValidReference(reference))) {
        issues.push(
            createIssue(source, file, index, "@see", `${subject} must link to ${expected}`)
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

/** Create a source-positioned diagnostic for the command-line report. */
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
    try {
        const issues = await checkJsdoc();
        if (issues.length === 0) {
            console.log("JSDoc check passed.");
        } else {
            console.error(`JSDoc check found ${issues.length} issue(s):`);
            for (const issue of issues) {
                console.error(`${issue.file}:${issue.line} [${issue.tag}] ${issue.message}`);
            }
            process.exitCode = 1;
        }
    } catch (error: unknown) {
        console.error(error instanceof Error ? error.message : String(error));
        process.exitCode = 2;
    }
}
