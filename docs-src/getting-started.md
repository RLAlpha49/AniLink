---
title: Getting started
layout: .vitepress/theme/DocsLayout.vue
---

# Getting started

## Install

```bash
npm install anilink-api-wrapper
```

You will need Node.js 22 or newer. The package is ESM-only.

## Your first AniList query

```typescript
import { AniLink } from "anilink-api-wrapper";

const aniLink = new AniLink();

const anime = await aniLink.anilist.query.media({ id: 21, type: "ANIME" });
console.log(anime.media?.title?.romaji);
```

No token needed — public data is right there for the taking. The `anilist` namespace exposes queries, page queries, mutations, pagination helpers, and `custom()`.

## Your first MAL lookup

```typescript
import { AniLink } from "anilink-api-wrapper";

const aniLink = new AniLink({ mal: { accessToken: "mal-token" } });

const anime = await aniLink.mal.anime.get(21, {
    fields: ["id", "title", "main_picture"],
});
console.log(anime.title);
```

The `mal` namespace holds the REST operations. `anime.get` works without a token for public fields, and `user.me` wants one.

## Instance basics

One `AniLink` instance carries both provider surfaces:

```typescript
const aniLink = new AniLink({
    anilist: { authToken: "anilist-token" },
    mal: { accessToken: "mal-token" },
});

// AniList GraphQL surface
await aniLink.anilist.query.viewer();

// MyAnimeList REST surface
await aniLink.mal.user.me();
```

Each provider keeps its own credentials and its own transport settings — nothing leaks between them. [Provider configuration](/provider-configuration) has the full rules.

## Next steps

- <Icon name="ArrowRight" :size="14" /> [Provider configuration](/provider-configuration) — constructor forms and credential isolation.
- <Icon name="ArrowRight" :size="14" /> [Error handling](/error-handling) — classify failures by stable code.
- <Icon name="ArrowRight" :size="14" /> [Operation reference](/operations/index) — every operation's request/response anatomy.
