---
title: Custom queries
description: "Send a GraphQL document you write yourself with anilist.custom and anilist.customPage for field combinations the typed operations do not expose."
layout: .vitepress/theme/DocsLayout.vue
---

# Custom queries

`anilist.custom()` sends a GraphQL document you write yourself. Use it when the typed operations do not expose a field combination you need. `anilist.customPage()` paginates a caller-authored `Page` document through the shared traversal engine.

```typescript
const result = await aniLink.anilist.custom<{ Media: { id: number; title: { romaji: string } } }>(
    "query ($id: Int) { Media(id: $id) { id title { romaji } } }",
    { id: 21 }
);
console.log(result.Media.title.romaji);
```

## Generic typing

`custom<T>` uses `T` as the type of the unwrapped result.

## Envelope-unwrapping rule

The return shape depends on how many root fields your document has:

| Document shape                                              | Return value                                                           |
| ----------------------------------------------------------- | ---------------------------------------------------------------------- |
| Single root field (`query { Media { … } }`)                 | The bare value of that field, e.g. `{ id, title }`                     |
| Multiple root fields (`query { Media { … } Viewer { … } }`) | The full `{ data }` envelope, e.g. `{ data: { Media: …, Viewer: … } }` |

<script setup>
import customQueriesEnvelope from "../../diagrams/custom-queries-envelope.mmd?raw";
</script>

<Mermaid :code="customQueriesEnvelope" />

```typescript
// Single root field: T is the field's value.
const media = await aniLink.anilist.custom<{ id: number }>("query { Media(id: 1) { id } }");
media.id; // direct access

// Multi-root: T is the envelope.
const both = await aniLink.anilist.custom<{
    data: { Media: { id: number }; Viewer: { id: number } };
}>(
    "query { Media(id: 1) { id } Viewer { id } }",
    undefined,
    { timeout: 10_000 } // optional per-request transport settings
);
both.data.Media.id;
```

## `customPage`

`customPage` paginates a caller-authored `Page` document through the same engine as `paginate`. Use it for collections whose field combination the generated page operations do not expose.

The document must be a `query` whose single root field is `Page`, selected with `$page`/`$perPage` `Int` variables, and it must select `pageInfo { hasNextPage }` plus an items array under a key of your choosing. Anything else, including mutation documents and documents with additional root fields, is rejected locally with an `AniLinkValidationError` before a request is made.

```typescript
const result = await aniLink.anilist.customPage(
    `query ($page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
            pageInfo { hasNextPage }
            characters(search: "spike") { id name { full } }
        }
    }`,
    "characters",
    {},
    { perPage: 50, maxPages: 3 }
);
console.log(result.items.length, result.truncated);
```

The second argument is the items key on the `Page` response (`"media"`, `"characters"`, any array field your document selects). The third argument carries variables forwarded verbatim on every page request, with `page`/`perPage` merged over them. The fourth carries the traversal options.

Because `Page` is the document's single root field, the response unwraps to the bare `Page` object, so the generic parameter is the `Page` selection's shape, not an envelope.

The traversal reuses every engine guard: `perPage` clamping (AniList caps it at 50), the `maxPages` bound (default 100), look-ahead `concurrency` (default 3), `AbortSignal` forwarding, and the `pageInfo.lastPage` terminal bound. See the [pagination guide](/guides/anilist/pagination) for what each guard does. Per-request transport settings go under `transportOptions` in the options object.

A fetched page response missing the `itemsKey` key throws an `AniLinkValidationError`.

## Errors

`custom()` and `customPage()` throw the same normalized errors as the typed operations: `AniLinkGraphQLError` for GraphQL-level failures (with partial `data` when present), `AniLinkApiError` for HTTP failures, `AniLinkNetworkError` for transport failures. `customPage()` additionally throws `AniLinkValidationError` for a malformed `Page` document or a response missing the items key.

## Next steps

- <Icon name="ArrowRight" :size="14" /> [Pagination](/guides/anilist/pagination) documents the traversal engine `customPage` reuses.
- <Icon name="ArrowRight" :size="14" /> [TypeScript patterns](/typescript-patterns), typing `custom()` results.
- <Icon name="ArrowRight" :size="14" /> [Error handling](/error-handling), classifying failures.
