import { Title } from './Title'
import { FuzzyDate } from './FuzzyDate'
import { Trailer } from './Trailer'
import { CoverImage } from './CoverImage'
import { Tag } from './Tag'
import { NextAiringEpisode } from './NextAiringEpisode'
import { ExternalLink } from './ExternalLink'
import { StreamingEpisode } from './StreamingEpisode'
import { Ranking } from './Ranking'
import { Stats } from './Stats'
import { MediaListEntry } from './MediaListEntry'

export interface Media {
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
  isFavourite: boolean
  isAdult: boolean
  nextAiringEpisode: NextAiringEpisode
  externalLinks: ExternalLink[]
  streamingEpisodes: StreamingEpisode[]
  rankings: Ranking[]
  mediaListEntry: MediaListEntry
  stats: Stats
  siteUrl: string
  autoCreateForumThread: boolean
  isRecommendationBlocked: boolean
  modNotes: string
}
