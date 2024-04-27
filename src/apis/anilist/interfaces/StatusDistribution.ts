export interface StatusDistribution {
  status: string
  amount: number
}

export const StatusDistributionSchema = `
  statusDistribution {
    status
    amount
  }
`
