import { AniListOperation } from "../AniListOperation";
import type { RequestOptions } from "../../../../base/RequestHandler";

/**
 * {@link MarkdownVariables} contains variables for the {@link MarkdownQuery} operation.
 *
 * See {@link MarkdownQuery}; the resolved value carries the rendered `html` field.
 *
 * @see https://docs.anilist.co/reference/object/parsedmarkdown
 */
export interface MarkdownVariables {
    /**
     * `markdown` is a string representing the Markdown text to be converted.
     */
    markdown: string;
}

/**
 * {@link MarkdownQuery} converts Markdown text to HTML through AniList.
 * It extends {@link AniListOperation} and exposes {@link MarkdownQuery.markdown}.
 * @see https://docs.anilist.co/reference/object/parsedmarkdown
 */
export class MarkdownQuery extends AniListOperation {
    /**
     * {@link MarkdownQuery.markdown} sends a query request to convert Markdown text to HTML.
     *
     * @param variables - Values from {@link MarkdownVariables} for the query; `markdown` must be set.
     * @returns The rendered result. AniList resolves the field to a `ParsedMarkdown` object with
     * a `html` property; the declared `string` return type does not match that runtime shape.
     * @see https://docs.anilist.co/reference/object/parsedmarkdown
     * @param options - Optional {@link RequestOptions} merged over the instance-level settings for this call only.
     * @example
     * ```typescript
     * const result = await new MarkdownQuery().markdown({ markdown: "# AniList" });
     * // AniList resolves the field to `{ html }` at runtime; cast `result` to read it.
     * ```
     */
    async markdown(variables: MarkdownVariables, options?: RequestOptions): Promise<string> {
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
            transportOptions: options,
        });
    }
}
