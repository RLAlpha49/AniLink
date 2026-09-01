---
title: AniList custom operations
layout: .vitepress/theme/DocsLayout.vue
---

<script setup>
import OperationCatalog from "../../lib/components/OperationCatalog.vue";
import { data as grouped } from "./custom.data.ts";
</script>

# AniList custom operations

The flexible custom AniList GraphQL operation, including its request and response contract.

<OperationCatalog :grouped="grouped" />
