import { Title, TitleSchema } from '../../Title'
import { FuzzyDate, FuzzyDateSchema } from '../../FuzzyDate'
import { Trailer, TrailerSchema } from '../../Trailer'
import { CoverImage, CoverImageSchema } from '../../CoverImage'
import { Tag, TagSchema } from '../../Tag'
import { NextAiringEpisode, NextAiringEpisodeSchema } from '../../NextAiringEpisode'
import { ExternalLink, ExternalLinkSchema } from '../../ExternalLink'
import { StreamingEpisode, StreamingEpisodeSchema } from '../../StreamingEpisode'
import { Ranking, RankingSchema } from '../../Ranking'
import { MediaStats } from '../../MediaStats'
import { MediaListEntry, MediaListEntrySchema } from '../../MediaListEntry'
import { Name, NameSchema } from '../../Name'
import { Image, ImageSchema } from '../../Image'
import { StatusDistributionSchema } from '../../StatusDistribution'
import { ScoreDistributionSchema } from '../../ScoreDistribution'

/**
 * `MediaResponse` is an interface representing the response from a media query.
 * It includes the media's id, idMal, title, type, format, status, description, startDate, endDate, season, seasonYear, seasonInt, episodes, duration, chapters, volumes, countryOfOrigin, isLicensed, source, hashtag, trailer, updatedAt, coverImage, bannerImage, genres, synonyms, averageScore, meanScore, popularity, isLocked, trending, favourites, tags, relations, characters, staff, studios, isFavourite, isAdult, nextAiringEpisode, externalLinks, streamingEpisodes, rankings, mediaListEntry, stats, siteUrl, autoCreateForumThread, isRecommendationBlocked, and modNotes.
 */
export interface MediaResponse {
  /**
   * `id` is a number representing the id of the media.
   */
  id: number

  /**
   * `idMal` is a number representing the MyAnimeList id of the media.
   */
  idMal: number

  /**
   * `title` is an instance of `Title` representing the title of the media.
   */
  title: Title

  /**
   * `type` is a string representing the type of the media.
   */
  type: string

  /**
   * `format` is a string representing the format of the media.
   */
  format: string

  /**
   * `status` is a string representing the status of the media.
   */
  status: string

  /**
   * `description` is a string representing the description of the media.
   */
  description: string

  /**
   * `startDate` is an instance of `FuzzyDate` representing the start date of the media.
   */
  startDate: FuzzyDate

  /**
   * `endDate` is an instance of `FuzzyDate` representing the end date of the media.
   */
  endDate: FuzzyDate

  /**
   * `season` is a string representing the season of the media.
   */
  season: string

  /**
   * `seasonYear` is a number representing the year of the season of the media.
   */
  seasonYear: number

  /**
   * `seasonInt` is a number representing the integer of the season of the media.
   */
  seasonInt: number

  /**
   * `episodes` is a number representing the number of episodes of the media.
   */
  episodes?: number

  /**
   * `duration` is a number representing the duration of the media.
   */
  duration?: number

  /**
   * `chapters` is a number representing the number of chapters of the media.
   */
  chapters?: number

  /**
   * `volumes` is a number representing the number of volumes of the media.
   */
  volumes?: number

  /**
   * `countryOfOrigin` is a string representing the country of origin of the media.
   */
  countryOfOrigin: string

  /**
   * `isLicensed` is a boolean representing whether the media is licensed.
   */
  isLicensed: boolean

  /**
   * `source` is a string representing the source of the media.
   */
  source: string

  /**
   * `hashtag` is a string representing the hashtag of the media.
   */
  hashtag: string

  /**
   * `trailer` is an instance of `Trailer` representing the trailer of the media.
   */
  trailer: Trailer

  /**
   * `updatedAt` is a number representing the timestamp when the media was last updated.
   */
  updatedAt: number

  /**
   * `coverImage` is an instance of `CoverImage` representing the cover image of the media.
   */
  coverImage: CoverImage

  /**
   * `bannerImage` is a string representing the banner image URL of the media.
   */
  bannerImage: string

