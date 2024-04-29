import { Image, ImageSchema } from '../../Image'
import { Statistics } from '../../Statistics'
import { UserAnimeStatsSchema, UserMangaStatsSchema, UserStats } from '../../UserStats'
import { TitleSchema } from '../../Title'
import { NameSchema } from '../../Name'
import { CoverImageSchema } from '../../CoverImage'
import { TagSchema } from '../../Tag'

/**
 * `UserResponse` is an interface representing the response from a user query.
 * It includes the user's id, name, about, avatar, bannerImage, isFollowing status, isFollower status, isBlocked status, bans, options, mediaListOptions, favourites, statistics, stats, unreadNotificationCount, siteUrl, donatorTier, donatorBadge, moderatorRoles, createdAt, updatedAt, and previousNames.
 */
export interface UserResponse {
  /**
   * `id` is a number representing the id of the user.
   */
  id: number

  /**
   * `name` is a string representing the name of the user.
   */
  name: string

  /**
   * `about` is a string representing the about section of the user.
   */
  about: string

  /**
   * `avatar` is an instance of `Image` representing the avatar of the user.
   */
  avatar: Image

  /**
   * `bannerImage` is a string representing the banner image of the user.
   */
  bannerImage: string

  /**
   * `isFollowing` is a boolean representing whether the user is following.
   */
  isFollowing: boolean

  /**
   * `isFollower` is a boolean representing whether the user is a follower.
   */
  isFollower: boolean

  /**
   * `isBlocked` is a boolean representing whether the user is blocked.
   */
  isBlocked: boolean

  /**
   * `bans` is an array of any representing the bans of the user.
   */
  bans: any[]

  /**
   * `options` is an object representing the options of the user.
   */
  options: {
    /**
     * `titleLanguage` is a string representing the title language of the user.
     */
    titleLanguage: string

    /**
     * `displayAdultContent` is a boolean representing whether the user displays adult content.
     */
    displayAdultContent: boolean

    /**
     * `airingNotifications` is a boolean representing whether the user has airing notifications.
     */
    airingNotifications: boolean

    /**
     * `profileColor` is a string representing the profile color of the user.
     */
    profileColor: string

    /**
     * `notificationOptions` is an array of objects representing the notification options of the user.
     */
    notificationOptions: Array<{
      /**
       * `type` is a string representing the type of the notification option.
       */
      type: string

      /**
       * `enabled` is a boolean representing whether the notification option is enabled.
       */
      enabled: boolean
    }>

    /**
     * `timezone` is a string representing the timezone of the user.
     */
    timezone: string

    /**
     * `activityMergeTime` is a number representing the activity merge time of the user.
     */
    activityMergeTime: number

    /**
     * `staffNameLanguage` is a string representing the staff name language of the user.
     */
    staffNameLanguage: string

    /**
     * `restrictMessagesToFollowing` is a boolean representing whether the user restricts messages to following.
     */
    restrictMessagesToFollowing: boolean

    /**
     * `disabledListActivity` is an array of objects representing the disabled list activity of the user.
     */
    disabledListActivity: Array<{
      /**
       * `disabled` is a boolean representing whether the list activity is disabled.
       */
      disabled: boolean

      /**
       * `type` is a string representing the type of the list activity.
       */
      type: string
    }>
  }

  /**
   * `mediaListOptions` is an object representing the media list options of the user.
   */
  mediaListOptions: {
    /**
     * `scoreFormat` is a string representing the score format of the media list options.
     */
    scoreFormat: string

    /**
     * `rowOrder` is a string representing the row order of the media list options.
     */
    rowOrder: string

    /**
     * `animeList` is an object representing the anime list of the media list options.
     */
    animeList: {
      /**
       * `sectionOrder` is an array of strings representing the section order of the anime list.
       */
      sectionOrder: string[]

      /**
       * `splitCompletedSectionByFormat` is a boolean representing whether the completed section is split by format in the anime list.
       */
      splitCompletedSectionByFormat: boolean

      /**
       * `customLists` is an array of strings representing the custom lists in the anime list.
       */
      customLists: string[]

      /**
       * `advancedScoring` is an array of strings representing the advanced scoring in the anime list.
       */
      advancedScoring: string[]

      /**
       * `advancedScoringEnabled` is a boolean representing whether advanced scoring is enabled in the anime list.
       */
      advancedScoringEnabled: boolean
    }

    /**
     * `mangaList` is an object representing the manga list of the media list options.
     */
    mangaList: {
      /**
       * `sectionOrder` is an array of strings representing the section order of the manga list.
       */
      sectionOrder: string[]

      /**
       * `splitCompletedSectionByFormat` is a boolean representing whether the completed section is split by format in the manga list.
       */
      splitCompletedSectionByFormat: boolean

      /**
       * `customLists` is an array of strings representing the custom lists in the manga list.
       */
      customLists: string[]

      /**
       * `advancedScoring` is an array of strings representing the advanced scoring in the manga list.
       */
      advancedScoring: string[]

      /**
       * `advancedScoringEnabled` is a boolean representing whether advanced scoring is enabled in the manga list.
       */
      advancedScoringEnabled: boolean
    }
  }

