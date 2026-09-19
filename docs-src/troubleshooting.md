---
title: Troubleshooting & FAQ
description: "Symptom, cause, and fix rows grouped by provider. Covers auth, rate limits, and common AniLink setup mistakes."
layout: .vitepress/theme/DocsLayout.vue
---

# Troubleshooting & FAQ

Each row gives the symptom, the cause, and the fix, labelled by provider. Skim the headings for your symptom.

## 401 Unauthorized

**AniList.** The token is missing, expired, or revoked. Mutations and viewer-scoped queries require a token; public queries do not. Configure `refreshToken`, `clientId`, and `clientSecret`. The client refreshes automatically on `401` (one replay, no loop). See [automatic refresh](/guides/anilist/authentication#_5-automatic-refresh). Otherwise re-run the [OAuth flow](/guides/anilist/authentication) and construct a new client with the fresh token. See the [token-refresh recipe](/recipes#background-token-refresh-loop).

**MAL.** The access token expired, and MAL tokens are short-lived by design. Configure `refreshToken` and `clientId`. The client refreshes automatically on `401` (one replay, no loop). See [automatic refresh](/guides/mal/authentication#_4-automatic-refresh). Otherwise refresh with `refreshMalAccessToken` before expiry. See the [token-refresh recipe](/recipes#background-token-refresh-loop).

## 429 Too Many Requests

Both providers rate limit. AniLink's default retry policy retries `429` with backoff and honors `Retry-After`. If you still see a `429`:

- You disabled retries (`retry: false`). Re-enable them, or catch `AniLinkApiError` and check `error.rateLimit?.reset`.
- You send more requests than the rate limit allows. Enable `paceWithRateLimit` so the client waits before it reaches the limit.

## Timeouts

`TIMEOUT_ERROR` means the request took longer than `timeout` (default 30000 ms). Raise `timeout` for slow endpoints, or pass a per-request `timeout`. `0` disables the timeout, so a stalled request can hang indefinitely.

## Invalid fields (MAL)

MAL returns `400` when `fields` contains a name it does not recognize. MAL defines the valid field names. See the [MAL API v2 schema](https://myanimelist.net/apiconfig/references/api/v2). AniLink passes `fields` through verbatim, so you must fix the field names yourself.

## Missing provider credentials

`AniLinkAuthError` with no request sent means the operation required a token you never configured. This happens when you call `mal.user.me()` without `mal.accessToken`, or run an AniList mutation without `authToken`. Supply the credential in the correct provider slot.

## Unexpected GraphQL envelope

`anilist.custom()` unwraps single-root-field documents to the bare value and returns the full `{ data }` envelope for multi-root documents. If you see an unexpected shape, count your document's root fields. See [Custom queries](/guides/anilist/custom-queries).

## FAQ

**Does one client share tokens between providers?** No. Each provider has its own credential slots. See [Provider configuration](/provider-configuration).

**Does AniLink retry mutations?** Not by default. Opt in explicitly. See [Retries & resilience](/retries-and-resilience).

**Does AniLink normalize AniList and MAL data?** No. Cross-provider mapping is your code's job.

**Where are exact types documented?** The [TypeDoc API reference](/typedoc/modules/AniLink.html). The [operation reference](/operations/index) links each operation to its TypeDoc page.
