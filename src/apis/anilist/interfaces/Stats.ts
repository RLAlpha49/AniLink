import { ScoreDistribution } from './ScoreDistribution'
import { StatusDistribution } from './StatusDistribution'

export interface Stats {
  scoreDistribution: ScoreDistribution[]
  statusDistribution: StatusDistribution[]
}
