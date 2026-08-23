/**
 * `Name` is an interface representing a name.
 * It includes the first name, last name, full name, and native name each having their own properties.
 * @see https://docs.anilist.co/reference/object/charactername
 */
export interface Name {
    /**
     * `first` is a string representing the first name.
     */
    first: string;

    /**
     * `last` is a string representing the last name.
     */
    last: string;

    /**
     * `full` is a string representing the full name.
     */
    full: string;

    /**
     * `native` is a string representing the native name.
     */
    native: string;
}
