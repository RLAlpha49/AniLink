import { CoverImageSchema } from "../../CoverImage";
import { ImageSchema } from "../../Image";
import { NameSchema } from "../../Name";
import { TagSchema } from "../../Tag";
import { TitleSchema } from "../../Title";
import {
    UserAnimeStatsSchema,
    UserMangaStatsSchema,
    UserStatsSectionSchema,
} from "../../UserStats";

/**
 * `StatisticsAnimeSchema` is a string representing the GraphQL selection set for a user's anime statistics.
 * It includes the count, meanScore, standardDeviation, minutesWatched, episodesWatched, formats, statuses, scores, lengths, releaseYears, startYears, genres, tags, countries, voiceActors, staff, and studios.
 * @see https://docs.anilist.co/reference/object/userstatistics
 */
export const StatisticsAnimeSchema = `
    anime {
      count
      meanScore
      standardDeviation
      minutesWatched
      episodesWatched
      formats (limit: $animeStatLimit, sort: $animeStatSort) {
        ${UserAnimeStatsSchema}
        format
      }
      statuses (limit: $animeStatLimit, sort: $animeStatSort) {
        ${UserAnimeStatsSchema}
        status
      }
      scores (limit: $animeStatLimit, sort: $animeStatSort) {
        ${UserAnimeStatsSchema}
        score
      }
      lengths (limit: $animeStatLimit, sort: $animeStatSort) {
        ${UserAnimeStatsSchema}
        length
      }
      releaseYears (limit: $animeStatLimit, sort: $animeStatSort) {
        ${UserAnimeStatsSchema}
        releaseYear
      }
      startYears (limit: $animeStatLimit, sort: $animeStatSort) {
        ${UserAnimeStatsSchema}
        startYear
      }
      genres (limit: $animeStatLimit, sort: $animeStatSort) {
        ${UserAnimeStatsSchema}
        genre
      }
      tags (limit: $animeStatLimit, sort: $animeStatSort) {
        ${UserAnimeStatsSchema}
        tag {
          ${TagSchema}
        }
      }
      countries (limit: $animeStatLimit, sort: $animeStatSort) {
        ${UserAnimeStatsSchema}
        country
      }
      voiceActors (limit: $animeStatLimit, sort: $animeStatSort) {
        ${UserAnimeStatsSchema}
        voiceActor {
          id
          ${NameSchema}
        }
        characterIds
      }
      staff (limit: $animeStatLimit, sort: $animeStatSort) {
        ${UserAnimeStatsSchema}
        staff {
          id
          ${NameSchema}
        }
      }
      studios (limit: $animeStatLimit, sort: $animeStatSort) {
        ${UserAnimeStatsSchema}
        studio {
          id
          name
        }
      }
    }
`;

/**
 * `StatisticsMangaSchema` is a string representing the GraphQL selection set for a user's manga statistics.
 * It includes the count, meanScore, standardDeviation, chaptersRead, volumesRead, formats, statuses, scores, lengths, releaseYears, startYears, genres, tags, countries, staff, and studios.
 * @see https://docs.anilist.co/reference/object/userstatistics
 */
export const StatisticsMangaSchema = `
    manga {
      count
      meanScore
      standardDeviation
      chaptersRead
      volumesRead
      formats (limit: $mangaStatLimit, sort: $mangaStatSort) {
        ${UserMangaStatsSchema}
        format
      }
      statuses (limit: $mangaStatLimit, sort: $mangaStatSort) {
        ${UserMangaStatsSchema}
        status
      }
      scores (limit: $mangaStatLimit, sort: $mangaStatSort) {
        ${UserMangaStatsSchema}
        score
      }
      lengths (limit: $mangaStatLimit, sort: $mangaStatSort) {
        ${UserMangaStatsSchema}
        length
      }
      releaseYears (limit: $mangaStatLimit, sort: $mangaStatSort) {
        ${UserMangaStatsSchema}
        releaseYear
      }
      startYears (limit: $mangaStatLimit, sort: $mangaStatSort) {
        ${UserMangaStatsSchema}
        startYear
      }
      genres (limit: $mangaStatLimit, sort: $mangaStatSort) {
        ${UserMangaStatsSchema}
        genre
      }
      tags (limit: $mangaStatLimit, sort: $mangaStatSort) {
        ${UserMangaStatsSchema}
        tag {
          ${TagSchema}
        }
      }
      countries (limit: $mangaStatLimit, sort: $mangaStatSort) {
        ${UserMangaStatsSchema}
        country
      }
      staff (limit: $mangaStatLimit, sort: $mangaStatSort) {
        ${UserMangaStatsSchema}
        staff {
          id
          ${NameSchema}
        }
      }
      studios (limit: $mangaStatLimit, sort: $mangaStatSort) {
        ${UserMangaStatsSchema}
        studio {
          id
          name
        }
      }
    }
`;

