import { APIWrapper } from '../../../base/APIWrapper';
import { RequestHandler } from '../../../base/RequestHandler';

export type UserTitleLanguage = 'ROMAJI' | 'ENGLISH' | 'NATIVE' | 'ROMAJI_STYLISED' | 'ENGLISH_STYLISED' | 'NATIVE_STYLISED';
export type ScoreFormat = 'POINT_100' | 'POINT_10_DECIMAL' | 'POINT_10' | 'POINT_5' | 'POINT_3';
export type UserStaffNameLanguage = 'ROMAJI' | 'ENGLISH' | 'NATIVE' | 'ROMAJI_STYLISED' | 'ENGLISH_STYLISED' | 'NATIVE_STYLISED';
export type NotificationOptionInput = { type: string, enabled: boolean };
export type MediaListOptionsInput = { scoreFormat: ScoreFormat, rowOrder: string, animeList: any, mangaList: any };
export type ListActivityOptionInput = 'ANIME_LIST' | 'MANGA_LIST';

export class UpdateUserMutation extends APIWrapper {
  constructor() {
    super('https://graphql.anilist.co');
  }

  async updateUser(variables: {
    about?: string,
    titleLanguage?: UserTitleLanguage,
    displayAdultContent?: boolean,
    airingNotifications?: boolean,
    scoreFormat?: ScoreFormat,
    rowOrder?: string,
    profileColor?: string,
    donatorBadge?: string,
    notificationOptions?: NotificationOptionInput[],
    timezone?: string,
    activityMergeTime?: number,
    animeListOptions?: MediaListOptionsInput,
    mangaListOptions?: MediaListOptionsInput,
    staffNameLanguage?: UserStaffNameLanguage,
    restrictMessagesToFollowing?: boolean,
    disabledListActivity?: ListActivityOptionInput[]
  }) {
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
            donatorBadge
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
          moderatorRoles
          createdAt
          updatedAt
        }
      }
    `;
    const data = { query: mutation, variables };
    return RequestHandler.sendRequest(this.baseURL, 'POST', data);
  }
}