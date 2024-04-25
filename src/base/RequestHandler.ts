import axios from 'axios';

export class RequestHandler {
  static async sendRequest(url: string, method: 'GET' | 'POST', data?: object) {
    const response = await axios({ url, method, data });
    return response.data;
  }
}