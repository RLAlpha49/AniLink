---
title: MyAnimeList forum operations
description: "The public MyAnimeList forum operations for reading boards and topics, grouped by response domain."
layout: .vitepress/theme/DocsLayout.vue
---

<script setup>
import OperationCatalog from "../../lib/components/OperationCatalog.vue";
import { data as grouped } from "./forum.data.ts";
</script>

# MyAnimeList forum operations

The public MyAnimeList forum operations, grouped by response domain.

<OperationCatalog :grouped="grouped" />
