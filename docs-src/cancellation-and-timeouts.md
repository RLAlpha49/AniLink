---
title: Cancellation & timeouts
layout: .vitepress/theme/DocsLayout.vue
---

# Cancellation & timeouts

## Timeouts

`timeout` is the milliseconds before a request is aborted. Default: `30000` (30 s). `0` disables the timeout. Negative or non-finite values throw a `TypeError` when options are resolved.

```typescript
import { AniLink } from "anilink-api-wrapper";

const aniLink = new AniLink("token", { timeout: 10_000 });
```

Timeout failures throw `AniLinkNetworkError` with code `TIMEOUT_ERROR`. The error carries the effective duration as `timeoutMs`.

<Mermaid
    :code="`flowchart TD\n    A([Request sent]) --> B{timeout elapsed?}\n    B -- yes --> T([Throw TIMEOUT_ERROR]):::err\n    B -- no --> C{AbortSignal aborted?}\n    C -- yes --> AB([Throw ABORTED_ERROR]):::err\n    C -- no --> D{Response received?}\n    D -- no --> B\n    D -- yes --> E([Return result]):::ok\n\n    F([In retry wait]) --> G{AbortSignal aborted?}\n    G -- yes --> AB\n    G -- no --> H[Continue waiting]\n    H --> F\n\n    classDef ok fill:#d5e8d4,stroke:#82b366,color:#2d5016;\n    classDef err fill:#f8cecc,stroke:#b85450,color:#5c1a1a;`"
/>

## Cancellation with `AbortSignal`

Pass an `AbortSignal` to cancel in-flight requests:

```typescript
const controller = new AbortController();

const aniLink = new AniLink("token", { signal: controller.signal });

setTimeout(() => controller.abort(), 2_000);

try {
    await aniLink.anilist.query.media({ id: 1, type: "ANIME" });
} catch (error) {
    // Aborted requests surface as AniLinkNetworkError with code ABORTED_ERROR.
}
```

## Abort during retry waits

Cancellation is honored while a retry backoff is pending. Aborting the signal during a wait stops the retry loop. The request rejects promptly with `ABORTED_ERROR` instead of waiting out the delay.

## Token-request defaults

OAuth token requests (both providers) use their own default timeout of **10 seconds**, independent of instance transport settings. Pass `options.timeout` on the token-request helpers to override it.

## Provider scoping

`timeout` and `signal` are transport settings — they apply to the provider slot where they are declared. See [Provider configuration](/provider-configuration).

## Next steps

- <Icon name="ArrowRight" :size="14" /> [Retries & resilience](/retries-and-resilience) — how retries interact with aborts.
- <Icon name="ArrowRight" :size="14" /> [Error handling](/error-handling) — classifying `TIMEOUT_ERROR` and `ABORTED_ERROR`.
