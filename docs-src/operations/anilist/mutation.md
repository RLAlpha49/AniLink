---
title: AniList mutation operations
description: "The authenticated AniList GraphQL mutation operations, grouped by response domain."
layout: .vitepress/theme/DocsLayout.vue
---

<script setup>
import OperationCatalog from "../../lib/components/OperationCatalog.vue";
import { data as grouped } from "./mutation.data.ts";
</script>

# AniList mutation operations

The authenticated AniList GraphQL mutation operations, grouped by response domain.

<OperationCatalog :grouped="grouped" />

## Related guides

- [Mutations](/guides/anilist/mutations) covers authentication and mutation behavior.
- [Field selection](/guides/anilist/field-selection) covers selecting mutation response fields.