/**
 * `StatisticsSchema` is a string representing the wrapped statistics selection used to derive
 * the `Statistics` response interface. It interpolates the anime and manga statistic blocks.
 * @see https://docs.anilist.co/reference/object/userstatistictypes
 */
export const StatisticsSchema = `
  statistics {
    ${StatisticsAnimeSchema}
    ${StatisticsMangaSchema}
  }
`;

/**
 * `UserSchema` is a constant representing the GraphQL schema for a user query.
 * It includes the user's id, name, about, avatar, bannerImage, isFollowing status, isFollower status, isBlocked status, bans, options, mediaListOptions, favourites, statistics, stats, unreadNotificationCount, siteUrl, donatorTier, donatorBadge, moderatorRoles, createdAt, updatedAt, and previousNames.
 * @see https://docs.anilist.co/reference/object/user
 */
export const UserSchema = `
  id
  name
  about(asHtml: $asHtml)
  avatar {
    large
    medium
  }
  bannerImage
  isFollowing
  isFollower
  isBlocked
  bans
  options {
    titleLanguage
    displayAdultContent
    airingNotifications
    profileColor
    notificationOptions {
      type
      enabled
    }
    timezone
    activityMergeTime
    staffNameLanguage
    restrictMessagesToFollowing
    disabledListActivity {
    disabled
    type
    }
  }
  mediaListOptions {
    scoreFormat
    rowOrder
    animeList {
      sectionOrder
      splitCompletedSectionByFormat
      customLists
      advancedScoring
      advancedScoringEnabled
    }
    mangaList {
      sectionOrder
      splitCompletedSectionByFormat
      customLists
      advancedScoring
      advancedScoringEnabled
    }
  }
  favourites {
    anime (perPage: 50) {
      edges {
        node {
          id
          ${TitleSchema}
        }
      }
      nodes {
        id
        ${TitleSchema}
      }
    }
    manga (perPage: 50) {
      edges {
        node {
        id
        ${TitleSchema}
        }
      }
      nodes {
        id
        ${TitleSchema}
      }
    }
    characters (perPage: 50) {
      edges {
        id
        role
        name
        voiceActors {
          id
          ${NameSchema}
          ${ImageSchema}
        }
        media {
          id
          ${TitleSchema}
          ${CoverImageSchema}
        }
        favouriteOrder
        node {
          id
          ${NameSchema}
          ${ImageSchema}
        }
      }
    }
    staff (perPage: 50) {
      edges {
        id
        role
        favouriteOrder
        node {
          id
          ${NameSchema}
          ${ImageSchema}
        }
      }
    }
    studios (perPage: 50) {
      edges {
        id
        isMain
        favouriteOrder
        node {
          id
          name
          isAnimationStudio
          siteUrl
        }
      }
    }
  }
  statistics {
    ${StatisticsAnimeSchema}
    ${StatisticsMangaSchema}
  }
  stats {
    ${UserStatsSectionSchema}
  }
  unreadNotificationCount
  siteUrl
  donatorTier
  donatorBadge
  moderatorRoles
  createdAt
  updatedAt
  previousNames {
    name
    createdAt
    updatedAt
  }
`;
