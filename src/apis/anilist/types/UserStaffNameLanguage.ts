/**
 * `UserStaffNameLanguage` is a type representing the language of a user's staff name.
 * It can be one of the following: 'ROMAJI', 'ENGLISH', 'NATIVE', 'ROMAJI_STYLISED', 'ENGLISH_STYLISED', 'NATIVE_STYLISED'.
 * @see https://docs.anilist.co/reference/enum/userstaffnamelanguage
 */
export type UserStaffNameLanguage =
    "ROMAJI" | "ENGLISH" | "NATIVE" | "ROMAJI_STYLISED" | "ENGLISH_STYLISED" | "NATIVE_STYLISED";

/**
 * `UserStaffNameLanguageMapping` is a mapping of `UserStaffNameLanguage` enum values to their corresponding string values.
 * It can be one of the following: 'ROMAJI', 'ENGLISH', 'NATIVE', 'ROMAJI_STYLISED', 'ENGLISH_STYLISED', 'NATIVE_STYLISED'.
 * @see https://docs.anilist.co/reference/enum/userstaffnamelanguage
 */
export const UserStaffNameLanguageMapping: readonly UserStaffNameLanguage[] = [
    "ROMAJI",
    "ENGLISH",
    "NATIVE",
    "ROMAJI_STYLISED",
    "ENGLISH_STYLISED",
    "NATIVE_STYLISED",
];
