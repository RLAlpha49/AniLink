---
title: Complete examples
description: "Every MyAnimeList operation with its complete params object filled out."
layout: .vitepress/theme/DocsLayout.vue
---

# Complete examples

This page shows every MAL operation with **every** param filled in. Every optional property below can be omitted in real calls; pass only what you need.

## Anime reads

```typescript
await aniLink.mal.anime.get({ id: 21 });

await aniLink.mal.anime.search({
    q: "one piece", // required
    limit: 100, // optional, max 100
    offset: 0,
});

await aniLink.mal.anime.seasonal({
    year: 2026, // required
    season: "winter", // required: "winter" | "spring" | "summer" | "fall"
});

await aniLink.mal.anime.ranking({
    rankingType: "all", // required: "all" | "airing" | "upcoming" | "tv" | "ova"
    //                       | "movie" | "special" | "bypopularity" | "favorite"
});

await aniLink.mal.anime.suggestions(); // no params, authenticated read
```

## Anime list write

```typescript
// id required, every payload field optional
await aniLink.mal.anime.updateMyListStatus({
    id: 21,
    status: "watching", // "watching" | "completed" | "on_hold" | "dropped" | "plan_to_watch"
    num_watched_episodes: 5,
    score: 8, // 0-10
    start_date: "2026-01-15", // partial dates OK: "2026-01" or "2026"
    finish_date: "2026-09-01",
    comments: "rewatching with a friend",
    is_rewatching: true,
    num_times_rewatched: 2,
    rewatch_value: 3, // 0-5
    priority: 1, // 0-2
    tags: ["cozy", "winter-2026"],
});

await aniLink.mal.anime.deleteFromList({ id: 21 });
```

## Manga

Same shape with manga fields:

```typescript
await aniLink.mal.manga.get({ id: 1 });

await aniLink.mal.manga.search({
    q: "berserk", // required
    limit: 100, // optional, max 100
    offset: 0,
});

await aniLink.mal.manga.ranking({
    rankingType: "manga", // required: "all" | "manga" | "novels" | "oneshots"
    //                        | "doujin" | "manhwa" | "manhua" | "bypopularity" | "favorite"
});

await aniLink.mal.manga.updateMyListStatus({
    id: 1,
    status: "reading", // "reading" | "completed" | "on_hold" | "dropped" | "plan_to_read"
    num_chapters_read: 45,
    num_volumes_read: 5,
    score: 9,
    start_date: "2026-02-01",
    finish_date: "2026-08-01",
    comments: "",
    is_rereading: false,
    num_times_reread: 0,
    reread_value: 0,
    priority: 0,
    tags: [],
});

await aniLink.mal.manga.deleteFromList({ id: 1 });
```

## User

```typescript
await aniLink.mal.user.me();

await aniLink.mal.user.get({
    username: "@me", // required. MyAnimeList documents only "@me" here
});

await aniLink.mal.user.animeList({
    username: "@me", // required: "@me" (authenticated) or any MAL username
    status: "watching", // optional filter
    sort: "list_score", // "list_score" | "list_updated_at" | "anime_title"
    //                        | "anime_start_date" | "anime_id"
    limit: 100, // default 100, max 1000
    offset: 0,
});

await aniLink.mal.user.mangaList({
    username: "@me",
    status: "reading",
    sort: "list_score", // "list_score" | "list_updated_at" | "manga_title"
    //                        | "manga_start_date" | "manga_id"
    limit: 100,
    offset: 0,
});
```

## Forum

```typescript
await aniLink.mal.forum.boards(); // no params

await aniLink.mal.forum.topics({
    boardId: 5, // optional, limit to one board
    subboardId: 0, // optional, limit to one subboard
    q: "one piece", // optional, filter topic titles
    topicUserName: "someuser", // optional, topics created by a user
    userName: "someuser", // optional, topics with posts by a user
    sort: "recent", // "recent" is the only documented sort
    limit: 100, // optional, max 100
    offset: 0,
});

await aniLink.mal.forum.topic({
    id: 23744, // required: the topic ID
    limit: 100, // optional, max 100. Pages through the topic's posts
    offset: 0,
});
```

## Trailing options

Every operation accepts the same options object. It has `fields` to select the response shape, plus the transport settings shared with AniList. Operations with inputs take it after params; zero-parameter operations such as `anime.suggestions()` and `user.me()` take it as their first argument:

```typescript
await aniLink.mal.anime.get(
    { id: 21 },
    {
        fields: ["id", "title", "main_picture"],
        timeout: 8_000,
        retry: false,
        signal: undefined,
    }
);

// Zero-parameter operations take the options object as their first argument:
await aniLink.mal.anime.suggestions({
    fields: ["id", "title", "main_picture"],
    timeout: 8_000,
});
```

See [Per-request options](/per-request-options) for the full options table.
