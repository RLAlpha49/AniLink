import { APIWrapper } from '../../../base/APIWrapper';
import { RequestHandler } from '../../../base/RequestHandler';

export class UpdateUserMutation extends APIWrapper {
  constructor() {
    super('https://graphql.anilist.co');
  }

  async updateUser(variables: object) {
    const mutation = `...`;
    const data = { query: mutation, variables };
    return RequestHandler.sendRequest(this.baseURL, 'POST', data);
  }
}