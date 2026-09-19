---
title: Provider configuration
description: "The two forms for passing AniLink credentials, the positional AniList token or per-provider anilist and mal slots, and how each form maps credentials to the aniLink.anilist and aniLink.mal clients."
layout: .vitepress/theme/DocsLayout.vue
---

# Provider configuration

AniLink accepts credentials in two forms. Both produce a client with `aniLink.anilist` and `aniLink.mal`. The positional form authenticates only AniList. The per-provider form takes a credentials slot for each provider.

<Mermaid
    :code="`flowchart LR\n    subgraph ctor[AniLink constructor]\n        direction TB\n        pos[Positional form\ntoken, options]:::form\n        obj[Per-provider form\nanilist + mal slots]:::form\n    end\n\n    pos -->|forwards token + options| bpc\n    obj --> bpc[buildProviderClients]\n\n    bpc -->|anilist slot only| af[AniList factory]\n    bpc -->|mal slot only| mf[MAL factory]\n\n    af --> al[anilist surface\nuses anilist credentials]:::iso\n    mf --> mal[mal surface\nuses mal credentials]:::iso\n\n    al -.->|credentials never cross| mal\n    mal -.->|credentials never cross| al\n\n    classDef form fill:#fff2cc,stroke:#d6b656,color:#5c4a00;\n    classDef iso fill:#e1d5e7,stroke:#9673a6,color:#3b3a45;`"
/>

## Positional form (legacy AniList)

```typescript
import { AniLink } from "anilink-api-wrapper";

// Token for AniList; transport settings apply to AniList only.
const aniLink = new AniLink("anilist-token", { timeout: 10_000 });
```

The first argument is the AniList token. The second argument is transport settings, and the constructor forwards them only to the AniList factory. The MAL client still exists, but it is unauthenticated.

## Per-provider credentials form

```typescript
import { AniLink } from "anilink-api-wrapper";

const aniLink = new AniLink({
    anilist: { authToken: "anilist-token", timeout: 5_000 },
    mal: { accessToken: "mal-token", timeout: 10_000 },
});
```

When the first argument is a credentials object, the constructor rejects a second argument with a `TypeError`. Transport settings belong inside each provider's slot, so the constructor would silently drop a second argument. It rejects the ambiguous call instead.

## Credential slots

| Slot | Fields | Provider |
| --- | --- | --- |
| `anilist` | `authToken` plus shared transport options | AniList |
| `mal` | `accessToken`, `refreshToken`, `clientId`, `clientSecret` plus shared transport options | MAL |

<Callout kind="provider" label="Provider scope">

AniLink never applies credentials from one slot to another provider's requests. It never sends a MAL access token to AniList, and it never sends an AniList bearer token to MAL.

</Callout>

### Credential key validation

Unknown credential keys fail fast with a `TypeError` at client construction. A typo such as `accesstoken` instead of `accessToken`, or an obsolete field, produces an error that lists the valid transport and auth fields. Otherwise the constructor would silently ignore the key, and requests would fail later with an `AniLinkAuthError`.

### Client-level `onHookError`

The per-provider credentials form accepts a top-level `onHookError`. It applies to every provider slot that does not define its own. See [Observability](/observability) for details.

## `buildProviderClients()`

The constructor delegates to `buildProviderClients`, which is also exported so you can build provider clients without the `AniLink` class:

```typescript
import { buildProviderClients } from "anilink-api-wrapper";

const clients = buildProviderClients({
    anilist: { authToken: "anilist-token" },
    mal: { accessToken: "mal-token" },
});

const anime = await clients.mal.anime.get({ id: 21 });
```

`buildProviderClients(credentials?, legacyOptions?)` invokes each registered provider factory with only that provider's credential slot. `legacyOptions` holds the positional form's transport settings, and `buildProviderClients` forwards it only to the AniList factory.

## Transport settings scoping

`timeout`, `retry`, `signal`, pacing, circuit breaker, and hooks are transport settings. AniLink scopes each setting to the provider slot where you declare it:

```typescript
const aniLink = new AniLink({
    anilist: { authToken: "t", timeout: 5_000, retry: false },
    mal: { accessToken: "m", timeout: 15_000 },
});
```

Here AniList requests time out after 5 seconds with no retries, while MAL requests time out after 15 seconds with the default retry policy.

## Next steps

- <Icon name="ArrowRight" :size="14" /> [AniList client configuration](/guides/anilist/configuration) has the full options table.
- <Icon name="ArrowRight" :size="14" /> [MAL client configuration](/guides/mal/configuration) covers MAL credentials in detail.
- <Icon name="ArrowRight" :size="14" /> [Observability](/observability) documents client-level `onHookError` and lifecycle hooks.
