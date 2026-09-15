/**
 * {@link UserTitleLanguage} is the AniList UserTitleLanguage enum: the language a user
 * prefers media titles in. The `_STYLISED` variants keep the site's stylised rendering.
 * @see https://docs.anilist.co/reference/enum/usertitlelanguage
 */
export type UserTitleLanguage =
    "ROMAJI" | "ENGLISH" | "NATIVE" | "ROMAJI_STYLISED" | "ENGLISH_STYLISED" | "NATIVE_STYLISED";

/**
 * {@link UserTitleLanguageMapping} is the allowlist of {@link UserTitleLanguage} values
 * accepted by the `titleLanguage` variable of the `UpdateUser` mutation.
 * @see https://docs.anilist.co/reference/enum/usertitlelanguage
 */
export const UserTitleLanguageMapping: readonly UserTitleLanguage[] = [
    "ROMAJI",
    "ENGLISH",
    "NATIVE",
    "ROMAJI_STYLISED",
    "ENGLISH_STYLISED",
    "NATIVE_STYLISED",
];
