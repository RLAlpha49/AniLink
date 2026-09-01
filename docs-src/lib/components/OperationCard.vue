<script setup lang="ts">
/**
 * Operation reference card shared by all redesigns.
 *
 * Renders one generated operation: signature, request/response tables,
 * auth, errors, example, and links. Highlighting is applied on demand
 * via the shared Shiki highlighter; while pending, CodeBlock falls back
 * to a plain `<pre>` view so nothing flickers.
 */
import { computed, ref, watchEffect } from "vue";
import {
    ArrowDownRight,
    ArrowUpRight,
    ChevronDown,
    Code,
    Terminal,
    TriangleAlert,
} from "@lucide/vue";
import CodeBlock from "./CodeBlock.vue";
import { highlightTypeScript } from "../useShikiHighlighter";

/**
 * Props are the JSON-serializable slices of a ReferenceOperation from
 * the generated operation manifest (see
 * `scripts/generate-operation-reference.ts`).
 */
export interface OperationCardProps {
    op: {
        provider: "anilist" | "mal";
        protocol: "graphql" | "rest";
        namespace: string;
        name: string;
        signature: string;
        purpose: string;
        auth: string;
        request: Array<{
            name: string;
            type: string;
            required: boolean;
            description: string;
            nestedFields?: Array<{ name: string; type: string; description: string }>;
        }>;
        responseType: string;
        response: Array<{
            name: string;
            type: string;
            required: boolean;
            description: string;
        }>;
        errors: Array<{ error: string; condition: string }>;
        example: string;
        links: Array<{ label: string; url: string }>;
    };
}

const props = defineProps<OperationCardProps>();

const signatureHtml = ref("");
const exampleHtml = ref("");

watchEffect(async () => {
    signatureHtml.value = await highlightTypeScript(props.op.signature);
    exampleHtml.value = await highlightTypeScript(props.op.example);
});

interface PurposeToken {
    kind: "text" | "code";
    value: string;
}

const purposeTokens = computed<PurposeToken[]>(() => {
    const text = props.op.purpose ?? "";
    const parts = text.split(/(`[^`\n]+`)/g);
    return parts
        .filter((part) => part.length > 0)
        .map((part) => ({
            kind: part.startsWith("`") && part.endsWith("`") ? "code" : "text",
            value: part.replace(/^`/, "").replace(/`$/, ""),
        }));
});

const requestOpen = ref(false);
const responseOpen = ref(false);
const errorsOpen = ref(false);
</script>

<template>
    <section class="op-card">
        <p class="op-purpose">
            <template v-for="(token, idx) in purposeTokens" :key="idx">
                <code v-if="token.kind === 'code'">{{ token.value }}</code>
                <template v-else>{{ token.value }}</template>
            </template>
        </p>

        <div class="op-block">
            <p class="op-block-title">
                <Code :size="13" :stroke-width="2.25" aria-hidden="true" /> Signature
            </p>
            <CodeBlock :source="op.signature" language="TypeScript" :html="signatureHtml" />
            <p class="op-auth"><strong>Auth:</strong> {{ op.auth }}</p>
        </div>

        <div class="op-block op-collapsible" :class="{ 'is-open': requestOpen }">
            <button
                type="button"
                class="op-block-title op-toggle"
                :aria-expanded="requestOpen"
                @click="requestOpen = !requestOpen"
            >
                <ArrowDownRight :size="13" :stroke-width="2.25" aria-hidden="true" /> Request
                <ChevronDown class="op-chevron" :size="13" aria-hidden="true" />
            </button>
            <div class="op-collapsible-body">
                <table v-if="op.request.length">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Type</th>
                            <th>Required</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        <template v-for="param in op.request" :key="param.name">
                            <tr>
                                <td>
                                    <code>{{ param.name }}</code>
                                </td>
                                <td>
                                    <code>{{ param.type }}</code>
                                </td>
                                <td>{{ param.required ? "yes" : "no" }}</td>
                                <td>{{ param.description }}</td>
                            </tr>
                            <tr
                                v-for="nested in param.nestedFields ?? []"
                                :key="param.name + nested.name"
                            >
                                <td>
                                    <code>&nbsp;&nbsp;{{ nested.name }}</code>
                                </td>
                                <td>
                                    <code>{{ nested.type }}</code>
                                </td>
                                <td>no</td>
                                <td>{{ nested.description }}</td>
                            </tr>
                        </template>
                    </tbody>
                </table>
                <p v-else class="op-empty">No parameters.</p>
            </div>
        </div>

        <div class="op-block op-collapsible" :class="{ 'is-open': responseOpen }">
            <button
                type="button"
                class="op-block-title op-toggle"
                :aria-expanded="responseOpen"
                @click="responseOpen = !responseOpen"
            >
                <ArrowUpRight :size="13" :stroke-width="2.25" aria-hidden="true" />
                Response — <code>{{ op.responseType }}</code>
                <ChevronDown class="op-chevron" :size="13" aria-hidden="true" />
            </button>
            <div class="op-collapsible-body">
                <table v-if="op.response.length">
                    <thead>
                        <tr>
                            <th>Field</th>
                            <th>Type</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="field in op.response" :key="field.name">
                            <td>
                                <code>{{ field.name }}</code>
                            </td>
                            <td>
                                <code>{{ field.type }}</code>
                            </td>
                            <td>{{ field.description }}</td>
                        </tr>
                    </tbody>
                </table>
                <p v-else class="op-empty">
                    See the TypeDoc page for the full <code>{{ op.responseType }}</code> shape.
                </p>
            </div>
        </div>

        <div class="op-block op-collapsible" :class="{ 'is-open': errorsOpen }">
            <button
                type="button"
                class="op-block-title op-toggle"
                :aria-expanded="errorsOpen"
                @click="errorsOpen = !errorsOpen"
            >
                <TriangleAlert :size="13" :stroke-width="2.25" aria-hidden="true" /> Errors
                <ChevronDown class="op-chevron" :size="13" aria-hidden="true" />
            </button>
            <div class="op-collapsible-body">
                <ul class="op-errors">
                    <li v-for="err in op.errors" :key="err.error + err.condition">
                        <code>{{ err.error }}</code> — {{ err.condition }}
                    </li>
                </ul>
            </div>
        </div>

        <div class="op-block">
            <p class="op-block-title">
                <Terminal :size="13" :stroke-width="2.25" aria-hidden="true" /> Example
            </p>
            <CodeBlock
                v-if="op.example"
                :source="op.example"
                language="TypeScript"
                :html="exampleHtml"
            />
            <p v-else class="op-empty">See the TypeDoc page for usage.</p>
        </div>

        <footer class="op-links">
            <a v-for="link in op.links" :key="link.url" :href="link.url">
                {{ link.label }} <ArrowUpRight :size="13" aria-hidden="true" />
            </a>
        </footer>
    </section>
</template>
