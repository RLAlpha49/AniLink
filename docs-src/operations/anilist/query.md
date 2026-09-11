---
title: AniList query operations
description: "The public AniList GraphQL query operations, grouped by response domain."
layout: .vitepress/theme/DocsLayout.vue
---

<script setup>
import OperationCatalog from "../../lib/components/OperationCatalog.vue";
import { data as grouped } from "./query.data.ts";
</script>

# AniList query operations

The public AniList GraphQL query operations, grouped by response domain.

<OperationCatalog :grouped="grouped" />
