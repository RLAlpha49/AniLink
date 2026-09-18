/**
 * The `fields` option and the type-level narrowing it drives, plus the
 * always-selected-key policy lists the composer and the operation classes
 * share.
 *
 * ## How a union path resolves
 *
 * A response union (e.g. `Activity`) is routed through
 * `NamedUnionMembers`, which maps each member to its selection-scope name:
 * the three activity discriminants via `ActivityKinds`, the notification
 * variants via `NotificationKinds`, and the `Likeable` members structurally.
 * `FieldPathInto` then offers `QualifiedFieldPath` — paths qualified by the
 * scope name (`"TextActivity.text"`) — instead of the members' bare keys,
 * because a bare key like `"text"` is ambiguous across members. The same
 * scope name is a scope, not a field: it never renders as a property in the
 * composed document, and `DeepPickUnion` re-bases paths that continue past it
 * onto the member's own fields.
 *
 * Worked example — `"notifications.ActivityMentionNotification.activity.TextActivity.id"`
 * on a page query: `Page.notifications` resolves to the notification union;
 * `ActivityMentionNotification` selects that member's scope; its `activity`
 * field is the activity union, so `TextActivity` selects that member's
 * scope; `id` is then an ordinary field of `TextActivity`. The composed
 * document keeps only the two matching inline fragments, and `DeepPick`
 * yields `{ activity: { id: number } }` for that member.
 *
 * @see https://docs.anilist.co/reference/query
 */

import type { Activity, ActivityReply } from "../../interfaces/Activity";
import type { Likeable, LikeableThread, LikeableThreadComment } from "../../interfaces/Likeable";
import type { NotificationResponse } from "../../interfaces/responses/query/Notification";
import type { Thread, ThreadComment } from "../../interfaces/Thread";

/**
 * Compile-time drift guards for the selection-scope maps below.
 *
 * The maps hand-duplicate knowledge that also lives in the generated
 * interfaces; these asserts make disagreement a build failure instead of a
 * silent capability gap (a member missing from a map simply stops being
 * offered by `FieldPath`, with no error anywhere). Each guard holds only
 * while the map's values exactly cover the union's `type` values.
 */
type AssertCovers<Values extends string, Expected extends Values> = [Expected] extends [Values]
    ? [Values] extends [Expected]
        ? true
        : never
    : never;

/** `ActivityKinds` must cover exactly the `type` values of the `Activity` union. */
type ActivityKindsCovers = AssertCovers<Activity["type"], ActivityKinds[keyof ActivityKinds]>;

/** `NotificationKinds` must cover exactly the `type` values of the notification union. */
type NotificationKindsCovers = AssertCovers<
    NotificationResponse["type"],
    NotificationKinds[keyof NotificationKinds]
>;

/**
 * The `Likeable` member map must match the `Likeable` union exactly: the
 * activity discriminants through `ActivityKinds`, the other three members
 * structurally. A member added to `Likeable` without a map entry stops being
 * selectable; a map entry without a union member offers paths the runtime
 * document cannot select. `Likeable` carries no shared `type` field (only
 * the activity members have one), so the guard asserts mutual assignability
 * against the union the map assumes instead.
 */
type LikeableMembersCover = [Likeable] extends [Activity | ActivityReply | Thread | ThreadComment]
    ? [Activity | ActivityReply | Thread | ThreadComment] extends [Likeable]
        ? true
        : never
    : never;

// The guards are type-level only; these bindings exist so a violation fails
// with the guard's name in the error message instead of an unused-type hint.
// The underscore prefix matches the repo's unused-vars ignore pattern.
const _activityKindsCovers: ActivityKindsCovers = true;
const _notificationKindsCovers: NotificationKindsCovers = true;
const _likeableMembersCover: LikeableMembersCover = true;

