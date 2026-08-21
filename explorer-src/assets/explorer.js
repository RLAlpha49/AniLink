/* AniLink API Explorer — client logic.
 * Vanilla JS, no framework. Loads operations.json, renders the operation tree,
 * generates a variables form, shows AniLink + GraphQL code, and executes live
 * against https://graphql.anilist.co.
 */
(function () {
  "use strict";

  var TOKEN_KEY = "anilink_explorer_token";
  var ENDPOINT = "https://graphql.anilist.co";

  var state = {
    manifest: null,
    currentOp: null,
    token: null,
    activeTab: "response",
    lastRequest: null,
    lastResponse: null,
  };

  // ---------- DOM helpers ----------

  function $(id) { return document.getElementById(id); }
  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      for (var k in attrs) {
        if (k === "class") node.className = attrs[k];
        else if (k === "text") node.textContent = attrs[k];
        else if (k === "html") node.innerHTML = attrs[k];
        else if (k.startsWith("on") && typeof attrs[k] === "function") node.addEventListener(k.slice(2), attrs[k]);
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
  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /** Pretty-print a GraphQL document: one field per line, 2-space nesting. */
  function formatGraphql(query) {
    var lines = [];
    var depth = 0;
    var pending = ""; // the current field (name + optional args)

    var indent = function () { return "  ".repeat(depth); };
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
        // Whitespace between fields ends the current field's line — unless the
        // next token is an argument list or selection set that must stay attached.
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

  /** Wrap GraphQL keywords, variables, and fields in highlight spans. */
  function highlightGraphql(formatted) {
    var h = esc(formatted);
    h = h.replace(
      /^(\s*)(query|mutation|fragment)(\s|\()/gm,
      '$1<span class="gql-keyword">$2</span>$3'
    );
    h = h.replace(/(\$[A-Za-z_]\w*)/g, '<span class="gql-arg">$1</span>');
    h = h.replace(
      /^(\s*)([A-Za-z_]\w*)(\s*\(|\s*\{|$)/gm,
      function (m, ws, name, tail) {
        if (/^(query|mutation|fragment)$/.test(name)) return m;
        return ws + '<span class="gql-field">' + name + "</span>" + tail;
      }
    );
    h = h.replace(/([{}(),])/g, '<span class="gql-punct">$1</span>');
    return h;
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
          '<p class="op-item-desc" style="padding:16px">Failed to load operations.json: ' + esc(err.message) + "</p>";
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
        var item = el("div", {
          class: "op-item",
          "data-name": op.name,
          "data-cat": op.category,
          onclick: function () { selectOp(op, item); },
        }, [
          el("div", { class: "op-item-name", text: op.name }),
          op.description ? el("div", { class: "op-item-desc", text: op.description }) : null,
        ]);
        list.appendChild(item);
      });
    });
  }

  function groupOps(ops) {
    var g = { query: [], mutation: [], page: [], custom: [] };
    ops.forEach(function (o) { if (g[o.category]) g[o.category].push(o); });
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
        if (next.style.display !== "none") { anyVisible = true; break; }
        next = next.nextElementSibling;
      }
      grp.style.display = anyVisible ? "" : "none";
    });
  }

  // ---------- Operation selection + builder ----------

  function selectOp(op, itemEl) {
    document.querySelectorAll(".op-item.active").forEach(function (n) { n.classList.remove("active"); });
    if (itemEl) itemEl.classList.add("active");
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
    if (op.variablesType) meta.appendChild(el("span", { class: "badge badge-type", text: op.variablesType }));
    if (op.responseType) meta.appendChild(el("span", { class: "badge", text: "→ " + op.responseType }));
    if (op.requiresAuth) meta.appendChild(el("span", { class: "badge badge-auth", text: "Auth required" }));

    var form = $("vars-form");
    form.innerHTML = "";

    if (op.category === "custom") {
      renderCustomForm(form, op);
    } else {
      op.fields.forEach(function (f) { form.appendChild(renderField(f)); });
    }

    updateCodePreview();
  }

  function renderCustomForm(form, op) {
    var qWrap = el("div", { class: "field" }, [
      el("div", { class: "field-label" }, [el("span", { class: "field-name", text: "query" })]),
      el("div", { class: "field-input" }, [
        el("textarea", { id: "custom-query", placeholder: "query { Viewer { id } }", oninput: updateCodePreview }),
        el("div", { class: "field-desc", text: "Raw GraphQL query or mutation string." }),
      ]),
    ]);
    var vWrap = el("div", { class: "field" }, [
      el("div", { class: "field-label" }, [el("span", { class: "field-name", text: "variables" })]),
      el("div", { class: "field-input" }, [
        el("textarea", { id: "custom-variables", placeholder: "{}", oninput: updateCodePreview }),
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
    if (f.description) inputWrap.appendChild(el("div", { class: "field-desc", text: f.description }));
    return el("div", { class: "field", "data-field": f.name }, [label, inputWrap]);
  }

  function renderInput(f) {
    var name = "field-" + f.name;
    var common = { id: name, "data-field": f.name, oninput: updateCodePreview, onchange: updateCodePreview };

    if (f.type === "boolean") {
      return el("input", Object.assign({ type: "checkbox" }, common));
    }
    if (f.type === "number") {
      return el("input", Object.assign({ type: "number", step: "any" }, common));
    }
    if (f.type === "enum") {
      var sel = el("select", common, [el("option", { value: "" })]);
      (f.enumValues || []).forEach(function (v) { sel.appendChild(el("option", { value: v, text: v })); });
      return sel;
    }
    if (f.type === "enum[]") {
      var multi = el("select", Object.assign({ multiple: "multiple", size: "5" }, common), []);
      (f.enumValues || []).forEach(function (v) { multi.appendChild(el("option", { value: v, text: v })); });
      return multi;
    }
    if (f.type === "number[]") {
      return el("input", Object.assign({ type: "text", placeholder: "1, 2, 3" }, common));
    }
    if (f.type === "string[]") {
      return el("input", Object.assign({ type: "text", placeholder: "a, b, c" }, common));
    }
    if (f.type === "object") {
      return renderNestedObject(f, name);
    }
    if (f.type === "object[]") {
      return el("textarea", Object.assign({ placeholder: '[{ "key": "value" }]' }, common));
    }
    // string (default)
    return el("input", Object.assign({ type: "text" }, common));
  }

  function renderNestedObject(f, baseId) {
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

  // ---------- Variables collection ----------

  function collectVariables() {
    var op = state.currentOp;
    if (!op) return {};
    if (op.category === "custom") {
      var raw = ($("custom-variables") || {}).value || "";
      if (!raw.trim()) return {};
      try { return JSON.parse(raw); } catch { return {}; }
    }
    var vars = {};
    op.fields.forEach(function (f) {
      var val = readField(f);
      if (val !== undefined && val !== null && val !== "") vars[f.name] = val;
    });
    return vars;
  }

  function readField(f) {
    var node = $("field-" + f.name);
    if (!node) return undefined;
    if (f.type === "boolean") return node.checked ? true : undefined;
    if (f.type === "number") {
      var n = node.value.trim();
      if (n === "") return undefined;
      var num = Number(n);
      return isNaN(num) ? undefined : num;
    }
    if (f.type === "enum") {
      return node.value || undefined;
    }
    if (f.type === "enum[]") {
      var selected = Array.prototype.map.call(node.selectedOptions || [], function (o) { return o.value; });
      return selected.length ? selected : undefined;
    }
    if (f.type === "number[]") {
      var parts = node.value.split(",").map(function (s) { return s.trim(); }).filter(Boolean);
      if (parts.length === 0) return undefined;
      var nums = parts.map(Number);
      return nums.some(isNaN) ? undefined : nums;
    }
    if (f.type === "string[]") {
      var arr = node.value.split(",").map(function (s) { return s.trim(); }).filter(Boolean);
      return arr.length ? arr : undefined;
    }
    if (f.type === "object") {
      var obj = {};
      var any = false;
      (f.nestedFields || []).forEach(function (nf) {
        var input = document.querySelector('[data-nested="' + f.name + "." + nf.name + '"]');
        if (!input || input.value.trim() === "") return;
        if (nf.type === "number") {
          var num2 = Number(input.value);
          if (!isNaN(num2)) { obj[nf.name] = num2; any = true; }
        } else {
          obj[nf.name] = input.value; any = true;
        }
      });
      return any ? obj : undefined;
    }
    if (f.type === "object[]") {
      var raw2 = node.value.trim();
      if (!raw2) return undefined;
      try { return JSON.parse(raw2); } catch { return undefined; }
    }
    // string
    var s = node.value.trim();
    return s === "" ? undefined : s;
  }

  // ---------- Code preview ----------

  function updateCodePreview() {
    var op = state.currentOp;
    if (!op) return;
    var vars = collectVariables();
    var token = state.token ? JSON.stringify(state.token) : "'<token>'";

    // AniLink call
    var anilinkCode = buildAnilinkCode(op, vars, token);
    $("anilink-code").innerHTML = highlightTs(anilinkCode);

    // GraphQL
    var gql = op.category === "custom" ? (($("custom-query") || {}).value || "") : op.graphql;
    $("graphql-code").innerHTML = highlightGraphql(formatGraphql(gql));
  }

  function buildAnilinkCode(op, vars, token) {
    var varsJson = JSON.stringify(vars, null, 2);
    var indented = varsJson.split("\n").map(function (l, i) { return i === 0 ? l : "  " + l; }).join("\n");
    if (op.category === "custom") {
      var q = (($("custom-query") || {}).value || "").trim();
      var qStr = JSON.stringify(q);
      return "const aniLink = new AniLink(" + token + ");\n" +
        "const result = await aniLink.anilist.custom(" + qStr + ", " + varsJson + ");";
    }
    var callPath = op.anilinkCall.replace("aniLink.", "").replace("(variables)", "");
    return "const aniLink = new AniLink(" + token + ");\n" +
      "const result = await aniLink." + callPath + "(" + indented + ");";
  }

  // ---------- Syntax highlighting ----------

  function highlightTs(code) {
    var h = esc(code);
    h = h.replace(/\b(const|await|new|async|function|return|if|else)\b/g, '<span class="ts-keyword">$1</span>');
    h = h.replace(/(AniLink)(\()/g, '<span class="ts-fn">$1</span>$2');
    h = h.replace(/(\bresult\b)/g, '<span class="ts-fn">$1</span>');
    return h;
  }

  function highlightJson(obj) {
    var json = JSON.stringify(obj, null, 2);
    if (json === undefined) json = String(obj);
    var h = esc(json);
    h = h.replace(/("[^&]*?")(\s*:)/g, '<span class="tok-key">$1</span>$2');
    h = h.replace(/:\s*("[^&]*?")/g, ': <span class="tok-string">$1</span>');
    h = h.replace(/:\s*(-?\d+\.?\d*)/g, ': <span class="tok-number">$1</span>');
    h = h.replace(/:\s*(true|false)/g, ': <span class="tok-bool">$1</span>');
    h = h.replace(/:\s*null/g, ': <span class="tok-null">null</span>');
    h = h.replace(/([{}\[\],])/g, '<span class="tok-punct">$1</span>');
    return h;
  }

  // ---------- Execution ----------

  function runOperation() {
    var op = state.currentOp;
    if (!op) return;

    // Validate required fields.
    var missing = [];
    if (op.category !== "custom") {
      op.fields.forEach(function (f) {
        if (f.required) {
          var val = readField(f);
          if (val === undefined || val === null || val === "") missing.push(f.name);
        }
      });
    }
    if (missing.length > 0) {
      showResponseError("Missing required field" + (missing.length > 1 ? "s" : "") + ": " + missing.join(", "));
      return;
    }

    if (op.requiresAuth && !state.token) {
      showResponseError("This operation requires an auth token. Add one in the Auth token panel (top-right).");
      return;
    }

    var vars = collectVariables();
    var query = op.category === "custom" ? (($("custom-query") || {}).value || "") : op.graphql;
    if (!query.trim()) {
      showResponseError("No GraphQL query to send.");
      return;
    }

    var body = { query: query, variables: vars };
    var headers = { "Content-Type": "application/json", Accept: "application/json" };
    if (state.token) headers.Authorization = "Bearer " + state.token;
    state.lastRequest = { query: query, variables: vars, headers: headers };

    var btn = $("run-btn");
    btn.disabled = true;
    btn.textContent = "Running…";
    setStatus("", "");
    var start = performance.now();

    fetch(ENDPOINT, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(body),
    })
      .then(function (r) {
        var elapsed = Math.round(performance.now() - start);
        var status = r.status;
        return r.json().then(function (data) {
          return { status: status, data: data, elapsed: elapsed };
        }).catch(function () {
          return { status: status, data: null, elapsed: elapsed };
        });
      })
      .then(function (res) {
        btn.disabled = false;
        btn.textContent = "Run";
        state.lastResponse = res;
        renderResponse(res);
      })
      .catch(function (err) {
        btn.disabled = false;
        btn.textContent = "Run";
        showResponseError("Network error: " + err.message);
      });
  }

  function renderResponse(res) {
    var statusEl = $("response-status");
    statusEl.textContent = res.status + " · " + res.elapsed + "ms";
    statusEl.className = "response-status " + (res.status >= 200 && res.status < 300 ? "ok" : "err");

    var data = res.data;
    var output = $("response-output");
    if (data && data.errors && data.errors.length) {
      output.innerHTML = '<span class="tok-err">Errors:</span>\n' +
        data.errors.map(function (e) { return esc(e.message || JSON.stringify(e)); }).join("\n\n");
    } else if (data) {
      output.innerHTML = highlightJson(data);
    } else {
      output.textContent = "(empty response body)";
    }
    if (state.activeTab === "request") renderRequestTab();
  }

  function showResponseError(msg) {
    setStatus("error", "err");
    $("response-output").innerHTML = '<span class="tok-err">' + esc(msg) + "</span>";
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
      html += '<span class="tok-key">"method"</span>: <span class="tok-string">"POST"</span>\n';
      html += '<span class="tok-key">"url"</span>: <span class="tok-string">"' + esc(ENDPOINT) + '"</span>\n';
      html += '<span class="tok-key">"headers"</span>: ' + highlightJson(req.headers) + "\n";
      html += '<span class="tok-key">"query"</span>:\n';
      html += '<span class="gql-field">' + highlightGraphql(formatGraphql(req.query)) + "</span>\n";
      html += '<span class="tok-key">"variables"</span>: ' + highlightJson(req.variables);
      $("response-output").innerHTML = html;
    }
  }

  function switchTab(tab) {
    state.activeTab = tab;
    $("tab-response").classList.toggle("tab-active", tab === "response");
    $("tab-request").classList.toggle("tab-active", tab === "request");
    if (tab === "request") {
      renderRequestTab();
    } else if (state.lastResponse) {
      renderResponse(state.lastResponse);
    } else {
      clearResponse();
    }
  }

  // ---------- Token handling ----------

  function loadToken() {
    try {
      var t = localStorage.getItem(TOKEN_KEY);
      state.token = t && t.length > 0 ? t : null;
    } catch { state.token = null; }
    if (state.token) {
      var input = $("token-input");
      if (input) input.value = state.token;
    }
  }

  function saveToken() {
    var val = ($("token-input") || {}).value || "";
    state.token = val.trim() || null;
    try {
      if (state.token) localStorage.setItem(TOKEN_KEY, state.token);
      else localStorage.removeItem(TOKEN_KEY);
    } catch { /* ignore */ }
    updateCodePreview();
  }

  function clearToken() {
    state.token = null;
    try { localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ }
    var input = $("token-input");
    if (input) input.value = "";
    updateCodePreview();
  }

  // ---------- Event wiring ----------

  function wireGlobalEvents() {
    $("op-search").addEventListener("input", function (e) { filterTree(e.target.value); });
    $("run-btn").addEventListener("click", runOperation);
    $("copy-anilink").addEventListener("click", function () { copyText($("anilink-code").textContent, $("copy-anilink")); });
    $("copy-graphql").addEventListener("click", function () { copyText($("graphql-code").textContent, $("copy-graphql")); });
    $("token-save").addEventListener("click", saveToken);
    $("token-clear").addEventListener("click", clearToken);
    $("tab-response").addEventListener("click", function () { switchTab("response"); });
    $("tab-request").addEventListener("click", function () { switchTab("request"); });

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
      navigator.clipboard.writeText(text).then(function () {
        flashCopied(btn);
      }).catch(function () { fallbackCopy(text, btn); });
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
    try { document.execCommand("copy"); flashCopied(btn); } catch { /* ignore */ }
    document.body.removeChild(ta);
  }

  function flashCopied(btn) {
    var orig = btn.textContent;
    btn.textContent = "Copied";
    btn.classList.add("copied");
    setTimeout(function () { btn.textContent = orig; btn.classList.remove("copied"); }, 1200);
  }

  // ---------- Boot ----------

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
