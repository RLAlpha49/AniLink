---
title: Provider configuration
description: "The two forms for passing AniLink credentials, the positional AniList token or per-provider anilist and mal slots, and how each form maps credentials to the aniLink.anilist and aniLink.mal clients."
layout: .vitepress/theme/DocsLayout.vue
---

# Provider configuration

AniLink accepts credentials in two forms. Both create a client with `aniLink.anilist` and `aniLink.mal`. The positional form authenticates AniList only. The per-provider form accepts a credentials slot for each provider.

<script setup>
import providerConfiguration from "./diagrams/provider-configuration.mmd?raw";
</script>

<Mermaid :code="providerConfiguration" />

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

If the first argument is a credentials object, the constructor rejects a second argument with a `TypeError`. Put transport settings inside each provider's slot. Otherwise, the constructor would silently drop them, so it rejects the call.

## Credential slots

| Slot      | Fields                                                                                  | Provider |
| --------- | --------------------------------------------------------------------------------------- | -------- |
| `anilist` | `authToken` plus shared transport options                                               | AniList  |
| `mal`     | `accessToken`, `refreshToken`, `clientId`, `clientSecret` plus shared transport options | MAL      |

<Callout kind="provider" label="Provider scope">

AniLink never applies credentials from one slot to another provider's requests. It never sends a MAL access token to AniList, and it never sends an AniList bearer token to MAL.

</Callout>

### Credential key validation

At construction, AniLink rejects unknown credential keys with a `TypeError`. For example, misspelling `accessToken` as `accesstoken` produces an error that lists valid transport and authentication fields. The constructor also rejects obsolete fields. Without this check, it would ignore the key and requests would fail later with an `AniLinkAuthError`.

### Client-level `onHookError`

The per-provider credentials form accepts a top-level `onHookError`. It applies to every provider slot that does not define its own. See [Observability](/observability) for details.

## `buildProviderClients()`

The constructor delegates to `buildProviderClients`. The package also exports this function so you can build provider clients without the `AniLink` class:

```typescript
import { buildProviderClients } from "anilink-api-wrapper";

const clients = buildProviderClients({
    anilist: { authToken: "anilist-token" },
    mal: { accessToken: "mal-token" },
});

const anime = await clients.mal.anime.get({ id: 21 });
```

`buildProviderClients(credentials?, legacyOptions?)` calls each registered provider factory with only that provider's credential slot. `legacyOptions` holds the positional form's transport settings. The function forwards those settings only to the AniList factory.

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
