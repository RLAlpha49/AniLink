/**
 * Generation manifest for the response interfaces under
 * `src/apis/anilist/interfaces/`.
 *
 * Each output derives its exported types from a schema-fragment constant under
 * `src/apis/anilist/schemas/`, resolved against the committed AniList schema
 * snapshot. Adding or removing a fragment field is reflected by rerunning
 * `npm run interfaces:generate` — no interface edit required.
 *
 * Overrides encode deliberate typing decisions that mechanical resolution
 * cannot make:
 * - `fieldTypes` pins enum aliases from `src/apis/anilist/types/`,
 *   discriminator literals for unions, references to handwritten aggregate
 *   interfaces, and compatibility shapes (e.g. `unknown[]` placeholders).
 * - `optionalFields` preserves today's handwritten optionality instead of
 *   narrowing it from upstream nullability.
 *
 * Every interface file under `src/apis/anilist/interfaces/` is fully generated
 * EXCEPT these deliberately handwritten single-sources (they have no faithful
 * schema-fragment or operation twin):
 * - `Stat.ts` / `Favoured.ts` — superset unions across per-slot discriminator
 *   selections; generating one shape per slot would change the GraphQL queries.
 * - `Staff.ts` / `Studio.ts` — shared sub-shapes referenced by the supersets
 *   above and by generated responses; they correspond to no single fragment.
 *
 * Operation-derived outputs (`responses/page/*`, `AniChartUserResponse`,
 * `ExternalLinkSourceCollectionResponse`, `MediaTagCollectionResponse`,
 * `DeleteMediaListEntryResponse`, and the `Thread` aliases) are generated from
 * the operation files' inline documents, so they always mirror what the client
 * actually sends.
 */
import type { OutputSpec } from "../lib/interfaces-codegen/run";

export interface GeneratorConfig {
    /** Committed introspection snapshot consumed by `anilist:api:compare`. */
    schemaSnapshotPath: string;
    /** Directory holding the handwritten selection-set constants. */
    schemasDir: string;
    outputs: OutputSpec[];
    /** Generated-referenced alias types that live outside the interfaces tree. */
    aliasImports: Record<string, string>;
}

const SEE = {
    activityReply: "https://docs.anilist.co/reference/object/activityreply",
    textActivity: "https://docs.anilist.co/reference/object/textactivity",
    listActivity: "https://docs.anilist.co/reference/object/listactivity",
    messageActivity: "https://docs.anilist.co/reference/object/messageactivity",
    activityUnion: "https://docs.anilist.co/reference/union/activityunion",
    notificationUnion: "https://docs.anilist.co/reference/union/notificationunion",
    user: "https://docs.anilist.co/reference/object/user",
    thread: "https://docs.anilist.co/reference/object/thread",
    threadComment: "https://docs.anilist.co/reference/object/threadcomment",
    mediaCoverImage: "https://docs.anilist.co/reference/object/mediacoverimage",
    scoredistribution: "https://docs.anilist.co/reference/object/scoredistribution",
    statusdistribution: "https://docs.anilist.co/reference/object/statusdistribution",
    mediaExternalLink: "https://docs.anilist.co/reference/object/mediaexternallink",
    fuzzyDate: "https://docs.anilist.co/reference/object/fuzzydate",
    characterImage: "https://docs.anilist.co/reference/object/characterimage",
    medialist: "https://docs.anilist.co/reference/object/medialist",
    characterName: "https://docs.anilist.co/reference/object/charactername",
    airingSchedule: "https://docs.anilist.co/reference/object/airingschedule",
    mediarank: "https://docs.anilist.co/reference/object/mediarank",
    siteTrend: "https://docs.anilist.co/reference/object/sitetrend",
    siteTrendConnection: "https://docs.anilist.co/reference/object/sitetrendconnection",
    mediaStreamingEpisode: "https://docs.anilist.co/reference/object/mediastreamingepisode",
    studio: "https://docs.anilist.co/reference/object/studio",
    mediaTag: "https://docs.anilist.co/reference/object/mediatag",
    mediaTitle: "https://docs.anilist.co/reference/object/mediatitle",
    mediaTrailer: "https://docs.anilist.co/reference/object/mediatrailer",
    media: "https://docs.anilist.co/reference/object/media",
    staff: "https://docs.anilist.co/reference/object/staff",
    character: "https://docs.anilist.co/reference/object/character",
    mediaListCollection: "https://docs.anilist.co/reference/object/medialistcollection",
    mediaTrend: "https://docs.anilist.co/reference/object/mediatrend",
    recommendation: "https://docs.anilist.co/reference/object/recommendation",
    review: "https://docs.anilist.co/reference/object/review",
    siteStatistics: "https://docs.anilist.co/reference/object/sitestatistics",
    favourites: "https://docs.anilist.co/reference/object/favourites",
    likeableMutation: "https://docs.anilist.co/reference/mutation",
    activityHistory: "https://docs.anilist.co/reference/object/useractivityhistory",
    listScores: "https://docs.anilist.co/reference/object/listscorestats",
    mediaStats: "https://docs.anilist.co/reference/object/mediastats",
    mediaStatistics: "https://docs.anilist.co/reference/object/userstatistics",
    statistics: "https://docs.anilist.co/reference/object/userstatistictypes",
    userStats: "https://docs.anilist.co/reference/object/userstats",
    pageInfo: "https://docs.anilist.co/reference/object/pageinfo",
    deleted: "https://docs.anilist.co/reference/object/deleted",
    anichartUser: "https://docs.anilist.co/reference/object/anichartuser",
} as const;

