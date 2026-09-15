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
 * {@link MediaStatsSchema} is the media `stats` selection: the score and status
 * distributions of a media's list entries, interpolated by the media fragments.
 * @see https://docs.anilist.co/reference/object/mediastats
 */
export const MediaStatsSchema = `
  ${StatusDistributionSchema}
  ${ScoreDistributionSchema}
`;

/**
 * {@link MediaWithRelationsSchema} is the maximal media document the media queries send:
 * every media field, plus the relation connections (characters, staff, studios, related
 * media). It is the single source of truth the `fields` option prunes.
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
 * {@link MediaSchema} is the media selection without relation connections: every media
 * field, but no characters/staff/studios/relations. Other fragments interpolate it when
 * they need a media payload without the cost of the full relation set.
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