/**
 * Keys selected in every composed document for an entity, regardless of the
 * `fields` list.
 *
 * Most entities always select `id` (the handle callers need to follow up with
 * any other call) and, for media, `idMal`. Entities whose response has no
 * `id` (e.g. `MediaTrend`, `SiteStatistics`) pass an empty list.
 *
 * The `_ALWAYS` constants typed by this alias are the single source of truth
 * for the always-keys: the operation class passes its constant to the
 * composer at runtime, and the facade generator parses the same constant
 * for the {@link DeepPick} narrowing, so the two can never drift.
 *
 * @see https://docs.anilist.co/reference/query
 */
export type SelectionAlways = readonly string[];

/**
 * Keys selected in every composed page document: the pagination metadata the
 * shared `paginate` helpers walk.
 *
 * Defined once here because every page query selects the same always-keys;
 * page classes import this constant instead of each declaring a copy.
 *
 * @see https://docs.anilist.co/reference/object/pageinfo
 */
export const PAGE_ALWAYS: SelectionAlways = ["pageInfo"];

/**
 * Generated responses omit `__typename`; these names belong to selection
 * scopes only. The compile-time guards above fail the build when this map
 * drifts from the generated `Activity` union's `type` values.
 */
type ActivityKinds = {
    TextActivity: "TEXT";
    ListActivity: "ANIME_LIST" | "MANGA_LIST";
    MessageActivity: "MESSAGE";
};

/**
 * The notification scope map; guarded against drift from the generated
 * `NotificationResponse` union by the compile-time guards above.
 */
type NotificationKinds = {
    AiringNotification: "AIRING";
    FollowingNotification: "FOLLOWING";
    ActivityMessageNotification: "ACTIVITY_MESSAGE";
    ActivityMentionNotification: "ACTIVITY_MENTION";
    ActivityReplyNotification: "ACTIVITY_REPLY";
    ActivityLikeNotification: "ACTIVITY_LIKE";
    ActivityReplyLikeNotification: "ACTIVITY_REPLY_LIKE";
    ActivityReplySubscribedNotification: "ACTIVITY_REPLY_SUBSCRIBED";
    ThreadCommentMentionNotification: "THREAD_COMMENT_MENTION";
    ThreadCommentReplyNotification: "THREAD_COMMENT_REPLY";
    ThreadCommentSubscribedNotification: "THREAD_SUBSCRIBED";
    ThreadCommentLikeNotification: "THREAD_COMMENT_LIKE";
    ThreadLikeNotification: "THREAD_LIKE";
    RelatedMediaAdditionNotification: "RELATED_MEDIA_ADDITION";
    MediaDataChangeNotification: "MEDIA_DATA_CHANGE";
    MediaMergeNotification: "MEDIA_MERGE";
    MediaDeletionNotification: "MEDIA_DELETION";
};

/** Keep nested schema shapes rather than replacing them with full response interfaces. */
type DiscriminantMember<Response, Kind> = Response extends { type: infer Values }
    ? [Extract<Values, Kind>] extends [never]
        ? never
        : [Values] extends [Kind]
          ? Response
          : Omit<Response, "type"> & { type: Extract<Values, Kind> }
    : never;

type DiscriminantMembers<Response, Kinds> = {
    [
        Name in keyof Kinds as [DiscriminantMember<Response, Kinds[Name]>] extends [never]
            ? never
            : Name
    ]: DiscriminantMember<Response, Kinds[Name]>;
};

/** A standalone object with a grouped `type` property is not a fragment-only union. */
type IsUnion<T, Whole = T> = T extends Whole ? ([Whole] extends [T] ? false : true) : never;

type DiscriminatedUnionMembers<T> =
    true extends IsUnion<T>
        ? [T] extends [{ type: ActivityKinds[keyof ActivityKinds] }]
            ? DiscriminantMembers<T, ActivityKinds>
            : [T] extends [{ type: NotificationKinds[keyof NotificationKinds] }]
              ? DiscriminantMembers<T, NotificationKinds>
              : never
        : never;

/**
 * Likeable also contains objects without a discriminant, so match that union
 * exactly. The member map is guarded against drift from the generated
 * `Likeable` union by the compile-time guards above.
 */
