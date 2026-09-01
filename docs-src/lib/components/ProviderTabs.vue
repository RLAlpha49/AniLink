<script setup lang="ts">
/**
 * Provider switcher shared by all redesigns.
 *
 * Renders the AniList / MyAnimeList slot pair; the active pane is
 * client-side state. Styling comes entirely from redesign CSS variables.
 */
import { ref } from "vue";
import { Disc, Square } from "@lucide/vue";

withDefaults(defineProps<{ initial?: "anilist" | "mal" }>(), { initial: "anilist" });

const active = ref<"anilist" | "mal">("anilist");
</script>

<template>
    <div class="provider-tabs">
        <div class="tab-buttons" role="tablist">
            <button
                type="button"
                role="tab"
                :aria-selected="active === 'anilist'"
                class="tab-btn tab-btn--anilist"
                :class="{ active: active === 'anilist' }"
                @click="active = 'anilist'"
            >
                <Disc :size="13" :stroke-width="2.25" aria-hidden="true" /> AniList
            </button>
            <button
                type="button"
                role="tab"
                :aria-selected="active === 'mal'"
                class="tab-btn tab-btn--mal"
                :class="{ active: active === 'mal' }"
                @click="active = 'mal'"
            >
                <Square :size="13" :stroke-width="2.25" aria-hidden="true" /> MyAnimeList
            </button>
        </div>
        <div v-show="active === 'anilist'" role="tabpanel"><slot name="anilist" /></div>
        <div v-show="active === 'mal'" role="tabpanel"><slot name="mal" /></div>
    </div>
</template>
