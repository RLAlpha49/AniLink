export interface Title {
  romaji: string
  english: string
  native: string
  userPreferred: string
}

export const TitleSchema = `
  title {
    romaji
    english
    native
    userPreferred
  }
`
