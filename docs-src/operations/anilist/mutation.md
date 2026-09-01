---
title: AniList mutation operations
layout: .vitepress/theme/DocsLayout.vue
---

<script setup>
import OperationCatalog from "../../lib/components/OperationCatalog.vue";
import { data as grouped } from "./mutation.data.ts";
</script>

# AniList mutation operations

The authenticated AniList GraphQL mutation operations, grouped by response domain.

<OperationCatalog :grouped="grouped" />
