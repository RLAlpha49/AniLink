import { AniLinkValidationError } from "../../../../../base/AniLinkError";
import type { SelectionAlways } from "./fieldsSelection";

/**
 * Field-selection composition for AniList operation documents.
 *
 * The maximal document an operation sends without `fields` is the single
 * source of truth: its root field's selection is parsed into a tree, the
 * requested paths are pruned out of that tree, and the pruned tree is
 * re-rendered in place of the original selection. Everything outside the
 * root field's selection — the operation header, variable declarations, and
 * the root field's argument list — is preserved verbatim, except variable
 * declarations the pruned document no longer references (the GraphQL spec's
 * All Variables Used rule makes servers reject those).
 *
 * @see https://docs.anilist.co/reference/query
 */

/** A field or inline fragment, addressed by its field name or type condition. */
interface SelectionNode {
    /** Fragments render their name as a GraphQL type condition. */
    kind: "field" | "fragment";
    /** The response key or fragment type condition used by selection paths. */
    name: string;
    /** The underlying field name when the response key is an alias. */
    fieldName?: string;
    /** The field's argument list, verbatim (e.g. `(asHtml: $asHtml)`), or `""`. */
    args: string;
    /** Nested selection nodes, in document order. */
    children: SelectionNode[];
}

/**
 * Cache of parsed selection trees, keyed by the selection body text.
 *
 * The maximal documents are immutable string literals, so every call for the
 * same operation hits the cache after the first; the tree is pruned into a
 * fresh structure per call and never mutated in place. Bounded by the number
 * of distinct maximal documents (one per operation class).
 */
const parseCache = new Map<string, SelectionNode[]>();

/**
 * One field line of a maximal document: a response key, an optional
 * `alias:` prefix naming the underlying field, an optional argument list,
 * and an optional selection-set opener.
 *
 * The security rule flags the nested quantifiers in the optional alias and
 * argument groups; every inner class is a single-character negated or
 * bounded set, so the pattern is linear and cannot backtrack catastrophically.
 */
const FIELD_LINE_PATTERN =
    // eslint-disable-next-line security/detect-unsafe-regex -- bounded single-char classes; no nested unbounded quantifiers
    /^([A-Za-z_][A-Za-z0-9_]*)\s*(?::\s*([A-Za-z_][A-Za-z0-9_]*)\s*)?(\([^()]*\))?\s*(\{)?$/;

/**
 * Parse a GraphQL selection body into a tree of `SelectionNode`s.
 *
 * Tracks brace depth so nested selections attach to their parent field.
 * Blank lines are skipped. Lines that carry no field (lone closing braces)
 * only pop the stack. Any other unrecognized line is a hard error: the
 * maximal documents this composer serves are generated in one-field-per-line
 * format, and silently dropping a line would corrupt every composed document
 * built from it.
 *
 * @param body - The selection text to parse (e.g. a root field's selection).
 * @returns The top-level selection nodes, in document order.
 * @throws {AniLinkValidationError} When a line is neither blank, a lone closing-brace run, nor a field.
 */
function parseSelection(body: string): SelectionNode[] {
    const cached = parseCache.get(body);
    if (cached !== undefined) return cached;
    const parsed = parseSelectionUncached(body);
    parseCache.set(body, parsed);
    return parsed;
}

/** Uncached parse pass behind `parseSelection`. */
function parseSelectionUncached(body: string): SelectionNode[] {
    const roots: SelectionNode[] = [];
    const stack: SelectionNode[] = [];
    for (const rawLine of body.split("\n")) {
        const line = rawLine.trim();
        if (line === "") continue;

        const closeCount = (line.match(/\}/g) ?? []).length;

        // A line that opens and closes a selection in place (`title { romaji }`)
        // would pop the stack before its own field is attached, silently
        // rendering the field as a scalar and dropping its children. The
        // maximal documents are strictly one-field-per-line, so reject the
        // shape instead of mis-parsing it.
        if (closeCount > 0 && line.includes("{")) {
            throw new AniLinkValidationError(
                [
                    `composeSelection cannot parse the document line: "${line}". ` +
                        "The maximal document must use one field per line, without " +
                        "comments or single-line selection blocks.",
                ],
                "The GraphQL document is invalid"
            );
        }

        // Closing braces pop the stack before the line's own field is parsed.
        for (let i = 0; i < closeCount; i++) stack.pop();

        const fragmentMatch = /^\.\.\.\s+on\s+([A-Za-z_][A-Za-z0-9_]*)\s*\{$/.exec(line);
        if (fragmentMatch) {
            const node: SelectionNode = {
                kind: "fragment",
                name: fragmentMatch[1],
                args: "",
                children: [],
            };
            if (stack.length === 0) roots.push(node);
            else stack[stack.length - 1].children.push(node);
            stack.push(node);
            continue;
        }

        const fieldMatch = FIELD_LINE_PATTERN.exec(line);
        if (fieldMatch) {
            const node: SelectionNode = {
                kind: "field",
                name: fieldMatch[1],
                fieldName: fieldMatch[2],
                args: fieldMatch[3] ?? "",
                children: [],
            };
            if (stack.length === 0) roots.push(node);
            else stack[stack.length - 1].children.push(node);
            if (fieldMatch[4]) stack.push(node);
            continue;
        }
        if (/^\}+$/.test(line)) continue;
        throw new AniLinkValidationError(
            [
                `composeSelection cannot parse the document line: "${line}". ` +
                    "The maximal document must use one field per line, without " +
                    "comments or single-line selection blocks.",
            ],
            "The GraphQL document is invalid"
        );
    }
    assertNoEmptyFragments(roots);
    return roots;
}

