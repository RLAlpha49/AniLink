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
    throw error
  }
}