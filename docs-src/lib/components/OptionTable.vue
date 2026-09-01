<script setup lang="ts">
/**
 * Options table shared by all redesigns.
 *
 * Renders constructor/request option rows with an optional provider
 * chip column. Styling comes from redesign CSS variables.
 */
export interface OptionRow {
    name: string;
    type: string;
    default?: string;
    description: string;
    provider?: string;
}

defineProps<{ rows: OptionRow[]; showProvider?: boolean }>();
</script>

<template>
    <div class="option-table">
        <table>
            <thead>
                <tr>
                    <th v-if="showProvider">Provider</th>
                    <th>Option</th>
                    <th>Type</th>
                    <th>Default</th>
                    <th>Description</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="row in rows" :key="row.name">
                    <td v-if="showProvider">
                        <span
                            v-if="row.provider"
                            class="provider-chip"
                            :class="row.provider === 'mal' ? 'mal' : 'anilist'"
                            >{{ row.provider === "mal" ? "MAL" : "AniList" }}</span
                        >
                        <span v-else class="provider-chip shared">Both</span>
                    </td>
                    <td>
                        <code>{{ row.name }}</code>
                    </td>
                    <td>
                        <code>{{ row.type }}</code>
                    </td>
                    <td>
                        <code v-if="row.default">{{ row.default }}</code
                        ><span v-else>—</span>
                    </td>
                    <td>{{ row.description }}</td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<style scoped>
td code {
    white-space: nowrap;
}
</style>
