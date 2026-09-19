---
title: MyAnimeList user operations
description: "The public MyAnimeList user operations are grouped by response domain. They cover profile reads and user-list reads."
layout: .vitepress/theme/DocsLayout.vue
---

<script setup>
import OperationCatalog from "../../lib/components/OperationCatalog.vue";
import { data as grouped } from "./user.data.ts";
</script>

# MyAnimeList user operations

The public MyAnimeList user operations are grouped by response domain.

<OperationCatalog :grouped="grouped" />
