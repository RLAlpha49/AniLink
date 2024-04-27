export interface NextAiringEpisode {
  airingAt: number
  timeUntilAiring: number
  episode: number
}

export const NextAiringEpisodeSchema = `
  nextAiringEpisode {
    airingAt
    timeUntilAiring
    episode
  }
`
