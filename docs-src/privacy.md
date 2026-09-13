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

## Fonts

The docs load their typefaces — Shippori Mincho, Zen Old Mincho, IBM Plex Sans, and JetBrains Mono — from Google Fonts: the stylesheet from fonts.googleapis.com and the font files from fonts.gstatic.com. These requests happen on every page load, before any consent choice, because the fonts are part of the page's layout and load with the page itself so text renders styled from first paint. As with any network request, they expose your IP address and browser metadata to Google. The font requests use no cookies or application storage, but your browser may cache the downloaded stylesheet and font files.

## What is not collected

- No advertising or personalization profiles.
- No cross-site tracking.
- No account data: the docs never ask for, receive, or store AniList or MyAnimeList credentials.

## Other browser storage

The docs site also stores two strictly-necessary, analytics-free preferences in localStorage:

| Key                     | Purpose                                                |
| ----------------------- | ------------------------------------------------------ |
| `anilink-docs-theme`    | Remembers your light/dark theme choice.                |
| `anilink-search-recent` | Remembers your last five search queries, locally only. |

The semantic-search model weights are cached by your browser (Cache API) so repeat searches do not re-download the model. That cache contains no personal data. When the fetches happen depends on the surface: the API reference loads the embedding library (from cdn.jsdelivr.net) and the model weights (from the Hugging Face CDN) when you open its search dialog, before you type anything; the main docs site loads only its small first-party search index when you open the search dialog and defers the library and model weights until your first submitted search. Your search queries and the document content stay in your browser, and the model runs entirely there; as with any network request, however, both CDN providers receive standard request metadata such as your IP address and browser information.

## Contact

Questions about this page? Open an issue at [github.com/RLAlpha49/AniLink/issues](https://github.com/RLAlpha49/AniLink/issues).
