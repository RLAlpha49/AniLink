---
title: MyAnimeList operation catalog
description: "Every public MyAnimeList operation — all REST — grouped by response domain on a single catalog page."
layout: .vitepress/theme/DocsLayout.vue
---

<script setup>
import OperationCatalog from "../lib/components/OperationCatalog.vue";
import { data as grouped } from "./mal/rest.data.ts";
</script>

# MyAnimeList operation catalog

Every public MyAnimeList operation is REST, so the catalog is a single page: the operations below are grouped by response domain.

<OperationCatalog :grouped="grouped" />

## Learn the workflows

The catalog states each operation's contract. The guides teach the workflows around them:

- <Icon name="ArrowRight" :size="14" /> [MAL operations guide](/guides/mal/operations) — worked examples for every operation listed above.
- <Icon name="ArrowRight" :size="14" /> [MAL authentication](/guides/mal/authentication) — obtaining and configuring the access token the catalog's authenticated reads require.
- <Icon name="ArrowRight" :size="14" /> [MAL client configuration](/guides/mal/configuration) — transport options scoped to the `mal` slot.
