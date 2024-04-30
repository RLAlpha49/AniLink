import { APIWrapper } from '../../../base/APIWrapper'
import { sendRequest } from '../../../base/RequestHandler'
import { ScoreFormat, ScoreFormatMapping } from '../types/ScoreFormat'
import { UserStaffNameLanguage, UserStaffNameLanguageMapping } from '../types/UserStaffNameLanguage'
import { UserTitleLanguage, UserTitleLanguageMapping } from '../types/UserTitleLanguage'
import { validateVariables } from '../../../base/ValidateVariables'
import { NotificationOptions, NotificationOptionsMapping } from '../types/NotificationOptions'
import { MediaListOptions, MediaListOptionsMapping } from '../types/MediaListOptions'
import { DisabledListActivity, DisabledListActivityMapping } from '../types/DisabledListActivity'

/**
 * `UpdateUserVariables` is an interface representing the variables for the `UpdateUserMutation`.
 * It includes optional fields for updating user details.
 */
export interface UpdateUserVariables {
  /**
   * `about` is a string representing the updated about section of the user.
   */
  about?: string

  /**
   * `titleLanguage` is a `UserTitleLanguage` representing the updated title language preference of the user.
   */
  titleLanguage?: UserTitleLanguage

  /**
   * `displayAdultContent` is a boolean representing the updated preference of the user for displaying adult content.
   */
  displayAdultContent?: boolean

  /**
   * `airingNotifications` is a boolean representing the updated preference of the user for receiving airing notifications.
   */
  airingNotifications?: boolean

  /**
   * `scoreFormat` is a `ScoreFormat` representing the updated score format preference of the user.
   */
  scoreFormat?: ScoreFormat

  /**
   * `rowOrder` is a string representing the updated row order preference of the user.
   */
  rowOrder?: string

  /**
   * `profileColor` is a string representing the updated profile color preference of the user.
   */
  profileColor?: string

  /**
   * `donatorBadge` is a string representing the updated donator badge of the user.
   */
  donatorBadge?: string

  /**
   * `notificationOptions` is an array of `NotificationOptions` representing the updated notification options of the user.
   */
  notificationOptions?: NotificationOptions[]

  /**
   * `timezone` is a string representing the updated timezone of the user.
   */
  timezone?: string

  /**
   * `activityMergeTime` is a number representing the updated activity merge time of the user.
   */
  activityMergeTime?: number

  /**
   * `animeListOptions` is a `MediaListOptions` representing the updated anime list options of the user.
   */
  animeListOptions?: MediaListOptions

  /**
   * `mangaListOptions` is a `MediaListOptions` representing the updated manga list options of the user.
   */
  mangaListOptions?: MediaListOptions

  /**
   * `staffNameLanguage` is a `UserStaffNameLanguage` representing the updated staff name language preference of the user.
   */
  staffNameLanguage?: UserStaffNameLanguage

  /**
   * `restrictMessagesToFollowing` is a boolean representing the updated preference of the user for restricting messages to following.
   */
  restrictMessagesToFollowing?: boolean

  /**
   * `disabledListActivity` is an array of `DisabledListActivity` representing the updated disabled list activity preferences of the user.
   */
  disabledListActivity?: DisabledListActivity[]
}

/**
 * `UpdateUserResponse` is an interface representing the response from an update user mutation.
 * It includes the id, name, about, avatar, banner image, is following, is follower, is blocked, bans, options, media list options, unread notification count, site url, donator tier, donator badge, moderator roles, created at, and updated at.
 */
export interface UpdateUserResponse {
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
   * `avatar` is an object that includes the large and medium avatar of the user.
   */
  avatar: {
    /**
     * `large` is a string representing the large avatar of the user.
     */
    large: string

    /**
     * `medium` is a string representing the medium avatar of the user.
     */
    medium: string
  }

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
   * `bans` is an array representing the bans of the user.
   */
  bans: any[]

  /**
   * `options` is an object that includes the title language, display adult content, airing notifications, profile color, notification options, timezone, activity merge time, staff name language, and restrict messages to following of the user.
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
     * `airingNotifications` is a boolean representing whether the user has airing notifications enabled.
     */
    airingNotifications: boolean

    /**
     * `profileColor` is a string representing the profile color of the user.
     */
    profileColor: string

