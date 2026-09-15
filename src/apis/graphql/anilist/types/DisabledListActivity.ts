/**
 * {@link DisabledListActivity} is one list-status activity toggle: whether list updates with
 * this `MediaListStatus` generate an activity feed entry. `UpdateUser` accepts a list
 * of them as `disabledListActivity`.
 * @see https://docs.anilist.co/reference/object/listactivityoption
 */
export type DisabledListActivity = {
    /**
     * Whether activity feed entries are suppressed for this status.
     */
    disabled: boolean;

    /**
     * The list status whose activity generation is toggled.
     */
    type: "CURRENT" | "PLANNING" | "COMPLETED" | "DROPPED" | "PAUSED" | "REPEATING";
};

/**
 * {@link DisabledListActivityMapping} is the field-shape map `UpdateUser` validates its
 * `disabledListActivity` entries against before dispatch.
 * @see https://docs.anilist.co/reference/object/listactivityoption
 */
export const DisabledListActivityMapping = {
    disabled: "boolean",
    type: ["CURRENT", "PLANNING", "COMPLETED", "DROPPED", "PAUSED", "REPEATING"],
};
