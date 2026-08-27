import { BaseOperation } from "../../base/BaseOperation";
import { type RequestOptions } from "../../base/RequestHandler";
import {
    type VariableTypeMappings,
    requireVariables,
    validateVariables,
} from "../../base/ValidateVariables";

/**
 * A single variable-presence requirement declared by an operation.
 *
 * Mirrors the requirement shapes accepted by {@link requireVariables}, with
 * the operation's error `message` attached so an operation can declare its
 * whole validation contract as data.
 */
export type VariableRequirement =
    | { readonly kind: "one"; readonly message: string }
    | { readonly kind: "all"; readonly names: readonly string[]; readonly message: string }
    | { readonly kind: "any"; readonly names: readonly string[]; readonly message: string }
    | { readonly kind: "notOnly"; readonly names: readonly string[]; readonly message: string };

/**
 * The declarative contract an operation passes to
 * `GraphQLOperation.execute`.
 *
 * Every field is optional: an operation declares only the variation points it
 * needs, and `execute` applies them in a fixed order so validation behaviour
 * is uniform across the whole API surface.
 */
export interface GraphQLExecuteOptions {
    /**
     * Variable-presence requirements evaluated before type validation. Each
     * entry maps directly to one {@link requireVariables} call.
     */
    readonly requirements?: readonly VariableRequirement[];

    /**
     * The variable type map used to type-check caller-supplied variables.
     * Omit for operations that declare no typed variables.
     */
    readonly mappings?: VariableTypeMappings;

    /**
     * Whether the operation requires an authentication token. Defaults to
     * `false` (public queries).
     */
    readonly requiresAuth?: boolean;

    /**
     * Per-request transport settings (`timeout`, `signal`, retry policy,
     * lifecycle hooks, pacing, circuit breaker) merged over the instance-level
     * options for this single call. A field set here wins; unset fields keep
     * the instance value.
     */
    readonly transportOptions?: RequestOptions;
}

/**
 * `GraphQLOperation` is the GraphQL protocol layer shared by every
 * GraphQL-style provider.
 *
 * It extends the provider-agnostic {@link BaseOperation} with what GraphQL
 * adds on top of plain HTTP: a provider endpoint, JSON-encoded `{ query,
 * variables }` bodies, validate-then-dispatch ordering for operation
 * variables, and envelope unwrapping. Provider subclasses pin their endpoint
 * (the AniList subclass does this with a constant); concrete operations only
 * declare their variables interface, GraphQL document, and a thin method.
 */
export abstract class GraphQLOperation extends BaseOperation {
    /**
     * The GraphQL endpoint every document of this provider is POSTed to.
     */
    protected abstract readonly graphqlUrl: string;

    /**
     * Sends a GraphQL document to the configured endpoint.
     *
     * The token guard, Authorization header, timeout, retry policy, and error
     * normalization are handled by the shared request pipeline; this method
     * only shapes the GraphQL-specific POST body.
     *
     * @param query - The GraphQL document to execute.
     * @param variables - The variables for the document. When omitted the request body contains only the query.
     * @param requiresAuth - Whether the operation requires an authentication token.
     * @param operation - Optional human-readable operation name included in missing-token auth errors. Defaults to the concrete operation class name.
     * @param transportOptions - Optional per-request transport settings merged over the instance-level ones. A field set here wins; unset fields keep the instance value.
     * @returns The unwrapped response data. For documents with a single root field this is the bare field value; otherwise it is the full `{ data }` envelope.
     * @throws An {@link AniLinkAuthError} when `requiresAuth` is true and no token is set, or a normalized {@link AniLinkError} when the request fails.
     */
    protected async request<T = unknown>(
        query: string,
        variables?: unknown,
        requiresAuth = false,
        operation?: string,
        transportOptions?: RequestOptions
    ): Promise<T> {
        const data = variables === undefined ? { query } : { query, variables };
        return await this.dispatch<T>(
            this.graphqlUrl,
            "POST",
            data,
            requiresAuth,
            operation,
            transportOptions
        );
    }

    /**
     * Runs the shared validate-then-dispatch pipeline for an operation.
     *
     * Operations declare their contract as a {@link GraphQLExecuteOptions}
     * object — variable-presence requirements, an optional type map, and the
     * auth requirement — and this method applies them in a fixed order before
     * delegating to {@link GraphQLOperation.request}.
     *
     * @param query - The GraphQL document to execute.
     * @param variables - The variables for the document. Pass `undefined` for
     * operations that take no variables.
     * @param options - The declarative validation and auth contract.
     * @returns The unwrapped response data, as described by {@link GraphQLOperation.request}.
     * @throws An {@link AniLinkValidationError} when a requirement or type check
     * fails, or a normalized {@link AniLinkError} when the request fails.
     */
    protected async execute<T = unknown>(
        query: string,
        variables: object | undefined,
        options: GraphQLExecuteOptions
    ): Promise<T> {
        const { requirements, mappings, requiresAuth, transportOptions } = options;

        if (requirements && variables !== undefined) {
            for (const requirement of requirements) {
                requireVariables(variables, requirement, requirement.message);
            }
        }

        if (mappings && variables !== undefined) {
            validateVariables(variables, mappings);
        }

        return await this.request<T>(query, variables, requiresAuth, undefined, transportOptions);
    }
}
