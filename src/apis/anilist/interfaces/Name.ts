export interface Name {
  first: string
  last: string
  full: string
  native: string
  alternative: string
  userPreferred: string
}

export const NameSchema = `
  name {
    first
    last
    full
    native
  }
`