/**
 * Reject inline fragments that select no fields.
 *
 * A childless fragment would re-render as an empty selection set — invalid
 * GraphQL — so a malformed maximal document fails at parse time, with the
 * fragment named, instead of producing a document the server rejects with a
 * less actionable message. This also keeps the invariant the prune step
 * relies on: a childless node in a parsed tree is always a scalar field.
 */
function assertNoEmptyFragments(nodes: SelectionNode[]): void {
    for (const node of nodes) {
        if (node.kind === "fragment" && node.children.length === 0) {
            throw new AniLinkValidationError(
                [
                    `composeSelection cannot parse the document: the inline fragment ` +
                        `"... on ${node.name}" selects no fields.`,
                ],
                "The GraphQL document is invalid"
            );
        }
        assertNoEmptyFragments(node.children);
    }
}

/**
 * Render a selection tree back to GraphQL text.
 *
 * @param nodes - The selection nodes to render, in order.
 * @param indent - The indentation prefix for each depth level.
 * @returns The rendered selection lines, joined by newlines.
 */
function renderSelection(nodes: SelectionNode[], indent: string): string {
    const lines: string[] = [];
    for (const node of nodes) {
        const field = node.fieldName === undefined ? node.name : `${node.name}: ${node.fieldName}`;
        const head = node.kind === "fragment" ? `... on ${node.name}` : `${field}${node.args}`;
        if (node.kind === "field" && node.children.length === 0) {
            lines.push(`${indent}${head}`);
        } else {
            lines.push(`${indent}${head} {`);
            lines.push(renderSelection(node.children, `${indent}  `));
            lines.push(`${indent}}`);
        }
    }
    return lines.join("\n");
}

/**
 * Prune a selection tree down to the requested field paths.
 *
 * A path is a dot-separated field chain (`"title.romaji"`, `"tags.name"`).
 * A path that stops at an object keeps that object's whole sub-tree; a path
 * that continues prunes the sub-tree recursively. Paths sharing a head merge
 * into one selection of that head. Paths are validated against the tree as
 * they walk: an unknown segment fails with every other invalid path listed,
 * reported with the full caller-provided path (not just the failing segment).
 *
 * Union members are addressed by type-qualified paths: a first segment that
 * names an inline fragment's type condition (`"TextActivity.text"`) selects
 * inside that spread, and the bare type name (`"TextActivity"`) keeps the
 * whole spread. The type name is a scope, not a field: it never renders as a
 * property, and paths that continue past it are re-based onto the spread's
 * children.
 *
 * @param nodes - The maximal selection tree.
 * @param paths - The caller-requested dot paths.
 * @param always - Field names (at this level) selected in every composed document.
 * @param prefix - The dot-path prefix of `nodes` inside the caller's request,
 *   used to report unknown fields with their full path.
 * @returns The pruned selection tree, in maximal-document order. Whole-head
 *   selections share nodes with the parse cache — treat the returned tree as
 *   frozen; never mutate it in place.
 * @throws An {@link AniLinkValidationError} listing every unknown path.
 */
