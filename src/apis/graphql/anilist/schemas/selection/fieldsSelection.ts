/**
 * The `fields` option and the type-level narrowing it drives, plus the
 * always-selected-key policy lists the composer and the operation classes
 * share.
 *
 * @see https://docs.anilist.co/reference/query
 */

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
 * for the `DeepPick` narrowing, so the two can never drift.
 */
export type SelectionAlways = readonly string[];

/**
 * Keys selected in every composed page document: the pagination metadata the
 * shared `paginate` helpers walk.
 *
 * Defined once here because every page query selects the same always-keys;
 * page classes import this constant instead of each declaring a copy.
 */
export const PAGE_ALWAYS: SelectionAlways = ["pageInfo"];

/**
 * Collapses a union of object types into their intersection.
 *
 * Maps each union member to a contravariant function parameter, then infers
 * the parameter type back out: inference from contravariant positions
 * intersects the candidates instead of unioning them. The condition must
 * distribute over `unknown` — checking `extends never` collapses every
 * member to `never` and the whole type resolves to `unknown`.
 */
type UnionToIntersection<U> = (U extends unknown ? (k: U) => void : never) extends (
    k: infer I
) => void
    ? I
    : never;

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

/**
 * The valid paths into an object type: each of its string keys, plus — for
 * keys whose value is a drillable object — that key followed by a valid path
 * into the value. `true extends` widens union-valued fields (a field whose
 * type is a union of objects drills into every member's keys).
 */
type FieldPathInto<T> = T extends object
    ? {
          [K in keyof T & string]: true extends IsDrillable<T[K]>
              ? K | `${K}.${FieldPathInto<DrillInto<T[K]>>}`
              : K;
      }[keyof T & string]
    : never;

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

/** Picks `K` out of `V`, unwrapping arrays so the pick addresses the element. */
type DeepPickValue<V, K extends string> = V extends readonly (infer E)[]
    ? DeepPick<E, K>[]
    : DeepPick<V, K>;

/**
 * Narrow a response type by the `fields` paths actually passed.
 *
 * Each path contributes one object: a whole-field path (`"title"`) keeps the
 * field's full type; a nested path (`"title.romaji"`) picks that key out of
 * the field's type, unwrapping arrays along the way (`"tags.name"` →
 * `{ tags: { name: string }[] }`). Paths sharing a head merge into one
 * selection, and so one key of the result.
 *
 * @see https://docs.anilist.co/reference/query
 */
export type DeepPick<Response, K extends string> = Response extends readonly (infer E)[]
    ? DeepPick<E, K>[]
    : UnionToIntersection<
          K extends `${infer Head}.${infer Rest}`
              ? Head extends keyof Response
                  ? { [P in Head]: DeepPickValue<Response[Head], Rest> }
                  : never
              : K extends keyof Response
                ? { [P in K]: Response[K] }
                : never
      >;