  /**
   * `genres` is an array of strings representing the genres of the media.
   */
  genres: string[]

  /**
   * `synonyms` is an array of strings representing the synonyms of the media.
   */
  synonyms: string[]

  /**
   * `averageScore` is a number representing the average score of the media.
   */
  averageScore: number

  /**
   * `meanScore` is a number representing the mean score of the media.
   */
  meanScore: number

  /**
   * `popularity` is a number representing the popularity of the media.
   */
  popularity: number

  /**
   * `isLocked` is a boolean representing whether the media is locked.
   */
  isLocked: boolean

  /**
   * `trending` is a number representing the trending status of the media.
   */
  trending: number

  /**
   * `favourites` is a number representing the number of favourites of the media.
   */
  favourites: number

  /**
   * `tags` is an array of `Tag` representing the tags of the media.
   */
  tags: Tag[]

  /**
   * `relations` is an object representing the relations of the media.
   */
  relations: {
    edges: Array<{
      /**
       * `id` is a number representing the id of the relation.
       */
      id: number

      /**
       * `relationType` is a string representing the type of the relation.
       */
      relationType: string

      /**
       * `isMainStudio` is a boolean representing whether the relation is the main studio.
       */
      isMainStudio: boolean

      /**
       * `characterRole` is a string representing the role of the character in the relation.
       */
      characterRole: string

      /**
       * `characterName` is a string representing the name of the character in the relation.
       */
      characterName: string

      /**
       * `roleNotes` is a string representing the notes of the role in the relation.
       */
      roleNotes: string

      /**
       * `dubGroup` is a string representing the dub group of the relation.
       */
      dubGroup: string

      /**
       * `staffRole` is a string representing the role of the staff in the relation.
       */
      staffRole: string

      /**
       * `node` is an object representing the node of the relation.
       */
      node: {
        /**
         * `id` is a number representing the id of the node.
         */
        id: number

        /**
         * `title` is an instance of `FuzzyDate` representing the title of the node.
         */
        title: FuzzyDate
      }
    }>
  }

  /**
   * `characters` is an object representing the characters of the media.
   */
  characters: {
    edges: Array<{
      /**
       * `id` is a number representing the id of the character.
       */
      id: number

      /**
       * `role` is a string representing the role of the character.
       */
      role: string

      /**
       * `name` is a string representing the name of the character.
       */
      name: string

      /**
       * `voiceActors` is an array of objects, each representing a voice actor of the character.
       */
      voiceActors: Array<{
        /**
         * `id` is a number representing the id of the voice actor.
         */
        id: number

        /**
         * `name` is an instance of `Name` representing the name of the voice actor.
         */
        name: Name

        /**
         * `image` is an instance of `Image` representing the image of the voice actor.
         */
        image: Image
      }>

      /**
       * `media` is an object representing the media of the character.
       */
      media: {
        /**
         * `id` is a number representing the id of the media.
         */
        id: number

        /**
         * `title` is an instance of `Title` representing the title of the media.
         */
        title: Title

        /**
         * `coverImage` is an instance of `CoverImage` representing the cover image of the media.
         */
        coverImage: CoverImage
      }

      /**
       * `favouriteOrder` is a number representing the order of the favourite character.
       */
      favouriteOrder: number

      /**
       * `node` is an object representing the node of the character.
       */
      node: {
        /**
         * `id` is a number representing the id of the node.
         */
        id: number

        /**
         * `name` is an instance of `Name` representing the name of the node.
         */
        name: Name

        /**
         * `image` is an instance of `Image` representing the image of the node.
         */
        image: Image
      }
    }>
  }

  /**
   * `staff` is an object representing the staff of the media.
   */
  staff: {
    edges: Array<{
      /**
       * `id` is a number representing the id of the staff.
       */
      id: number

      /**
       * `role` is a string representing the role of the staff.
       */
      role: string

      /**
       * `favouriteOrder` is a number representing the order of the favourite staff.
       */
      favouriteOrder: number

      /**
       * `node` is an object representing the node of the staff.
       */
      node: {
        /**
         * `id` is a number representing the id of the node.
         */
        id: number

        /**
         * `name` is an instance of `Name` representing the name of the node.
         */
        name: Name

        /**
         * `image` is an instance of `Image` representing the image of the node.
         */
        image: Image
      }
    }>
  }