type NamedUnionMembers<T> = [Likeable] extends [T]
    ? [T] extends [Likeable]
        ? DiscriminantMembers<Activity, ActivityKinds> & {
              ActivityReply: ActivityReply;
              Thread: LikeableThread;
              ThreadComment: LikeableThreadComment;
          }
        : DiscriminatedUnionMembers<T>
    : DiscriminatedUnionMembers<T>;

/** Unwraps `T` when it is an array type, so paths address the element shape. */
type UnwrapArray<T> = T extends readonly (infer E)[] ? E : T;

/**
 * The dot paths accepted by an operation's `fields` option.
 *
 * A path is a field chain into the response type: `"title"`,
 * `"title.romaji"`, `"tags.name"`, `"media.title.romaji"` on page queries.
 * Every segment is checked against the response type: arrays are unwrapped
 * (so `"media.title"` addresses the media element's shape), object fields
 * drill into their own keys, and scalar fields terminate the path — an
 * unknown key or a step through a scalar is a compile-time error. The
 * composer validates paths again at runtime, so JavaScript callers get the
 * same rejections as `AniLinkValidationError`s.
 *
 * Known fragment-only response unions require type scopes such as `"TextActivity.text"`
 * and `"activities.ListActivity.media.title.romaji"`. Standalone member objects
 * do not accept a type prefix.
 *
 * @see https://docs.anilist.co/reference/query
 */
export type FieldPath<Response> = FieldPathInto<UnwrapArray<Response>>;

/**
 * The value a path segment drills into: the array element with
 * `null`/`undefined` stripped, so optional objects and lists both drill.
 */
type DrillInto<Value> = NonNullable<UnwrapArray<Value>>;

/**
 * Whether a field value can be followed by a deeper path segment: only
 * object values (never scalars or functions) accept drilling.
 */
type IsDrillable<Value> =
    DrillInto<Value> extends object
        ? DrillInto<Value> extends (...args: never[]) => unknown
            ? false
            : true
        : false;

/** Fragment-only unions expose qualified paths; standalone objects keep ordinary keys. */
type FieldPathInto<T> = [NamedUnionMembers<NonNullable<T>>] extends [never]
    ? ObjectFieldPath<T>
    : QualifiedFieldPath<NamedUnionMembers<NonNullable<T>>>;

type ObjectFieldPath<T> = T extends object
    ? {
          [K in keyof T & string]: true extends IsDrillable<T[K]>
              ? K | `${K}.${FieldPathInto<DrillInto<T[K]>>}`
              : K;
      }[keyof T & string]
    : never;

type QualifiedFieldPath<Members> = [Members] extends [never]
    ? never
    : {
          [Name in keyof Members & string]: Name | `${Name}.${ObjectFieldPath<Members[Name]>}`;
      }[keyof Members & string];

/**
 * The `fields` option accepted by operations with a selection surface.
 *
 * `fields` lists the response paths the caller wants; the operation composes
 * its document from the corresponding selections and the return type narrows
 * to {@link DeepPick}. Omit it for the maximal selection and full response.
 *
 * @see https://docs.anilist.co/reference/query
 */
export type FieldsSelection<Response> = {
    fields?: readonly FieldPath<Response>[];
};

/**
 * The return type of the implementation signature every `fields` operation
 * method carries.
 *
 * The public surface is the three-overload pattern: the default call returns
 * the full response, a call with `fields: undefined` (the conditional-value
 * pattern) also returns the full response, and a call with `fields` narrows
 * to `DeepPick<Response, K | Always>` — the always-selected keys join the
 * pick because the composed document always sends them. This alias types the
 * implementation signature's return (the fourth, non-public member of that
 * pattern) so the operation classes share one declaration instead of
 * hand-writing the union return type each time.
 *
 * @see https://docs.anilist.co/reference/query
 */
export type FieldsResult<Response, Always extends string = never> = Promise<
    Response | DeepPick<Response, FieldPath<Response> | Always>
>;

/**
 * The result of stripping the `fields` option off a per-call options object.
 *
 * @see https://docs.anilist.co/reference/query
 */
