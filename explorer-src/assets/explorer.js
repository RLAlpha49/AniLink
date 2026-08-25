/* AniLink API Explorer — client logic.
 * Vanilla JS, no framework. Loads operations.json, renders the operation tree,
 * generates a variables form, shows AniLink + GraphQL code, and executes live
 * against https://graphql.anilist.co.
 *
 * Pure logic (escaping, highlighting, masking, input coercion) lives in
 * explorer-core.js; this file is DOM wiring and app state only.
 */
(function () {
    "use strict";

    var core = window.ExplorerCore;
    var TOKEN_KEY = "anilink_explorer_token";
    var ENDPOINT = "https://graphql.anilist.co";

    var state = {
        manifest: null,
        currentOp: null,
        token: null,
        activeTab: "response",
        lastRequest: null,
        lastResponse: null,
        // Monotonic counter guarding against stale async responses (FE-005):
        // every dispatch captures the current value and bails if it changed.
        requestSeq: 0,
    };

    // ---------- DOM helpers ----------

    function $(id) {
        return document.getElementById(id);
    }
    function el(tag, attrs, children) {
        var node = document.createElement(tag);
        if (attrs) {
            for (var k in attrs) {
                if (k === "class") node.className = attrs[k];
                else if (k === "text") node.textContent = attrs[k];
                else if (k.startsWith("on") && typeof attrs[k] === "function")
                    node.addEventListener(k.slice(2), attrs[k]);
                else if (attrs[k] != null) node.setAttribute(k, attrs[k]);
            }
        }
        if (children) {
            (Array.isArray(children) ? children : [children]).forEach(function (c) {
                if (c == null) return;
                node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
            });
        }
        return node;
    }

    // ---------- Manifest load + tree ----------

    function init() {
        loadToken();
        fetch("operations.json")
            .then(function (r) {
                if (!r.ok) throw new Error("HTTP " + r.status);
                return r.json();
            })
            .then(function (manifest) {
                state.manifest = manifest;
                ENDPOINT = manifest.anilistEndpoint || ENDPOINT;
                renderTree();
            })
            .catch(function (err) {
                $("op-list").innerHTML =
                    '<p class="op-item-desc" style="padding:16px">Failed to load operations.json: ' +
                    core.escFull(err.message) +
                    "</p>";
            });

        wireGlobalEvents();
    }

    function renderTree() {
        var groups = groupOps(state.manifest.operations);
        var list = $("op-list");
        list.innerHTML = "";
        var order = ["query", "mutation", "page", "custom"];
        var labels = {
            query: "Queries",
            mutation: "Mutations",
            page: "Page Queries",
            custom: "Custom",
        };
        order.forEach(function (cat) {
            var ops = groups[cat];
            if (!ops || ops.length === 0) return;
            list.appendChild(el("div", { class: "op-group", text: labels[cat] }));
            ops.forEach(function (op) {
                // Real buttons: keyboard-focusable and announced by screen readers (FE-002).
                var item = el(
                    "button",
                    {
                        class: "op-item",
                        type: "button",
                        "data-name": op.name,
                        "data-cat": op.category,
                        onclick: function () {
                            selectOp(op, item);
                        },
                    },
                    [
                        el("span", { class: "op-item-name", text: op.name }),
                        op.description
                            ? el("span", { class: "op-item-desc", text: op.description })
                            : null,
                    ]
                );
                list.appendChild(item);
            });
        });
    }

    function groupOps(ops) {
        var g = { query: [], mutation: [], page: [], custom: [] };
        ops.forEach(function (o) {
            if (g[o.category]) g[o.category].push(o);
        });
        return g;
    }

    function filterTree(query) {
        var q = query.toLowerCase().trim();
        var items = document.querySelectorAll(".op-item");
        items.forEach(function (item) {
            var name = (item.getAttribute("data-name") || "").toLowerCase();
            var desc = (item.querySelector(".op-item-desc") || {}).textContent || "";
            desc = desc.toLowerCase();
            var match = !q || name.indexOf(q) >= 0 || desc.indexOf(q) >= 0;
            item.style.display = match ? "" : "none";
        });
        // Hide group headers with no visible items.
        document.querySelectorAll(".op-group").forEach(function (grp) {
            var next = grp.nextElementSibling;
            var anyVisible = false;
            while (next && !next.classList.contains("op-group")) {
                if (next.style.display !== "none") {
                    anyVisible = true;
                    break;
                }
                next = next.nextElementSibling;
            }
            grp.style.display = anyVisible ? "" : "none";
        });
    }

    // ---------- Operation selection + builder ----------

    function selectOp(op, itemEl) {
        // Invalidate any in-flight request so its response cannot render here (FE-005).
        state.requestSeq++;
        document.querySelectorAll(".op-item.active").forEach(function (n) {
            n.classList.remove("active");
            n.removeAttribute("aria-current");
        });
        if (itemEl) {
            itemEl.classList.add("active");
            itemEl.setAttribute("aria-current", "true");
        }
        state.currentOp = op;
        $("builder-empty").hidden = true;
        $("builder-content").hidden = false;
        renderBuilder(op);
        clearResponse();
    }

    function renderBuilder(op) {
        $("op-title").textContent = op.name;
        $("op-description").textContent = op.description || "";

        var meta = $("op-meta");
        meta.innerHTML = "";
        if (op.variablesType)
            meta.appendChild(el("span", { class: "badge badge-type", text: op.variablesType }));
        if (op.responseType)
            meta.appendChild(el("span", { class: "badge", text: "→ " + op.responseType }));
        if (op.requiresAuth)
            meta.appendChild(el("span", { class: "badge badge-auth", text: "Auth required" }));

        var form = $("vars-form");
        form.innerHTML = "";

        if (op.category === "custom") {
            renderCustomForm(form);
        } else {
            op.fields.forEach(function (f) {
                form.appendChild(renderField(f));
            });
        }

        updateCodePreview();
    }

    function renderCustomForm(form) {
        var qWrap = el("div", { class: "field" }, [
            el("div", { class: "field-label" }, [
                el("span", { class: "field-name", text: "query" }),
            ]),
            el("div", { class: "field-input" }, [
                el("textarea", {
                    id: "custom-query",
                    placeholder: "query { Viewer { id } }",
                    oninput: updateCodePreview,
                }),
                el("div", { class: "field-desc", text: "Raw GraphQL query or mutation string." }),
            ]),
        ]);
        var vWrap = el("div", { class: "field" }, [
            el("div", { class: "field-label" }, [
                el("span", { class: "field-name", text: "variables" }),
            ]),
            el("div", { class: "field-input" }, [
                el("textarea", {
                    id: "custom-variables",
                    placeholder: "{}",
                    oninput: updateCodePreview,
                }),
                el("div", { id: "custom-vars-error", class: "field-error", hidden: "hidden" }),
                el("div", { class: "field-desc", text: "JSON object of variables." }),
            ]),
        ]);
        form.appendChild(qWrap);
        form.appendChild(vWrap);
    }

    function renderField(f) {
        var label = el("div", { class: "field-label" }, [
            el("span", { class: "field-name", text: f.name }),
            f.required ? el("span", { class: "req-mark", text: "*" }) : null,
            el("span", { class: "field-type-tag", text: f.type }),
        ]);
        var inputWrap = el("div", { class: "field-input" });
        inputWrap.appendChild(renderInput(f));
        // Slot for inline coercion errors, filled/cleared on every keystroke (FE-006).
        inputWrap.appendChild(el("div", { class: "field-error", hidden: "hidden" }));
        if (f.description)
            inputWrap.appendChild(el("div", { class: "field-desc", text: f.description }));
        return el("div", { class: "field", "data-field": f.name }, [label, inputWrap]);
    }

    function renderInput(f) {
        var name = "field-" + f.name;
        var common = {
            id: name,
            "data-field": f.name,
            oninput: updateCodePreview,
            onchange: updateCodePreview,
        };

        if (f.type === "boolean") {
            return el("input", Object.assign({ type: "checkbox" }, common));
        }
        if (f.type === "number") {
            return el("input", Object.assign({ type: "number", step: "any" }, common));
        }
        if (f.type === "enum") {
            var sel = el("select", common, [el("option", { value: "" })]);
            (f.enumValues || []).forEach(function (v) {
                sel.appendChild(el("option", { value: v, text: v }));
            });
            return sel;
        }
        if (f.type === "enum[]") {
            var multi = el(
                "select",
                Object.assign({ multiple: "multiple", size: "5" }, common),
                []
            );
            (f.enumValues || []).forEach(function (v) {
                multi.appendChild(el("option", { value: v, text: v }));
            });
            return multi;
        }
        if (f.type === "number[]") {
            return el("input", Object.assign({ type: "text", placeholder: "1, 2, 3" }, common));
        }
        if (f.type === "string[]") {
            return el("input", Object.assign({ type: "text", placeholder: "a, b, c" }, common));
        }
        if (f.type === "object") {
            return renderNestedObject(f);
        }
        if (f.type === "object[]") {
            return el("textarea", Object.assign({ placeholder: '[{ "key": "value" }]' }, common));
        }
        // string (default)
        return el("input", Object.assign({ type: "text" }, common));
    }

    function renderNestedObject(f) {
        var wrap = el("div", { class: "nested-fields" });
        (f.nestedFields || []).forEach(function (nf) {
            var row = el("div", { class: "nested-row" }, [
                el("label", { text: nf.name }),
                el("input", {
                    type: nf.type === "number" ? "number" : "text",
                    step: "any",
                    "data-nested": f.name + "." + nf.name,
                    oninput: updateCodePreview,
                }),
            ]);
            wrap.appendChild(row);
        });
        return wrap;
    }

    // ---------- Variable collection (with inline coercion errors, FE-006) ----------

    /**
     * Collect the current variables plus per-field coercion errors.
     * Returns `{ vars, errors }` where `errors` holds `{ field, message }`
     * entries (`field` is null for the custom variables textarea).
     */
    function collectVariables() {
        var op = state.currentOp;
        if (!op) return { vars: {}, errors: [] };
        var errors = [];

        if (op.category === "custom") {
            var raw = ($("custom-variables") || {}).value || "";
            var parsed = core.parseCustomVariables(raw);
            if (parsed.error) errors.push({ field: null, message: parsed.error });
            return { vars: parsed.value, errors: errors };
        }

        var vars = {};
        op.fields.forEach(function (f) {
            var res = readField(f);
            if (res.error) {
                errors.push({ field: f.name, message: res.error });
                return;
            }
            var val = res.value;
            if (val !== undefined && val !== null && val !== "") vars[f.name] = val;
        });
        return { vars: vars, errors: errors };
    }

    /** Read one field via the shared coercion parsers. */
    function readField(f) {
        var node = $("field-" + f.name);
        if (!node) return { value: undefined };
        if (f.type === "boolean") return { value: node.checked ? true : undefined };
        if (f.type === "number") return core.parseNumberInput(node.value);
        if (f.type === "enum") return { value: node.value || undefined };
        if (f.type === "enum[]") {
            var selected = Array.prototype.map.call(node.selectedOptions || [], function (o) {
                return o.value;
            });
            return { value: selected.length ? selected : undefined };
        }
        if (f.type === "number[]") return core.parseNumberList(node.value);
        if (f.type === "string[]") return core.parseStringList(node.value);
        if (f.type === "object") {
            var obj = {};
            var any = false;
            (f.nestedFields || []).forEach(function (nf) {
                var input = document.querySelector(
                    '[data-nested="' + f.name + "." + nf.name + '"]'
                );
                if (!input || input.value.trim() === "") return;
                if (nf.type === "number") {
                    var num = Number(input.value);
                    if (!isNaN(num)) {
                        obj[nf.name] = num;
                        any = true;
                    }
                } else {
                    obj[nf.name] = input.value;
                    any = true;
                }
            });
            return { value: any ? obj : undefined };
        }
        if (f.type === "object[]") return core.parseJsonArray(node.value);
        // string
        var s = node.value.trim();
        return { value: s === "" ? undefined : s };
    }

    /** Mirror coercion errors inline under each invalid field (FE-006). */
    function renderFieldErrors(errors) {
        document.querySelectorAll(".field-error").forEach(function (n) {
            n.textContent = "";
            n.hidden = true;
        });
        errors.forEach(function (e) {
            var slot;
            if (e.field === null) {
                slot = $("custom-vars-error");
            } else {
                var wrap = document.querySelector('.field[data-field="' + e.field + '"]');
                slot = wrap ? wrap.querySelector(".field-error") : null;
            }
            if (!slot) return;
            slot.textContent = e.message;
            slot.hidden = false;
        });
    }

    // ---------- Code preview ----------

    /** Re-render both code blocks from the current form state. */
    function updateCodePreview() {
        var op = state.currentOp;
        if (!op) return;
        var collected = collectVariables();
        renderFieldErrors(collected.errors);
        // Invalid input yields no value — preview the last-known-good empty
        // object while the inline error explains what to fix (FE-006).
        var vars = collected.vars || {};
        // Never render the live token into the preview — masked form only (FE-004).
        var token = state.token ? JSON.stringify(core.maskToken(state.token)) : "'<token>'";

        // AniLink call
        var anilinkCode = buildAnilinkCode(op, vars, token);
        $("anilink-code").innerHTML = core.highlightTs(anilinkCode);

        // GraphQL
        var gql = op.category === "custom" ? ($("custom-query") || {}).value || "" : op.graphql;
        $("graphql-code").innerHTML = core.highlightGraphql(core.formatGraphql(gql));
    }

    function buildAnilinkCode(op, vars, token) {
        var varsJson = JSON.stringify(vars, null, 2);
        var indented = varsJson
            .split("\n")
            .map(function (l, i) {
                return i === 0 ? l : "  " + l;
            })
            .join("\n");
        if (op.category === "custom") {
            var q = (($("custom-query") || {}).value || "").trim();
            var qStr = JSON.stringify(q);
            return (
                "const aniLink = new AniLink(" +
                token +
                ");\n" +
                "const result = await aniLink.anilist.custom(" +
                qStr +
                ", " +
                varsJson +
                ");"
            );
        }
        var callPath = op.anilinkCall.replace("aniLink.", "").replace("(variables)", "");
        return (
            "const aniLink = new AniLink(" +
            token +
            ");\n" +
            "const result = await aniLink." +
            callPath +
            "(" +
            indented +
            ");"
        );
    }

    // ---------- Execution ----------

    function runOperation() {
        var op = state.currentOp;
        if (!op) return;

        var collected = collectVariables();

        // Surface coercion failures instead of silently dropping input (FE-006).
        if (collected.errors.length > 0) {
            showResponseError("Fix invalid variable input: " + collected.errors[0].message);
            return;
        }

        // Validate required fields.
        var missing = [];
        if (op.category !== "custom") {
            op.fields.forEach(function (f) {
                if (f.required && collected.vars[f.name] === undefined) missing.push(f.name);
            });
        }
        if (missing.length > 0) {
            showResponseError(
                "Missing required field" +
                    (missing.length > 1 ? "s" : "") +
                    ": " +
                    missing.join(", ")
            );
            return;
        }

        if (op.requiresAuth && !state.token) {
            showResponseError(
                "This operation requires an auth token. Add one in the Auth token panel (top-right)."
            );
            return;
        }

        var vars = collected.vars;
        var query = op.category === "custom" ? ($("custom-query") || {}).value || "" : op.graphql;
        if (!query.trim()) {
            showResponseError("No GraphQL query to send.");
            return;
        }

        var body = { query: query, variables: vars };
        // Real headers carry the live credential and are never rendered anywhere.
        var headers = { "Content-Type": "application/json", Accept: "application/json" };
        if (state.token) headers.Authorization = "Bearer " + state.token;
        // The stored/displayed request copy carries a masked credential (FE-004).
        var displayHeaders = { "Content-Type": "application/json", Accept: "application/json" };
        if (state.token) displayHeaders.Authorization = "Bearer " + core.maskToken(state.token);
        state.lastRequest = { query: query, variables: vars, headers: displayHeaders };

        var btn = $("run-btn");
        btn.disabled = true;
        btn.textContent = "Running…";
        setStatus("", "");
        var start = performance.now();
        var seq = ++state.requestSeq;

        fetch(ENDPOINT, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(body),
        })
            .then(function (r) {
                var elapsed = Math.round(performance.now() - start);
                var status = r.status;
                return r
                    .json()
                    .then(function (data) {
                        return { status: status, data: data, elapsed: elapsed };
                    })
                    .catch(function () {
                        return { status: status, data: null, elapsed: elapsed };
                    });
            })
            .then(function (res) {
                if (seq !== state.requestSeq) return; // stale response — user moved on
                btn.disabled = false;
                btn.textContent = "Run";
                state.lastResponse = res;
                renderResponse(res);
            })
            .catch(function (err) {
                if (seq !== state.requestSeq) return; // stale failure — ignore silently
                btn.disabled = false;
                btn.textContent = "Run";
                showResponseError("Network error: " + err.message);
            });
    }

    function renderResponse(res) {
        var statusEl = $("response-status");
        statusEl.textContent = res.status + " · " + res.elapsed + "ms";
        statusEl.className =
            "response-status " + (res.status >= 200 && res.status < 300 ? "ok" : "err");

        var data = res.data;
        var output = $("response-output");
        if (data && data.errors && data.errors.length) {
            output.innerHTML =
                '<span class="tok-err">Errors:</span>\n' +
                data.errors
                    .map(function (e) {
                        return core.escFull(e.message || JSON.stringify(e));
                    })
                    .join("\n\n");
        } else if (data) {
            output.innerHTML = core.highlightJson(data);
        } else {
            output.textContent = "(empty response body)";
        }
        if (state.activeTab === "request") renderRequestTab();
    }

    function showResponseError(msg) {
        // Status text change is announced by the aria-live region (FE-003).
        setStatus("Error", "err");
        $("response-output").innerHTML = '<span class="tok-err">' + core.escFull(msg) + "</span>";
    }

    function setStatus(text, cls) {
        var s = $("response-status");
        s.textContent = text;
        s.className = "response-status" + (cls ? " " + cls : "");
    }

    function clearResponse() {
        $("response-output").textContent = "";
        setStatus("", "");
        state.lastRequest = null;
        state.lastResponse = null;
    }

    function renderRequestTab() {
        if (state.activeTab === "request" && state.lastRequest) {
            var req = state.lastRequest;
            var html = "";
            html +=
                '<span class="tok-key">"method"</span>: <span class="tok-string">"POST"</span>\n';
            html +=
                '<span class="tok-key">"url"</span>: <span class="tok-string">"' +
                core.escFull(ENDPOINT) +
                '"</span>\n';
            html +=
                '<span class="tok-key">"headers"</span>: ' + core.highlightJson(req.headers) + "\n";
            html += '<span class="tok-key">"query"</span>:\n';
            html +=
                '<span class="gql-field">' +
                core.highlightGraphql(core.formatGraphql(req.query)) +
                "</span>\n";
            html +=
                '<span class="tok-key">"variables"</span>: ' + core.highlightJson(req.variables);
            $("response-output").innerHTML = html;
        }
    }

    function switchTab(tab) {
        state.activeTab = tab;
        var tabs = { response: $("tab-response"), request: $("tab-request") };
        ["response", "request"].forEach(function (name) {
            var btn = tabs[name];
            var active = name === tab;
            btn.classList.toggle("tab-active", active);
            btn.setAttribute("aria-selected", active ? "true" : "false");
            btn.tabIndex = active ? 0 : -1; // roving tabindex for arrow-key nav (FE-003)
        });
        if (tab === "request") {
            renderRequestTab();
        } else if (state.lastResponse) {
            renderResponse(state.lastResponse);
        } else {
            clearResponse();
        }
    }

    // ---------- Token handling ----------
    //
    // The bearer token lives in sessionStorage only (FE-004 / SEC-001): scoped to
    // this tab, gone when the tab closes, and never written back to
    // localStorage. It is never placed back into the password input or rendered
    // unmasked anywhere in the DOM.

    function loadToken() {
        try {
            var t = sessionStorage.getItem(TOKEN_KEY);
            state.token = t && t.length > 0 ? t : null;
        } catch {
            state.token = null;
        }
        renderTokenStatus();
    }

    function saveToken() {
        var val = ($("token-input") || {}).value || "";
        state.token = val.trim() || null;
        try {
            if (state.token) sessionStorage.setItem(TOKEN_KEY, state.token);
            else sessionStorage.removeItem(TOKEN_KEY);
        } catch {
            /* ignore */
        }
        var input = $("token-input");
        if (input) input.value = ""; // keep the raw token out of the DOM
        renderTokenStatus();
        flashSaved($("token-save"));
        updateCodePreview();
    }

    function clearToken() {
        state.token = null;
        try {
            sessionStorage.removeItem(TOKEN_KEY);
        } catch {
            /* ignore */
        }
        var input = $("token-input");
        if (input) input.value = "";
        renderTokenStatus();
        updateCodePreview();
    }

    /** Show masked token presence next to the controls (announced politely). */
    function renderTokenStatus() {
        var status = $("token-status");
        if (!status) return;
        status.textContent = state.token
            ? "Token saved for this tab (" + core.maskToken(state.token) + ")"
            : "No token saved";
    }

    function flashSaved(btn) {
        if (!btn) return;
        var orig = btn.textContent;
        btn.textContent = "Saved ✓";
        btn.classList.add("copied");
        setTimeout(function () {
            btn.textContent = orig;
            btn.classList.remove("copied");
        }, 1200);
    }

    // ---------- Event wiring ----------

    function wireGlobalEvents() {
        $("op-search").addEventListener("input", function (e) {
            filterTree(e.target.value);
        });
        $("run-btn").addEventListener("click", runOperation);
        $("copy-anilink").addEventListener("click", function () {
            copyText($("anilink-code").textContent, $("copy-anilink"));
        });
        $("copy-graphql").addEventListener("click", function () {
            copyText($("graphql-code").textContent, $("copy-graphql"));
        });
        $("token-save").addEventListener("click", saveToken);
        $("token-clear").addEventListener("click", clearToken);
        // Enter in the token field saves without leaving the keyboard (FE-006).
        $("token-input").addEventListener("keydown", function (e) {
            if (e.key === "Enter") {
                e.preventDefault();
                saveToken();
            }
        });
        $("tab-response").addEventListener("click", function () {
            switchTab("response");
        });
        $("tab-request").addEventListener("click", function () {
            switchTab("request");
        });

        // Arrow-key navigation between response tabs (FE-003).
        var tablist = document.querySelector(".tab-list");
        if (tablist) {
            tablist.addEventListener("keydown", function (e) {
                var toTab = null;
                if (e.key === "ArrowRight" || e.key === "ArrowDown")
                    toTab = state.activeTab === "response" ? "request" : "response";
                else if (e.key === "ArrowLeft" || e.key === "ArrowUp")
                    toTab = state.activeTab === "response" ? "request" : "response";
                else if (e.key === "Home") toTab = "response";
                else if (e.key === "End") toTab = "request";
                if (!toTab) return;
                e.preventDefault();
                switchTab(toTab);
                $(toTab === "response" ? "tab-response" : "tab-request").focus();
            });
        }

        // Ctrl/Cmd+Enter to run.
        document.addEventListener("keydown", function (e) {
            if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                e.preventDefault();
                runOperation();
            }
        });
    }

    function copyText(text, btn) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard
                .writeText(text)
                .then(function () {
                    flashCopied(btn);
                })
                .catch(function () {
                    fallbackCopy(text, btn);
                });
        } else {
            fallbackCopy(text, btn);
        }
    }

    function fallbackCopy(text, btn) {
        var ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        try {
            document.execCommand("copy");
            flashCopied(btn);
        } catch {
            /* ignore */
        }
        document.body.removeChild(ta);
    }

    function flashCopied(btn) {
        var orig = btn.textContent;
        btn.textContent = "Copied";
        btn.classList.add("copied");
        setTimeout(function () {
            btn.textContent = orig;
            btn.classList.remove("copied");
        }, 1200);
    }

    // ---------- Boot ----------

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
