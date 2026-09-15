import { NameSchema } from "./Name";
import { TagSchema } from "./Tag";

/**
 * {@link UserAnimeStatsSchema} is the per-category anime statistic row: the aggregate
 * `count`, `meanScore`, and `minutesWatched`, plus the `mediaIds` the row covers. The
 * user fragment interpolates it under every anime statistics category.
 * @see https://docs.anilist.co/reference/object/userstatistics
 */
export const UserAnimeStatsSchema = `
  count
  meanScore
  minutesWatched
  mediaIds
`;

/**
 * {@link UserMangaStatsSchema} is the per-category manga statistic row: the aggregate
 * `count`, `meanScore`, and `chaptersRead`, plus the `mediaIds` the row covers. The
 * user fragment interpolates it under every manga statistics category.
 * @see https://docs.anilist.co/reference/object/userstatistics
 */
export const UserMangaStatsSchema = `
  count
  meanScore
  chaptersRead
  mediaIds
`;

/**
 * {@link UserStatsSectionSchema} is the `stats` block of a user response: totals, activity
 * history, score/status distributions, list-score summaries, and the favoured-entity
 * overviews. The user fragment interpolates it under `stats`.
 * @see https://docs.anilist.co/reference/object/userstats
 */
export const UserStatsSectionSchema = `
    watchedTime
    chaptersRead
    activityHistory {
      date
      amount
      level
    }
    animeStatusDistribution {
      status
      amount
    }
    mangaStatusDistribution {
      status
      amount
    }
    animeScoreDistribution {
      score
      amount
    }
    mangaScoreDistribution {
      score
      amount
    }
    animeListScores {
      meanScore
      standardDeviation
    }
    mangaListScores {
      meanScore
      standardDeviation
    }
    favouredGenresOverview {
      genre
      amount
      meanScore
      timeWatched
    }
    favouredGenres {
      genre
      amount
      meanScore
      timeWatched
    }
    favouredTags {
      tag {
        ${TagSchema}
      }
      amount
      meanScore
      timeWatched
    }
    favouredActors {
      staff {
        id
        ${NameSchema}
      }
      amount
      meanScore
      timeWatched
    }
    favouredStaff {
      staff {
        id
        ${NameSchema}
      }
      amount
      meanScore
      timeWatched
    }
    favouredStudios {
      studio {
        id
        name
      }
      amount
      meanScore
      timeWatched
    }
    favouredYears {
      year
      amount
      meanScore
    }
    favouredFormats {
      format
      amount
    }
`;