export interface SplitFieldsOption<Options extends object> {
    /** The caller-requested paths, or `undefined` for the maximal selection. */
    fields: readonly string[] | undefined;
    /** The remaining transport options, with `fields` removed. */
    transportOptions: Options;
}

/**
 * The per-call options as the implementation signature sees them: any
 * `fields` value, because the public overloads already constrain it to
 * {@link FieldPath}s of the operation's response.
 */
type AnyFieldsSelection = {
    fields?: readonly string[];
};

/**
 * Split a per-call options object into its `fields` selection and the
 * remaining transport options.
 *
 * Every operation with a selection surface calls this once instead of
 * hand-destructuring, so the normalization (`null` rejected by the composer,
 * `undefined` meaning maximal) lives in exactly one place.
 *
 * @param options - The per-call options object, or `undefined`.
 * @returns The `fields` value and the transport options without it.
 * @see https://docs.anilist.co/reference/query
 */
export function splitFieldsOption<Options extends object>(
    options: (Options & AnyFieldsSelection) | null | undefined
): SplitFieldsOption<Options> {
    // `null` is treated like `undefined`: a JS caller passing
    // `options: null` means "no options", not a maximal-selection request,
    // and destructuring `null` would throw. The composer still rejects a
    // `fields: null` value passed inside a real options object.
    if (options === undefined || options === null) {
        return { fields: undefined, transportOptions: {} as Options };
    }
    const { fields, ...transportOptions } = options;
    return { fields, transportOptions: transportOptions as Options };
}

/** Gather sibling paths before recursing, so nested union selections stay correlated. */
type PathHead<K extends string> = K extends `${infer Head}.${string}` ? Head : K;

type PathTail<K extends string, Head extends string> = K extends `${Head}.${infer Rest}`
    ? Rest
    : never;

type DeepPickObject<Response, K extends string> = {
    [Head in PathHead<K> & keyof Response]: Head extends K
        ? Response[Head]
        : DeepPick<Response[Head], PathTail<K, Head>>;
};

/** Fragment names select members but never become response wrapper properties. */
type DeepPickUnion<Members, K extends string> = {
    [Name in keyof Members & string]: Name extends K
        ? Members[Name]
        : DeepPickObject<
              Members[Name],
              | Exclude<K, (keyof Members & string) | `${keyof Members & string}.${string}`>
              | PathTail<K, Name>
          >;
}[keyof Members & string];

/** Preserve the existing non-object fallback while keeping union detection nondistributive. */
type DeepPickResponse<Response, K extends string> = Response extends readonly (infer E)[]
    ? DeepPick<E, K>[]
    : Response extends object
      ? DeepPickObject<Response, K>
      : unknown;

/**
 * Narrow a response type by the `fields` paths actually passed.
 *
 * Each path contributes one object: a whole-field path (`"title"`) keeps the
 * field's full type; a nested path (`"title.romaji"`) picks that key out of
 * the field's type, unwrapping arrays along the way (`"tags.name"` →
 * `{ tags: { name: string }[] }`). Paths sharing a head merge into one
 * selection, and so one key of the result.
 *
 * For a union response, type scopes select fields on their matching member
 * without adding a wrapper property. The result is a union: the member(s)
 * whose fields were selected contribute their picked shape, and every other
 * member contributes an empty object. Read a selected field by narrowing
 * first — either on the field's presence (`"text" in result`) or, when the
 * `type` discriminant is selected on every member, on it
 * (`result.type === "TEXT"`):
 *
 * ```typescript
 * const result = await client.anilist.query.activity(
 *     { id: 1 },
 *     {
 *         fields: [
 *             "TextActivity.type",
 *             "TextActivity.text",
 *             "ListActivity.type",
 *             "MessageActivity.type",
 *         ],
 *     }
 * );
 * if (result.type === "TEXT") {
 *     console.log(result.text);
 * }
 * ```
 *
 * @see https://docs.anilist.co/reference/query
 */
export type DeepPick<Response, K extends string> = [NamedUnionMembers<Response>] extends [never]
    ? DeepPickResponse<Response, K>
    : DeepPickUnion<NamedUnionMembers<Response>, K>;
