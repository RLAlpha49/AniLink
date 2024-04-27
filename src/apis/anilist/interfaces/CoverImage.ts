export interface CoverImage {
  extraLarge: string
  large: string
  medium: string
  color: string
}

export const CoverImageSchema = `
  coverImage {
    extraLarge
    large
    medium
    color
  }
`
