<script setup lang="ts">
/**
 * Thin wrapper that exposes Lucide icons to Markdown content.
 *
 * Markdown files cannot import Vue components per-file, so this wrapper is
 * registered globally in the theme and addressed by icon name. It forwards
 * `size` and `strokeWidth` (and any extra SVG attribute) to the underlying
 * Lucide functional component, keeping the ink-line aesthetic tunable from
 * one place.
 */
import { computed, type FunctionalComponent } from "vue";
import * as lucide from "@lucide/vue";

const props = withDefaults(
    defineProps<{
        /** Lucide icon name in PascalCase, e.g. "ArrowRight". */
        name: string;
        /** Icon size in pixels. */
        size?: number;
        /** Stroke width; Lucide defaults to 2. */
        strokeWidth?: number;
    }>(),
    {
        size: 16,
        strokeWidth: 2,
    }
);

const icon = computed<FunctionalComponent | undefined>(
    () => (lucide as Record<string, FunctionalComponent>)[props.name]
);
</script>

<template>
    <component
        :is="icon"
        v-if="icon"
        :size="size"
        :stroke-width="strokeWidth"
        class="docs-icon"
        aria-hidden="true"
    />
</template>

<style scoped>
.docs-icon {
    display: inline-block;
    vertical-align: -0.18em;
    flex-shrink: 0;
}
</style>
