import { UserQuery } from './apis/anilist/query/User';
import { UpdateUserMutation } from './apis/anilist/mutation/UpdateUser';

class AniLink {
  public anilist: {
    query: {
      user: UserQuery;
    };
    mutation: {
      updateUser: UpdateUserMutation;
    };
  };

  constructor() {
    this.anilist = {
      query: {
        user: new UserQuery(),
      },
      mutation: {
        updateUser: new UpdateUserMutation(),
      },
    };
  }
}

module.exports = AniLink;