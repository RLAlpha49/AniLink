import { Title, TitleSchema } from '../Title'
import { FuzzyDate, FuzzyDateSchema } from '../FuzzyDate'
import { Trailer, TrailerSchema } from '../Trailer'
import { CoverImage, CoverImageSchema } from '../CoverImage'
import { Tag, TagSchema } from '../Tag'
import { NextAiringEpisode, NextAiringEpisodeSchema } from '../NextAiringEpisode'
import { ExternalLink, ExternalLinkSchema } from '../ExternalLink'
import { StreamingEpisode, StreamingEpisodeSchema } from '../StreamingEpisode'
import { Ranking, RankingSchema } from '../Ranking'
import { MediaStats } from '../MediaStats'
import { MediaListEntry, MediaListEntrySchema } from '../MediaListEntry'
import { Name, NameSchema } from '../Name'
import { Image, ImageSchema } from '../Image'
import { StatusDistributionSchema } from '../StatusDistribution'
import { ScoreDistributionSchema } from '../ScoreDistribution'

export interface MediaResponse {
  id: number
  idMal: number
  title: Title
  type: string
  format: string
  status: string
  description: string
  startDate: FuzzyDate
  endDate: FuzzyDate
  season: string
  seasonYear: number
  seasonInt: number
  episodes?: number
  duration?: number
  chapters?: number
  volumes?: number
  countryOfOrigin: string
  isLicensed: boolean
  source: string
  hashtag: string
  trailer: Trailer
  updatedAt: number
  coverImage: CoverImage
  bannerImage: string
  genres: string[]
  synonyms: string[]
  averageScore: number
  meanScore: number
  popularity: number
  isLocked: boolean
  trending: number
  favourites: number
  tags: Tag[]
  relations: {
    edges: Array<{
      id: number
      relationType: string
      isMainStudio: boolean
      characterRole: string
      characterName: string
      roleNotes: string
      dubGroup: string
      staffRole: string
      node: {
        id: number
        title: FuzzyDate
      }
    }>
  }
  characters: {
    edges: Array<{
      id: number
      role: string
      name: string
      voiceActors: Array<{
        id: number
        name: Name
        image: Image
      }>
      media: {
        id: number
        title: Title
        coverImage: CoverImage
      }
      favouriteOrder: number
      node: {
        id: number
        name: Name
        image: Image
      }
    }>
  }
  staff: {
    edges: Array<{
      id: number
      role: string
      favouriteOrder: number
      node: {
        id: number
        name: Name
        image: Image
      }
    }>
  }
  studios: {
    edges: Array<{
      id: number
      isMain: boolean
      favouriteOrder: number
      node: {
        id: number
        name: string
        isAnimationStudio: boolean
        siteUrl: string
      }
    }>
  }
  isFavourite: boolean
  isAdult: boolean
  nextAiringEpisode: NextAiringEpisode
  externalLinks: ExternalLink[]
  streamingEpisodes: StreamingEpisode[]
  rankings: Ranking[]
  mediaListEntry: MediaListEntry
  stats: MediaStats
  siteUrl: string
  autoCreateForumThread: boolean
  isRecommendationBlocked: boolean
  modNotes: string
}

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
