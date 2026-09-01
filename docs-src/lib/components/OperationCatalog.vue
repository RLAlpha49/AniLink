<script setup lang="ts">
/**
 * Renders one provider/category slice of the operation reference.
 *
 * Imported by the generated operation pages instead of a shared theme
 * so the operation cards and their Shiki highlighter load only when a
 * reader opens an operation-reference page.
 */
import type { GroupedOperations } from "../load-ops";
import OperationCard from "./OperationCard.vue";

defineProps<{ grouped: GroupedOperations }>();

/** Slugify a namespace into a URL-safe anchor id. */
function slug(namespace: string): string {
    return namespace.toLowerCase().replace(/\W+/g, "-");
}
</script>

<template>
    <template v-for="(ops, domain) in grouped" :key="domain">
        <h2 :id="String(domain).toLowerCase().replace(/\W+/g, '-')">{{ domain }}</h2>
        <template v-for="op in ops" :key="op.namespace">
            <h3 :id="slug(op.namespace)">
                <code>{{ op.namespace }}</code>
            </h3>
            <OperationCard :op="op" />
        </template>
    </template>
</template>
