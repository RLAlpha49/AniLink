import { readFile, readdir } from "node:fs/promises";
import { join, relative, resolve } from "node:path";

const ANILIST_API_REFERENCE_PREFIX = "https://docs.anilist.co/reference/";

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

export function checkAniLinkSource(source: string, file: string): JsdocIssue[] {
    const issues: JsdocIssue[] = [];
    const lines = getSourceLines(source);

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const line = lines[lineIndex];
        const property = /^ {12,}([A-Za-z]\w*): *\(/.exec(line.text);
        if (!property) continue;

        const index = line.start + line.text.indexOf(property[1]);
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
                `AniLink operation ${property[1]} must document its ${parameter} parameter`
            );
        }

        requireTag(
            issues,
            source,
            file,
            index,
            documentation,
            "@returns",
            `AniLink operation ${property[1]} must document its return value`
        );
        requireTag(
            issues,
            source,
            file,
            index,
            documentation,
            "@example",
            `AniLink operation ${property[1]} must include an executable usage example`
        );
        requireApiReference(
            issues,
            source,
            file,
            index,
            documentation,
            `AniLink operation ${property[1]}`
        );
    }

    return issues;
}

export function checkOperationSource(source: string, file: string): JsdocIssue[] {
    const issues: JsdocIssue[] = [];
    checkOperationDeclarations(source, file, issues);
    checkOperationMembers(source, file, /[\\/]mutation[\\/]/.test(file), issues);
    return issues;
}

function checkOperationDeclarations(source: string, file: string, issues: JsdocIssue[]): void {
    let checkingVariables = false;

    for (const line of getSourceLines(source)) {
        const trimmed = line.text.trim();
        const declaration = /^export (interface|class) ([A-Za-z]\w*)/.exec(trimmed);
        if (declaration) {
            const index = line.start + line.text.indexOf("export");
            const documentation = requireDocumentation(
                issues,
                source,
                file,
                index,
                `Export ${declaration[2]} must have JSDoc`
            );
            requireApiReference(
                issues,
                source,
                file,
                index,
                documentation,
                `Export ${declaration[2]}`
            );
            checkingVariables =
                declaration[1] === "interface" && declaration[2].endsWith("Variables");
            continue;
        }

        if (checkingVariables && trimmed === "}") {
            checkingVariables = false;
            continue;
        }

        if (checkingVariables) {
            const property = /^([A-Za-z]\w*)\?? *:/.exec(trimmed);
            if (property) {
                const index = line.start + line.text.indexOf(property[1]);
                requireDocumentation(
                    issues,
                    source,
                    file,
                    index,
                    `Variable ${property[1]} must have JSDoc`
                );
            }
        }
    }
}

function checkOperationMembers(
    source: string,
    file: string,
    mutation: boolean,
    issues: JsdocIssue[]
): void {
    for (const line of getSourceLines(source)) {
        checkAuthTokenDocumentation(source, file, line, issues);

        const trimmed = line.text.trim();
        const constructor = /^constructor *\(([^)]*)\)/.exec(trimmed);
        if (constructor) checkConstructorDocumentation(source, file, line, issues);

        const method = /^async +([A-Za-z]\w*) *\(([^)]*)\)/.exec(trimmed);
        if (!method) continue;

        checkMethodDocumentation(source, file, line, method, mutation, issues);
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

function checkMethodDocumentation(
    source: string,
    file: string,
    line: SourceLine,
    method: RegExpExecArray,
    mutation: boolean,
    issues: JsdocIssue[]
): void {
    const index = line.start + line.text.indexOf("async");
    const documentation = requireDocumentation(
        issues,
        source,
        file,
        index,
        `Operation ${method[1]} must have JSDoc`
    );
    if (!documentation) return;

    requireApiReference(issues, source, file, index, documentation, `Operation ${method[1]}`);

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

export function checkTypeSource(source: string, file: string): JsdocIssue[] {
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
        requireApiReference(issues, source, file, index, documentation, `Export ${declaration[2]}`);
    }

    return issues;
}

export async function checkJsdoc(projectRoot = process.cwd()): Promise<JsdocIssue[]> {
    const issues: JsdocIssue[] = [];
    const sourceRoot = resolve(projectRoot, "src");
    const aniLinkPath = join(sourceRoot, "AniLink.ts");
    const aniLinkSource = await readFile(aniLinkPath, "utf8");
    issues.push(...checkAniLinkSource(aniLinkSource, relative(projectRoot, aniLinkPath)));

    for (const directory of ["apis/anilist/query", "apis/anilist/mutation"]) {
        for (const file of await collectTypeScriptFiles(join(sourceRoot, directory))) {
            const source = await readFile(file, "utf8");
            issues.push(...checkOperationSource(source, relative(projectRoot, file)));
        }
    }

    const typeDirectory = join(sourceRoot, "apis/anilist/types");
    for (const file of await collectTypeScriptFiles(typeDirectory)) {
        const source = await readFile(file, "utf8");
        issues.push(...checkTypeSource(source, relative(projectRoot, file)));
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

    for (const text of source.split(/\r?\n/)) {
        lines.push({ text, start });
        start += text.length + 1;
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
    const match = /\/\*\*([\s\S]*?)\*\/\s*$/.exec(prefix);
    if (!match) return undefined;
    return { text: match[0] };
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

function requireApiReference(
    issues: JsdocIssue[],
    source: string,
    file: string,
    index: number,
    documentation: DocumentationBlock | undefined,
    subject: string
): void {
    if (!documentation) return;

    const reference = /@see\s+(\S+)/.exec(documentation.text)?.[1];
    if (!(reference?.startsWith(ANILIST_API_REFERENCE_PREFIX) ?? false)) {
        issues.push(
            createIssue(
                source,
                file,
                index,
                "@see",
                `${subject} must link to the official AniList API reference`
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

if (require.main === module) {
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