  /**
   * `favourites` is an object representing the favourites of the user.
   */
  favourites: {
    /**
     * `anime` is an array of any representing the favourite anime of the user.
     */
    anime: any[]

    /**
     * `manga` is an array of any representing the favourite manga of the user.
     */
    manga: any[]

    /**
     * `characters` is an array of any representing the favourite characters of the user.
     */
    characters: any[]

    /**
     * `staff` is an array of any representing the favourite staff of the user.
     */
    staff: any[]

    /**
     * `studios` is an array of any representing the favourite studios of the user.
     */
    studios: any[]
  }

  /**
   * `statistics` is an instance of `Statistics` representing the statistics of the user.
   */
  statistics: Statistics

  /**
   * `stats` is an instance of `UserStats` representing the stats of the user.
   */
  stats: UserStats

  /**
   * `unreadNotificationCount` is a number representing the unread notification count of the user.
   */
  unreadNotificationCount: number

  /**
   * `siteUrl` is a string representing the site URL of the user.
   */
  siteUrl: string

  /**
   * `donatorTier` is a number representing the donator tier of the user.
   */
  donatorTier: number

  /**
   * `donatorBadge` is a string representing the donator badge of the user.
   */
  donatorBadge: string

  /**
   * `moderatorRoles` is an array of strings representing the moderator roles of the user.
   */
  moderatorRoles: string[]

  /**
   * `createdAt` is a number representing the timestamp when the user was created.
   */
  createdAt: number

  /**
   * `updatedAt` is a number representing the timestamp when the user was last updated.
   */
  updatedAt: number

  /**
   * `previousNames` is an array of objects representing the previous names of the user.
   */
  previousNames: Array<{
    /**
     * `name` is a string representing the previous name of the user.
     */
    name: string

    /**
     * `createdAt` is a number representing the timestamp when the previous name was created.
     */
    createdAt: number

    /**
     * `updatedAt` is a number representing the timestamp when the previous name was last updated.
     */
    updatedAt: number
  }>
}

/**
 * `UserSchema` is a constant representing the GraphQL schema for a user query.
 * It includes the user's id, name, about, avatar, bannerImage, isFollowing status, isFollower status, isBlocked status, bans, options, mediaListOptions, favourites, statistics, stats, unreadNotificationCount, siteUrl, donatorTier, donatorBadge, moderatorRoles, createdAt, updatedAt, and previousNames.
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
  }
  stats {
    watchedTime
    chaptersRead
    activityHistory {
      date
      amount
      level
    }
    animeStatusDistribution {
      status
      amount
    }
    mangaStatusDistribution {
      status
      amount
    }
    animeScoreDistribution {
      score
      amount
    }
    mangaScoreDistribution {
      score
      amount
    }
    animeListScores {
      meanScore
      standardDeviation
    }
    mangaListScores {
      meanScore
      standardDeviation
    }
    favouredGenresOverview {
      genre
      amount
      meanScore
      timeWatched
    }
    favouredGenres {
      genre
      amount
      meanScore
      timeWatched
    }
    favouredTags {
      tag {
        ${TagSchema}
      }
      amount
      meanScore
      timeWatched
    }
    favouredActors {
      staff {
        id
        ${NameSchema}
      }
      amount
      meanScore
      timeWatched
    }
    favouredStaff {
      staff {
        id
        ${NameSchema}
      }
      amount
      meanScore
      timeWatched
    }
    favouredStudios {
      studio {
        id
        name
      }
      amount
      meanScore
      timeWatched
    }
    favouredYears {
      year
      amount
      meanScore
    }
    favouredFormats {
      format
      amount
    }
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
`
