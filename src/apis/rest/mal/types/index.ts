/**
 * Exports MyAnimeList types grouped by resource. `common` contains shared
 * types; `anime`, `manga`, and `user` contain resource-specific types. The
 * public re-export is in `src/mal.ts`. Code in `src/apis/rest/mal` imports
 * from this module.
 */
export * from "./anime";
export * from "./common";
export * from "./forum";
export * from "./manga";
export * from "./user";
