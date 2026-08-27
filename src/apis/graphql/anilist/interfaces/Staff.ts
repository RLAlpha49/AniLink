import { type Name } from "./Name";

/**
 * {@link Staff} is an interface representing a staff member.
 * It includes the id and name each having their own properties.
 * @see https://docs.anilist.co/reference/object/staff
 */
export interface Staff {
    /**
     * `id` is a number representing the id of the staff member.
     */
    id: number;

    /**
     * `name` is an instance of {@link Name} representing the name of the staff member.
     */
    name: Name;
}
