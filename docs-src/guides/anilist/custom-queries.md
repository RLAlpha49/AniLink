---
title: Custom queries
description: "Send a GraphQL document you write yourself with anilist.custom for field combinations the typed operations do not expose."
layout: .vitepress/theme/DocsLayout.vue
---

# Custom queries

`anilist.custom()` sends a GraphQL document you write yourself. Use it when the typed operations do not expose a field combination you need.

```typescript
const result = await aniLink.anilist.custom<{ Media: { id: number; title: { romaji: string } } }>(
    "query ($id: Int) { Media(id: $id) { id title { romaji } } }",
    { id: 21 }
);
console.log(result.Media.title.romaji);
```

## Generic typing

`custom<T>` types the **unwrapped** result. Declare `T` as the shape of what the document returns after unwrapping.

## Envelope-unwrapping rule

The return shape depends on how many root fields your document has:

| Document shape | Return value |
| --- | --- |
| Single root field (`query { Media { … } }`) | The bare value of that field, e.g. `{ id, title }` |
| Multiple root fields (`query { Media { … } Viewer { … } }`) | The full `{ data }` envelope, e.g. `{ data: { Media: …, Viewer: … } }` |

```typescript
// Single root field: T is the field's value.
const media = await aniLink.anilist.custom<{ id: number }>(
    "query { Media(id: 1) { id } }"
);
media.id; // direct access

// Multi-root: T is the envelope.
const both = await aniLink.anilist.custom<{ data: { Media: { id: number }; Viewer: { id: number } } }>(
    "query { Media(id: 1) { id } Viewer { id } }",
    undefined,
    { timeout: 10_000 } // optional per-request transport settings
);
both.data.Media.id;
```

## Errors

`custom()` throws the same normalized errors as the typed operations: `AniLinkGraphQLError` for GraphQL-level failures (with partial `data` when present), `AniLinkApiError` for HTTP failures, `AniLinkNetworkError` for transport failures.

## Next steps

- <Icon name="ArrowRight" :size="14" /> [TypeScript patterns](/typescript-patterns), typing `custom()` results.
- <Icon name="ArrowRight" :size="14" /> [Error handling](/error-handling), classifying failures.
