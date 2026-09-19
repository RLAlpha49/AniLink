---
title: Getting started
description: "Install anilink-api-wrapper, create a client with credentials, and send a first request to either provider."
layout: .vitepress/theme/DocsLayout.vue
---

# Getting started

## Install

```bash
npm install anilink-api-wrapper
```

You need Node.js 22 or newer. The package is ESM-only.

## Your first AniList query

```typescript
import { AniLink } from "anilink-api-wrapper";

const aniLink = new AniLink();

const anime = await aniLink.anilist.query.media({ id: 21, type: "ANIME" });
console.log(anime.media?.title?.romaji);
```

You do not need a token to read public data. The `anilist` namespace has queries, page queries, mutations, pagination helpers, and `custom()`.

## Your first MAL lookup

```typescript
import { AniLink } from "anilink-api-wrapper";

const aniLink = new AniLink({ mal: { accessToken: "mal-token" } });

const anime = await aniLink.mal.anime.get(
    { id: 21 },
    { fields: ["id", "title", "main_picture"] }
);
console.log(anime.title);
```

The `mal` namespace has the REST operations. `anime.get` requires no token for public fields, and `user.me` requires one.

## Instance basics

One `AniLink` instance gives you both providers:

```typescript
const aniLink = new AniLink({
    anilist: { authToken: "anilist-token" },
    mal: { accessToken: "mal-token" },
});

// AniList GraphQL API
await aniLink.anilist.query.viewer();

// MyAnimeList REST API
await aniLink.mal.user.me();
```

Each provider keeps its own credentials and transport settings. Nothing leaks between them. [Provider configuration](/provider-configuration) has the full rules.

## Next steps

- <Icon name="ArrowRight" :size="14" /> [Provider configuration](/provider-configuration) covers constructor forms and credential isolation.
- <Icon name="ArrowRight" :size="14" /> [Error handling](/error-handling) covers classifying failures by stable code.
- <Icon name="ArrowRight" :size="14" /> [Operation reference](/operations/index) covers every operation's request and response.
