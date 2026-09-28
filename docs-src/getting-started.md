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

You can read public AniList data without a token. The `anilist` namespace provides queries, page queries, mutations, pagination helpers, and `custom()`.

## Your first MAL lookup

```typescript
import { AniLink } from "anilink-api-wrapper";

const aniLink = new AniLink({ mal: { accessToken: "mal-token" } });

const anime = await aniLink.mal.anime.get({ id: 21 }, { fields: ["id", "title", "main_picture"] });
console.log(anime.title);
```

Use the `mal` namespace for REST operations. `anime.get` needs no token for public fields, but `user.me` does.

## Use AniLink from CommonJS

AniLink publishes ESM only. In a CommonJS project, load the package with dynamic `import()`:

```javascript
async function main() {
    const { AniLink } = await import("anilink-api-wrapper");
    const aniLink = new AniLink();
    const result = await aniLink.anilist.query.media({ id: 21, type: "ANIME" });
    console.log(result.media?.title?.romaji);
}

main();
```

To use static imports, configure the consuming project as ESM. Add `"type": "module"` to `package.json`, or use the `.mjs` file extension. AniLink does not provide a CommonJS build.

## Instance basics

`AniLink` exposes both providers from one instance:

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

Each provider keeps separate credentials and transport settings. See [Provider configuration](/provider-configuration) for the details.

## Next steps

- <Icon name="ArrowRight" :size="14" /> [Provider configuration](/provider-configuration) covers constructor forms and credential isolation.
- <Icon name="ArrowRight" :size="14" /> [Error handling](/error-handling) covers classifying failures by stable code.
- <Icon name="ArrowRight" :size="14" /> [Operation reference](/operations/index) covers every operation's request and response.
