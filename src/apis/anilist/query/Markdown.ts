import { APIWrapper } from "../../../base/APIWrapper";

/**
 * `MarkdownVariables` is an interface representing the variables for the `MarkdownQuery`.
 * It includes an optional markdown string.
 * @see https://docs.anilist.co/reference/query
 */
export interface MarkdownVariables {
    /**
     * `markdown` is a string representing the Markdown text to be converted.
     */
    markdown: string;
}

/**
 * `MarkdownQuery` is a class representing a query for converting Markdown text to HTML.
 * It includes a method to send the Markdown text and receive the converted HTML.
 * @see https://docs.anilist.co/reference/object/parsedmarkdown
 */
export class MarkdownQuery extends APIWrapper {
    /**
     * `markdown` is a method that sends a query request to convert Markdown text to HTML.
     *
     * @param variables - The variables for the query.
     * @returns The response from the query request.
     * @see https://docs.anilist.co/reference/object/parsedmarkdown
     */
    async markdown(variables: MarkdownVariables): Promise<string> {
        const query = `
      query ($markdown: String!) {
        Markdown (markdown: $markdown) {
          html
        }
      }
    `;
        return await this.execute<string>(query, variables, {
            requirements: [
                {
                    kind: "all",
                    names: ["markdown"],
                    message: "The Markdown query requires a markdown variable.",
                },
            ],
        });
    }
}
