/**
 * Declarative operation registry for the MyAnimeList facade.
 *
 * Every operation is one entry in {@link MAL_OPERATION_REGISTRY}: the facade
 * key it is exposed under, the operation class that implements it, and the
 * method to bind (always the facade key — {@link op} enforces at compile
 * time that the key names a real method on the class). `buildMyAnimeListApi`
 * constructs and binds every entry through one loop, so adding an operation
 * touches exactly three sites: the operation class, its entry in this
 * registry, and the matching member on the group interface in `facade.ts`.
 * The bidirectional parity asserts at the bottom of this file keep this
 * registry and those typed group interfaces from drifting without failing
 * `tsc`.
 *
 * The entry shape mirrors the AniList registry in
 * `../../graphql/anilist/registry.ts`, minus two AniList-only pieces: the
 * `fieldsEnabled` flag (it only drives AniList's facade-group codegen, which
 * MAL has no counterpart for) and the eager runtime method validation
 * (AniList defers construction to lazy getters; MAL constructs eagerly at
 * the binding loop, and {@link op} already checks method existence at
 * registry-definition time).
 */
import type { BaseOperation } from "../../../base/BaseOperation";
import type { RequestAuthInput, RequestOptions } from "../../../base/transportTypes";
import type {
    MyAnimeListAnimeApi,
    MyAnimeListForumApi,
    MyAnimeListMangaApi,
    MyAnimeListUserApi,
} from "./facade";
import { MalAnimeOperation } from "./operations/AnimeOperation";
import { MalForumOperation } from "./operations/ForumOperation";
import { MalMangaOperation } from "./operations/MangaOperation";
import { MalUserOperation } from "./operations/UserOperation";

/**
 * The facade namespace an operation group is exposed under on
 * `aniLink.mal`: `anime`, `manga`, `user`, or `forum`.
 *
 * @see https://myanimelist.net/apiconfig/references/api/v2
 */
export type MalOperationGroup = "anime" | "manga" | "user" | "forum";

/**
 * The constructor contract every registered MyAnimeList operation class
 * must satisfy: the shared `BaseOperation` constructor shape the wiring
 * invokes with `(authToken, options, stateOwner)`.
 *
 * Constraining the return type to {@link BaseOperation} (rather than
 * `unknown`) lets the wiring track constructed instances for the
 * token-refresh lifecycle without a cast, and makes the compiler enforce
 * the contract at registry-definition time: an operation class that does
 * not extend `BaseOperation` fails typecheck here instead of silently
 * losing `updateAuth`/`getAuth` at runtime.
 *
 * @see https://myanimelist.net/apiconfig/references/api/v2
 */
export type MalOperationConstructor = new (
    authToken?: RequestAuthInput,
    options?: RequestOptions,
    stateOwner?: object
) => BaseOperation;

/**
 * One declarative wiring entry: the facade key, the operation class, and
 * the method to bind.
 *
 * Entries are created through {@link op}, which constrains the facade key
 * to a real method on the operation class, so wiring never has to validate
 * the method name at runtime.
 *
 * @typeParam TOperation - The operation class implementing this entry; must
 * satisfy the shared {@link MalOperationConstructor} contract.
 * @typeParam TName - The literal facade key this entry is exposed under.
 * @see https://myanimelist.net/apiconfig/references/api/v2
 */
export interface MalOperationEntry<
    TOperation extends MalOperationConstructor,
    TName extends string = string,
> {
    /**
     * The facade key the bound method is exposed under (e.g. `"seasonal"`).
     * Carried as a literal so the registry can derive exhaustive key unions
     * for compile-time parity checks against the facade group interfaces.
     */
    readonly name: TName;

    /**
     * The operation class. Constructed once per client with the shared
     * auth material, transport options, and per-client state owner.
     */
    readonly operationClass: TOperation;

    /**
     * The async method on {@link MalOperationEntry.operationClass} that is
     * bound and exposed on the facade. Always set to the facade key by
     * {@link op}.
     */
    readonly methodName: string;
}