  /**
   * `studios` is an object representing the studios of the media.
   */
  studios: {
    edges: Array<{
      /**
       * `id` is a number representing the id of the studio.
       */
      id: number

      /**
       * `isMain` is a boolean representing whether the studio is the main studio.
       */
      isMain: boolean

      /**
       * `favouriteOrder` is a number representing the order of the favourite studio.
       */
      favouriteOrder: number

      /**
       * `node` is an object representing the node of the studio.
       */
      node: {
        /**
         * `id` is a number representing the id of the node.
         */
        id: number

        /**
         * `name` is a string representing the name of the node.
         */
        name: string

        /**
         * `isAnimationStudio` is a boolean representing whether the node is an animation studio.
         */
        isAnimationStudio: boolean

        /**
         * `siteUrl` is a string representing the site URL of the node.
         */
        siteUrl: string
      }
    }>
  }

  /**
   * `isFavourite` is a boolean representing whether the media is a favourite.
   */
  isFavourite: boolean

  /**
   * `isAdult` is a boolean representing whether the media is for adults.
   */
  isAdult: boolean

  /**
   * `nextAiringEpisode` is an instance of `NextAiringEpisode` representing the next airing episode of the media.
   */
  nextAiringEpisode: NextAiringEpisode

  /**
   * `externalLinks` is an array of `ExternalLink` representing the external links of the media.
   */
  externalLinks: ExternalLink[]

  /**
   * `streamingEpisodes` is an array of `StreamingEpisode` representing the streaming episodes of the media.
   */
  streamingEpisodes: StreamingEpisode[]

  /**
   * `rankings` is an array of `Ranking` representing the rankings of the media.
   */
  rankings: Ranking[]

  /**
   * `mediaListEntry` is an instance of `MediaListEntry` representing the media list entry of the media.
   */
  mediaListEntry: MediaListEntry

  /**
   * `stats` is an instance of `MediaStats` representing the stats of the media.
   */
  stats: MediaStats

  /**
   * `siteUrl` is a string representing the site URL of the media.
   */
  siteUrl: string

  /**
   * `autoCreateForumThread` is a boolean representing whether the media should auto create a forum thread.
   */
  autoCreateForumThread: boolean

  /**
   * `isRecommendationBlocked` is a boolean representing whether the media is blocked for recommendation.
   */
  isRecommendationBlocked: boolean

  /**
   * `modNotes` is a string representing the mod notes of the media.
   */
  modNotes: string
}

/**
 * `MediaWithRelationsSchema` is a constant representing the GraphQL schema for a media query with relations.
 * It includes the media's id, idMal, title, type, format, status, description, startDate, endDate, season, seasonYear, seasonInt, episodes, duration, chapters, volumes, countryOfOrigin, isLicensed, source, hashtag, trailer, updatedAt, coverImage, bannerImage, genres, synonyms, averageScore, meanScore, popularity, isLocked, trending, favourites, tags, relations, characters, staff, studios, isFavourite, isAdult, nextAiringEpisode, externalLinks, streamingEpisodes, rankings, mediaListEntry, stats, siteUrl, autoCreateForumThread, isRecommendationBlocked, and modNotes.
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
`

/**
 * `MediaSchema` is a constant representing the GraphQL schema for a media query.
 * It includes the media's id, idMal, title, type, format, status, description, startDate, endDate, season, seasonYear, seasonInt, episodes, duration, chapters, volumes, countryOfOrigin, isLicensed, source, hashtag, trailer, updatedAt, coverImage, bannerImage, genres, synonyms, averageScore, meanScore, popularity, isLocked, trending, favourites, tags, isFavourite, isAdult, nextAiringEpisode, externalLinks, streamingEpisodes, rankings, mediaListEntry, stats, siteUrl, autoCreateForumThread, isRecommendationBlocked, and modNotes.
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
`
