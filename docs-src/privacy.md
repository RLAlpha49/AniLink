---
title: Privacy
description: "How the AniLink docs site handles analytics: GA4 measurement stays off until you accept in the consent banner, and declining clears analytics cookies."
layout: .vitepress/theme/DocsLayout.vue
---

# Privacy

This page explains what the AniLink documentation site does — and does not do — with your data.

## Analytics

The site uses Google Analytics 4 to understand which pages are read and how visitors find the docs. Measurement is **off by default**:

- Every GA4 consent signal (`analytics_storage`, `ad_storage`, `ad_user_data`, `ad_personalization`) starts as **denied**.
- The analytics library is not even fetched from Google until you press **Accept** in the consent banner; declining or ignoring the banner before ever accepting makes no analytics request at all.
- No analytics cookies are set and no measurement hits are sent until you accept.
- Your choice is stored in your browser under the `anilink-analytics-consent` key (localStorage) and stays valid for 12 months, after which the banner reappears so you can revisit it.
- Declining — or ignoring the banner — leaves measurement off. Declining later also deletes any `_ga` cookies that were set while consent was granted. If you had previously accepted, the already-loaded analytics library may still send cookieless, identifier-free pings after you decline; these pings set no cookies and cannot identify you across visits.
- Accepting grants **analytics only**: the advertising signals (`ad_storage`, `ad_user_data`, `ad_personalization`) stay permanently denied because the docs run no ads and build no personalization profiles.

## What is not collected

- No advertising or personalization profiles.
- No cross-site tracking.
- No account data: the docs never ask for, receive, or store AniList or MyAnimeList credentials.

## Other browser storage

The docs site also stores two strictly-necessary, analytics-free preferences in localStorage:

| Key | Purpose |
| --- | --- |
| `anilink-docs-theme` | Remembers your light/dark theme choice. |
| `anilink-search-recent` | Remembers your last five search queries, locally only. |

The semantic-search model weights are cached by your browser (Cache API) so repeat searches do not re-download the model. That cache contains no personal data. On your **first search**, the search runtime fetches the embedding library from cdn.jsdelivr.net and the model weights from the Hugging Face CDN. Your search queries and the document content stay in your browser, and the model runs entirely there; as with any network request, however, both CDN providers receive standard request metadata such as your IP address and browser information.

## Contact

Questions about this page? Open an issue at [github.com/RLAlpha49/AniLink/issues](https://github.com/RLAlpha49/AniLink/issues).
