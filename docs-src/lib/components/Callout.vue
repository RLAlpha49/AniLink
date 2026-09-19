<script setup lang="ts">
/**
 * Callout box shared by all redesigns.
 *
 * The callout has three semantic kinds: note, caution, and provider, with
 * an optional label override. All styling comes from redesign CSS variables.
 */
import { Info, Layers, TriangleAlert } from "@lucide/vue";

withDefaults(defineProps<{ kind?: "note" | "caution" | "provider"; label?: string }>(), {
    kind: "note",
    label: "",
});

const ICONS = {
    note: Info,
    caution: TriangleAlert,
    provider: Layers,
} as const;
</script>

<template>
    <div class="callout" :class="`callout--${kind}`">
        <p class="callout-label">
            <component :is="ICONS[kind]" :size="14" :stroke-width="2.25" aria-hidden="true" />
            {{
                label ||
                (kind === "caution" ? "Caution" : kind === "provider" ? "Provider scope" : "Note")
            }}
        </p>
        <div class="callout-body"><slot /></div>
    </div>
</template>
