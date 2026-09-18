---
title: Introduction
description: "What AniLink is: one AniLink class exposing the typed anilist and mal APIs side by side. Both use one calling convention, (params, options?) for operations with inputs and (options?) for the parameterless reads. Includes a provider, protocol, and namespace overview."
layout: .vitepress/theme/DocsLayout.vue
---

# Introduction

AniLink is a typed TypeScript client for the two big anime databases. One class, `AniLink`, gives you both providers side by side:

| Provider              | Protocol | Namespace         | What it offers                                                                                                                |
| --------------------- | -------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **AniList**           | GraphQL  | `aniLink.anilist` | Queries, page queries, mutations, pagination helpers, `custom()`, data helpers                                                |
| **MyAnimeList (MAL)** | REST     | `aniLink.mal`     | Anime and manga lookups, discovery reads (`seasonal`, `ranking`, `suggestions`), paginated user-list reads (`user.animeList`, `user.mangaList`), list-status updates and removals, `user.me` |

The two APIs share one transport layer: timeouts, retries, pacing, circuit breaker, hooks, and error normalization. But they never share credentials. A MAL access token is never sent to AniList. An AniList bearer token is never sent to MAL.

<Mermaid
    :code="`flowchart TB\n    subgraph client[AniLink instance]\n        direction TB\n        al[anilist API\nGraphQL] --- mal[mal API\nREST]\n    end\n\n    subgraph transport[Shared transport layer]\n        direction LR\n        to[Timeouts] --- re[Retries] --- pa[Pacing] --- cb[Circuit breaker] --- ho[Hooks] --- en[Error normalization]\n    end\n\n    al --> transport\n    mal --> transport\n\n    subgraph creds[Credentials, isolated per slot]\n        alcred[anilist: authToken]:::iso\n        malcred[mal: accessToken]:::iso\n    end\n\n    al -.->|uses only| alcred\n    mal -.->|uses only| malcred\n    alcred -.->|never sent to| mal\n    malcred -.->|never sent to| al\n\n    classDef iso fill:#e1d5e7,stroke:#9673a6,color:#3b3a45;`"
/>

## Why AniLink exists

Call AniList or MAL directly and you soon find yourself hand-rolling HTTP, GraphQL documents, OAuth flows, retry logic, and rate-limit handling. You write the same code twice. AniLink implements it once, with types:

- **Typed operations.** Every operation has typed variables and a typed response, generated from the provider schemas. Hover a call and your editor shows those types.
- **One calling convention.** Every operation with inputs takes one typed params object and one optional trailing options object, `(params, options?)`. The parameterless reads, `mal.user.me(options?)` and `mal.anime.suggestions(options?)`, take the options object alone. Learn it once, use it on both providers. AniList params are its GraphQL variables; MAL params are its path, query, and body inputs. `fields` selects the response shape on both.
- **Normalized errors.** Provider failures become `AniLinkError` subclasses with stable `code` values, so you classify failures without parsing messages.
- **Resilience built in.** Retries with jittered backoff, optional rate-limit pacing, and an optional circuit breaker work identically on both providers.
- **Provider isolation.** Credentials and transport settings stay scoped to their provider slot.

## How to choose a provider

- Want rich anime and manga metadata, lists, activity, or social features? Use **AniList**. Its GraphQL API is the larger one.
- Want data from a user's MyAnimeList account, or MAL anime and manga details? Use **MAL**. Its focused REST API covers lookups, discovery reads, user-list reads, list-status updates, and `user.me`.
- Need both? Compose them in one client and keep each provider's credentials in its own slot. [Provider configuration](/provider-configuration) explains the rules.

## Where to go next

- <Icon name="ArrowRight" :size="14" /> [Getting started](/getting-started) covers installing the client and making your first calls.
- <Icon name="ArrowRight" :size="14" /> [Operation reference](/operations/index) documents the full request and response anatomy of every operation.
- <Icon name="ArrowRight" :size="14" /> [API reference](/typedoc/modules/AniLink.html) lists the exact TypeDoc signatures.