/**
 * Convenience constructor for a registry entry whose bound method shares the
 * facade key's name.
 *
 * The `TName` constraint is the validation: it only accepts a key that
 * exists on `operationClass`'s instance type, so a typo or a facade key that
 * no longer matches the operation class fails typecheck at the registry
 * entry instead of at first call.
 *
 * @param name - The facade key the bound method is exposed under.
 * @param operationClass - The operation class implementing this entry.
 * @returns The registry entry with `methodName` defaulted to `name`.
 */
function op<
    TOperation extends MalOperationConstructor,
    TName extends Extract<keyof InstanceType<TOperation>, string>,
>(name: TName, operationClass: TOperation): MalOperationEntry<TOperation, TName> {
    return { name, operationClass, methodName: name };
}

/**
 * The shape constraint for registry groups: each group is a readonly tuple
 * of operation entries.
 */
type MalRegistryGroups = {
    [TGroup in MalOperationGroup]: readonly MalOperationEntry<MalOperationConstructor, string>[];
};

/**
 * The single source of truth for which MyAnimeList operations exist and how
 * they are wired into the facade. `buildMyAnimeListApi` constructs and binds
 * every entry through one loop, and the parity asserts below keep the group
 * interfaces in `facade.ts` in step with these keys.
 *
 * Order within each group matches the declaration order of the
 * corresponding group interface in `facade.ts`.
 *
 * @see https://myanimelist.net/apiconfig/references/api/v2
 */
export const MAL_OPERATION_REGISTRY = {
    anime: [
        op("get", MalAnimeOperation),
        op("search", MalAnimeOperation),
        op("seasonal", MalAnimeOperation),
        op("ranking", MalAnimeOperation),
        op("suggestions", MalAnimeOperation),
        op("updateMyListStatus", MalAnimeOperation),
        op("deleteFromList", MalAnimeOperation),
    ],
    manga: [
        op("get", MalMangaOperation),
        op("search", MalMangaOperation),
        op("ranking", MalMangaOperation),
        op("updateMyListStatus", MalMangaOperation),
        op("deleteFromList", MalMangaOperation),
    ],
    user: [
        op("me", MalUserOperation),
        op("get", MalUserOperation),
        op("animeList", MalUserOperation),
        op("mangaList", MalUserOperation),
    ],
    forum: [
        op("boards", MalForumOperation),
        op("topics", MalForumOperation),
        op("topic", MalForumOperation),
    ],
} as const satisfies MalRegistryGroups;

/**
 * The literal facade keys one registry group exposes, derived from
 * {@link MAL_OPERATION_REGISTRY} so the registry stays the single source of
 * truth for which operations exist.
 */
type MalRegistryGroupKeys<TGroup extends MalOperationGroup> =
    (typeof MAL_OPERATION_REGISTRY)[TGroup][number]["name"];

/**
 * Compile-time exhaustiveness checks between each registry group and its
 * facade group interface. The bidirectional type assertions ensure that
 * every group's registry key union and facade `keyof` are the same set: a
 * member added to a facade interface without a registry entry (or vice
 * versa) produces a type error. The registry is the source of truth; this
 * asserts the typed surface keeps pace — the same parity mechanism AniList's
 * generated facade groups carry, extended to MAL.
 */
const _assertAnimeParity: MalRegistryGroupKeys<"anime"> =
    null as unknown as keyof MyAnimeListAnimeApi;
const _assertAnimeParityReverse: keyof MyAnimeListAnimeApi =
    null as unknown as MalRegistryGroupKeys<"anime">;
const _assertMangaParity: MalRegistryGroupKeys<"manga"> =
    null as unknown as keyof MyAnimeListMangaApi;
const _assertMangaParityReverse: keyof MyAnimeListMangaApi =
    null as unknown as MalRegistryGroupKeys<"manga">;
const _assertUserParity: MalRegistryGroupKeys<"user"> = null as unknown as keyof MyAnimeListUserApi;
const _assertUserParityReverse: keyof MyAnimeListUserApi =
    null as unknown as MalRegistryGroupKeys<"user">;
const _assertForumParity: MalRegistryGroupKeys<"forum"> =
    null as unknown as keyof MyAnimeListForumApi;
const _assertForumParityReverse: keyof MyAnimeListForumApi =
    null as unknown as MalRegistryGroupKeys<"forum">;
