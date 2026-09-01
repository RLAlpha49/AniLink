---
title: MyAnimeList operation catalog
layout: .vitepress/theme/DocsLayout.vue
---

<script setup>
import OperationCatalog from "../lib/components/OperationCatalog.vue";
import { data as grouped } from "./mal/rest.data.ts";
</script>

# MyAnimeList operation catalog

Every public MyAnimeList operation is REST, so the catalog is a single page: the operations below are grouped by response domain.

<OperationCatalog :grouped="grouped" />