function pruneSelection(
    nodes: SelectionNode[],
    paths: readonly string[],
    always: readonly string[],
    prefix: string
): SelectionNode[] {
    const byName = new Map<string, SelectionNode>();
    for (const node of nodes) byName.set(node.name, node);

    const unknown: string[] = [];
    // Group sub-paths by their head field, preserving first-seen order.
    const subPaths = new Map<string, string[]>();
    const wholeHeads = new Set<string>();

    // Always-keys are validated separately from the caller's paths: a bad
    // entry is a library bug (the operation class's always-keys constant),
    // and blaming the caller's `fields` list would send them hunting through
    // paths they never wrote.
    for (const path of always) {
        const segments = path.split(".");
        if (!byName.has(segments[0])) {
            throw new AniLinkValidationError(
                [
                    `composeSelection: invalid always-selected key "${path}" — not a field of the maximal document. ` +
                        "This is a library bug in the operation's always-keys constant, not a caller error.",
                ],
                "The operation's always-selected fields are invalid"
            );
        }
    }

    // Always-keys are retained as whole selections even when a requested
    // path extends them: `pageInfo.total` over the always-selected `pageInfo`
    // keeps the whole `pageInfo` block (a superset), so pagination metadata
    // stays available to the shared `paginate` helpers. The render loop's
    // `isWhole` check takes priority, so the extending path's sub-paths are
    // simply ignored for that head.
    const requested = [...always, ...paths];
    for (const path of requested) {
        const segments = path.split(".");
        const head = segments[0];
        if (!byName.has(head)) {
            unknown.push(prefix === "" ? path : `${prefix}.${path}`);
            continue;
        }
        if (segments.length === 1) {
            wholeHeads.add(head);
        } else {
            const rest = segments.slice(1).join(".");
            const existing = subPaths.get(head);
            if (existing) existing.push(rest);
            else subPaths.set(head, [rest]);
        }
    }
    if (unknown.length > 0) {
        throw new AniLinkValidationError([
            `Unknown field(s): ${unknown.join(", ")}. Valid fields are the response type's keys, at any nesting depth.`,
        ]);
    }

    // Re-render in maximal-document order so composed documents keep the
    // source fragment's field order.
    const out: SelectionNode[] = [];
    for (const node of nodes) {
        const isWhole = wholeHeads.has(node.name);
        const subs = subPaths.get(node.name);
        if (isWhole) {
            out.push(node);
            continue;
        }
        if (subs === undefined) continue;
        // Prune this node's children by the requested sub-paths. A node with
        // no children cannot be drilled into; requesting a sub-path under it
        // is an unknown field. The parser rejects empty inline fragments, so
        // a childless node here is always a scalar field.
        if (node.children.length === 0) {
            const full = (s: string): string =>
                prefix === "" ? `${node.name}.${s}` : `${prefix}.${node.name}.${s}`;
            throw new AniLinkValidationError([
                `Unknown field(s): ${subs.map(full).join(", ")}. ` +
                    `"${node.name}" is a scalar and cannot be drilled into.`,
            ]);
        }
        out.push({
            kind: node.kind,
            name: node.name,
            fieldName: node.fieldName,
            args: node.args,
            children: pruneSelection(
                node.children,
                subs,
                [],
                prefix === "" ? node.name : `${prefix}.${node.name}`
            ),
        });
    }
    return out;
}

/**
 * Whether a variable name appears as a whole token (`$name` followed by a
 * non-identifier character) in a usage scope.
 *
 * @param usageScope - The document text to search, excluding the declaration list.
 * @param name - The variable name without its `$` prefix.
 * @returns `true` when `$name` is referenced as a whole token.
 */