    /**
     * `notificationOptions` is an array that includes the type and enabled status of the notification options of the user.
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
  }

  /**
   * `mediaListOptions` is an object that includes the score format, row order, anime list, and manga list of the user.
   */
  mediaListOptions: {
    /**
     * `scoreFormat` is a string representing the score format of the user.
     */
    scoreFormat: string

    /**
     * `rowOrder` is a string representing the row order of the user.
     */
    rowOrder: string

    /**
     * `animeList` is an object that includes the section order, custom lists, advanced scoring, and advanced scoring enabled status of the anime list of the user.
     */
    animeList: {
      /**
       * `sectionOrder` is an array of strings representing the section order of the anime list of the user.
       */
      sectionOrder: string[]

      /**
       * `customLists` is an array of strings representing the custom lists of the anime list of the user.
       */
      customLists: string[]

      /**
       * `advancedScoring` is an array of strings representing the advanced scoring of the anime list of the user.
       */
      advancedScoring: string[]

      /**
       * `advancedScoringEnabled` is a boolean representing whether advanced scoring is enabled for the anime list of the user.
       */
      advancedScoringEnabled: boolean
    }

    /**
     * `mangaList` is an object that includes the section order, custom lists, advanced scoring, and advanced scoring enabled status of the manga list of the user.
     */
    mangaList: {
      /**
       * `sectionOrder` is an array of strings representing the section order of the manga list of the user.
       */
      sectionOrder: string[]

      /**
       * `customLists` is an array of strings representing the custom lists of the manga list of the user.
       */
      customLists: string[]

      /**
       * `advancedScoring` is an array of strings representing the advanced scoring of the manga list of the user.
       */
      advancedScoring: string[]

      /**
       * `advancedScoringEnabled` is a boolean representing whether advanced scoring is enabled for the manga list of the user.
       */
      advancedScoringEnabled: boolean
    }
  }

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
   * `createdAt` is a number representing when the user was created.
   */
  createdAt: number

  /**
   * `updatedAt` is a number representing when the user was last updated.
   */
  updatedAt: number
}

/**
 * `UpdateUserMutation` is a class representing a mutation to update a user.
 * It includes a method to update a user.
 */
export class UpdateUserMutation extends APIWrapper {
  /**
   * `authToken` is a string representing the authentication token.
   */
  private readonly authToken: string

  /**
   * Constructs a new `UpdateUserMutation` instance.
   *
   * @param authToken - The authentication token.
   */
  constructor (authToken: string) {
    super('https://graphql.anilist.co')
    this.authToken = authToken
  }

  /**
   * `updateUser` is a method that sends a mutation request to update a user.
   *
   * @param variables - An object of type `UpdateUserVariables` representing the variables for the mutation.
   * @returns A Promise that resolves to an object of type `UpdateUserResponse`. This object includes the updated user details
   * @throws Will throw an error if the mutation request fails or if the provided variables do not pass the validation checks.
   */
  async updateUser (variables: UpdateUserVariables): Promise<UpdateUserResponse> {
    const variableTypeMappings = {
      about: 'string',
      titleLanguage: UserTitleLanguageMapping,
      displayAdultContent: 'boolean',
      airingNotifications: 'boolean',
      scoreFormat: ScoreFormatMapping,
      rowOrder: 'string',
      profileColor: 'string',
      donatorBadge: 'string',
      notificationOptions: NotificationOptionsMapping,
      timezone: 'string',
      activityMergeTime: 'number',
      animeListOptions: MediaListOptionsMapping,
      mangaListOptions: MediaListOptionsMapping,
      staffNameLanguage: UserStaffNameLanguageMapping,
      restrictMessagesToFollowing: 'boolean',
      disabledListActivity: DisabledListActivityMapping
    }

    validateVariables(variables, variableTypeMappings)

    const mutation = `
      mutation ($about: String, $titleLanguage: UserTitleLanguage, $displayAdultContent: Boolean, $airingNotifications: Boolean, $scoreFormat: ScoreFormat, $rowOrder: String, $profileColor: String, $donatorBadge: String, $notificationOptions: [NotificationOptionInput], $timezone: String, $activityMergeTime: Int, $animeListOptions: MediaListOptionsInput, $mangaListOptions: MediaListOptionsInput, $staffNameLanguage: UserStaffNameLanguage, $restrictMessagesToFollowing: Boolean, $disabledListActivity: [ListActivityOptionInput]) {
        UpdateUser(about: $about, titleLanguage: $titleLanguage, displayAdultContent: $displayAdultContent, airingNotifications: $airingNotifications, scoreFormat: $scoreFormat, rowOrder: $rowOrder, profileColor: $profileColor, donatorBadge: $donatorBadge, notificationOptions: $notificationOptions, timezone: $timezone, activityMergeTime: $activityMergeTime, animeListOptions: $animeListOptions, mangaListOptions: $mangaListOptions, staffNameLanguage: $staffNameLanguage, restrictMessagesToFollowing: $restrictMessagesToFollowing, disabledListActivity: $disabledListActivity) {
          id
          name
          about
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
          }
          mediaListOptions {
            scoreFormat
            rowOrder
            animeList {
              sectionOrder
              customLists
              advancedScoring
              advancedScoringEnabled
            }
            mangaList {
              sectionOrder
              customLists
              advancedScoring
              advancedScoringEnabled
            }
          }
          unreadNotificationCount
          siteUrl
          donatorTier
          donatorBadge
          moderatorRoles
          createdAt
          updatedAt
        }
      }
    `

    const data = { query: mutation, variables }
    return await sendRequest(this.baseURL, 'POST', data, this.authToken)
  }
}
