---
title: MyAnimeList user operations
description: "The public MyAnimeList user operations — profile reads and user-list reads — grouped by response domain."
layout: .vitepress/theme/DocsLayout.vue
---

<script setup>
import OperationCatalog from "../../lib/components/OperationCatalog.vue";
import { data as grouped } from "./user.data.ts";
</script>

# MyAnimeList user operations

The public MyAnimeList user operations, grouped by response domain.

<OperationCatalog :grouped="grouped" />
