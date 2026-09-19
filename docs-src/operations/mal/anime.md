---
title: MyAnimeList anime operations
description: "The public MyAnimeList anime operations, lookups, discovery reads, and list-status writes, grouped by response domain."
layout: .vitepress/theme/DocsLayout.vue
---

<script setup>
import OperationCatalog from "../../lib/components/OperationCatalog.vue";
import { data as grouped } from "./anime.data.ts";
</script>

# MyAnimeList anime operations

The public MyAnimeList anime operations, grouped by response domain.

<OperationCatalog :grouped="grouped" />
