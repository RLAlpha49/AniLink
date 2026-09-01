---
title: Custom queries
layout: .vitepress/theme/DocsLayout.vue
---

# Custom queries

`anilist.custom()` sends a GraphQL document you write. Use it when a field combination is not exposed by the typed operations.

```typescript
const result = await aniLink.anilist.custom<{ Media: { id: number; title: { romaji: string } } }>(
    "query ($id: Int) { Media(id: $id) { id title { romaji } } }",
    { id: 21 }
);
console.log(result.Media.title.romaji);
```

## Generic typing

`custom<T>` types the **unwrapped** result. Declare `T` as the shape of what the document returns after unwrapping (see the rule below).

## Envelope-unwrapping rule

The return shape depends on how many root fields your document has:

| Document shape | Return value |
| --- | --- |
| Single root field (`query { Media { … } }`) | The bare value of that field — e.g. `{ id, title }` |
| Multiple root fields (`query { Media { … } Viewer { … } }`) | The full `{ data }` envelope — e.g. `{ data: { Media: …, Viewer: … } }` |

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

`custom()` throws the same normalized errors as typed operations: `AniLinkGraphQLError` for GraphQL-level failures (with partial `data` when present), `AniLinkApiError` for HTTP failures, `AniLinkNetworkError` for transport failures.

## Next steps

- <Icon name="ArrowRight" :size="14" /> [TypeScript patterns](/typescript-patterns) — typing `custom()` results.
- <Icon name="ArrowRight" :size="14" /> [Error handling](/error-handling) — classifying failures.
