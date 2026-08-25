import { CoverImageSchema } from "../../CoverImage";
import { ScoreDistributionSchema, StatusDistributionSchema } from "../../Distribution";
import { ExternalLinkSchema } from "../../ExternalLink";
import { FuzzyDateSchema } from "../../FuzzyDate";
import { ImageSchema } from "../../Image";
import { MediaListEntrySchema } from "../../Media";
import { NameSchema } from "../../Name";
import { NextAiringEpisodeSchema } from "../../NextAiringEpisode";
import { RankingSchema } from "../../Ranking";
import { StreamingEpisodeSchema } from "../../StreamingEpisode";
import { TagSchema } from "../../Tag";
import { TitleSchema } from "../../Title";
import { TrailerSchema } from "../../Trailer";

/**
 * `MediaStatsSchema` is a string representing the GraphQL selection set for a media's aggregate statistics.
 * It interpolates the status and score distribution selections.
 * @see https://docs.anilist.co/reference/object/mediastats
 */
export const MediaStatsSchema = `
  ${StatusDistributionSchema}
  ${ScoreDistributionSchema}
`;

/**
 * `MediaWithRelationsSchema` is a constant representing the GraphQL schema for a media query with relations.
 * It includes the media's id, idMal, title, type, format, status, description, startDate, endDate, season, seasonYear, seasonInt, episodes, duration, chapters, volumes, countryOfOrigin, isLicensed, source, hashtag, trailer, updatedAt, coverImage, bannerImage, genres, synonyms, averageScore, meanScore, popularity, isLocked, trending, favourites, tags, relations, characters, staff, studios, isFavourite, isAdult, nextAiringEpisode, externalLinks, streamingEpisodes, rankings, mediaListEntry, stats, siteUrl, autoCreateForumThread, isRecommendationBlocked, and modNotes.
 * @see https://docs.anilist.co/reference/object/media
 */
export const MediaWithRelationsSchema = `
  id
  idMal
  ${TitleSchema}
  type
  format
  status
  description (asHtml: $asHtml)
  startDate {
    ${FuzzyDateSchema}
  }
  endDate {
    ${FuzzyDateSchema}
  }
  season
  seasonYear
  seasonInt
  episodes
  duration
  chapters
  volumes
  countryOfOrigin
  isLicensed
  source
  hashtag
  ${TrailerSchema}
  updatedAt
  ${CoverImageSchema}
  bannerImage
  genres
  synonyms
  averageScore
  meanScore
  popularity
  isLocked
  trending
  favourites
  tags {
    ${TagSchema}
  }
  relations {
    edges {
      id
      relationType
      isMainStudio
      characters {
        id
        ${NameSchema}
        ${ImageSchema}
        description (asHtml: $asHtml)
        gender
        dateOfBirth {
          ${FuzzyDateSchema}
        }
        age
        bloodType
        isFavourite
        isFavouriteBlocked
        siteUrl
        favourites
        modNotes
      }
      characterRole
      characterName
      roleNotes
      dubGroup
      staffRole
      node {
        id
        ${TitleSchema}
      }
    }
  }
  characters {
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
  staff {
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
  studios {
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
  isFavourite
  isAdult
  ${NextAiringEpisodeSchema}
  ${ExternalLinkSchema}
  ${StreamingEpisodeSchema}
  ${RankingSchema}
  ${MediaListEntrySchema}
  stats {
    ${StatusDistributionSchema}
    ${ScoreDistributionSchema}
  }
  siteUrl
  autoCreateForumThread
  isRecommendationBlocked
  modNotes
`;

/**
 * `MediaSchema` is a constant representing the GraphQL schema for a media query.
 * It includes the media's id, idMal, title, type, format, status, description, startDate, endDate, season, seasonYear, seasonInt, episodes, duration, chapters, volumes, countryOfOrigin, isLicensed, source, hashtag, trailer, updatedAt, coverImage, bannerImage, genres, synonyms, averageScore, meanScore, popularity, isLocked, trending, favourites, tags, isFavourite, isAdult, nextAiringEpisode, externalLinks, streamingEpisodes, rankings, mediaListEntry, stats, siteUrl, autoCreateForumThread, isRecommendationBlocked, and modNotes.
 * @see https://docs.anilist.co/reference/object/media
 */
export const MediaSchema = `
  id
  idMal
  ${TitleSchema}
  type
  format
  status
  description (asHtml: $asHtml)
  startDate {
    ${FuzzyDateSchema}
  }
  endDate {
    ${FuzzyDateSchema}
  }
  season
  seasonYear
  seasonInt
  episodes
  duration
  chapters
  volumes
  countryOfOrigin
  isLicensed
  source
  hashtag
  ${TrailerSchema}
  updatedAt
  ${CoverImageSchema}
  bannerImage
  genres
  synonyms
  averageScore
  meanScore
  popularity
  isLocked
  trending
  favourites
  tags {
    ${TagSchema}
  }
  isFavourite
  isAdult
  ${NextAiringEpisodeSchema}
  ${ExternalLinkSchema}
  ${StreamingEpisodeSchema}
  ${RankingSchema}
  ${MediaListEntrySchema}
  stats {
    ${StatusDistributionSchema}
    ${ScoreDistributionSchema}
  }
  siteUrl
  autoCreateForumThread
  isRecommendationBlocked
  modNotes
`;
