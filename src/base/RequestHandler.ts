import axios, { AxiosResponse } from 'axios'

export const sendRequest = async (url: string, method: 'GET' | 'POST', data?: object, token?: string): Promise<any> => {
  const headers: { [key: string]: string } = {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  }

  if (token !== null && token !== undefined && token !== '') {
    headers.Authorization = `Bearer ${token}`
  }

  try {
    const response: AxiosResponse = await axios({
      url,
      method,
      data,
      headers
    })

    return response.data
  } catch (error: any) {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      throw error.response;
    } else if (error.request) {
      // The request was made but no response was received
      // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
      // http.ClientRequest in node.js
      throw error.request;
    } else {
      // Something happened in setting up the request that triggered an Error
      throw error.message;
    }
  }
}