---
title: Troubleshooting & FAQ
description: "Symptom, cause, and fix rows grouped by provider. Covers auth, rate limits, and common AniLink setup mistakes."
layout: .vitepress/theme/DocsLayout.vue
---

# Troubleshooting & FAQ

Rows list a symptom, its cause, and a fix. Check the provider label, then find your symptom under a heading.

## 401 Unauthorized

**AniList.** The token is missing, expired, or revoked. Mutations and viewer-scoped queries require a token. Public queries do not. Configure `refreshToken`, `clientId`, and `clientSecret`. AniLink refreshes automatically after a `401` and replays the request once. See [automatic refresh](/guides/anilist/authentication#_5-automatic-refresh). Otherwise, re-run the [OAuth flow](/guides/anilist/authentication) and create a new client with the fresh token. See the [token-refresh recipe](/recipes#background-token-refresh-loop).

**MAL.** MAL access tokens expire by design. Configure `refreshToken` and `clientId`. AniLink refreshes automatically after a `401` and replays the request once. See [automatic refresh](/guides/mal/authentication#_4-automatic-refresh). Otherwise, call `refreshMalAccessToken` before the token expires. See the [token-refresh recipe](/recipes#background-token-refresh-loop).

## 429 Too Many Requests

Both providers enforce rate limits. By default, AniLink retries `429` responses with backoff and honors `Retry-After`. If `429` responses continue:

- You disabled retries (`retry: false`). Re-enable them, or catch `AniLinkApiError` and check `error.rateLimit?.reset`.
- You send more requests than the rate limit allows. Enable `paceWithRateLimit` so the client waits before it reaches the limit.

## Timeouts

`TIMEOUT_ERROR` means the request exceeded its `timeout` (30000 ms by default). Increase the timeout for slow endpoints or set it per request. Setting it to `0` disables the timeout, so a stalled request can wait indefinitely.

## Invalid fields (MAL)

MAL returns `400` if `fields` contains an unsupported name. Check valid names in the [MAL API v2 schema](https://myanimelist.net/apiconfig/references/api/v2). AniLink passes `fields` through unchanged.

## Missing provider credentials

`AniLinkAuthError` before a request is sent means the operation requires a token that's missing from its provider configuration. For example, `mal.user.me()` requires `mal.accessToken`, and AniList mutations require `authToken`. Add the token to the correct provider slot.

## Unexpected GraphQL envelope

`anilist.custom()` unwraps single-root-field documents to the bare value and returns the full `{ data }` envelope for multi-root documents. If the result has an unexpected shape, count the document's root fields. See [Custom queries](/guides/anilist/custom-queries).

## FAQ

**Does one client share tokens between providers?** No. Each provider has its own credential slots. See [Provider configuration](/provider-configuration).

**Does AniLink retry mutations?** Not by default. You can opt in explicitly. See [Retries & resilience](/retries-and-resilience).

**Does AniLink normalize AniList and MAL data?** No. Map the data in your application.

**Where are exact types documented?** The [TypeDoc API reference](/typedoc/modules/AniLink.html). The [operation reference](/operations/index) links each operation to its TypeDoc page.
