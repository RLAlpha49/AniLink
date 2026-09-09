---
title: Troubleshooting & FAQ
layout: .vitepress/theme/DocsLayout.vue
---

# Troubleshooting & FAQ

Symptom → cause → fix, labelled by provider. Skim for what hurts; the answer is probably here.

## 401 Unauthorized

**AniList** — the token is missing, expired, or revoked. Mutations and viewer-scoped queries want a token; public queries do not. Fix: re-run the [OAuth flow](/guides/anilist/authentication) and construct a new client with the fresh token.

**MAL** — the access token expired, and MAL tokens are short-lived by design. Fix: refresh with `refreshMalAccessToken` before expiry. See the [token-refresh recipe](/recipes#background-token-refresh-loop).

## 429 Too Many Requests

Both providers rate limit — that is their nature. AniLink's default retry policy already retries `429` with backoff and honors `Retry-After`. If a `429` still reaches you:

- You disabled retries (`retry: false`) — re-enable or catch `AniLinkApiError` and check `error.rateLimit?.reset`.
- Your volume is high — enable `paceWithRateLimit` so the client waits before hitting the limit.

## Timeouts

`TIMEOUT_ERROR` means the request outlived `timeout` (default 30000 ms). Fix: raise `timeout` for slow endpoints, or pass a per-request `timeout`. `0` disables the timeout entirely — use with care.

## Invalid fields (MAL)

MAL answers `400` when `fields` contains a name it does not recognize. Field names are MAL's own — see the [MAL API v2 schema](https://myanimelist.net/apiconfig/references/api/v2). AniLink passes `fields` through verbatim, so the fix is on your side of the keyboard.

## Missing provider credentials

`AniLinkAuthError` with no request sent means the operation wanted a token that was never configured — calling `mal.user.me()` without `mal.accessToken`, say, or an AniList mutation without `authToken`. Fix: supply the credential in the correct provider slot.

## Unexpected GraphQL envelope

`anilist.custom()` unwraps single-root-field documents to the bare value and returns the full `{ data }` envelope for multi-root documents. Seeing an unexpected shape? Count your document's root fields. See [Custom queries](/guides/anilist/custom-queries).

## FAQ

**Does one client share tokens between providers?** No. Credential slots are isolated — that is the whole design. See [Provider configuration](/provider-configuration).

**Are mutations retried?** Not by default. Opt in explicitly. See [Retries & resilience](/retries-and-resilience).

**Does AniLink normalize AniList and MAL data?** No. Cross-provider mapping is your code's job — by design, not neglect.

**Where are exact types documented?** The [TypeDoc API reference](/typedoc/AniLink.html). The [operation reference](/operations/index) links each operation to its TypeDoc page.
