import { UserQuery } from './apis/anilist/query/User';
import { UpdateUserMutation, UserTitleLanguage, ScoreFormat, NotificationOptionInput, MediaListOptionsInput, ListActivityOptionInput } from './apis/anilist/mutation/UpdateUser';

class AniLink {
  public anilist: {
    query: {
      user: () => Promise<any>;
    };
    mutation: {
      updateUser: (variables: {
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
        staffNameLanguage?: UserTitleLanguage,
        restrictMessagesToFollowing?: boolean,
        disabledListActivity?: ListActivityOptionInput[]
      }) => Promise<any>;
    };
  };

  constructor() {
    const userQueryInstance = new UserQuery();
    const updateUserMutationInstance = new UpdateUserMutation();
    this.anilist = {
      query: {
        user: userQueryInstance.user.bind(userQueryInstance),
      },
      mutation: {
        updateUser: updateUserMutationInstance.updateUser.bind(updateUserMutationInstance),
      },
    };
  }
}

module.exports = AniLink;