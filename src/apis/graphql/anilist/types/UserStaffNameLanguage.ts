/**
 * {@link UserStaffNameLanguage} is the AniList UserStaffNameLanguage enum: the language a
 * user prefers staff and character names in. The `_STYLISED` variants keep the site's
 * stylised rendering.
 * @see https://docs.anilist.co/reference/enum/userstaffnamelanguage
 */
export type UserStaffNameLanguage =
    "ROMAJI" | "ENGLISH" | "NATIVE" | "ROMAJI_STYLISED" | "ENGLISH_STYLISED" | "NATIVE_STYLISED";

/**
 * {@link UserStaffNameLanguageMapping} is the allowlist of {@link UserStaffNameLanguage}
 * values accepted by the `staffNameLanguage` variable of the `UpdateUser` mutation.
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
