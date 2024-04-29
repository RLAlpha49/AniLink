export interface FuzzyDate {
  year: number
  month: number
  day: number
}

export interface FuzzyDateInput {
  year?: number
  month?: number
  day?: number
}

export const FuzzyDateSchema = `
  year
  month
  day
`
