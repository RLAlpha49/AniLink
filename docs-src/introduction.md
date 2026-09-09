---
title: Introduction
layout: .vitepress/theme/DocsLayout.vue
---

# Introduction

AniLink is a typed TypeScript client for the two big anime databases. One class — `AniLink` — hands you both providers side by side:

| Provider              | Protocol | Namespace         | What it offers                                                                 |
| --------------------- | -------- | ----------------- | ------------------------------------------------------------------------------ |
| **AniList**           | GraphQL  | `aniLink.anilist` | Queries, page queries, mutations, pagination helpers, `custom()`, data helpers |
| **MyAnimeList (MAL)** | REST     | `aniLink.mal`     | Anime and manga lookups, list-status updates and removals, `user.me`           |

The two surfaces share one transport layer — timeouts, retries, pacing, circuit breaker, hooks, error normalization — but they never share credentials. A MAL access token is never sent to AniList. An AniList bearer token is never sent to MAL. Your tokens stay in their lanes.

<Mermaid
    :code="`flowchart TB\n    subgraph client[AniLink instance]\n        direction TB\n        al[anilist surface\nGraphQL] --- mal[mal surface\nREST]\n    end\n\n    subgraph transport[Shared transport layer]\n        direction LR\n        to[Timeouts] --- re[Retries] --- pa[Pacing] --- cb[Circuit breaker] --- ho[Hooks] --- en[Error normalization]\n    end\n\n    al --> transport\n    mal --> transport\n\n    subgraph creds[Credentials — isolated per slot]\n        alcred[anilist: authToken]:::iso\n        malcred[mal: accessToken]:::iso\n    end\n\n    al -.->|uses only| alcred\n    mal -.->|uses only| malcred\n    alcred -.->|never sent to| mal\n    malcred -.->|never sent to| al\n\n    classDef iso fill:#e1d5e7,stroke:#9673a6,color:#3b3a45;`"
/>

## Why AniLink exists

Call AniList or MAL directly and you soon find yourself hand-rolling HTTP, GraphQL documents, OAuth flows, retry logic, and rate-limit handling — the same plumbing, twice. AniLink rolls it once, with types:

- **Typed operations.** Every operation has typed variables and a typed response, generated from the provider schemas. Hover a call and the shapes are just there.
- **Normalized errors.** Provider failures become `AniLinkError` subclasses with stable `code` values, so you classify failures without parsing messages.
- **Resilience built in.** Retries with jittered backoff, optional rate-limit pacing, and an optional circuit breaker work identically on both providers.
- **Provider isolation.** Credentials and transport settings stay scoped to their provider slot.

## When to use `custom()`

`anilist.custom()` (AniList only) sends a raw GraphQL document you write yourself. Reach for it when you need a field combination the typed operations do not expose. MAL has no equivalent — its surface is a fixed set of REST operations.

## How to choose a provider

- After rich anime and manga metadata, lists, activity, or social features? **AniList** — it has the large GraphQL surface.
- After data from a user's MyAnimeList account, or MAL anime and manga details? **MAL** — a focused REST surface: lookups, list-status updates, and `user.me`.
- Need both? Compose them in one client and keep each provider's credentials in its own slot. [Provider configuration](/provider-configuration) explains the rules.

## Where to go next

- <Icon name="ArrowRight" :size="14" /> [Getting started](/getting-started) — install and make your first calls.
- <Icon name="ArrowRight" :size="14" /> [Operation reference](/operations/index) — look up any operation's full request/response anatomy.
- <Icon name="ArrowRight" :size="14" /> [API reference](/typedoc/AniLink.html) — exact TypeDoc signatures.
