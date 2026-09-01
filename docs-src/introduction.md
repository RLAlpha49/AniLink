---
title: Introduction
layout: .vitepress/theme/DocsLayout.vue
---

# Introduction

AniLink is a typed TypeScript client for two anime-database APIs. One class, `AniLink`, composes two independent provider surfaces:

| Provider              | Protocol | Namespace         | What it offers                                                                 |
| --------------------- | -------- | ----------------- | ------------------------------------------------------------------------------ |
| **AniList**           | GraphQL  | `aniLink.anilist` | Queries, page queries, mutations, pagination helpers, `custom()`, data helpers |
| **MyAnimeList (MAL)** | REST     | `aniLink.mal`     | `anime.get` and `user.me` REST reads with field selection                      |

The two surfaces share a transport layer (timeouts, retries, pacing, circuit breaker, hooks, error normalization) but never share credentials. A MAL access token is never sent to AniList. An AniList bearer token is never sent to MAL.

<Mermaid
    :code="`flowchart TB\n    subgraph client[AniLink instance]\n        direction TB\n        al[anilist surface\nGraphQL] --- mal[mal surface\nREST]\n    end\n\n    subgraph transport[Shared transport layer]\n        direction LR\n        to[Timeouts] --- re[Retries] --- pa[Pacing] --- cb[Circuit breaker] --- ho[Hooks] --- en[Error normalization]\n    end\n\n    al --> transport\n    mal --> transport\n\n    subgraph creds[Credentials — isolated per slot]\n        alcred[anilist: authToken]:::iso\n        malcred[mal: accessToken]:::iso\n    end\n\n    al -.->|uses only| alcred\n    mal -.->|uses only| malcred\n    alcred -.->|never sent to| mal\n    malcred -.->|never sent to| al\n\n    classDef iso fill:#e1d5e7,stroke:#9673a6,color:#3b3a45;`"
/>

## Why AniLink exists

Calling AniList or MAL directly means hand-rolling HTTP, GraphQL documents, OAuth flows, retry logic, and rate-limit handling. AniLink does that once, with types:

- **Typed operations.** Every operation has typed variables and a typed response, generated from the provider schemas.
- **Normalized errors.** Provider failures become `AniLinkError` subclasses with stable `code` values, so you classify failures without parsing messages.
- **Resilience built in.** Retries with jittered backoff, optional rate-limit pacing, and an optional circuit breaker work identically on both providers.
- **Provider isolation.** Credentials and transport settings are scoped per provider slot.

## When to use `custom()`

`anilist.custom()` (AniList only) sends a raw GraphQL document you write yourself. Use it when you need a field combination the typed operations do not expose. MAL has no equivalent — the MAL surface is fixed REST operations.

## How to choose a provider

- Need rich anime/manga metadata, lists, activity, or social features? **AniList** — it has the large GraphQL surface.
- Need data from a user's MyAnimeList account or MAL anime details? **MAL** — currently `anime.get` and `user.me` only.
- Need both? Compose them in one client and keep each provider's credentials in its own slot. See [Provider configuration](/provider-configuration).

## Where to go next

- <Icon name="ArrowRight" :size="14" /> [Getting started](/getting-started) — install and make your first calls.
- <Icon name="ArrowRight" :size="14" /> [Operation reference](/operations/index) — look up any operation's full request/response anatomy.
- <Icon name="ArrowRight" :size="14" /> [API reference](/typedoc/AniLink.html) — exact TypeDoc signatures.
