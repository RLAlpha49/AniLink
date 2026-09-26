---
title: AniList page-query operations
description: "The paginated AniList GraphQL page-query operations, grouped by response domain."
layout: .vitepress/theme/DocsLayout.vue
---

<script setup>
import OperationCatalog from "../../lib/components/OperationCatalog.vue";
import { data as grouped } from "./page.data.ts";
</script>

# AniList page-query operations

The paginated AniList GraphQL query operations, grouped by response domain.

<OperationCatalog :grouped="grouped" />

## Related guides

- [Page queries](/guides/anilist/page-queries) covers fetching one known page.
- [Pagination](/guides/anilist/pagination) covers traversing pages automatically.
