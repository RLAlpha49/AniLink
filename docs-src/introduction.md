---
title: Introduction
description: "AniLink is one class that exposes the typed anilist and mal APIs side by side. Both use one calling convention. Operations with inputs take (params, options?) and the parameterless reads take (options?). This page covers the providers, protocols, and namespaces."
layout: .vitepress/theme/DocsLayout.vue
---

# Introduction

AniLink is a typed TypeScript client for AniList and MyAnimeList. One class, `AniLink`, gives you both providers side by side:

| Provider          | Protocol | Namespace         | What it includes                                                                                                                                                                             |
| ----------------- | -------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AniList           | GraphQL  | `aniLink.anilist` | Queries, page queries, mutations, pagination helpers, `custom()`, data helpers                                                                                                               |
| MyAnimeList (MAL) | REST     | `aniLink.mal`     | Anime and manga lookups, discovery reads (`seasonal`, `ranking`, `suggestions`), paginated user-list reads (`user.animeList`, `user.mangaList`), list-status updates and removals, `user.me` |

The two APIs share one transport layer: timeouts, retries, pacing, circuit breaker, hooks, and error normalization. But they never share credentials. AniLink never sends a MAL access token to AniList. It never sends an AniList bearer token to MAL.

<Mermaid
    :code="`flowchart TB\n    subgraph client[AniLink instance]\n        direction TB\n        al[anilist API\nGraphQL] --- mal[mal API\nREST]\n    end\n\n    subgraph transport[Shared transport layer]\n        direction LR\n        to[Timeouts] --- re[Retries] --- pa[Pacing] --- cb[Circuit breaker] --- ho[Hooks] --- en[Error normalization]\n    end\n\n    al --> transport\n    mal --> transport\n\n    subgraph creds[Credentials, isolated per slot]\n        alcred[anilist: authToken]:::iso\n        malcred[mal: accessToken]:::iso\n    end\n\n    al -.->|uses only| alcred\n    mal -.->|uses only| malcred\n    alcred -.->|never sent to| mal\n    malcred -.->|never sent to| al\n\n    classDef iso fill:#e1d5e7,stroke:#9673a6,color:#3b3a45;`"
/>

## Why AniLink exists

Call AniList or MAL directly and you end up hand-rolling HTTP, GraphQL documents, OAuth flows, retry logic, and rate-limit handling. You write the same code twice. AniLink implements it once, with types:

- **Typed operations.** Every operation has typed variables and a typed response, generated from the provider schemas. Hover a call and your editor shows those types.
- **One calling convention.** Every operation with inputs takes one typed params object and one optional trailing options object, `(params, options?)`. The parameterless reads, `mal.user.me(options?)` and `mal.anime.suggestions(options?)`, take the options object alone. Both providers use the same convention. AniList params are its GraphQL variables; MAL params are its path, query, and body inputs. `fields` selects the response shape on both.
- **Normalized errors.** Provider failures become `AniLinkError` subclasses with stable `code` values, so you classify failures without parsing messages.
- **Built-in resilience.** Retries with jittered backoff, optional rate-limit pacing, and an optional circuit breaker work identically on both providers.
- **Provider isolation.** Credentials and transport settings stay scoped to their provider slot.

## Where to go next

- <Icon name="ArrowRight" :size="14" /> [Getting started](/getting-started) covers installing the client and making your first calls.
- <Icon name="ArrowRight" :size="14" /> [Operation reference](/operations/index) documents the full request and response structure of every operation.
- <Icon name="ArrowRight" :size="14" /> [API reference](/typedoc/modules/AniLink.html) lists the exact TypeDoc signatures.
