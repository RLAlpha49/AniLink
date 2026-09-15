import { type Name } from "./Name";

/**
 * {@link Staff} is the minimal staff shape used inside favoured-entity stat rows: the
 * `id` and `name` of the person a row counts. The full staff response is
 * `StaffResponse`.
 * @see https://docs.anilist.co/reference/object/staff
 */
export interface Staff {
    /**
     * The AniList id of the staff member.
     */
    id: number;

    /**
     * The staff member's name.
     */
    name: Name;
}
