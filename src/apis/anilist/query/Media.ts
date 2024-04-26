import { APIWrapper } from '../../../base/APIWrapper'
import { sendRequest } from '../../../base/RequestHandler'
import { MediaResponse } from '../interfaces/responses/Media'

interface MediaVariables {
  id?: number
  idMal?: number
  startDate?: number
  endDate?: number
  season?: string
  seasonYear?: number
  type?: 'ANIME' | 'MANGA'
  format?: string
  status?: string
  episodes?: number
  duration?: number
  chapters?: number
  volumes?: number
  isAdult?: boolean
  genre?: string
  tag?: string
  minimumTagRank?: number
  tagCategory?: string
  onList?: boolean
  licensedBy?: string
  licensedById?: number
  averageScore?: number
  popularity?: number
  source?: string
  countryOfOrigin?: string
  isLicensed?: boolean
  search?: string
  id_not?: number
  id_in?: number[]
  id_not_in?: number[]
  idMal_not?: number
  idMal_in?: number[]
  idMal_not_in?: number[]
  startDate_greater?: number
  startDate_lesser?: number
  startDate_like?: string
  endDate_greater?: number
  endDate_lesser?: number
  endDate_like?: string
  format_in?: string[]
  format_not?: string
  format_not_in?: string[]
  status_in?: string[]
  status_not?: string
  status_not_in?: string[]
  episodes_greater?: number
  episodes_lesser?: number
  duration_greater?: number
  duration_lesser?: number
  chapters_greater?: number
  chapters_lesser?: number
  volumes_greater?: number
  volumes_lesser?: number
  genre_in?: string[]
  genre_not_in?: string[]
  tag_in?: string[]
  tag_not_in?: string[]
  tagCategory_in?: string[]
  tagCategory_not_in?: string[]
  licensedBy_in?: string[]
  licensedById_in?: number[]
  averageScore_not?: number
  averageScore_greater?: number
  averageScore_lesser?: number
  popularity_not?: number
  popularity_greater?: number
  popularity_lesser?: number
  source_in?: string[]
  sort?: string[]
}

export class MediaQuery extends APIWrapper {
  constructor () {
    super('https://graphql.anilist.co')
  }

