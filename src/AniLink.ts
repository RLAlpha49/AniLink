import { UserQuery } from './apis/anilist/query/User';
import { UpdateUserMutation } from './apis/anilist/mutation/UpdateUser';

export class AniLink {
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