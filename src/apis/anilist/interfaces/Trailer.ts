export interface Trailer {
  id: string
  site: string
  thumbnail: string
}

export const TrailerSchema = `
  trailer {
    id
    site
    thumbnail
  }
`
