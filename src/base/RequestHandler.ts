import axios, { type AxiosResponse } from 'axios'

/**
 * Sends a request to the specified URL.
 * @param url - The URL to send the request to.
 * @param method - The HTTP method to use ('GET' or 'POST').
 * @param data - The data to send with the request.
 * @param token - The authentication token to include in the request headers.
 * @returns The data from the response.
 * @throws An error if the request fails.
 */
export const sendRequest = async (url: string, method: 'GET' | 'POST', data?: object, token?: string): Promise<any> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  }

  if (token !== null && token !== undefined && token !== '') {
    headers.Authorization = `Bearer ${token}`
  }

  /* eslint-disable no-useless-catch */
  try {
    const response: AxiosResponse = await axios({
      url,
      method,
      data,
      headers
    })

    return response.data
  } catch (error: any) {
    throw error
  }
}
