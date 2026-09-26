---
title: Privacy
description: "How the AniLink docs site handles analytics. GA4 measurement stays off until you press Accept in the consent banner, and declining clears analytics cookies."
layout: .vitepress/theme/DocsLayout.vue
---

# Privacy

This page explains what the AniLink documentation site does, and does not do, with your data.

Last updated: September 26, 2026.

## Analytics

The site uses Google Analytics 4 to understand which pages visitors read and how they find the docs. Measurement is **off by default**:

- Every GA4 consent signal (`analytics_storage`, `ad_storage`, `ad_user_data`, `ad_personalization`) starts as **denied**.
- The site does not even fetch the analytics library from Google until you press **Accept** in the consent banner. If you never accept, the site makes no analytics request at all.
- The site sets no analytics cookies and sends no measurement hits until you accept.
- The site stores your choice in your browser's localStorage under the `anilink-analytics-consent` key. The choice stays valid for 12 months, after which the banner reappears so you can revisit it.
- Declining or ignoring the banner leaves measurement off. Declining later also deletes any `_ga` cookies set while consent was granted. If you had previously accepted, the already-loaded analytics library may still send cookieless, identifier-free pings after you decline. These pings set no cookies and cannot identify you across visits.
- Accepting grants **analytics only**. The advertising signals (`ad_storage`, `ad_user_data`, `ad_personalization`) stay permanently denied because the docs run no ads and build no personalization profiles.
- When your browser reports Global Privacy Control (`navigator.globalPrivacyControl === true`),
  the site treats it as a refusal. GA4 stays off, the site removes `_ga` cookies, and the
  consent banner stays closed even if localStorage contains an earlier acceptance. The site
  does not load the analytics library while the signal is active.

## Fonts

The docs load their typefaces from Google Fonts: Shippori Mincho, Zen Old Mincho, IBM Plex Sans, and JetBrains Mono. The stylesheet comes from fonts.googleapis.com and the font files from fonts.gstatic.com. These requests happen on every page load, before any consent choice, because the fonts are part of the page's layout. This keeps text styled from first paint. As with any network request, they expose your IP address and browser metadata to Google. The font requests use no cookies or application storage, but your browser may cache the downloaded stylesheet and font files.

## What is not collected

- No advertising or personalization profiles.
- No cross-site tracking.
- No account data: the docs never ask for, receive, or store AniList or MyAnimeList credentials.

## Other browser storage

The docs site also stores two strictly necessary, analytics-free preferences in localStorage:

| Key                     | Purpose                                                            |
| ----------------------- | ------------------------------------------------------------------ |
| `anilink-docs-theme`    | Remembers your light/dark theme choice.                            |
| `anilink-search-recent` | Stores up to five queries locally on the main docs site.           |

On the main docs site, select **Clear** beside **Recent searches** to remove saved queries from localStorage. The API-reference search does not save recent queries.

Your browser stores the semantic-search model weights in the Cache API so repeat searches do not re-download the model. That cache contains no personal data. When the fetches happen depends on which part of the docs you use. The API reference loads the embedding library from cdn.jsdelivr.net and the model weights from the Hugging Face CDN when you open its search dialog, before you type anything. The main docs site loads only its small first-party search index when you open the search dialog and defers the library and model weights until you submit your first search. Your search queries and the document content stay in your browser, and the model runs entirely there. As with any network request, however, both CDN providers receive standard request metadata such as your IP address and browser information.

## Contact

Questions about this page? Open an issue at [github.com/RLAlpha49/AniLink/issues](https://github.com/RLAlpha49/AniLink/issues).
