/**
 * AniLink API Explorer — pure logic core.
 *
 * Framework-free helpers shared by the explorer UI: HTML escaping, GraphQL
 * formatting/highlighting, TypeScript snippet highlighting, JSON highlighting,
 * bearer-token masking/redaction, and form-input coercion. Every function is
 * pure (no DOM, no network) so the whole module is unit-testable under Node.
 *
 * Loaded as a plain <script> before explorer.js; attaches `window.ExplorerCore`.
 * Also exports via CommonJS (`module.exports`) so vitest can require it.
 */
(function (root, factory) {
    var api = factory();
    if (typeof module === "object" && typeof module.exports === "object") {
        module.exports = api;
    }
    // Always expose globally too: plain <script> tags need window.ExplorerCore,
    // and ESM loaders (package "type": "module") have neither module nor `this`.
    if (root && typeof root === "object") {
        root.ExplorerCore = api;
    } else if (typeof globalThis !== "undefined") {
        globalThis.ExplorerCore = api;
    }
})(
    typeof self !== "undefined" ? self : typeof globalThis !== "undefined" ? globalThis : this,
    function () {
        "use strict";

        // ---------- Escaping ----------

        /** Escape characters that could break out of HTML text context. */
        function escStructural(s) {
            return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        }

        /** Escape double quotes (for attribute-like contexts inside spans). */
        function escQuotes(s) {
            return String(s).replace(/"/g, "&quot;");
        }

        /** Full escape: structural characters plus double quotes. */
        function escFull(s) {
            return escQuotes(escStructural(s));
        }

        // ---------- GraphQL formatting + highlighting ----------

        /**
         * Pretty-print a GraphQL document: one field per line, 2-space nesting.
         * Pure string transformation — no HTML escaping applied here.
         */
        function formatGraphql(query) {
            var lines = [];
            var depth = 0;
            var pending = ""; // the current field (name + optional args)

            var indent = function () {
                return "  ".repeat(depth);
            };
            var flush = function () {
                if (pending.trim()) lines.push(indent() + pending.trim());
                pending = "";
            };

            var i = 0;
            while (i < query.length) {
                var ch = query[i];

                if (ch === "{") {
                    pending = pending.trim();
                    lines.push(indent() + (pending ? pending + " {" : "{"));
                    pending = "";
                    depth++;
                    i++;
                    continue;
                }
                if (ch === "}") {
                    flush();
                    depth = Math.max(0, depth - 1);
                    lines.push(indent() + "}");
                    i++;
                    continue;
                }
                if (ch === ")") {
                    // A bare close paren (e.g. after `query (...)`) flushes the line.
                    pending = pending.trimEnd() + ")";
                    flush();
                    i++;
                    continue;
                }
                if (/\s/.test(ch)) {
                    // Whitespace between fields ends the current field's line — unless
                    // the next token is an argument list or selection set that must stay
                    // attached.
                    var j = i;
                    while (j < query.length && /\s/.test(query[j])) j++;
                    var next = query[j];
                    i = j; // always consume the whitespace run
                    if (next === "(" || next === "{") continue; // keep pending attached
                    flush();
                    continue;
                }
                if (ch === "(") {
                    // Argument list: consume through the matching close paren verbatim.
                    var args = "";
                    var parenDepth = 0;
                    while (i < query.length) {
                        var c2 = query[i];
                        args += c2;
                        if (c2 === "(") parenDepth++;
                        if (c2 === ")") {
                            parenDepth--;
                            i++;
                            if (parenDepth === 0) break;
                            continue;
                        }
                        i++;
                    }
                    // Attach the args directly to the field name already pending.
                    pending = pending.trimEnd() + args;
                    continue;
                }

                // A word token (field name, variable, type, etc.).
                var word = "";
                while (i < query.length && !/[\s{}()]/.test(query[i])) {
                    word += query[i];
                    i++;
                }
                if (word) pending = pending.trimEnd() + (pending.trim() ? " " : "") + word;
            }
            flush();
            return lines.join("\n");
        }

        /**
         * Wrap GraphQL keywords, variables, and fields in highlight spans.
         * Fully escapes first (these regexes do not depend on quote characters),
         * so span markup can never be mangled by later escaping.
         */
        function highlightGraphql(formatted) {
            var h = escFull(formatted);
            h = h.replace(
                /^(\s*)(query|mutation|fragment)(\s|\()/gm,
                '$1<span class="gql-keyword">$2</span>$3'
            );
            h = h.replace(/(\$[A-Za-z_]\w*)/g, '<span class="gql-arg">$1</span>');
            h = h.replace(/^(\s*)([A-Za-z_]\w*)(\s*\(|\s*\{|$)/gm, function (m, ws, name, tail) {
                if (/^(query|mutation|fragment)$/.test(name)) return m;
                return ws + '<span class="gql-field">' + name + "</span>" + tail;
            });
            return h.replace(/([{}(),])/g, '<span class="gql-punct">$1</span>');
        }

        // ---------- TypeScript snippet highlighting ----------

        /**
         * Wrap TS keywords and known identifiers in highlight spans.
         * Fully escapes first; span insertion happens only afterwards.
         */
        function highlightTs(code) {
            var h = escFull(code);
            h = h.replace(
                /\b(const|await|new|async|function|return|if|else)\b/g,
                '<span class="ts-keyword">$1</span>'
            );
            h = h.replace(/(AniLink)(\()/g, '<span class="ts-fn">$1</span>$2');
            return h.replace(/(\bresult\b)/g, '<span class="ts-fn">$1</span>');
        }

        // ---------- JSON highlighting ----------

        /*
         * Tokenizer for serialized JSON. Runs against structurally-escaped text
         * that still contains real quote characters, so keys and strings are
         * matched correctly; quotes are escaped only at the very end (FE-001).
         *
         * Alternation order matters: a quoted string followed by a colon is a KEY;
         * any other string, then numbers, literals, and finally punctuation.
         */
        var JSON_TOKEN_RE =
            /("(?:[^"\\]|\\.)*")(\s*:)|("(?:[^"\\]|\\.)*")|(-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?)|(true|false|null)|([{}[\],])/g;

        /**
         * Highlight pretty-printed JSON (accepts an object or pre-serialized text).
         * Returns HTML with tok-* spans; all input text is HTML-escaped.
         */
        function highlightJson(input) {
            var json = typeof input === "string" ? input : JSON.stringify(input, null, 2);
            if (json === undefined) json = String(input);

            // Pass 1: structurally escape, then mark tokens with sentinel chars so
            // the final quote-escaping cannot mangle span markup.
            var marked = escStructural(json).replace(
                JSON_TOKEN_RE,
                function (m, key, colon, str, num, lit, punct) {
                    var cls;
                    var body;
                    if (key !== undefined) {
                        cls = "tok-key";
                        body = key;
                    } else if (str !== undefined) {
                        cls = "tok-string";
                        body = str;
                    } else if (num !== undefined) {
                        cls = "tok-number";
                        body = num;
                    } else if (lit !== undefined) {
                        cls = lit === "null" ? "tok-null" : "tok-bool";
                        body = lit;
                    } else {
                        cls = "tok-punct";
                        body = punct;
                    }
                    return "\u0001" + cls + "\u0002" + body + "\u0003" + (colon || "");
                }
            );

            // Pass 2: escape quotes everywhere (tokens included), then swap the
            // sentinels for real span markup.
            return escQuotes(marked).replace(
                /\u0001([\w-]+)\u0002([\s\S]*?)\u0003/g,
                '<span class="$1">$2</span>'
            );
        }

        // ---------- Token masking / redaction ----------

        /**
         * Human-safe rendering of a bearer token: first/last four characters with
         * everything between collapsed to an ellipsis; short tokens fully dotted.
         */
        function maskToken(token) {
            if (!token) return "";
            var t = String(token);
            if (t.length <= 8) return "•".repeat(t.length);
            return t.slice(0, 4) + "…" + t.slice(-4);
        }

        /**
         * Replace the exact saved token and any generic Bearer credential in free
         * text with "[REDACTED]" so logs/previews never echo live credentials.
         */
        function redactTokens(text, token) {
            var out = String(text);
            if (token) out = out.split(String(token)).join("[REDACTED]");
            out = out.replace(/Bearer\s+[A-Za-z0-9\-_.~+/=]{8,}/gi, "Bearer [REDACTED]");
            return out;
        }

        // ---------- Form-input coercion ----------
        //
        // Each parser maps raw form input to `{ value }` on success, `{ error }`
        // on invalid input, or `{ value: undefined }` for empty input. Errors are
        // human-readable strings suitable for inline display.

        /** Parse a single number field ("42", "-3.5"). */
        function parseNumberInput(raw) {
            var s = String(raw == null ? "" : raw).trim();
            if (s === "") return { value: undefined };
            var n = Number(s);
            if (isNaN(n)) return { error: "Must be a number." };
            return { value: n };
        }

        /** Parse a comma-separated number list ("1, 2, 3"). */
        function parseNumberList(raw) {
            var parts = String(raw == null ? "" : raw)
                .split(",")
                .map(function (s) {
                    return s.trim();
                })
                .filter(Boolean);
            if (parts.length === 0) return { value: undefined };
            var nums = [];
            for (var i = 0; i < parts.length; i++) {
                var n = Number(parts[i]);
                if (isNaN(n)) return { error: '"' + parts[i] + '" is not a number.' };
                nums.push(n);
            }
            return { value: nums };
        }

        /** Parse a comma-separated string list ("a, b, c"). */
        function parseStringList(raw) {
            var arr = String(raw == null ? "" : raw)
                .split(",")
                .map(function (s) {
                    return s.trim();
                })
                .filter(Boolean);
            if (arr.length === 0) return { value: undefined };
            return { value: arr };
        }

        /** Parse a JSON array textarea ('[{"id":1}]'). */
        function parseJsonArray(raw) {
            var s = String(raw == null ? "" : raw).trim();
            if (s === "") return { value: undefined };
            try {
                var parsed = JSON.parse(s);
            } catch (err) {
                return { error: "Invalid JSON: " + err.message };
            }
            if (!Array.isArray(parsed)) return { error: "Must be a JSON array." };
            return { value: parsed };
        }

        /** Parse the custom-operation variables textarea (JSON object). */
        function parseCustomVariables(raw) {
            var s = String(raw == null ? "" : raw).trim();
            if (s === "") return { value: {} };
            try {
                var parsed = JSON.parse(s);
            } catch (err) {
                return { error: "Invalid JSON: " + err.message };
            }
            if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
                return { error: "Must be a JSON object." };
            }
            return { value: parsed };
        }

        return {
            escStructural: escStructural,
            escQuotes: escQuotes,
            escFull: escFull,
            formatGraphql: formatGraphql,
            highlightGraphql: highlightGraphql,
            highlightTs: highlightTs,
            highlightJson: highlightJson,
            maskToken: maskToken,
            redactTokens: redactTokens,
            parseNumberInput: parseNumberInput,
            parseNumberList: parseNumberList,
            parseStringList: parseStringList,
            parseJsonArray: parseJsonArray,
            parseCustomVariables: parseCustomVariables,
        };
    }
);
