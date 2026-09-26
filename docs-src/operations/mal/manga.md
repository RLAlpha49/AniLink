---
title: MyAnimeList manga operations
description: "The public MyAnimeList manga operations are grouped by response domain. They cover lookups, discovery reads, and list-status writes."
layout: .vitepress/theme/DocsLayout.vue
---

<script setup>
import OperationCatalog from "../../lib/components/OperationCatalog.vue";
import { data as grouped } from "./manga.data.ts";
</script>

# MyAnimeList manga operations

The public MyAnimeList manga operations are grouped by response domain.

<OperationCatalog :grouped="grouped" />

## Related guides

- [MAL operations](/guides/mal/operations) explains operation parameters and responses.
- [MAL pagination](/guides/mal/pagination) covers paging through manga results.
