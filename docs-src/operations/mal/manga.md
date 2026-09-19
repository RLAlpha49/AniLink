---
title: MyAnimeList manga operations
description: "The public MyAnimeList manga operations — lookups, discovery reads, and list-status writes — grouped by response domain."
layout: .vitepress/theme/DocsLayout.vue
---

<script setup>
import OperationCatalog from "../../lib/components/OperationCatalog.vue";
import { data as grouped } from "./manga.data.ts";
</script>

# MyAnimeList manga operations

The public MyAnimeList manga operations, grouped by response domain.

<OperationCatalog :grouped="grouped" />
