/**
 * `APIWrapper` is a base class for API wrappers.
 * It provides a basic structure that can be extended by specific API wrappers.
 */
export class APIWrapper {
  /**
   * The base URL for the API.
   */
  protected baseURL: string

  /**
   * Constructs a new `APIWrapper` instance.
   * @param baseURL - The base URL for the API.
   */
  constructor (baseURL: string) {
    this.baseURL = baseURL
  }
}
