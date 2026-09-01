---
title: Provider configuration
layout: .vitepress/theme/DocsLayout.vue
---

# Provider configuration

AniLink accepts credentials two ways. Both produce a client with `aniLink.anilist` and `aniLink.mal` surfaces.

<Mermaid
    :code="`flowchart LR\n    subgraph ctor[AniLink constructor]\n        direction TB\n        pos[Positional form\ntoken, options]:::form\n        obj[Per-provider form\nanilist + mal slots]:::form\n    end\n\n    pos -->|forwards token + options| bpc\n    obj --> bpc[buildProviderClients]\n\n    bpc -->|anilist slot only| af[AniList factory]\n    bpc -->|mal slot only| mf[MAL factory]\n\n    af --> al[anilist surface\nuses anilist credentials]:::iso\n    mf --> mal[mal surface\nuses mal credentials]:::iso\n\n    al -.->|credentials never cross| mal\n    mal -.->|credentials never cross| al\n\n    classDef form fill:#fff2cc,stroke:#d6b656,color:#5c4a00;\n    classDef iso fill:#e1d5e7,stroke:#9673a6,color:#3b3a45;`"
/>

## Positional form (legacy AniList)

```typescript
import { AniLink } from "anilink-api-wrapper";

// Token for AniList; transport settings apply to AniList only.
const aniLink = new AniLink("anilist-token", { timeout: 10_000 });
```

The first argument is the AniList token. The second is transport settings forwarded **only to the AniList factory**. The MAL surface is still available but unauthenticated.

## Per-provider credentials form

```typescript
import { AniLink } from "anilink-api-wrapper";

const aniLink = new AniLink({
    anilist: { authToken: "anilist-token", timeout: 5_000 },
    mal: { accessToken: "mal-token", timeout: 10_000 },
});
```

When the first argument is a credentials object, the second constructor argument is unused — transport settings belong inside each provider's slot.

## Credential slots

| Slot | Fields | Provider |
| --- | --- | --- |
| `anilist` | `authToken` plus shared transport options | AniList |
| `mal` | `accessToken`, `refreshToken`, `clientId`, `clientSecret` plus shared transport options | MAL |

<Callout kind="provider" label="Provider scope">

Credentials given under one key are never applied to another provider's requests. A MAL access token is never sent to AniList. An AniList bearer token is never sent to MAL.

</Callout>

## `buildProviderClients()`

The constructor delegates to `buildProviderClients`, which is exported for advanced composition:

```typescript
import { buildProviderClients } from "anilink-api-wrapper";

const clients = buildProviderClients({
    anilist: { authToken: "anilist-token" },
    mal: { accessToken: "mal-token" },
});

const anime = await clients.mal.anime.get(21);
```

`buildProviderClients(credentials?, legacyOptions?)` invokes each registered provider factory with only that provider's credential slot. `legacyOptions` exists for the positional form and is forwarded only to the AniList factory.

## Transport settings scoping

`timeout`, `retry`, `signal`, pacing, circuit breaker, and hooks are transport settings. They are scoped to the provider slot where they are declared:

```typescript
const aniLink = new AniLink({
    anilist: { authToken: "t", timeout: 5_000, retry: false },
    mal: { accessToken: "m", timeout: 15_000 },
});
```

Here AniList requests time out after 5 s with no retries. MAL requests time out after 15 s with the default retry policy.

## Next steps

- <Icon name="ArrowRight" :size="14" /> [AniList client configuration](/guides/anilist/configuration) — the full options table.
- <Icon name="ArrowRight" :size="14" /> [MAL client configuration](/guides/mal/configuration) — MAL credentials in detail.
