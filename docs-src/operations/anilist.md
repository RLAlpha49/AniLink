---
title: AniList operation catalog
description: "Entry point for the AniList operation pages, grouped by query, page-query, mutation, and custom categories."
layout: .vitepress/theme/DocsLayout.vue
---

<script setup>
// The AniList catalog is a parent entry in the sidebar; clicking it lands on
// the first category (query operations) rather than a separate landing page.
if (typeof window !== "undefined") {
    window.location.replace("/operations/anilist/query");
}
</script>

# AniList operation catalog

Redirecting to [Query operations](/operations/anilist/query)…
