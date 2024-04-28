export interface BasicThread {
  id: number
  title: string
  body: string
  siteUrl: string
}

export const BasicThreadSchema = `
  id
  title
  body (asHtml: $asHtml)
  siteUrl
`
