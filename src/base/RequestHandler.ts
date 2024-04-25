import axios, { AxiosResponse } from 'axios'

export const sendRequest = async (url: string, method: 'GET' | 'POST', data?: object): Promise<any> => {
  const response: AxiosResponse = await axios({ url, method, data })
  return response.data
}
