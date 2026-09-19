---
title: MyAnimeList operation catalog
description: "Entry point for the MyAnimeList operation pages, grouped by anime, manga, user, and forum categories."
layout: .vitepress/theme/DocsLayout.vue
---

<script setup>
// The MAL catalog is a parent entry in the sidebar; clicking it lands on
// the first category (anime operations) rather than a separate landing page.
if (typeof window !== "undefined") {
    window.location.replace("/operations/mal/anime");
}
</script>

# MyAnimeList operation catalog

Redirecting to [Anime operations](/operations/mal/anime)…
