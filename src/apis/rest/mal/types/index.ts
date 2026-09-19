/**
 * Barrel for the MyAnimeList type surface, split by resource: `common`
 * holds the nodes shared across resources, and `anime`, `manga`, and `user`
 * hold their resource types. The public re-export lives in `src/mal.ts`;
 * consumers inside `src/apis/rest/mal` import from this module.
 */
export * from "./anime";
export * from "./common";
export * from "./forum";
export * from "./manga";
export * from "./user";
