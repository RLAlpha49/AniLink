import {UserQuery} from './apis/anilist/query/User';
import {MediaQuery} from './apis/anilist/query/Media';
import {
    ListActivityOptionInput,
    MediaListOptionsInput,
    NotificationOptionInput,
    ScoreFormat,
    UpdateUserMutation,
    UserTitleLanguage
} from './apis/anilist/mutation/UpdateUser';

class AniLink {
    public anilist: {
        query: {
            user: () => Promise<any>;
            media: () => Promise<any>;
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
        const mediaQueryInstance = new MediaQuery();
        const updateUserMutationInstance = new UpdateUserMutation();
        this.anilist = {
            query: {
                user: userQueryInstance.user.bind(userQueryInstance),
                media: mediaQueryInstance.media.bind(mediaQueryInstance),
            },
            mutation: {
                updateUser: updateUserMutationInstance.updateUser.bind(updateUserMutationInstance),
            },
        };
    }
}

module.exports = AniLink;