function isVariableUsed(usageScope: string, name: string): boolean {
    const token = `$${name}`;
    let at = usageScope.indexOf(token);
    while (at !== -1) {
        const after = usageScope[at + token.length];
        // A whole token ends at end-of-scope or a non-identifier character,
        // so `$id` is not a use of `$idMal`.
        if (after === undefined || !/[A-Za-z0-9_]/.test(after)) return true;
        at = usageScope.indexOf(token, at + token.length);
    }
    return false;
}

/**
 * Drop variable declarations the composed document no longer references.
 *
 * The GraphQL spec's All Variables Used rule makes spec-compliant servers
 * reject documents that declare variables their selections never use, and
 * pruning fields orphans their variables (dropping `description` orphans
 * `$asHtml`). The declaration list is rebuilt keeping only variables that
 * still appear elsewhere in the composed document — in the root field's
 * argument list or in the pruned selection.
 *
 * @param header - The operation header, up to and including the opening `{`
 *   of the operation definition (e.g. `query ($id: Int) {`).
 * @param document - The full composed document (header included); variable
 *   references anywhere outside the declaration list keep their declarations.
 * @returns The header with unused declarations removed; unchanged when every
 *   declared variable is still referenced.
 */
function pruneVariableDeclarations(header: string, document: string): string {
    // The declaration list opens before the operation definition's opening
    // brace; a paren after that brace is the root field's argument list, not
    // declarations. Treating root args as declarations would excise them
    // from the usage scope and silently strip the root field's arguments
    // from every composed document (no current maximal document declares
    // zero variables, but nothing else guards the shape).
    const opBrace = header.indexOf("{");
    const openParen = header.indexOf("(");
    if (openParen === -1 || opBrace === -1 || openParen > opBrace) return header;

    // The declaration list ends at its own matching `)` — a depth scan, not
    // `lastIndexOf(")")`, which would find the root field's argument list
    // further down the header.
    let parenDepth = 0;
    let closeParen = -1;
    for (let i = openParen; i < header.length; i++) {
        const char = header[i];
        if (char === "(") parenDepth++;
        else if (char === ")") {
            parenDepth--;
            if (parenDepth === 0) {
                closeParen = i;
                break;
            }
        }
    }
    if (closeParen === -1) return header;

    const declarations = header.slice(openParen + 1, closeParen).split(",");
    // Usage scope: the whole composed document minus the declaration list
    // itself, so a variable referenced only in the root field's argument
    // list (which lives in the header) still counts as used. The span is
    // excised positionally — the declaration list's own indices — rather than
    // by first-occurrence text search, so identical text elsewhere can never
    // redirect the excision.
    const usageScope = document.slice(0, openParen) + document.slice(closeParen + 1);
    const kept = declarations.filter((declaration) => {
        const nameMatch = /\$([A-Za-z0-9_]+)/.exec(declaration);
        if (!nameMatch) return true; // Not a variable declaration; keep verbatim.
        // A variable is used when its name appears as a whole token anywhere
        // in the usage scope: `$name` followed by a non-identifier character
        // (or the end of the scope), so `$id` does not count as a use of
        // `$idMal`. Plain substring scanning avoids a dynamic RegExp.
        return isVariableUsed(usageScope, nameMatch[1]);
    });
    if (kept.length === declarations.length) return header;
    // Rebuild the header around the pruned declaration list, keeping the
    // operation's opening brace and the root field's line (with its argument
    // list) that follow the declarations.
    const prefix = header.slice(0, openParen).trimEnd();
    const suffix = header.slice(closeParen + 1);
    if (kept.length === 0) {
        // No variables left: the operation takes no declarations at all.
        return `${prefix}${suffix}`;
    }
    return `${prefix}(${kept.map((d) => d.trim()).join(", ")})${suffix}`;
}

