---
title: Introduction
description: "AniLink is one class that exposes the typed anilist and mal APIs side by side. Both use one calling convention. Operations with inputs take (params, options?) and the parameterless reads take (options?). This page covers the providers, protocols, and namespaces."
layout: .vitepress/theme/DocsLayout.vue
---

# Introduction

`AniLink` is a typed TypeScript client for AniList and MyAnimeList. Each instance exposes both providers:

| Provider          | Protocol | Namespace         | What it includes                                                                                                                                                                             |
| ----------------- | -------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AniList           | GraphQL  | `aniLink.anilist` | Queries, page queries, mutations, pagination helpers, `custom()`, data helpers                                                                                                               |
| MyAnimeList (MAL) | REST     | `aniLink.mal`     | Anime and manga lookups, discovery reads (`seasonal`, `ranking`, `suggestions`), paginated user-list reads (`user.animeList`, `user.mangaList`), list-status updates and removals, `user.me` |

Both providers use the same transport layer for timeouts, retries, pacing, circuit breaking, hooks, and error normalization. Their credentials stay separate. AniLink never sends a MAL access token to AniList or an AniList bearer token to MAL.

<script setup>
import architectureOverview from "./diagrams/architecture-overview.mmd?raw";
</script>

<Mermaid :code="architectureOverview" />

## Why AniLink exists

Calling AniList or MAL directly means handling HTTP, GraphQL documents, OAuth flows, retries, and rate limits yourself. AniLink provides typed operations for both providers:

- **Typed operations.** Provider schemas generate typed variables and responses for every operation. Hover over a call to see the types in your editor.
- **One calling convention.** Operations with inputs take a typed params object and an optional trailing options object: `(params, options?)`. Parameterless reads such as `mal.user.me(options?)` and `mal.anime.suggestions(options?)` take only the options object. AniList params are its GraphQL variables. MAL params provide path, query, and body inputs. The `fields` option selects the response shape for both providers.
- **Normalized errors.** AniLink wraps provider failures in `AniLinkError` subclasses with stable `code` values. Classify failures without parsing messages.
- **Built-in resilience.** Both providers use the same retry policy with jittered backoff. You can enable rate-limit pacing and the circuit breaker for either provider.
- **Provider isolation.** Each provider slot has its own credentials and transport settings.

## Where to go next

- <Icon name="ArrowRight" :size="14" /> [Getting started](/getting-started) covers installing the client and making your first calls.
- <Icon name="ArrowRight" :size="14" /> [Operation reference](/operations/index) documents the full request and response structure of every operation.
- <Icon name="ArrowRight" :size="14" /> [API reference](/typedoc/modules/AniLink.html) lists the exact TypeDoc signatures.
