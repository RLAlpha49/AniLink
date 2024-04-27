export interface StreamingEpisode {
  title: string
  thumbnail: string
  url: string
  site: string
}

export const StreamingEpisodeSchema = `
  streamingEpisodes {
    title
    thumbnail
    url
    site
  }
`