/**
 * Compose a partial GraphQL document from a maximal one.
 *
 * The maximal document stays the single source of truth: `fields` is
 * `undefined` returns the maximal document byte-identical, so the default
 * surface — which the api-compare gate validates against the live schema —
 * never changes. When `fields` is given, the root field's selection is pruned
 * to the requested paths (plus the always-selected keys): the operation
 * header and the root field's argument list are preserved verbatim, variable
 * declarations the pruned document no longer references are dropped, and
 * the root field's own closing brace is re-emitted so the composed document
 * is always a syntactically valid sub-document of the maximal one.
 *
 * @param maximalDocument - The maximal document the operation sends without `fields`.
 * @param fields - The caller-requested dot paths, or `undefined` for the maximal document.
 * @param always - Root-level field names selected in every document for this entity
 *   (a {@link SelectionAlways} policy list; see `fieldsSelection.ts`).
 * @returns The composed document; the maximal document unchanged when `fields` is `undefined`.
 * @throws An {@link AniLinkValidationError} listing every unknown field path, when
 *   `fields` is `null`, when the requested paths (plus always keys) select nothing,
 *   or when the maximal document's structure cannot be parsed or located.
 * @see https://docs.anilist.co/reference/query
 */
export function composeDocument(
    maximalDocument: string,
    fields: readonly string[] | undefined,
    always: SelectionAlways
): string {
    if (fields === undefined) return maximalDocument;
    // `null` is not "no selection": a JS caller passing `fields: null` almost
    // certainly lost a value, and silently answering with the maximal
    // document — the heaviest possible request — would punish them with
    // over-fetching and rate-limit cost. Reject it loudly instead.
    if (fields === null) {
        throw new AniLinkValidationError([
            "`fields` must be an array of response paths, not `null`. Omit it for the maximal selection.",
        ]);
    }
    // A non-array `fields` (e.g. a bare string from a JS caller) would
    // otherwise be spread character-by-character into the path walk and
    // rejected with a baffling "Unknown field(s): i, d" message.
    if (!Array.isArray(fields)) {
        throw new AniLinkValidationError([
            "`fields` must be an array of response paths. Omit it for the maximal selection.",
        ]);
    }

    // Locate the root field: the first field after the operation definition's
    // opening brace. Its selection opens at the next `{` and closes at the
    // matching `}`, which a depth scan finds (the document's last `}` closes
    // the operation, not the root field). A document whose structure cannot be
    // located while `fields` is set is a generated-code bug, not a caller
    // mistake: silently returning the maximal document would ignore the
    // caller's selection and over-fetch, so fail loudly instead.
    const opOpen = maximalDocument.indexOf("{");
    if (opOpen === -1) {
        throw new AniLinkValidationError(
            ["composeSelection cannot locate the operation definition's opening brace."],
            "The GraphQL document is invalid"
        );
    }
    const rootOpen = maximalDocument.indexOf("{", opOpen + 1);
    if (rootOpen === -1) {
        throw new AniLinkValidationError(
            ["composeSelection cannot locate the root field's selection."],
            "The GraphQL document is invalid"
        );
    }
    let depth = 0;
    let rootClose = -1;
    for (let i = rootOpen; i < maximalDocument.length; i++) {
        const char = maximalDocument[i];
        if (char === "{") depth++;
        else if (char === "}") {
            depth--;
            if (depth === 0) {
                rootClose = i;
                break;
            }
        }
    }
    if (rootClose === -1) {
        throw new AniLinkValidationError(
            ["composeSelection cannot locate the root field's closing brace."],
            "The GraphQL document is invalid"
        );
    }

    const tree = parseSelection(maximalDocument.slice(rootOpen + 1, rootClose));
    const pruned = pruneSelection(tree, fields, always, "");
    if (pruned.length === 0) {
        // An empty selection set is invalid GraphQL; fail before dispatch
        // instead of letting the server reject the document.
        throw new AniLinkValidationError([
            "`fields` must name at least one field of the response.",
        ]);
    }
    const rendered = renderSelection(pruned, "  ");

    // Reassemble: header (through the root field's opening `{`), the pruned
    // selection, the root field's closing `}`, and the operation's tail (its
    // own closing `}` and any trailing text) verbatim.
    const header = maximalDocument.slice(0, rootOpen + 1);
    const tail = maximalDocument.slice(rootClose);
    const body = `${rendered}\n${tail}`;
    const composed = `${header}\n${body}`;
    return `${pruneVariableDeclarations(header, composed)}\n${body}`;
}