  async media (variables?: MediaVariables): Promise<MediaResponse> {
    const query = `
      query ($id: Int, $idMal: Int, $startDate: FuzzyDateInt, $endDate: FuzzyDateInt, $season: MediaSeason, $seasonYear: Int, $type: MediaType, $format: MediaFormat, $status: MediaStatus, $episodes: Int, $duration: Int, $chapters: Int, $volumes: Int, $isAdult: Boolean, $genre: String, $tag: String, $minimumTagRank: Int, $tagCategory: String, $onList: Boolean, $licensedBy: String, $licensedById: Int, $averageScore: Int, $popularity: Int, $source: MediaSource, $countryOfOrigin: CountryCode, $isLicensed: Boolean, $search: String, $id_not: Int, $id_in: [Int], $id_not_in: [Int], $idMal_not: Int, $idMal_in: [Int], $idMal_not_in: [Int], $startDate_greater: FuzzyDateInt, $startDate_lesser: FuzzyDateInt, $startDate_like: String, $endDate_greater: FuzzyDateInt, $endDate_lesser: FuzzyDateInt, $endDate_like: String, $format_in: [MediaFormat], $format_not: MediaFormat, $format_not_in: [MediaFormat], $status_in: [MediaStatus], $status_not: MediaStatus, $status_not_in: [MediaStatus], $episodes_greater: Int, $episodes_lesser: Int, $duration_greater: Int, $duration_lesser: Int, $chapters_greater: Int, $chapters_lesser: Int, $volumes_greater: Int, $volumes_lesser: Int, $genre_in: [String], $genre_not_in: [String], $tag_in: [String], $tag_not_in: [String], $tagCategory_in: [String], $tagCategory_not_in: [String], $licensedBy_in: [String], $licensedById_in: [Int], $averageScore_not: Int, $averageScore_greater: Int, $averageScore_lesser: Int, $popularity_not: Int, $popularity_greater: Int, $popularity_lesser: Int, $source_in: [MediaSource], $sort: [MediaSort]) {
        Media (id: $id, idMal: $idMal, startDate: $startDate, endDate: $endDate, season: $season, seasonYear: $seasonYear, type: $type, format: $format, status: $status, episodes: $episodes, duration: $duration, chapters: $chapters, volumes: $volumes, isAdult: $isAdult, genre: $genre, tag: $tag, minimumTagRank: $minimumTagRank, tagCategory: $tagCategory, onList: $onList, licensedBy: $licensedBy, licensedById: $licensedById, averageScore: $averageScore, popularity: $popularity, source: $source, countryOfOrigin: $countryOfOrigin, isLicensed: $isLicensed, search: $search, id_not: $id_not, id_in: $id_in, id_not_in: $id_not_in, idMal_not: $idMal_not, idMal_in: $idMal_in, idMal_not_in: $idMal_not_in, startDate_greater: $startDate_greater, startDate_lesser: $startDate_lesser, startDate_like: $startDate_like, endDate_greater: $endDate_greater, endDate_lesser: $endDate_lesser, endDate_like: $endDate_like, format_in: $format_in, format_not: $format_not, format_not_in: $format_not_in, status_in: $status_in, status_not: $status_not, status_not_in: $status_not_in, episodes_greater: $episodes_greater, episodes_lesser: $episodes_lesser, duration_greater: $duration_greater, duration_lesser: $duration_lesser, chapters_greater: $chapters_greater, chapters_lesser: $chapters_lesser, volumes_greater: $volumes_greater, volumes_lesser: $volumes_lesser, genre_in: $genre_in, genre_not_in: $genre_not_in, tag_in: $tag_in, tag_not_in: $tag_not_in, tagCategory_in: $tagCategory_in, tagCategory_not_in: $tagCategory_not_in, licensedBy_in: $licensedBy_in, licensedById_in: $licensedById_in, averageScore_not: $averageScore_not, averageScore_greater: $averageScore_greater, averageScore_lesser: $averageScore_lesser, popularity_not: $popularity_not, popularity_greater: $popularity_greater, popularity_lesser: $popularity_lesser, source_in: $source_in, sort: $sort) {
          id
          idMal
          title {
            romaji
            english
            native
            userPreferred
          }
          type
          format
          status
          description
          startDate {
            year
            month
            day
          }
          endDate {
            year
            month
            day
          }
          season
          seasonYear
          seasonInt
          ${variables?.type === 'ANIME' ? 'episodes\nduration' : 'chapters\nvolumes'}
          countryOfOrigin
          isLicensed
          source
          hashtag
          trailer {
            id
            site
            thumbnail
          }
          updatedAt
          coverImage {
            extraLarge
            large
            medium
            color
          }
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
            id
            name
            description
            rank
            isGeneralSpoiler
            isMediaSpoiler
            isAdult
          }
          relations {
            edges {
              relationType
              node {
                id
                title {
                  romaji
                  english
                  native
                  userPreferred
                }
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
                name {
                  first
                  last
                  full
                  native
                }
                image {
                  large
                }
              }
              media {
                id
                title {
                  romaji
                  english
                  native
                  userPreferred
                }
                coverImage {
                  extraLarge
                  large
                  medium
                  color
                }
              }
              favouriteOrder
              node {
                id
                name {
                  first
                  last
                  full
                  native
                }
                image {
                  large
                }
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
                name {
                  first
                  last
                  full
                  native
                }
                image {
                  large
                }
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
          nextAiringEpisode {
            airingAt
            timeUntilAiring
            episode
          }
          externalLinks {
            id
            url
            site
          }
          streamingEpisodes {
            title
            thumbnail
            url
            site
          }
          rankings {
            id
            rank
            type
            format
            year
            season
            allTime
            context
          }
          mediaListEntry {
            id
            status
          }
          stats {
            scoreDistribution {
              score
              amount
            }
            statusDistribution {
              status
              amount
            }
          }
          siteUrl
          autoCreateForumThread
          isRecommendationBlocked
          modNotes
        }
      }
    `

    const data = { query, variables }
    return await sendRequest(this.baseURL, 'POST', data)
  }
}
