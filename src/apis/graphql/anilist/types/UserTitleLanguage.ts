/**
 * {@link UserTitleLanguage} is a type representing the language of a user's title.
 * It can be one of the following: 'ROMAJI', 'ENGLISH', 'NATIVE', 'ROMAJI_STYLISED', 'ENGLISH_STYLISED', 'NATIVE_STYLISED'.
 * @see https://docs.anilist.co/reference/enum/usertitlelanguage
 */
export type UserTitleLanguage =
    "ROMAJI" | "ENGLISH" | "NATIVE" | "ROMAJI_STYLISED" | "ENGLISH_STYLISED" | "NATIVE_STYLISED";

/**
 * {@link UserTitleLanguageMapping} is an object that maps each {@link UserTitleLanguage} to its corresponding string value.
 * It can be one of the following: 'ROMAJI', 'ENGLISH', 'NATIVE', 'ROMAJI_STYLISED', 'ENGLISH_STYLISED', 'NATIVE_STYLISED'.
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
