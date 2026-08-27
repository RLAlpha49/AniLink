# Changelog

## [2.0.0](https://github.com/RLAlpha49/AniLink/compare/v1.29.2...v2.0.0) (2026-08-27)

### ⚠ BREAKING CHANGES

* **package:** the package no longer ships CommonJS output and now
requires Node.js >= 22. Consumers on CJS must use dynamic import() or
migrate to ESM.
* **api:** aniLink.anilist.query.like() has been removed; use aniLink.anilist.query.page.likes({ likeableId, type }) instead.
* **api:** Page.followers and Page.followings now require userId at the type level; calls omitting it already failed against the AniList API.
* **api:** operations now live under aniLink.anilist.* instead of
directly on the AniLink instance (aniLink.media(...) becomes
aniLink.anilist.media(...)).

- Extract the operation surface from AniLink.ts into
  src/apis/anilist/facade.ts (buildAniListApi / AniListApi)
- Move shared transport plumbing (endpoint, auth token, request helper)
  into APIWrapper so operation classes only declare variables, document,
  and a thin method
- Relocate GraphQL selection-set constants from interfaces/ to a
  dedicated schemas/ tree
- Update generate-explorer-manifest to parse facade.ts and scan schemas/

### ✨ Features

* **anilist:** add like query and review ratings ([2416574](https://github.com/RLAlpha49/AniLink/commit/2416574435e9cef0f21ed45557c8a6167a9de8f4))
* **api:** accept per-provider credentials in the AniLink constructor ([7170754](https://github.com/RLAlpha49/AniLink/commit/7170754df59dc0d26406dd3db36c6e0355c28adf))
* **api:** accept per-request transport options on every operation ([44aa4d0](https://github.com/RLAlpha49/AniLink/commit/44aa4d06be7bf544c0c650a6a917ec98f750d03f))
* **api:** add anilist subpath export for provider-scoped imports ([e7fefb7](https://github.com/RLAlpha49/AniLink/commit/e7fefb79c8fb682df1655cf37b8c13aeae3ad4d5))
* **api:** add concurrent page fetching to pagination helpers ([2d4806e](https://github.com/RLAlpha49/AniLink/commit/2d4806e7ceb5714b1b4675c7db1dd1d91ded79b9))
* **api:** add pagination and media-list helper capabilities ([24cdc95](https://github.com/RLAlpha49/AniLink/commit/24cdc956a76210ff288a15280d7f5ef0dfba2ae1))
* **api:** export pagination helpers and client options from AniLink ([21d6764](https://github.com/RLAlpha49/AniLink/commit/21d676478fda3aeefebc08e04160d5f7e81c845b))
* **api:** retry by default, add rate-limit pacing and circuit breaker ([39d61a8](https://github.com/RLAlpha49/AniLink/commit/39d61a869a47b735cd7f01c0c1cede7f37a377f8))
* **api:** scope transport options per client and classify GraphQL failures ([bc95b9b](https://github.com/RLAlpha49/AniLink/commit/bc95b9b4ba6092d8c189c7eab13f7fd00551f9fb))
* **api:** type delete, like, and AniChart mutation returns ([caa56a5](https://github.com/RLAlpha49/AniLink/commit/caa56a58d805c7c7fc2d8621c17dcc7874da64bb))
* **api:** validate custom GraphQL documents and type custom() generically ([c000ba1](https://github.com/RLAlpha49/AniLink/commit/c000ba1aeb933418a2dd2f83eb57e45e88206f7e))
* **auth:** add AniList OAuth2 authorization-code helpers ([7bafc4b](https://github.com/RLAlpha49/AniLink/commit/7bafc4b6bb902aeb098f8d08e8e489510cadd601))
* **auth:** route token requests through the shared request pipeline ([f25dfbb](https://github.com/RLAlpha49/AniLink/commit/f25dfbb8e70edcf96d24bc6d54a8c7f93d068266))
* **auth:** sanitize token errors and add state and expiry helpers ([d18711f](https://github.com/RLAlpha49/AniLink/commit/d18711f73593cc9bfff04441dd4180cbdb98067c))
* **base:** add auth-required request handling ([4fdc8ac](https://github.com/RLAlpha49/AniLink/commit/4fdc8acd25a6a1a11f7a61dc45a31f97a51f2a21))
* **base:** add typed transport errors and request options ([a5256af](https://github.com/RLAlpha49/AniLink/commit/a5256af84cad16d71bb190ba52603109768fa824))
* **explorer:** add AniLink API Explorer for building and testing calls live ([af9a72f](https://github.com/RLAlpha49/AniLink/commit/af9a72fcaf87820029672d538def34c81aee9cdb))
* **explorer:** format and highlight GraphQL queries ([938e239](https://github.com/RLAlpha49/AniLink/commit/938e2391e5d95a2f20c870cbf63b1cdb37fdb4e0))
* **requests:** add retry policy and normalized transport errors ([1a9d8f5](https://github.com/RLAlpha49/AniLink/commit/1a9d8f5f2946e0c709cd84d3fcf691afb7ed0c13))
* **scripts:** add provider selection to schema comparison CLI ([63f20c8](https://github.com/RLAlpha49/AniLink/commit/63f20c823a99a7dfc4749db6ba151287060db079))

### 🐛 Bug Fixes

* **anilist:** align response contracts with API schema ([32f74f8](https://github.com/RLAlpha49/AniLink/commit/32f74f817de2ecf01e74a5713338094b9cb50cd4))
* **anilist:** correct API operation contracts ([7ffd5fe](https://github.com/RLAlpha49/AniLink/commit/7ffd5fe089763de234a46b7e5acc1f0ce09df968))
* **api-compare:** parse inline mappings in explorer manifest generator ([9fe0983](https://github.com/RLAlpha49/AniLink/commit/9fe09836ef7c4e196890177de3a879e4aae93ebc))
* **api:** align response types with the AniList schema ([0858d63](https://github.com/RLAlpha49/AniLink/commit/0858d63d1294118e9f15751dca928f90607b48cb))
* **api:** always validate variables in collection and statistics queries ([653ca41](https://github.com/RLAlpha49/AniLink/commit/653ca41b33680b7a528313d34e79fdd44f998f42))
* **api:** clamp perPage and perChunk to AniList caps ([023fa22](https://github.com/RLAlpha49/AniLink/commit/023fa22f6881a3ba78771f1bf085209016d4237b))
* **api:** enforce real AniList variable contracts with requireVariables ([de31bfc](https://github.com/RLAlpha49/AniLink/commit/de31bfc507d60a77f75e74358c7c248249978644))
* **api:** make character query variables optional ([ac6c26e](https://github.com/RLAlpha49/AniLink/commit/ac6c26e5f4d8fd99a39da68de03b1637a38cfcae))
* **api:** point operation [@see](https://github.com/see) links at specific AniList reference pages ([868c159](https://github.com/RLAlpha49/AniLink/commit/868c159703ea7b0fc031839f37a47918565042d3))
* **api:** reject unknown variable keys by default ([00bb7ff](https://github.com/RLAlpha49/AniLink/commit/00bb7ff5714a756d0d3b5de1835292d985158123))
* **api:** render objects and arrays in variable validation errors ([5f6a2f6](https://github.com/RLAlpha49/AniLink/commit/5f6a2f656226230346f2942adaa03800fc86d0dd))
* **api:** require userId for followers and followings ([17bbd0d](https://github.com/RLAlpha49/AniLink/commit/17bbd0dd3eaaffddc60a3fd95c374155f3204cdb))
* **api:** throw typed validation error from updateFavouriteOrder ([c2cb640](https://github.com/RLAlpha49/AniLink/commit/c2cb640b144c9c79901810b0fb353a11cc94ed52))
* **explorer:** enforce [hidden] attribute over display:flex builder divs ([b33707a](https://github.com/RLAlpha49/AniLink/commit/b33707ababda25944b229842f39d6ee130f5199f))
* **explorer:** protect tokens, guard races, and restore keyboard access ([5a4780a](https://github.com/RLAlpha49/AniLink/commit/5a4780a347c09474895d03f48a8e877909b01bc7))
* **explorer:** rewrite JSON highlighting in a tested pure-logic core ([11d788b](https://github.com/RLAlpha49/AniLink/commit/11d788ba66564de508344f544ff7ca73969b795f))
* **package:** publish typed named-export package ([f9c7363](https://github.com/RLAlpha49/AniLink/commit/f9c7363dc13f73be6f7e1edad156655af5bbcc19))
* **transport:** scope circuit-breaker state per upstream host ([da60ecc](https://github.com/RLAlpha49/AniLink/commit/da60ecca09947429159eaff83c18169df7987d70))
* unwrap single-field AniList responses ([d98bf11](https://github.com/RLAlpha49/AniLink/commit/d98bf1102acaf25c53c99185d5f3d857be715339))
* **validation:** enforce nested variable validation ([83b59a3](https://github.com/RLAlpha49/AniLink/commit/83b59a3b5803c71a96b91d32539fe8499862e7f8))

### ⚡ Performance

* **build:** ship a single TypeScript declaration file ([bcbb6ee](https://github.com/RLAlpha49/AniLink/commit/bcbb6ee20639df5a0f225368d71881b780f55cae))
* **explorer:** ship minified operations.json manifest ([92b5d88](https://github.com/RLAlpha49/AniLink/commit/92b5d88ba292c51b5e8eabf47445b9cd951e2151))

### ♻️ Refactoring

* **anilist:** flatten media list collection response ([136eb1e](https://github.com/RLAlpha49/AniLink/commit/136eb1ecb3ae6ec05d96a71ab7e25ae9705ed153))
* **api:** annotate enum mapping constants as readonly ([acbf579](https://github.com/RLAlpha49/AniLink/commit/acbf579ea3796cbfb4b8c2db47add42d381eb22a))
* **api:** decompose AniList facade into type and wiring modules ([2d32a3f](https://github.com/RLAlpha49/AniLink/commit/2d32a3fdc21f14a60e542258685cdcce3f65de2c))
* **api:** derive operation wiring from a declarative registry ([d12d61c](https://github.com/RLAlpha49/AniLink/commit/d12d61cb63b2df400601beb81b3b71147dc2d63a))
* **api:** extract provider-neutral pagination core ([c05faab](https://github.com/RLAlpha49/AniLink/commit/c05faab7657770173d34e49f372b08f0077ee2dc))
* **api:** generate response interfaces from schema fragments ([db65ce1](https://github.com/RLAlpha49/AniLink/commit/db65ce1c23d5b274ce3d5561f909f7321485a7e8))
* **api:** move AniList operations behind anilist facade ([60b3c2d](https://github.com/RLAlpha49/AniLink/commit/60b3c2d4fb20564555151634dbe1d5f49e2fa832))
* **api:** relocate APIWrapper beside its AniList consumers ([14f1d7e](https://github.com/RLAlpha49/AniLink/commit/14f1d7ec763ad73909f02a57747155c825cf2648))
* **api:** remove redundant Like query ([bd180db](https://github.com/RLAlpha49/AniLink/commit/bd180dbc65ad2db87dc256a80a785b7cb0393a72))
* **api:** remove unused schema imports from response interfaces ([d934cc9](https://github.com/RLAlpha49/AniLink/commit/d934cc9f1f7a354d5d00cc4cce65b98f4c80b820))
* **api:** restructure providers under graphql/ and rest/ with shared operation bases ([89b44b8](https://github.com/RLAlpha49/AniLink/commit/89b44b8ec7939c7b04a6829dc9ab1c0d424f231f))
* **api:** reuse HttpMethod type in RestExecuteOptions ([245ffe6](https://github.com/RLAlpha49/AniLink/commit/245ffe677915e256bc57789c4d14f87520b8d3ff))
* **api:** route operations through declarative execute pipeline ([6b7e946](https://github.com/RLAlpha49/AniLink/commit/6b7e9463c06e1636a22835849588a090d8a3bff8))
* **api:** split anilist-api-type into facade group modules ([5a27644](https://github.com/RLAlpha49/AniLink/commit/5a27644f3bbc024278b55c53dc05bb65153f2814))
* **api:** wire AniList paginator onto the shared pagination core ([fc0b6d5](https://github.com/RLAlpha49/AniLink/commit/fc0b6d562f3adcd8e098ca9466bf6adf52d7912c))
* **base:** centralize GraphQL response unwrapping ([04e6bd8](https://github.com/RLAlpha49/AniLink/commit/04e6bd8ade014dc47be8c6c99b2b054e6a2ee0d5))
* **base:** extract unwrapSingleRootField helper ([09c4894](https://github.com/RLAlpha49/AniLink/commit/09c4894f8c08b4d0db7734a392f6e1c360b26cc4))
* **base:** schedule sleep timeout before abort handler ([d4d1358](https://github.com/RLAlpha49/AniLink/commit/d4d135857334d0e7ead118c8b32954d81d6aaba0))
* **scripts:** move api-compare library to lib/api-compare ([2a5969b](https://github.com/RLAlpha49/AniLink/commit/2a5969b5439dd3b2e77ef2f35056019d652d2ec3))

### 📚 Documentation

* add contributing guide and changelog stub ([23ccd05](https://github.com/RLAlpha49/AniLink/commit/23ccd0564ba7d69841b88cb7b482b8c2a8aa5e5f))
* add project badges ([f8ab890](https://github.com/RLAlpha49/AniLink/commit/f8ab890ced02d90de1790d5eb543908ec2f52a96))
* add upstream compatibility policy, auth examples, and contributor guardrails ([57cafbd](https://github.com/RLAlpha49/AniLink/commit/57cafbdb25c65998b1270436cef941a4baa956b2))
* **anilist:** add AniList reference links ([3fb6722](https://github.com/RLAlpha49/AniLink/commit/3fb6722dca6adc9416b7f952839ddf216811a219))
* **anilist:** simplify media list deletion example ([5f2dc95](https://github.com/RLAlpha49/AniLink/commit/5f2dc95ee78e7aba32317738c1eb8b7fc7692649))
* **anilist:** update AniList API examples ([5f2bb30](https://github.com/RLAlpha49/AniLink/commit/5f2bb30da9f53516de87ba94c78260141eb4af1e))
* **anilist:** update HTML query option examples ([3adcca7](https://github.com/RLAlpha49/AniLink/commit/3adcca7b6bbf9741ada81a505e6bd25ea8dbcbd6))
* **api-compare:** render dated upstream coverage into the comparison report ([980e83c](https://github.com/RLAlpha49/AniLink/commit/980e83c90171ece5df5629a51757f00a121e7f36))
* **api:** refresh examples and API docstrings ([40d0187](https://github.com/RLAlpha49/AniLink/commit/40d0187f9ff4e37f4a52a2d96bc151fa92077e60))
* fix stale Paginator path in MediaListCollection chunk guide ([5ca1926](https://github.com/RLAlpha49/AniLink/commit/5ca19266c5e499ba575ce3fa614307f86c75beeb))
* **readme:** document client options, hooks, errors, and OAuth state ([853986a](https://github.com/RLAlpha49/AniLink/commit/853986aee536fc7f4c0596c2ef8944eb972c068c))
* rewrite project overview ([1a4631d](https://github.com/RLAlpha49/AniLink/commit/1a4631d31e62c314c962c59d3d70419c78137938))

### 💎 Style

* **api:** collapse delete mutation signatures to single lines ([9711e58](https://github.com/RLAlpha49/AniLink/commit/9711e58921e8927fdf042d2ddd11dbfbb14423b9))
* format source and tests with Prettier ([4832b0f](https://github.com/RLAlpha49/AniLink/commit/4832b0fe654bf789a7e50ef4c4e29f5fe261128a))

### 📦 Build

* add AniList API comparison tooling ([01ea72c](https://github.com/RLAlpha49/AniLink/commit/01ea72c0943258720b6656af9cb43905602bb6d7))
* align the local check aggregate with CI quality gates ([690ab73](https://github.com/RLAlpha49/AniLink/commit/690ab73d71797d0ded87f32eeea5d1bdd9594cc8))
* **anilist-api:** expand schema comparison contracts ([6d414b8](https://github.com/RLAlpha49/AniLink/commit/6d414b85634136383d28b8718ada0b3806d7b5ba))
* **anilist-api:** improve schema comparison reporting ([5f63c55](https://github.com/RLAlpha49/AniLink/commit/5f63c55ae88d21de84d49ca26d639cbddffe6a3d))
* **codegen:** add interface generator engine with manifest and unit tests ([6a9984d](https://github.com/RLAlpha49/AniLink/commit/6a9984d8e484586e51e288d99a627cd7bf451594))
* **codegen:** replace schema:sync checker with interfaces:generate check ([4c4381d](https://github.com/RLAlpha49/AniLink/commit/4c4381d437a4ff41c2ba08132fbdbfa73206b3ee))
* configure Prettier formatting ([c0c0ccc](https://github.com/RLAlpha49/AniLink/commit/c0c0ccc2cb1a2a093409b17312b9f511c3a2fb40))
* **deps:** add fast-check for property-based testing ([f28d55c](https://github.com/RLAlpha49/AniLink/commit/f28d55cb7347faf7fc3eb798aa56b051a1c4fd66))
* **deps:** align @types/node with the Node 22 engines floor ([7c2af32](https://github.com/RLAlpha49/AniLink/commit/7c2af32742223ab1530a3faa2f7d65d50eea735a))
* **deps:** remove unused eslint plugins ([0a08bc2](https://github.com/RLAlpha49/AniLink/commit/0a08bc206639c2c2c7648c0c5bee5d6c247a3d27))
* **docs:** migrate Typedoc stack ([4bf1c38](https://github.com/RLAlpha49/AniLink/commit/4bf1c3866f80fd9174e2652df94bcc3ad6560941))
* **lint:** enable type-aware and security-focused ESLint rules ([8b0c9ff](https://github.com/RLAlpha49/AniLink/commit/8b0c9fffddbc2455c93c638fe72b448fa566965f))
* **lint:** enforce eslint and prettier on explorer sources ([eb10385](https://github.com/RLAlpha49/AniLink/commit/eb1038536d51f7f3697be366e2d727039416776c))
* migrate test tooling from Jest to Vitest ([ed232d4](https://github.com/RLAlpha49/AniLink/commit/ed232d4b4b51b4cd4a76a47628bcb1ef748d4b0d))
* modernize ESLint tooling ([881e209](https://github.com/RLAlpha49/AniLink/commit/881e2097fb8d68ed5cd7f39a07ebf641fb0facb5))
* modernize TypeScript tooling ([ebc7d30](https://github.com/RLAlpha49/AniLink/commit/ebc7d30656256035f7e5f1b27f0c5712338c3791))
* **package:** require Node.js 20 ([45015bd](https://github.com/RLAlpha49/AniLink/commit/45015bd1ad1d22197696216a85b5c2e39184a105))
* **package:** ship ESM-only unbuild bundle and require Node 22 ([e8ed796](https://github.com/RLAlpha49/AniLink/commit/e8ed79647dc15d5075078938d2d27b3619558e73))

### 🔧 CI/CD

* add AniList API comparison workflow ([a0d1e01](https://github.com/RLAlpha49/AniLink/commit/a0d1e0139623461f9e6be8980805df2c7c5cc540))
* add AniList integration workflow ([02ba421](https://github.com/RLAlpha49/AniLink/commit/02ba421931ad781215f21f6d8b98ad4f05bcb842))
* add automated verification workflow ([a7c0f1a](https://github.com/RLAlpha49/AniLink/commit/a7c0f1aa138becf49a2e707b28b4bd5e5a5c343d))
* add dry-run mode for release workflow ([23dff44](https://github.com/RLAlpha49/AniLink/commit/23dff44f4b25ac00acda9b75eb7ed68410c012d6))
* add packaged package smoke job ([da11275](https://github.com/RLAlpha49/AniLink/commit/da11275b9edda1b5ccfc273316db542814aac643))
* add semantic-release dry-run support ([a220c8c](https://github.com/RLAlpha49/AniLink/commit/a220c8c6cb7245298b14960a11b3ee0399799c3c))
* **api-compare:** add strict mode, weekly live schedule, and discrepancy annotations ([b739ef3](https://github.com/RLAlpha49/AniLink/commit/b739ef3a57b7a10bc346d979e73676310fc3ba10))
* bound jobs, adopt official Pages flow, and gate releases on live checks ([6231976](https://github.com/RLAlpha49/AniLink/commit/6231976ced3634227c0e85f0a7fb9b7fa82526f1))
* cancel superseded runs, run on Node 22, gate npm publishing ([2f1b4b4](https://github.com/RLAlpha49/AniLink/commit/2f1b4b427994732f1ce5e3235fd75be8267e7fb8))
* configure Dependabot GitHub Actions updates ([46b32f3](https://github.com/RLAlpha49/AniLink/commit/46b32f3f2350e691ed105382bff365b1119bbb61))
* **dependabot:** remove duplicate npm security update rule ([72fe6c0](https://github.com/RLAlpha49/AniLink/commit/72fe6c0a6858c8433f345880f4bb36141d171e77))
* **deps:** group dependabot updates and add daily security-only stream ([1a56e94](https://github.com/RLAlpha49/AniLink/commit/1a56e9462e480d144734ba6860ff81632c4d097d))
* **docs:** strengthen JSDoc validation ([59da56e](https://github.com/RLAlpha49/AniLink/commit/59da56ea4f8b20b4d3870e32e0281b0b9d17c9fe))
* **docs:** validate AniList API reference links ([6dd4310](https://github.com/RLAlpha49/AniLink/commit/6dd43102b2066cc1f61a6418bbad3625cc849254))
* **docs:** validate AniList reference links ([be4f436](https://github.com/RLAlpha49/AniLink/commit/be4f436eb8bb4822613b741fe298a253bce45ba7))
* enforce JSDoc and script validation ([07e2595](https://github.com/RLAlpha49/AniLink/commit/07e2595d1bf4caf93ede435f39a6beb8768996d9))
* fail when ANILIST_TOKEN secret is missing ([2832f6c](https://github.com/RLAlpha49/AniLink/commit/2832f6ccaee066e213f237aa30faa52dd82b406f))
* gate release on successful CI ([1849670](https://github.com/RLAlpha49/AniLink/commit/1849670615c5fb83a3555dd5772493f6c150108e))
* gate schema/interface sync and snapshot comparison ([169098d](https://github.com/RLAlpha49/AniLink/commit/169098d9be5a1a8a5465c1515f43b451b21e13dc))
* include formatting and JSDoc checks in validation ([1e9a252](https://github.com/RLAlpha49/AniLink/commit/1e9a2526b79bc88345c8a428fadedb4c9ffc1543))
* publish generated documentation to gh-pages ([c99ae6a](https://github.com/RLAlpha49/AniLink/commit/c99ae6ae7c7344bd0973e8cf9c4708fd803dba6d))
* reduce release workflow timeout ([59c994c](https://github.com/RLAlpha49/AniLink/commit/59c994c7c6f4789b832f468a90837c3333bc5af7))
* **release:** add provenance permission ([8d9cffc](https://github.com/RLAlpha49/AniLink/commit/8d9cffca89b7c1d2d3bd86646905e63ab47b7af9))
* **release:** add semantic-release automation [skip ci] ([bb50a94](https://github.com/RLAlpha49/AniLink/commit/bb50a943d5d786a891297723414f16330ad5d6ba))
* **release:** omit npm token from release job ([daa6f51](https://github.com/RLAlpha49/AniLink/commit/daa6f51f3e828a166dad7e00fe4898b6981f931f))
* remove Jest test workflow ([b4a2dd5](https://github.com/RLAlpha49/AniLink/commit/b4a2dd5e35f1e30019b862395c1cee11dd530674))
* update analysis and documentation workflows ([34ed87c](https://github.com/RLAlpha49/AniLink/commit/34ed87c07b67ac16abc4af1cddad5e13103b962a))

### 🧪 Tests

* **api:** add live integration coverage for AniList queries ([1aac56a](https://github.com/RLAlpha49/AniLink/commit/1aac56a457eb348e8882389b897b24c8a8d440da))
* **api:** add property-based tests for variables and pagination ([3368a65](https://github.com/RLAlpha49/AniLink/commit/3368a653a3852b5713d94d5c01c742bcd2f6f4cc))
* **api:** assert transport contract for every mutation operation ([2040a7a](https://github.com/RLAlpha49/AniLink/commit/2040a7a178f1f0cb845009afc2b1752aec1ff9d0))
* **api:** cover custom query input guards ([3ace603](https://github.com/RLAlpha49/AniLink/commit/3ace603bc87a351ce3c24e781ce9934761f0ed62))
* **api:** cover upstream error envelope normalization ([981668c](https://github.com/RLAlpha49/AniLink/commit/981668c2db6bcf5de69ae30cfcd30b06b25b0919))
* **api:** drive the real facade-to-Axios seam in a dedicated suite ([ed5522e](https://github.com/RLAlpha49/AniLink/commit/ed5522e444890f959c925f65d5e4330df97a8948))
* **api:** extract shared axios test double for transport suites ([c8266d2](https://github.com/RLAlpha49/AniLink/commit/c8266d2abb6a32a3f23cddc787d4e03c1906ab51))
* **api:** fail fast on invalid ANILIST_TOKEN via credential preflight ([e697e6f](https://github.com/RLAlpha49/AniLink/commit/e697e6f436a0cefbb3cfcf3448d9153be2d206db))
* **api:** pin custom() document guard against adversarial inputs ([fb6eb1c](https://github.com/RLAlpha49/AniLink/commit/fb6eb1c626c27b4e656c9bf51bf31e5ca35f5d23))
* **api:** pin registry wiring coverage and manifest resolution ([ec72352](https://github.com/RLAlpha49/AniLink/commit/ec7235239ea44c835d77486811e3520fe9807865))
* **api:** stop fixtures from sending variables operations do not accept ([a97bf52](https://github.com/RLAlpha49/AniLink/commit/a97bf5212f02011602b7e34326dcba29d0bb78b0))
* cover auth headers, envelope unwrapping, and validation errors ([f2d5a2a](https://github.com/RLAlpha49/AniLink/commit/f2d5a2ad1fda9333c6e805e07a7ccc8264857d1c))
* cover validation, pagination, retry, registry, and REST seams ([87fd9f5](https://github.com/RLAlpha49/AniLink/commit/87fd9f5313e88859ea1c121cf4d53dbba9874741))
* enforce 90% coverage thresholds via v8 provider ([edb5b74](https://github.com/RLAlpha49/AniLink/commit/edb5b7452b336d4e5ccf1dc9da7c01828d80f6cd))
* exclude integration tests from Vitest run ([9e6ba01](https://github.com/RLAlpha49/AniLink/commit/9e6ba014f98903ffc7beec7541444f887980b87b))
* harden array coercion against hostile property values ([2185a84](https://github.com/RLAlpha49/AniLink/commit/2185a84977aba9492205b242212daaae2882ced6))
* lower unit test timeout to five seconds ([f18ffb6](https://github.com/RLAlpha49/AniLink/commit/f18ffb646ac7ca85aeb7f4de347212e162e38e7e))
* remove any casts and unused mock parameters ([f896c93](https://github.com/RLAlpha49/AniLink/commit/f896c939fc4c21b582fbf222efd5a77b92315ee2))
* restore the 90% branch coverage gate ([c5daf4f](https://github.com/RLAlpha49/AniLink/commit/c5daf4f8c1d280640305c60f49dbb12d7cffcf51))