/**
 * Builds a paginated Page response output derived from the operation file's
 * inline document. The element type resolves automatically from the operation's
 * interpolated schema fragment; only `pageInfo` is pinned to the generated
 * PageInfo interface. Wrappers whose element fragment backs a union alias
 * (Activities, Notifications) pin the element reference explicitly because
 * union sources claim no constant mapping.
 */
function pageWrapper(
    name: string,
    elementField: string,
    elementSee: string,
    summary: string,
    extraFieldTypes?: Record<string, { refType: string }>
): OutputSpec {
    return {
        path: `src/apis/anilist/interfaces/responses/page/${name}.ts`,
        mode: "file",
        exports: [
            {
                exportedName: `${name}PageResponse`,
                see: elementSee,
                summary,
                graphqlType: "Page",
                source: {
                    operation: { file: `src/apis/anilist/query/page/${name}.ts` },
                    unwrappedOperation: true,
                    wrapped: true,
                },
                fieldTypes: {
                    pageInfo: { refType: "PageInfo" },
                    ...extraFieldTypes,
                },
            },
        ],
    };
}

export const generatorConfig: GeneratorConfig = {
    schemaSnapshotPath: "scripts/anilist-api-compare/anilist-schema.json",
    schemasDir: "src/apis/anilist/schemas",
    aliasImports: {
        MediaFormat: "src/apis/anilist/types/Format.ts",
        ScoreFormat: "src/apis/anilist/types/Format.ts",
        MediaSeason: "src/apis/anilist/types/Season.ts",
        MediaSource: "src/apis/anilist/types/Source.ts",
        MediaStatus: "src/apis/anilist/types/Status.ts",
        MediaType: "src/apis/anilist/types/Type.ts",
        NotificationType: "src/apis/anilist/types/Type.ts",
        UserStaffNameLanguage: "src/apis/anilist/types/UserStaffNameLanguage.ts",
        UserTitleLanguage: "src/apis/anilist/types/UserTitleLanguage.ts",
    },
    scalarTypes: {
        CountryCode: "string",
        Json: "unknown",
    },
    outputs: [
        // ------------------------------------------------------------------
        // Shared entity shapes (schemas/ root)
        // ------------------------------------------------------------------
        {
            path: "src/apis/anilist/interfaces/FuzzyDate.ts",
            mode: "file",
            exports: [
                {
                    exportedName: "FuzzyDate",
                    see: SEE.fuzzyDate,
                    summary: "a fuzzy date with optional year, month, and day components.",
                    graphqlType: "FuzzyDate",
                    source: { constant: "FuzzyDateSchema" },
                },
            ],
        },
        {
            path: "src/apis/anilist/interfaces/Image.ts",
            mode: "file",
            exports: [
                {
                    exportedName: "Image",
                    see: SEE.characterImage,
                    summary: "an image resource in its large and medium variants.",
                    graphqlType: "CharacterImage",
                    source: { constant: "ImageSchema", wrapped: true },
                },
            ],
        },
        {
            path: "src/apis/anilist/interfaces/CoverImage.ts",
            mode: "file",
            exports: [
                {
                    exportedName: "CoverImage",
                    see: SEE.mediaCoverImage,
                    summary: "a media cover image.",
                    graphqlType: "MediaCoverImage",
                    source: { constant: "CoverImageSchema", wrapped: true },
                },
            ],
        },
        {
            path: "src/apis/anilist/interfaces/Title.ts",
            mode: "file",
            exports: [
                {
                    exportedName: "Title",
                    see: SEE.mediaTitle,
                    summary: "the localized title variants of a media.",
                    graphqlType: "MediaTitle",
                    source: { constant: "TitleSchema", wrapped: true },
                },
            ],
        },
        {
            path: "src/apis/anilist/interfaces/Name.ts",
            mode: "file",
            exports: [
                {
                    exportedName: "Name",
                    see: SEE.characterName,
                    summary: "the name parts of a character or staff member.",
                    graphqlType: "CharacterName",
                    source: { constant: "NameSchema", wrapped: true },
                },
            ],
        },
        {
            path: "src/apis/anilist/interfaces/Tag.ts",
            mode: "file",
            exports: [
                {
                    exportedName: "Tag",
                    see: SEE.mediaTag,
                    summary: "a content tag attached to a media.",
                    graphqlType: "MediaTag",
                    source: { constant: "TagSchema" },
                },
            ],
        },
        {
            path: "src/apis/anilist/interfaces/Trailer.ts",
            mode: "file",
            exports: [
                {
                    exportedName: "Trailer",
                    see: SEE.mediaTrailer,
                    summary: "a media trailer hosted on an external site.",
                    graphqlType: "MediaTrailer",
                    source: { constant: "TrailerSchema", wrapped: true },
                },
            ],
        },
        {
            path: "src/apis/anilist/interfaces/NextAiringEpisode.ts",
            mode: "file",
            exports: [
                {
                    exportedName: "NextAiringEpisode",
                    see: SEE.airingSchedule,
                    summary: "the upcoming airing schedule entry of an anime.",
                    graphqlType: "AiringSchedule",
                    source: { constant: "NextAiringEpisodeSchema", wrapped: true },
                },
            ],
        },
        {
            path: "src/apis/anilist/interfaces/ExternalLink.ts",
            mode: "file",
            exports: [
                {
                    exportedName: "ExternalLink",
                    see: SEE.mediaExternalLink,
                    summary: "an external link associated with a media.",
                    graphqlType: "MediaExternalLink",
                    source: { constant: "ExternalLinkSchema", wrapped: true },
                },
            ],
        },
        {
            path: "src/apis/anilist/interfaces/StreamingEpisode.ts",
            mode: "file",
            exports: [
                {
                    exportedName: "StreamingEpisode",
                    see: SEE.mediaStreamingEpisode,
                    summary: "a streaming episode of a media on a provider site.",
                    graphqlType: "MediaStreamingEpisode",
                    source: { constant: "StreamingEpisodeSchema", wrapped: true },
                },
            ],
        },
        {
            path: "src/apis/anilist/interfaces/Ranking.ts",
            mode: "file",
            exports: [
                {
                    exportedName: "Ranking",
                    see: SEE.mediarank,
                    summary: "a media ranking on a ranked chart.",
                    graphqlType: "MediaRank",
                    source: { constant: "RankingSchema", wrapped: true },
                },
            ],
        },
        {
            path: "src/apis/anilist/interfaces/Basic.ts",
            mode: "file",
            exports: [
                {
                    exportedName: "BasicUser",
                    see: SEE.user,
                    summary: "the minimal user shape embedded in likes and replies.",
                    graphqlType: "User",
                    source: { constant: "BasicUserSchema" },
                },
                {
                    exportedName: "BasicThread",
                    see: SEE.thread,
                    summary: "the minimal thread shape embedded in notifications.",
                    graphqlType: "Thread",
                    source: { constant: "BasicThreadSchema" },
                },
                {
                    exportedName: "BasicComment",
                    see: SEE.threadComment,
                    summary: "the minimal thread-comment shape embedded in notifications.",
                    graphqlType: "ThreadComment",
                    source: { constant: "BasicCommentSchema" },
                },
            ],
        },
        {
            path: "src/apis/anilist/interfaces/SiteTrend.ts",
            mode: "file",
            exports: [
                {
                    exportedName: "SiteTrend",
                    see: SEE.siteTrend,
                    summary: "a daily AniList activity statistic.",
                    graphqlType: "SiteTrend",
                    source: { constant: "SiteTrendSchema" },
                },
                {
                    exportedName: "SiteTrendConnection",
                    see: SEE.siteTrendConnection,
                    summary: "a paginated connection of site trends.",
                    graphqlType: "SiteTrendConnection",
                    source: { constant: "SiteTrendConnectionSchema" },
                },
            ],
        },
        {
            path: "src/apis/anilist/interfaces/Distribution.ts",
            mode: "file",
            exports: [
                {
                    exportedName: "ScoreDistribution",
                    see: SEE.scoredistribution,
                    summary: "how many media fall into each 10-point score bucket.",
                    graphqlType: "ScoreDistribution",
                    source: { constant: "ScoreDistributionSchema", wrapped: true },
                },
                {
                    exportedName: "StatusDistribution",
                    see: SEE.statusdistribution,
                    summary: "how many media carry each list status.",
                    graphqlType: "StatusDistribution",
                    source: { constant: "StatusDistributionSchema", wrapped: true },
                },
            ],
        },
        {
            path: "src/apis/anilist/interfaces/ActivityHistory.ts",
            mode: "file",
            exports: [
                {
                    exportedName: "ActivityHistory",
                    see: SEE.activityHistory,
                    summary: "a daily activity history entry of a user.",
                    graphqlType: "UserActivityHistory",
                    source: { constant: "ActivityHistorySchema" },
                },
            ],
        },
        {
            path: "src/apis/anilist/interfaces/ListScores.ts",
            mode: "file",
            exports: [
                {
                    exportedName: "ListScores",
                    see: SEE.listScores,
                    summary: "the mean score and score deviation of a user's list.",
                    graphqlType: "ListScoreStats",
                    source: { constant: "ListScoresSchema" },
                },
            ],
        },
        {
            path: "src/apis/anilist/interfaces/MediaStats.ts",
            mode: "file",
            exports: [
                {
                    exportedName: "MediaStats",
                    see: SEE.mediaStats,
                    summary: "aggregate score and status distributions for a media.",
                    graphqlType: "MediaStats",
                    source: { constant: "MediaStatsSchema" },
                },
            ],
        },
        // ------------------------------------------------------------------
        // Activity entities and unions
        // ------------------------------------------------------------------
        {
            path: "src/apis/anilist/interfaces/Activity.ts",
            mode: "file",
            exports: [
                {
                    exportedName: "ActivityReply",
                    see: SEE.activityReply,
                    summary: "a reply to an activity.",
                    graphqlType: "ActivityReply",
                    source: { constant: "ActivityReplySchema" },
                },
                {
                    exportedName: "TextActivity",
                    see: SEE.textActivity,
                    summary: "a text status activity of a user.",
                    graphqlType: "TextActivity",
                    source: { constant: "TextActivitySchema" },
                    fieldTypes: { type: { tsType: '"TEXT"' } },
                },
                {
                    exportedName: "ListActivity",
                    see: SEE.listActivity,
                    summary: "a list update activity of a user.",
                    graphqlType: "ListActivity",
                    source: { constant: "ListActivitySchema" },
                    fieldTypes: { type: { tsType: '"ANIME_LIST" | "MANGA_LIST"' } },
                },
                {
                    exportedName: "MessageActivity",
                    see: SEE.messageActivity,
                    summary: "a direct message activity between two users.",
                    graphqlType: "MessageActivity",
                    source: { constant: "MessageActivitySchema" },
                    fieldTypes: { type: { tsType: '"MESSAGE"' } },
                },
                {
                    exportedName: "Activity",
                    see: SEE.activityUnion,
                    summary:
                        "a single activity returned by the activity query and activity mutations; narrow on the literal `type` field.",
                    graphqlType: "ActivityUnion",
                    source: {},
                    unionMembers: ["TextActivity", "ListActivity", "MessageActivity"],
                },
                {
                    exportedName: "ActivityNotification",
                    see: SEE.notificationUnion,
                    summary:
                        "an activity-related notification; narrow on the literal `type` field.",
                    graphqlType: "ActivityMentionNotification",
                    source: { constant: "ActivityNotificationSchema" },
                    fieldTypes: {
                        type: {
                            tsType: '"ACTIVITY_MENTION" | "ACTIVITY_REPLY" | "ACTIVITY_LIKE" | "ACTIVITY_REPLY_LIKE" | "ACTIVITY_REPLY_SUBSCRIBED"',
                        },
                        activity: { refType: "Activity" },
                    },
                },
            ],
        },
        {
            path: "src/apis/anilist/interfaces/Likeable.ts",
            mode: "file",
            exports: [
                {
                    exportedName: "Likeable",
                    see: SEE.likeableMutation,
                    summary:
                        "a likeable entity returned by ToggleLikeV2; narrow structurally because only activities carry a `type` discriminator.",
                    graphqlType: "LikeableUnion",
                    source: {},
                    unionMembers: ["Activity", "ActivityReply", "Thread", "ThreadComment"],
                },
            ],
        },
        // ------------------------------------------------------------------
        // Notification members and union
        // ------------------------------------------------------------------
        {
            path: "src/apis/anilist/interfaces/Notification.ts",
            mode: "file",
            exports: [
                {
                    exportedName: "ThreadNotification",
                    see: SEE.notificationUnion,
                    summary: "a thread-comment notification; narrow on the literal `type` field.",
                    graphqlType: "ThreadCommentMentionNotification",
                    source: { constant: "ThreadNotificationSchema" },
                    fieldTypes: {
                        type: {
                            tsType: '"THREAD_COMMENT_MENTION" | "THREAD_COMMENT_REPLY" | "THREAD_SUBSCRIBED" | "THREAD_COMMENT_LIKE"',
                        },
                    },
                },
                {
                    exportedName: "AiringNotification",
                    see: SEE.notificationUnion,
                    summary: 'an episode-airing notification; `type` is always "AIRING".',
                    graphqlType: "AiringNotification",
                    source: { constant: "NotificationSchema", condition: "AiringNotification" },
                    fieldTypes: { type: { tsType: '"AIRING"' } },
                },
                {
                    exportedName: "FollowingNotification",
                    see: SEE.notificationUnion,
                    summary: 'a new-follower notification; `type` is always "FOLLOWING".',
                    graphqlType: "FollowingNotification",
                    source: { constant: "NotificationSchema", condition: "FollowingNotification" },
                    fieldTypes: { type: { tsType: '"FOLLOWING"' } },
                },
                {
                    exportedName: "ActivityMessageNotification",
                    see: SEE.notificationUnion,
                    summary: 'a direct-message notification; `type` is always "ACTIVITY_MESSAGE".',
                    graphqlType: "ActivityMessageNotification",
                    source: {
                        constant: "NotificationSchema",
                        condition: "ActivityMessageNotification",
                    },
                    fieldTypes: { type: { tsType: '"ACTIVITY_MESSAGE"' } },
                },
                {
                    exportedName: "ThreadLikeNotification",
                    see: SEE.notificationUnion,
                    summary: 'a thread-like notification; `type` is always "THREAD_LIKE".',
                    graphqlType: "ThreadLikeNotification",
                    source: { constant: "NotificationSchema", condition: "ThreadLikeNotification" },
                    fieldTypes: { type: { tsType: '"THREAD_LIKE"' } },
                },
                {
                    exportedName: "RelatedMediaAdditionNotification",
                    see: SEE.notificationUnion,
                    summary:
                        'a media-added-to-list notification; `type` is always "RELATED_MEDIA_ADDITION".',
                    graphqlType: "RelatedMediaAdditionNotification",
                    source: {
                        constant: "NotificationSchema",
                        condition: "RelatedMediaAdditionNotification",
                    },
                    fieldTypes: { type: { tsType: '"RELATED_MEDIA_ADDITION"' } },
                },
                {
                    exportedName: "MediaDataChangeNotification",
                    see: SEE.notificationUnion,
                    summary:
                        'a media data-change notification; `type` is always "MEDIA_DATA_CHANGE".',
                    graphqlType: "MediaDataChangeNotification",
                    source: {
                        constant: "NotificationSchema",
                        condition: "MediaDataChangeNotification",
                    },
                    fieldTypes: { type: { tsType: '"MEDIA_DATA_CHANGE"' } },
                },
                {
                    exportedName: "MediaMergeNotification",
                    see: SEE.notificationUnion,
                    summary: 'a media-merge notification; `type` is always "MEDIA_MERGE".',
                    graphqlType: "MediaMergeNotification",
                    source: { constant: "NotificationSchema", condition: "MediaMergeNotification" },
                    fieldTypes: { type: { tsType: '"MEDIA_MERGE"' } },
                },
                {
                    exportedName: "MediaDeletionNotification",
                    see: SEE.notificationUnion,
                    summary: 'a media-deletion notification; `type` is always "MEDIA_DELETION".',
                    graphqlType: "MediaDeletionNotification",
                    source: {
                        constant: "NotificationSchema",
                        condition: "MediaDeletionNotification",
                    },
                    fieldTypes: { type: { tsType: '"MEDIA_DELETION"' } },
                },
            ],
        },
        {
            path: "src/apis/anilist/interfaces/responses/query/Notification.ts",
            mode: "file",
            exports: [
                {
                    exportedName: "NotificationResponse",
                    see: SEE.notificationUnion,
                    summary:
                        "a single notification returned by the notification query; narrow on the literal `type` field.",
                    graphqlType: "NotificationUnion",
                    source: {},
                    unionMembers: [
                        "AiringNotification",
                        "FollowingNotification",
                        "ActivityMessageNotification",
                        "ActivityNotification",
                        "ThreadNotification",
                        "ThreadLikeNotification",
                        "RelatedMediaAdditionNotification",
                        "MediaDataChangeNotification",
                        "MediaMergeNotification",
                        "MediaDeletionNotification",
                    ],
                },
            ],
        },
        {
            path: "src/apis/anilist/interfaces/Media.ts",
            mode: "file",
            exports: [
                {
                    exportedName: "MediaListEntry",
                    see: SEE.medialist,
                    summary: "the viewer's list entry for a media.",
                    graphqlType: "MediaList",
                    source: { constant: "MediaListEntrySchema", wrapped: true },
                },
                {
                    exportedName: "Media",
                    see: SEE.media,
                    summary: "a media entity without relation connections.",
                    graphqlType: "Media",
                    source: { constant: "MediaSchema" },
                    fieldTypes: { stats: { refType: "MediaStats" } },
                    optionalFields: ["episodes", "duration", "chapters", "volumes"],
                },
            ],
        },
        {
            path: "src/apis/anilist/interfaces/responses/query/Media.ts",
            mode: "file",
            exports: [
                {
                    exportedName: "MediaResponse",
                    see: SEE.media,
                    summary:
                        "the full media entity including relation, character, staff, and studio connections.",
                    graphqlType: "Media",
                    source: { constant: "MediaWithRelationsSchema" },
                    fieldTypes: {
                        type: { refType: "MediaType" },
                        format: { refType: "MediaFormat" },
                        status: { refType: "MediaStatus" },
                        season: { refType: "MediaSeason" },
                        source: { refType: "MediaSource" },
                        stats: { refType: "MediaStats" },
                    },
                    optionalFields: ["episodes", "duration", "chapters", "volumes"],
                },
            ],
        },
        {
            path: "src/apis/anilist/interfaces/MediaStatistics.ts",
            mode: "file",
            exports: [
                {
                    exportedName: "MediaStatistics",
                    see: SEE.mediaStatistics,
                    summary: "the per-media-type usage statistics of a user.",
                    graphqlType: "UserStatistics",
                    source: { constant: "StatisticsAnimeSchema", wrapped: true },
                    fieldTypes: {
                        formats: { refType: "Stat" },
                        statuses: { refType: "Stat" },
                        scores: { refType: "Stat" },
                        lengths: { refType: "Stat" },
                        releaseYears: { refType: "Stat" },
                        startYears: { refType: "Stat" },
                        genres: { refType: "Stat" },
                        tags: { refType: "Stat" },
                        countries: { refType: "Stat" },
                        voiceActors: { refType: "Stat" },
                        staff: { refType: "Stat" },
                        studios: { refType: "Stat" },
                    },
                    optionalFields: ["minutesWatched", "episodesWatched", "voiceActors"],
                    extraProperties: [
                        { name: "chaptersRead", tsType: "number" },
                        { name: "volumesRead", tsType: "number" },
                    ],
                },
            ],
        },
        {
            path: "src/apis/anilist/interfaces/Statistics.ts",
            mode: "file",
            exports: [
                {
                    exportedName: "Statistics",
                    see: SEE.statistics,
                    summary: "a user's anime and manga usage statistics.",
                    graphqlType: "UserStatisticTypes",
                    source: { constant: "StatisticsSchema", wrapped: true },
                    fieldTypes: {
                        anime: { refType: "MediaStatistics" },
                        manga: { refType: "MediaStatistics" },
                    },
                },
            ],
        },
        {
            path: "src/apis/anilist/interfaces/UserStats.ts",
            mode: "file",
            exports: [
                {
                    exportedName: "UserStats",
                    see: SEE.userStats,
                    summary:
                        "a user's aggregate activity stats, distributions, list scores, and favoured overviews.",
                    graphqlType: "UserStats",
                    source: { constant: "UserStatsSectionSchema" },
                    fieldTypes: {
                        activityHistory: { refType: "ActivityHistory" },
                        animeStatusDistribution: { refType: "StatusDistribution" },
                        mangaStatusDistribution: { refType: "StatusDistribution" },
                        animeScoreDistribution: { refType: "ScoreDistribution" },
                        mangaScoreDistribution: { refType: "ScoreDistribution" },
                        animeListScores: { refType: "ListScores" },
                        mangaListScores: { refType: "ListScores" },
                        favouredGenresOverview: { refType: "Favoured" },
                        favouredGenres: { refType: "Favoured" },
                        favouredTags: { refType: "Favoured" },
                        favouredActors: { refType: "Favoured" },
                        favouredStaff: { refType: "Favoured" },
                        favouredStudios: { refType: "Favoured" },
                        favouredYears: { refType: "Favoured" },
                        favouredFormats: { refType: "Favoured" },
                    },
                },
            ],
        },
        // ------------------------------------------------------------------
        // Query / mutation responses
        // ------------------------------------------------------------------
        {
            path: "src/apis/anilist/interfaces/responses/query/AiringSchedule.ts",
            mode: "file",
            exports: [
                {
                    exportedName: "AiringScheduleResponse",
                    see: SEE.airingSchedule,
                    summary: "an airing schedule entry together with its media.",
                    graphqlType: "AiringSchedule",
                    source: { constant: "AiringScheduleSchema" },
                },
            ],
        },
        {
            path: "src/apis/anilist/interfaces/responses/query/Character.ts",
            mode: "file",
            exports: [
                {
                    exportedName: "CharacterResponse",
                    see: SEE.character,
                    summary:
                        "a character with their description, name, image, and media appearances.",
                    graphqlType: "Character",
                    source: { constant: "CharacterSchema" },
                },
            ],
        },
        {
            path: "src/apis/anilist/interfaces/responses/query/MediaList.ts",
            mode: "file",
            exports: [
                {
                    exportedName: "MediaListResponse",
                    see: SEE.medialist,
                    summary: "a user's list entry for a media, including the media itself.",
                    graphqlType: "MediaList",
                    source: { constant: "MediaListSchema" },
                    fieldTypes: {
                        customLists: { tsType: "string[] | boolean[]" },
                    },
                },
            ],
        },
        {
            path: "src/apis/anilist/interfaces/responses/query/MediaListCollectionResponse.ts",
            mode: "file",
            exports: [
                {
                    exportedName: "MediaListCollectionResponse",
                    see: SEE.mediaListCollection,
                    summary: "a chunked collection of a user's media lists.",
                    graphqlType: "MediaListCollection",
                    source: {
                        constant: "MediaListCollectionQuerySchema",
                        unwrappedOperation: true,
                        wrapped: true,
                    },
                },
            ],
        },
        {
            path: "src/apis/anilist/interfaces/responses/query/MediaTrend.ts",
            mode: "file",
            exports: [
                {
                    exportedName: "MediaTrendResponse",
                    see: SEE.mediaTrend,
                    summary: "a daily popularity statistic for a media.",
                    graphqlType: "MediaTrend",
                    source: { constant: "MediaTrendSchema" },
                },
            ],
        },
        {
            path: "src/apis/anilist/interfaces/responses/query/Recommendation.ts",
            mode: "file",
            exports: [
                {
                    exportedName: "RecommendationResponse",
                    see: SEE.recommendation,
                    summary: "a media recommendation with its rating and author.",
                    graphqlType: "Recommendation",
                    source: { constant: "RecommendationSchema" },
                },
            ],
        },
        {
            path: "src/apis/anilist/interfaces/responses/query/Review.ts",
            mode: "file",
            exports: [
                {
                    exportedName: "ReviewResponse",
                    see: SEE.review,
                    summary: "a media review with its score, summary, and author.",
                    graphqlType: "Review",
                    source: { constant: "ReviewSchema" },
                },
            ],
        },
        {
            path: "src/apis/anilist/interfaces/responses/query/SiteStatistics.ts",
            mode: "file",
            exports: [
                {
                    exportedName: "SiteStatisticsResponse",
                    see: SEE.siteStatistics,
                    summary:
                        "site-wide statistic connections across users, anime, manga, and more.",
                    graphqlType: "SiteStatistics",
                    source: { constant: "SiteStatisticsSchema" },
                },
            ],
        },
        {
            path: "src/apis/anilist/interfaces/responses/query/Staff.ts",
            mode: "file",
            exports: [
                {
                    exportedName: "StaffResponse",
                    see: SEE.staff,
                    summary: "a staff member with their roles, characters, and media connections.",
                    graphqlType: "Staff",
                    source: { constant: "StaffSchema" },
                    optionalFields: [
                        "submissionStatus",
                        "submissionNotes",
                        "favourites",
                        "modNotes",
                    ],
                },
            ],
        },
        {
            path: "src/apis/anilist/interfaces/responses/query/Studio.ts",
            mode: "file",
            exports: [
                {
                    exportedName: "StudioResponse",
                    see: SEE.studio,
                    summary: "a studio with its produced media connections.",
                    graphqlType: "Studio",
                    source: { constant: "StudioSchema" },
                },
            ],
        },
        {
            path: "src/apis/anilist/interfaces/responses/query/Thread.ts",
            mode: "file",
            exports: [
                {
                    exportedName: "ThreadResponse",
                    see: SEE.thread,
                    summary: "a forum thread with its body, categories, and participants.",
                    graphqlType: "Thread",
                    source: { constant: "ThreadSchema" },
                },
            ],
        },
        {
            path: "src/apis/anilist/interfaces/responses/query/ThreadComment.ts",
            mode: "file",
            exports: [
                {
                    exportedName: "ThreadCommentResponse",
                    see: SEE.threadComment,
                    summary: "a forum-thread comment with its thread, author, and nested replies.",
                    graphqlType: "ThreadComment",
                    source: { constant: "ThreadCommentSchema" },
                },
            ],
        },
        {
            path: "src/apis/anilist/interfaces/responses/mutation/Favourites.ts",
            mode: "file",
            exports: [
                {
                    exportedName: "Favourites",
                    see: SEE.favourites,
                    summary:
                        "the collections of a user's favourite anime, manga, characters, staff, and studios.",
                    graphqlType: "Favourites",
                    source: { constant: "FavouritesSchema" },
                },
            ],
        },
        {
            path: "src/apis/anilist/interfaces/responses/query/User.ts",
            mode: "file",
            exports: [
                {
                    exportedName: "UserResponse",
                    see: SEE.user,
                    summary:
                        "a user with their options, list settings, favourites, statistics, and activity stats.",
                    graphqlType: "User",
                    source: { constant: "UserSchema" },
                    fieldTypes: {
                        bans: { tsType: "string[]" },
                        "options.titleLanguage": { refType: "UserTitleLanguage" },
                        "options.notificationOptions.type": { refType: "NotificationType" },
                        "options.disabledListActivity.type": { refType: "NotificationType" },
                        "options.staffNameLanguage": { refType: "UserStaffNameLanguage" },
                        "mediaListOptions.scoreFormat": { refType: "ScoreFormat" },
                        statistics: { refType: "Statistics" },
                        stats: { refType: "UserStats" },
                        "favourites.characters": { tsType: "unknown[]" },
                        "favourites.staff": { tsType: "unknown[]" },
                        "favourites.studios": { tsType: "unknown[]" },
                    },
                },
            ],
        },
        // ------------------------------------------------------------------
        // Operation-derived responses (page connections and misc operations)
        // ------------------------------------------------------------------
        {
            path: "src/apis/anilist/interfaces/responses/page/PageInfo.ts",
            mode: "file",
            exports: [
                {
                    exportedName: "PageInfo",
                    see: SEE.pageInfo,
                    summary: "pagination metadata returned by Page connections.",
                    graphqlType: "PageInfo",
                    source: {
                        operation: { file: "src/apis/anilist/query/page/Likes.ts" },
                        unwrappedOperation: true,
                        wrapped: 2,
                    },
                },
            ],
        },
        pageWrapper(
            "Activities",
            "activities",
            SEE.activityUnion,
            "a page of activities with pagination metadata.",
            { activities: { refType: "Activity" } }
        ),
        pageWrapper(
            "ActivityReplies",
            "activityReplies",
            SEE.activityReply,
            "a page of activity replies with pagination metadata."
        ),
        pageWrapper(
            "AiringSchedules",
            "airingSchedules",
            SEE.airingSchedule,
            "a page of airing schedule entries with pagination metadata."
        ),
        pageWrapper(
            "Characters",
            "characters",
            SEE.character,
            "a page of characters with pagination metadata."
        ),
        pageWrapper(
            "Followers",
            "followers",
            SEE.user,
            "a page of followers with pagination metadata."
        ),
        pageWrapper(
            "Followings",
            "following",
            SEE.user,
            "a page of followed users with pagination metadata."
        ),
        pageWrapper(
            "Likes",
            "likes",
            SEE.user,
            "the users who liked an entity, with pagination metadata."
        ),
        pageWrapper(
            "MediaLists",
            "mediaList",
            SEE.medialist,
            "a page of media list entries with pagination metadata."
        ),
        pageWrapper("Medias", "media", SEE.media, "a page of media with pagination metadata."),
        pageWrapper(
            "MediaTrends",
            "mediaTrends",
            SEE.mediaTrend,
            "a page of media trends with pagination metadata."
        ),
        pageWrapper(
            "Notifications",
            "notifications",
            SEE.notificationUnion,
            "a page of notifications with pagination metadata.",
            { notifications: { refType: "NotificationResponse" } }
        ),
        pageWrapper(
            "Recommendations",
            "recommendations",
            SEE.recommendation,
            "a page of media recommendations with pagination metadata."
        ),
        pageWrapper(
            "Reviews",
            "reviews",
            SEE.review,
            "a page of media reviews with pagination metadata."
        ),
        pageWrapper(
            "Staffs",
            "staff",
            SEE.staff,
            "a page of staff members with pagination metadata."
        ),
        pageWrapper(
            "Studios",
            "studios",
            SEE.studio,
            "a page of studios with pagination metadata."
        ),
        pageWrapper(
            "ThreadComments",
            "threadComments",
            SEE.threadComment,
            "a page of thread comments with pagination metadata."
        ),
        pageWrapper(
            "Threads",
            "threads",
            SEE.thread,
            "a page of forum threads with pagination metadata."
        ),
        pageWrapper("Users", "users", SEE.user, "a page of users with pagination metadata."),
        {
            path: "src/apis/anilist/interfaces/responses/mutation/DeleteMediaListEntry.ts",
            mode: "file",
            exports: [
                {
                    exportedName: "DeleteMediaListEntryResponse",
                    see: SEE.deleted,
                    summary: "the payload returned after deleting a media list entry.",
                    graphqlType: "Deleted",
                    source: {
                        operation: { file: "src/apis/anilist/mutation/DeleteMediaListEntry.ts" },
                        unwrappedOperation: true,
                        wrapped: true,
                    },
                },
            ],
        },
        {
            path: "src/apis/anilist/interfaces/responses/query/MediaTagCollection.ts",
            mode: "file",
            exports: [
                {
                    exportedName: "MediaTagCollectionResponse",
                    see: SEE.mediaTag,
                    summary: "a media tag as returned by the MediaTagCollection query.",
                    graphqlType: "MediaTag",
                    source: {
                        operation: { file: "src/apis/anilist/query/MediaTagCollection.ts" },
                        unwrappedOperation: true,
                        wrapped: true,
                    },
                },
            ],
        },
        {
            path: "src/apis/anilist/interfaces/responses/query/AniChartUser.ts",
            mode: "file",
            exports: [
                {
                    exportedName: "AniChartUserResponse",
                    see: SEE.anichartUser,
                    summary: "a user's AniChart integration data.",
                    graphqlType: "AniChartUser",
                    source: {
                        operation: { file: "src/apis/anilist/query/AniChartUser.ts" },
                        unwrappedOperation: true,
                        wrapped: true,
                    },
                },
            ],
        },
        {
            path: "src/apis/anilist/interfaces/responses/query/ExternalLinkSourceCollection.ts",
            mode: "file",
            exports: [
                {
                    exportedName: "ExternalLinkSourceCollectionResponse",
                    see: SEE.mediaExternalLink,
                    summary: "an external link source with streaming metadata.",
                    graphqlType: "MediaExternalLink",
                    source: {
                        operation: {
                            file: "src/apis/anilist/query/ExternalLinkSourceCollection.ts",
                        },
                        unwrappedOperation: true,
                        wrapped: true,
                    },
                },
            ],
        },
        {
            path: "src/apis/anilist/interfaces/Thread.ts",
            mode: "file",
            exports: [
                {
                    exportedName: "Thread",
                    see: SEE.thread,
                    summary: "an alias of ThreadResponse for readability at call sites.",
                    graphqlType: "Thread",
                    source: {},
                    unionMembers: ["ThreadResponse"],
                },
                {
                    exportedName: "ThreadComment",
                    see: SEE.threadComment,
                    summary: "an alias of ThreadCommentResponse for readability at call sites.",
                    graphqlType: "ThreadComment",
                    source: {},
                    unionMembers: ["ThreadCommentResponse"],
                },
            ],
        },
    ],
};
