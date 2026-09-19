---
title: TypeScript patterns
description: "How AniLink fully types operation variables and responses, so inferred shapes appear on hover."
layout: .vitepress/theme/DocsLayout.vue
---

# TypeScript patterns

## Provider-aware inferred types

AniLink fully types operation variables and responses. Hover any call and the inferred shapes appear:

```typescript
import { AniLink } from "anilink-api-wrapper";

const aniLink = new AniLink();

// Inferred: takes MediaVariables, returns Promise<MediaResponse>
const media = await aniLink.anilist.query.media({ id: 1, type: "ANIME" });

// Inferred: MalAnime, id and title guaranteed, extra fields via index signature
const anime = await aniLink.mal.anime.get({ id: 21 }, { fields: ["id", "title"] });
```

## Discriminating errors by `code` and `instanceof`

```typescript
import { AniLinkError, AniLinkErrorCodes, AniLinkApiError } from "anilink-api-wrapper";

try {
    await aniLink.anilist.query.viewer();
} catch (error: unknown) {
    if (error instanceof AniLinkApiError && error.status === 429) {
        // Rate limited. Check error.rateLimit?.reset
    } else if (error instanceof AniLinkError) {
        switch (error.code) {
            case AniLinkErrorCodes.AUTH:
                break; // re-authenticate
            case AniLinkErrorCodes.TIMEOUT:
                break; // tighten timeout or retry
            default:
                break;
        }
    }
}
```

`AniLinkErrorCodes` is a const object; `AniLinkErrorCode` is its union type. Branch on `instanceof` first for class-specific fields (`status`, `rateLimit`, `graphqlErrors`, `timeoutMs`), then on `code` to handle every case.

## Key type exports

The library exports the types behind these patterns. Import them for your own signatures:

| Type                                                  | Purpose                                                                                                |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `AniListApi`                                          | The composed AniList type at `aniLink.anilist` (queries, page queries, mutations, `custom()`, helpers) |
| `MyAnimeListApi`                                      | The composed MAL type at `aniLink.mal` (`anime`, `user`)                                               |
| `ProviderId`                                          | The `"anilist" \| "mal"` union that keys the credential slots and provider registry                    |
| `ProviderClients` / `ProviderFactory`                 | The composed client shape and per-provider factory signature                                           |
| `AniLinkCredentials`                                  | The per-provider credentials object the constructor accepts                                            |
| `ProviderCredentials` / `ResolvedProviderCredentials` | Base credential slot and its normalized resolver output                                                |
| `RequestAuth` / `RequestAuthInput`                    | The bearer token or headers the library applies to requests                                            |
| `PaginateOptions` / `ChunkPaginateOptions`            | Option objects for the pagination helpers                                                              |
| `PaginateResult` / `ChunkPaginateResult`              | Buffered results from `paginate` and `paginateChunks`                                                  |
| `RateLimitInfo`                                       | The `limit`/`remaining`/`reset` object on `AniLinkApiError.rateLimit`                                  |

```typescript
import type { ProviderId, PaginateOptions, RateLimitInfo } from "anilink-api-wrapper";

const provider: ProviderId = "anilist";
const opts: PaginateOptions = { perPage: 50, concurrency: 4 };
```

## Credential typing

Each constructor overload enforces its own credential shape:

```typescript
// Positional form: a string token, then AniLinkOptions
new AniLink("token", { timeout: 5_000 });

// Per-provider form: the compiler checks each slot against its provider's credential type
new AniLink({
    anilist: { authToken: "t" }, // AniListCredentials
    mal: { accessToken: "m", clientId: "c" }, // MalCredentials
});
```

Pass a MAL field into the `anilist` slot, or an AniList field into the `mal` slot, and the compiler catches it because the slots are distinct types.

## Generic `custom()` typing

`anilist.custom()` is generic over the response shape you declare:

```typescript
interface MyViewer {
    Viewer: { id: number; name: string };
}

const result = await aniLink.anilist.custom<MyViewer>("query { Viewer { id name } }");
console.log(result.Viewer.id);
```

See [Custom queries](/guides/anilist/custom-queries) for the envelope-unwrapping rule.

## Next steps

- <Icon name="ArrowRight" :size="14" /> [Operation reference](/operations/index) documents per-operation variable and response types.
- <Icon name="ArrowRight" :size="14" /> [Error handling](/error-handling) has the full error class reference.
