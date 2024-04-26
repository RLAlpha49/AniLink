import { ScoreDistribution } from './ScoreDistribution'
import { StatusDistribution } from './StatusDistribution'

export interface MediaStats {
  scoreDistribution: ScoreDistribution[]
  statusDistribution: StatusDistribution[]
}
