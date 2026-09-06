# Response-Shape Ownership

AniList response types are produced by a codegen pipeline. A single response
shape is defined by **four artifacts**. This file maps each kind of change to
the artifacts that must change with it, so a contributor can predict exactly
what a response-shape edit touches instead of discovering the links by
reading the generator.

## The four artifacts

| #   | Artifact                  | Path                                               | Role                                                                                                                             |
| --- | ------------------------- | -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Schema-fragment constants | `src/apis/graphql/anilist/schemas/` (36 files)     | Handwritten selection-set fragments (`export const MediaSchema = \`...\``). The fields the client requests.                      |
| 2   | Generation manifest       | `scripts/generate-interfaces.config.ts` (~50 KB)   | Pairs every generated export with its fragment or operation file, and records typing overrides (`fieldTypes`, `optionalFields`). |
| 3   | Generated interfaces      | `src/apis/graphql/anilist/interfaces/` (68 files)  | Output of the generator. **Do not hand-edit** generated files; rerun `npm run interfaces:generate`.                              |
| 4   | Drift-checker inventory   | `scripts/anilist-api-compare/package-inventory.ts` | Parses operation files and interface contracts to compare the package against the committed AniList schema snapshot.             |

The generator (`scripts/generate-interfaces.ts`) reads artifacts 1 and 2,
extracts inline documents from operation files, and writes artifact 3.
Artifact 4 reads operation files and artifact 3 independently to detect drift
against the upstream schema.

## Which artifact is authoritative for each change class

### Add or remove a field on an existing response

1. **Schema fragment** (`schemas/`) — add or remove the field from the
   selection set. This is the source of truth for _what is selected_.
2. **Generated interfaces** — regenerate with
   `npm run interfaces:generate`. Do not edit by hand.

No manifest change unless the field needs a typing override (see below).

### Add a new operation (query or mutation)

1. **Operation file** — `src/apis/graphql/anilist/query/<Name>.ts` or
   `mutation/<Name>.ts`. Must contain an inline
   `const query = \`...\``or`const mutation = \`...\`` template literal; the
   generator reads this document directly and does **not** resolve imports
   (see _Codegen invariants_ below).
2. **Schema fragment** (`schemas/`) — if the operation introduces a new
   selection shape, add a fragment constant for it.
3. **Manifest** (`generate-interfaces.config.ts`) — add an `OutputSpec`
   entry pairing the new response interface with its fragment or operation
   file.
4. **Generated interfaces** — regenerate.

The drift checker (artifact 4) needs no change; it discovers operation files
by walking `query/` and `mutation/`.

### Change a typing override (enum alias, union discriminator, optionality)

1. **Manifest** (`generate-interfaces.config.ts`) — edit `fieldTypes` (to pin
   an enum alias, discriminator literal, or handwritten aggregate reference)
   or `optionalFields` (to preserve handwritten optionality). The manifest is
   the source of truth for _deliberate typing decisions_ that mechanical
   resolution cannot infer.
2. **Generated interfaces** — regenerate.

No schema-fragment change; the override is a typing decision, not a
selection change.

### Change a schema fragment's selection

1. **Schema fragment** (`schemas/`) — edit the constant.
2. **Generated interfaces** — regenerate.

If the fragment is shared by multiple outputs, every output that references
it regenerates from the new selection. The manifest's
`exportsByConstant` map (built in `lib/interfaces-codegen/run.ts`) rejects a
fragment claimed by two outputs, so a shared fragment is surfaced explicitly.

### Restructure an operation file (rename the `const query` binding, extract the document to an imported constant)

The generator's `collectOperationDocument` extracts the inline document by
regex. Renaming the binding or moving the document to an imported constant
breaks generation. The guard in `collectOperationDocument` fails loudly in
both write and `--check` modes (so CI catches it) with a message naming the
file and the expected binding. See _Codegen invariants_.

To restructure safely: keep an inline `const query|mutation = \`...\``binding
in the operation file, or update the manifest's`source.operation.file` to
point at the new location and ensure that file has the inline binding.

## Codegen invariants

These invariants are enforced by the generator and the drift checker. Violating
them fails the `--check` CI gate (`npm run interfaces:generate -- --check`,
`.github/workflows/ci.yml`) with a named error.

1. **Inline document binding.** Every operation file referenced by a manifest
   `source.operation.file` must contain an inline
   `const query = \`...\``or`const mutation = \`...\`` template literal. The
generator does not resolve imported constants. A file that binds the
document to an identifier (`const query = SomeFragment`) or omits the
binding fails `collectOperationDocument` with a message naming the file.

2. **`mode: "file"` ownership.** Every output in the manifest is
   `mode: "file"`: the generator owns the entire output file. There are no
   `mode: "region"` outputs today. (The `region` mode, which splices a
   marker-delimited block into a handwritten file, is supported by
   `lib/interfaces-codegen/emit.ts` but unused by the current manifest.)

3. **Handwritten single-source interfaces.** A small set of interface files
   are deliberately handwritten and have no manifest entry (no faithful
   schema-fragment or operation twin): `Stat.ts`, `Favoured.ts`, `Staff.ts`,
   `Studio.ts`. They are not regenerated; edit them directly.

4. **Fragment ownership is exclusive.** A schema-fragment constant claimed by
   `source.constant` is owned by exactly one output. Two outputs claiming the
   same constant throw at generation time
   (`collectExportsByConstant` in `lib/interfaces-codegen/run.ts`).

5. **Generated files are not hand-edited.** Generated interface files carry a
   `@generated` header. Edits are overwritten on the next
   `npm run interfaces:generate`. Change the fragment or manifest, then
   regenerate.

## Commands

| Command                                  | Effect                                                                                                           |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `npm run interfaces:generate`            | Write updated generated interface files.                                                                         |
| `npm run interfaces:generate -- --check` | Exit 1 when any generated file is stale; runs in CI. Also fails when an operation file lacks the inline binding. |
| `npm run anilist:api:compare`            | Run the drift checker (artifact 4) against the committed schema snapshot.                                        |
