import { NameSchema } from "./Name";
import { TagSchema } from "./Tag";

/**
 * `UserAnimeStatsSchema` is a string representing the GraphQL schema for a user's anime statistics.
 * It includes the count, meanScore, minutesWatched, and mediaIds.
 * @see https://docs.anilist.co/reference/object/userstats
 */
export const UserAnimeStatsSchema = `
  count
  meanScore
  minutesWatched
  mediaIds
`;

/**
 * `UserMangaStatsSchema` is a string representing the GraphQL schema for a user's manga statistics.
 * It includes the count, meanScore, chaptersRead, and mediaIds.
 * @see https://docs.anilist.co/reference/object/userstats
 */
export const UserMangaStatsSchema = `
  count
  meanScore
  chaptersRead
  mediaIds
`;

/**
 * `UserStatsSectionSchema` is a string representing the GraphQL selection set for a user's aggregate stats.
 * It includes watchedTime, chaptersRead, activityHistory, status and score distributions, list scores,
 * and the favoured genres, tags, actors, staff, studios, years, and formats overviews.
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
