# Token CLI scripts

Interactive helpers that obtain OAuth2 tokens from each provider and write
them to `.env` — the keys the live integration suite gates on. They exist for
three reasons:

1. **Development tokens** — the fastest way to get `MAL_TOKEN` and
   `ANILIST_TOKEN` into `.env` for `npm run test:integration`.
2. **Manual auth testing** — each script runs the provider's real
   authorization-code and refresh flows through the library's own shipped
   auth helpers, so a green run is evidence the provider's auth surface works
   end-to-end against the live API.
3. **A repeatable pattern** — when a provider with wrappable auth is added to
   AniLink, a thin script here gives it the same CLI.

## Usage

```bash
# MAL — first run (client id remembered; secret only for web-type apps)
npm run mal:token -- --client-id <id> [--client-secret <secret>]

# MAL — later runs / renewal
npm run mal:token
npm run mal:token -- --refresh

# AniList — first run (all three remembered)
npm run anilist:token -- --client-id <id> --client-secret <secret> --redirect-uri <uri>

# AniList — later runs / renewal
npm run anilist:token
npm run anilist:token -- --refresh
```

Each script prints the provider's authorize URL; you approve it in a browser
and paste the full redirect URL back into the prompt — its `state` parameter
is validated against this run's authorize URL, so the whole URL is required,
not just the `code=...` part.
The access token is never printed to the console — only its expiry. MAL's
`plain` PKCE method embeds the verifier in the authorize URL, so treat the
printed URL as sensitive — do not paste it into shared logs or screenshots.
All credentials land in `.env`, which is gitignored.

## Files

| File               | Purpose                                                                                                                                            |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `token-cli.ts`     | Shared plumbing: `.env` parse/upsert, credential resolution (flag → env var → stored value), the paste-the-redirect prompt, the entry-point guard. |
| `mal-token.ts`     | MAL flow: PKCE (plain method only — MAL rejects S256 at exchange), optional client secret for web-type apps.                                       |
| `anilist-token.ts` | AniList flow: client secret required, no PKCE, redirect URI sent at both authorize and exchange.                                                   |

## Adding a provider

When a provider with wrappable OAuth auth joins AniLink:

1. **Ship the auth helpers in the library first** — an authorize-URL builder,
   a code-for-token exchange, a refresh exchange, and an expiry helper
   (mirror `src/apis/rest/mal/auth.ts` or
   `src/apis/graphql/anilist/auth.ts`). The script must exercise the
   library's own helpers, not a parallel implementation, or it stops
   serving purpose 2 above.

2. **Create `scripts/tokens/<provider>-token.ts`** with only the
   provider-specific pieces:

    - `ENV_KEYS` — the `.env` keys: `<PROVIDER>_CLIENT_ID`,
      `<PROVIDER>_CLIENT_SECRET` (if the provider uses one),
      `<PROVIDER>_TOKEN`, `<PROVIDER>_REFRESH_TOKEN`, plus any extra the flow
      needs (AniList stores `ANILIST_REDIRECT_URI`).
    - `CREATE_URL` — the provider's developer portal, for error messages.
    - `runAuthorizationFlow` — build the authorize URL with the library
      helper, `await promptForCode(url, "<Provider>")`, exchange the code.
    - `runRefreshFlow` — load the stored refresh token
      (`loadStoredEnvValue`), exchange it, fail with a pointer to the default
      flow when none is stored.
    - `run(argv)` — resolve credentials (`resolveCredential` for required,
      `resolveOptionalCredential` for provider-dependent), persist the
      client identity with `saveEnvEntry`, run the chosen flow, persist the
      tokens, print the expiry.
    - End with `runCliEntry(run, import.meta.url)` — the second argument is
      required; the guard compares it against the entry script's path, and
      `import.meta.url` inside `token-cli.ts` itself never matches.

3. **Wire the npm script** in `package.json`:

    ```json
    "<provider>:token": "tsx scripts/tokens/<provider>-token.ts"
    ```

4. **Check the integration suite's env key** — the script's token key must
   match the `process.env.<PROVIDER>_TOKEN` gate the live tests skip on
   (see `__tests__/integration/`).

5. **Validate**: `npx prettier --check` and `npx eslint` on the new file,
   then smoke-test the no-credentials path (expect a usage error and exit 1)
   and the `--refresh` path without a stored token (expect a pointer to the
   default flow).

### Provider quirks worth knowing

- **MAL** supports only the `plain` PKCE method — the challenge is the
  verifier itself. S256 is accepted at authorize but fails the exchange with 400. Web-type apps require a client secret; mobile-type apps use PKCE
  alone.
- **AniList** has no PKCE; the client secret authenticates the client, and
  the redirect URI must match the registered one at both steps.
- Access-token lifetimes differ (MAL ~1 hour, AniList ~1 year) — always
  print the expiry from the response rather than assuming.
