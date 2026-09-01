<script setup lang="ts">
/**
 * Code block with copy button shared by all redesigns.
 *
 * Accepts pre-highlighted Shiki HTML (preferred) or falls back to a
 * plain `<pre>` of the raw source. Styling comes from redesign CSS.
 */
import { onBeforeUnmount, ref } from "vue";

withDefaults(
    defineProps<{
        source: string;
        language: string;
        html?: string;
    }>(),
    { html: "" }
);

const copied = ref(false);
const copyFailed = ref(false);
let resetTimer: ReturnType<typeof setTimeout> | undefined;

/** Copy the raw source while keeping the generated Shiki markup out of the clipboard. */
async function copyCode(source: string): Promise<void> {
    copyFailed.value = false;
    try {
        await navigator.clipboard.writeText(source);
        copied.value = true;
        clearTimeout(resetTimer);
        resetTimer = setTimeout(() => {
            copied.value = false;
        }, 1600);
    } catch {
        copyFailed.value = true;
    }
}

onBeforeUnmount(() => clearTimeout(resetTimer));
</script>

<template>
    <div class="al-code-block">
        <div class="al-code-toolbar">
            <span class="al-code-language">{{ language }}</span>
            <button
                type="button"
                class="al-code-copy"
                :aria-label="copied ? 'Code copied' : 'Copy code'"
                :title="copied ? 'Copied' : copyFailed ? 'Copy failed' : 'Copy code'"
                @click="copyCode(source)"
            >
                <span class="al-code-copy-icon" aria-hidden="true">{{ copied ? "✓" : "⧉" }}</span>
                <span>{{ copied ? "Copied" : "Copy" }}</span>
            </button>
        </div>
        <div v-if="html" class="al-code-content" v-html="html"></div>
        <pre v-else class="al-code-content"><code>{{ source }}</code></pre>
    </div>
</template>
