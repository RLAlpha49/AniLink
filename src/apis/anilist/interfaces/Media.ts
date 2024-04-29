import { Title } from './Title'
import { FuzzyDate } from './FuzzyDate'
import { Trailer } from './Trailer'
import { CoverImage } from './CoverImage'
import { Tag } from './Tag'
import { NextAiringEpisode } from './NextAiringEpisode'
import { ExternalLink } from './ExternalLink'
import { StreamingEpisode } from './StreamingEpisode'
import { Ranking } from './Ranking'
import { MediaStats } from './MediaStats'
import { MediaListEntry } from './MediaListEntry'

/**
 * `Media` is an interface representing a media entity.
 * It includes various properties related to the media.
 */
export interface Media {
  /**
   * `id` is a number representing the unique identifier of the media.
   */
  id: number

  /**
   * `idMal` is a number representing the MyAnimeList identifier of the media.
   */
  idMal: number

  /**
   * `title` is an object of type `Title` representing the title of the media.
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
   * `startDate` is an object of type `FuzzyDate` representing the start date of the media.
   */
  startDate: FuzzyDate

  /**
   * `endDate` is an object of type `FuzzyDate` representing the end date of the media.
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
   * `seasonInt` is a number representing the integer value of the season of the media.
   */
  seasonInt: number

  /**
   * `episodes` is an optional number representing the number of episodes of the media.
   */
  episodes?: number

  /**
   * `duration` is an optional number representing the duration of the media.
   */
  duration?: number

  /**
   * `chapters` is an optional number representing the number of chapters of the media.
   */
  chapters?: number

  /**
   * `volumes` is an optional number representing the number of volumes of the media.
   */
  volumes?: number

  /**
   * `countryOfOrigin` is a string representing the country of origin of the media.
   */
  countryOfOrigin: string

  /**
   * `isLicensed` is a boolean indicating whether the media is licensed.
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
   * `trailer` is an object of type `Trailer` representing the trailer of the media.
   */
  trailer: Trailer

  /**
   * `updatedAt` is a number representing the timestamp when the media was last updated.
   */
  updatedAt: number

  /**
   * `coverImage` is an object of type `CoverImage` representing the cover image of the media.
   */
  coverImage: CoverImage

  /**
   * `bannerImage` is a string representing the URL of the banner image of the media.
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
   * `isLocked` is a boolean indicating whether the media is locked.
   */
  isLocked: boolean

  /**
   * `trending` is a number representing the trending value of the media.
   */
  trending: number

  /**
   * `favourites` is a number representing the number of favourites of the media.
   */
  favourites: number

  /**
   * `tags` is an array of objects of type `Tag` representing the tags of the media.
   */
  tags: Tag[]

  /**
   * `isFavourite` is a boolean indicating whether the media is a favourite.
   */
  isFavourite: boolean

  /**
   * `isAdult` is a boolean indicating whether the media is for adults.
   */
  isAdult: boolean

  /**
   * `nextAiringEpisode` is an object of type `NextAiringEpisode` representing the next airing episode of the media.
   */
  nextAiringEpisode: NextAiringEpisode

  /**
   * `externalLinks` is an array of objects of type `ExternalLink` representing the external links of the media.
   */
  externalLinks: ExternalLink[]

  /**
   * `streamingEpisodes` is an array of objects of type `StreamingEpisode` representing the streaming episodes of the media.
   */
  streamingEpisodes: StreamingEpisode[]

  /**
   * `rankings` is an array of objects of type `Ranking` representing the rankings of the media.
   */
  rankings: Ranking[]

  /**
   * `mediaListEntry` is an object of type `MediaListEntry` representing the media list entry of the media.
   */
  mediaListEntry: MediaListEntry

  /**
   * `stats` is an object of type `MediaStats` representing the statistics of the media.
   */
  stats: MediaStats

  /**
   * `siteUrl` is a string representing the site URL of the media.
   */
  siteUrl: string

  /**
   * `autoCreateForumThread` is a boolean indicating whether a forum thread is automatically created for the media.
   */
  autoCreateForumThread: boolean

  /**
   * `isRecommendationBlocked` is a boolean indicating whether recommendation is blocked for the media.
   */
  isRecommendationBlocked: boolean

  /**
   * `modNotes` is a string representing the moderator notes for the media.
   */
  modNotes: string
}
