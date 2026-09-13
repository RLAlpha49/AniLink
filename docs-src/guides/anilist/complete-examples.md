---
title: Complete examples
description: "Flagship AniList operations with every variable filled out."
layout: .vitepress/theme/DocsLayout.vue
---

# Complete examples

The flagship operations with **every** variable filled out — the full surface at a glance. Every property below is optional unless the type says otherwise, so real calls pass only what they need.

## query.media — all 70 variables

```typescript
await aniLink.anilist.query.media({
    id: 123,
    idMal: 21,
    id_not: 1,
    id_in: [1, 2, 3],
    id_not_in: [4, 5],
    idMal_not: 22,
    idMal_in: [21, 30],
    idMal_not_in: [40],
    type: "ANIME",
    format: "TV",
    format_in: ["TV", "MOVIE"],
    format_not: "MUSIC",
    format_not_in: ["SPECIAL"],
    status: "FINISHED",
    status_in: ["RELEASING", "FINISHED"],
    status_not: "NOT_YET_RELEASED",
    status_not_in: ["CANCELLED"],
    episodes: 12,
    episodes_greater: 1,
    episodes_lesser: 100,
    duration: 24,
    duration_greater: 20,
    duration_lesser: 90,
    chapters: 50,
    chapters_greater: 10,
    chapters_lesser: 500,
    volumes: 5,
    volumes_greater: 1,
    volumes_lesser: 20,
    season: "WINTER",
    seasonYear: 2026,
    startDate: 20260101,
    startDate_greater: 20251001,
    startDate_lesser: 20260401,
    startDate_like: "2026",
    endDate: 20260331,
    endDate_greater: 20260101,
    endDate_lesser: 20261231,
    endDate_like: "2026",
    isAdult: false,
    genre: "Action",
    genre_in: ["Action", "Comedy"],
    genre_not_in: ["Horror"],
    tag: "Isekai",
    tag_in: ["Isekai", "Time Loop"],
    tag_not_in: ["NTR"],
    minimumTagRank: 60,
    tagCategory: "Theme",
    tagCategory_in: ["Theme", "Content"],
    tagCategory_not_in: ["Technical"],
    onList: true,
    licensedBy: "Crunchyroll",
    licensedBy_in: ["Crunchyroll", "Netflix"],
    licensedById: 102,
    licensedById_in: [102, 137],
    isLicensed: true,
    averageScore: 80,
    averageScore_not: 50,
    averageScore_greater: 70,
    averageScore_lesser: 90,
    popularity: 100000,
    popularity_not: 999,
    popularity_greater: 50000,
    popularity_lesser: 500000,
    source: "ORIGINAL",
    source_in: ["ORIGINAL", "MANGA"],
    countryOfOrigin: "JP",
    search: "Frieren",
    sort: ["POPULARITY_DESC", "SCORE_DESC"],
    asHtml: false,
});
```

## query.mediaListCollection — all 24 variables

```typescript
await aniLink.anilist.query.mediaListCollection({
    userId: 542244,
    type: "ANIME",
    status: "COMPLETED",
    status_in: ["CURRENT", "PLANNING"],
    status_not: "DROPPED",
    status_not_in: ["PAUSED"],
    notes: "rewatch",
    notes_like: "%cozy%",
    startedAt: 20260101,
    startedAt_greater: 20250101,
    startedAt_lesser: 20261231,
    startedAt_like: "2026",
    completedAt: 20260901,
    completedAt_greater: 20260101,
    completedAt_lesser: 20261231,
    completedAt_like: "2026",
    forceSingleCompletedList: true,
    chunk: 1,
    perChunk: 500,
    sort: ["SCORE_DESC"],
    scoreFormat: "POINT_10",
    asArray: true,
    asHtml: false,
});
```

## query.user — all 10 variables

```typescript
await aniLink.anilist.query.user({
    id: 542244,
    name: "Frieren",
    isModerator: false,
    search: "somebody",
    sort: [],
    asHtml: false,
    animeStatLimit: 20,
    mangaStatLimit: 20,
    animeStatSort: ["COUNT"],
    mangaStatSort: ["COUNT"],
});
```

## mutation.saveMediaListEntry — all 16 variables

```typescript
await aniLink.anilist.mutation.saveMediaListEntry({
    id: 123456,
    mediaId: 21,
    status: "CURRENT",
    score: 9.5,
    scoreRaw: 95,
    progress: 12,
    progressVolumes: 3,
    repeat: 1,
    priority: 1,
    private: false,
    notes: "cozy rewatch",
    hiddenFromStatusLists: false,
    customLists: ["Winter 2026"],
    advancedScores: { story: 90, characters: 95 },
    startedAt: { year: 2026, month: 1, day: 15 },
    completedAt: { year: 2026, month: 3, day: 31 },
});
```

## mutation.updateUser — all 16 variables

```typescript
await aniLink.anilist.mutation.updateUser({
    about: "bio text",
    titleLanguage: "ROMAJI",
    displayAdultContent: false,
    airingNotifications: true,
    scoreFormat: "POINT_10_DECIMAL",
    rowOrder: "score",
    profileColor: "blue",
    donatorBadge: "Akatsuki",
    notificationOptions: { type: "AIRING", enabled: true },
    timezone: "America/New_York",
    activityMergeTime: 60,
    animeListOptions: {
        sectionOrder: ["watching"],
        splitCompletedSectionByFormat: true,
        customLists: ["Winter 2026"],
        advancedScoring: ["story", "characters"],
        advancedScoringEnabled: true,
        theme: "default",
    },
    mangaListOptions: {
        sectionOrder: ["reading"],
        splitCompletedSectionByFormat: true,
        customLists: ["Manga 2026"],
        advancedScoring: ["story"],
        advancedScoringEnabled: false,
        theme: "default",
    },
    staffNameLanguage: "ROMAJI_WESTERN",
    restrictMessagesToFollowing: false,
    disabledListActivity: { disabled: false, type: "CURRENT" },
});
```

## query.page.medias — page + perPage plus the media filters

```typescript
await aniLink.anilist.query.page.medias({
    page: 1,
    perPage: 20,
    search: "Frieren",
    type: "ANIME",
    sort: ["POPULARITY_DESC"],
});
```

## Selecting fields

Field-aware single-entity queries — those whose signature lists a `fields` option — accept it to request only what you need; the return type narrows to your selection plus the always-selected keys:

```typescript
const slim = await aniLink.anilist.query.media(
    { id: 123 },
    { fields: ["id", "title", "averageScore"] }
);
// slim: DeepPick<MediaResponse, "id" | "title" | "averageScore" | "idMal">
```

See [Field selection](/guides/anilist/field-selection) for the nested path rules, the always-selected `id`, and when to use `aniLink.anilist.custom()` instead.
