<script setup lang="ts">
/**
 * Provider switcher shared by all redesigns.
 *
 * Renders the AniList / MyAnimeList slot pair; the active pane is
 * client-side state. All styling comes from redesign CSS variables.
 */
import { ref, useId, useTemplateRef } from "vue";
import { Disc, Square } from "@lucide/vue";

const props = withDefaults(defineProps<{ initial?: "anilist" | "mal" }>(), {
    initial: "anilist",
});

const active = ref(props.initial);
const idPrefix = useId();
const anilistTabId = `${idPrefix}-anilist-tab`;
const malTabId = `${idPrefix}-mal-tab`;
const anilistPanelId = `${idPrefix}-anilist-panel`;
const malPanelId = `${idPrefix}-mal-panel`;
const anilistTab = useTemplateRef<HTMLButtonElement>("anilist-tab");
const malTab = useTemplateRef<HTMLButtonElement>("mal-tab");

function onTabKeydown(event: KeyboardEvent): void {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;

    event.preventDefault();
    const tabs = ["anilist", "mal"] as const;
    const currentIndex = tabs.indexOf(active.value);
    const direction = event.key === "ArrowRight" ? 1 : -1;
    active.value = tabs[(currentIndex + direction + tabs.length) % tabs.length];
    (active.value === "anilist" ? anilistTab : malTab).value?.focus();
}
</script>

<template>
    <div class="provider-tabs">
        <div class="tab-buttons" role="tablist" aria-label="Data provider">
            <button
                type="button"
                role="tab"
                :id="anilistTabId"
                :aria-selected="active === 'anilist'"
                :aria-controls="anilistPanelId"
                :tabindex="active === 'anilist' ? 0 : -1"
                ref="anilist-tab"
                class="tab-btn tab-btn--anilist"
                :class="{ active: active === 'anilist' }"
                @click="active = 'anilist'"
                @keydown="onTabKeydown"
            >
                <Disc :size="13" :stroke-width="2.25" aria-hidden="true" /> AniList
            </button>
            <button
                type="button"
                role="tab"
                :id="malTabId"
                :aria-selected="active === 'mal'"
                :aria-controls="malPanelId"
                :tabindex="active === 'mal' ? 0 : -1"
                ref="mal-tab"
                class="tab-btn tab-btn--mal"
                :class="{ active: active === 'mal' }"
                @click="active = 'mal'"
                @keydown="onTabKeydown"
            >
                <Square :size="13" :stroke-width="2.25" aria-hidden="true" /> MyAnimeList
            </button>
        </div>
        <div
            v-show="active === 'anilist'"
            :id="anilistPanelId"
            role="tabpanel"
            :aria-labelledby="anilistTabId"
            tabindex="0"
        >
            <slot name="anilist" />
        </div>
        <div
            v-show="active === 'mal'"
            :id="malPanelId"
            role="tabpanel"
            :aria-labelledby="malTabId"
            tabindex="0"
        >
            <slot name="mal" />
        </div>
    </div>
</template>
