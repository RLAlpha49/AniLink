---
title: AniList custom operations
description: "The custom AniList GraphQL operation, including its request and response contract."
layout: .vitepress/theme/DocsLayout.vue
---

<script setup>
import OperationCatalog from "../../lib/components/OperationCatalog.vue";
import { data as grouped } from "./custom.data.ts";
</script>

# AniList custom operations

The custom AniList GraphQL operation, including its request and response contract.

<OperationCatalog :grouped="grouped" />

## Related guides

- [Custom queries](/guides/anilist/custom-queries) covers writing GraphQL documents.
- [Field selection](/guides/anilist/field-selection) explains when to use `custom()` instead.
