/**
 * {@link DisabledListActivity} is a type representing the disabled list activity options for a user.
 * It includes a `disabled` field which is a boolean indicating whether the activity is disabled or not,
 * and a `type` field which is a string representing the type of the activity.
 * @see https://docs.anilist.co/reference/object/medialisttypeoptions
 */
export type DisabledListActivity = {
    /**
     * A boolean indicating whether the activity is disabled or not.
     */
    disabled: boolean;

    /**
     * A string representing the type of the activity.
     */
    type: "CURRENT" | "PLANNING" | "COMPLETED" | "DROPPED" | "PAUSED" | "REPEATING";
};

/**
 * {@link DisabledListActivityMapping} is a constant that maps the {@link DisabledListActivity} fields to their expected types.
 * The `disabled` field is mapped to 'boolean', and the `type` field is mapped to an array of possible values.
 * @see https://docs.anilist.co/reference/object/medialisttypeoptions
 */
export const DisabledListActivityMapping = {
    disabled: "boolean",
    type: ["CURRENT", "PLANNING", "COMPLETED", "DROPPED", "PAUSED", "REPEATING"],
};
