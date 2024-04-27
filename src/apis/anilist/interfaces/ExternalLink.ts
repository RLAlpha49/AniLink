export interface ExternalLink {
  id: number
  url: string
  site: string
}

export const ExternalLinkSchema = `
  externalLinks {
    id
    url
    site
  }
`
