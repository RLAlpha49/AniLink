---
title: Privacy
description: "How the AniLink docs site handles analytics. GA4 measurement stays off until you press Accept in the consent banner, and declining clears analytics cookies."
layout: .vitepress/theme/DocsLayout.vue
---

# Privacy

This page describes how the AniLink documentation site handles your data.

Last updated: September 26, 2026.

## Analytics

The site uses Google Analytics 4 (GA4) to track which pages visitors read and how they find the docs. Measurement is **off by default**:

- Every GA4 consent signal (`analytics_storage`, `ad_storage`, `ad_user_data`, `ad_personalization`) starts as **denied**.
- The site does not request the analytics library from Google until you select **Accept** in the consent banner. If you never accept, the site makes no analytics requests.
- Before you accept, the site sets no analytics cookies and sends no measurement hits.
- The site stores your choice in your browser's localStorage under the `anilink-analytics-consent` key. The choice stays valid for 12 months, after which the banner reappears so you can revisit it.
- If you decline or ignore the banner, measurement stays off. If you decline after accepting, the site deletes any `_ga` cookies set while consent was granted. The already-loaded library may still send cookieless, identifier-free pings after you decline. These pings set no cookies and cannot identify you across visits.
- Accepting grants **analytics only**. The advertising signals (`ad_storage`, `ad_user_data`, `ad_personalization`) stay permanently denied because the docs run no ads and build no personalization profiles.
- When your browser reports Global Privacy Control (`navigator.globalPrivacyControl === true`), the site treats it as a refusal. GA4 stays off, the site removes `_ga` cookies, and the consent banner stays closed even if localStorage contains an earlier acceptance. The site does not load the analytics library while the signal is active.

## Fonts

The docs load Shippori Mincho, Zen Old Mincho, IBM Plex Sans, and JetBrains Mono from Google Fonts. The browser requests the stylesheet from fonts.googleapis.com and the font files from fonts.gstatic.com on every page load, before you make a consent choice. These requests happen before consent because the fonts are part of the page layout, so the browser can style text on first paint. Google receives your IP address and browser metadata with these requests. Font requests use no cookies or application storage, though your browser may cache the stylesheet and font files.

## What is not collected

- No advertising or personalization profiles.
- No cross-site tracking.
- No account data: the docs never ask for, receive, or store AniList or MyAnimeList credentials.

## Other browser storage

The docs site also stores two strictly necessary, analytics-free preferences in localStorage:

| Key                     | Purpose                                                  |
| ----------------------- | -------------------------------------------------------- |
| `anilink-docs-theme`    | Remembers your light/dark theme choice.                  |
| `anilink-search-recent` | Stores up to five queries locally on the main docs site. |

On the main docs site, select **Clear** beside **Recent searches** to remove saved queries from localStorage. The API-reference search does not save recent queries.

Your browser stores semantic-search model weights in the Cache API so repeat searches do not download them again. The cache contains no personal data.

When the downloads occur depends on which search page you use. The API reference requests the embedding library from cdn.jsdelivr.net and model weights from the Hugging Face CDN when you open its search dialog, before you type. The main docs site requests only its small first-party search index when you open the dialog. It waits until you submit your first search to download the library and model weights. Your queries and document content stay in your browser, and the model runs there. Both CDN providers still receive standard request metadata, including your IP address and browser information.

## Contact

Questions about this page? Open an issue at [github.com/RLAlpha49/AniLink/issues](https://github.com/RLAlpha49/AniLink/issues).
