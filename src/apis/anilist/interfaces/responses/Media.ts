import { Title } from '../Title'
import { FuzzyDate } from '../FuzzyDate'
import { Trailer } from '../Trailer'
import { CoverImage } from '../CoverImage'
import { Tag } from '../Tag'
import { NextAiringEpisode } from '../NextAiringEpisode'
import { ExternalLink } from '../ExternalLink'
import { StreamingEpisode } from '../StreamingEpisode'
import { Ranking } from '../Ranking'
import { MediaStats } from '../MediaStats'
import { MediaListEntry } from '../MediaListEntry'
import { Name } from '../Name'
import { Image } from '../Image'

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
      relationType: string
      node: {
        id: number
        title: Title
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
