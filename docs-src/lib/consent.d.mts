/**
 * Type declarations for the plain-JavaScript consent module.
 *
 * `consent.mjs` is authored as plain JavaScript so the VitePress config
 * bundler can import it and the TypeDoc plugin can extract the boot script
 * as text; this companion declaration keeps `.vue`/`.ts` consumers typed.
 */

/** GA4 measurement ID — the single definition shared by every surface. */
export declare const GA_MEASUREMENT_ID: string;

/** localStorage key holding the visitor's choice. */
export declare const CONSENT_STORAGE_KEY: string;

/** How long (in milliseconds) a stored choice stays valid before the banner reappears. */
export declare const CONSENT_EXPIRY_MS: number;

/**
 * Inline boot script: denies every GA4 consent signal by default, grants
 * analytics only for a fresh stored "accepted" choice, and defines the
 * shared `window.__anilinkConsent` API both docs surfaces call.
 */
export declare const CONSENT_BOOT_SCRIPT: string;

/** True when the stored choice is "accepted". SSR-safe. */
export declare function consentAccepted(): boolean;

/** True when no valid stored choice exists (none, malformed, or expired). SSR-safe. */
export declare function consentChoiceNeeded(): boolean;

/**
 * Persist a choice and apply it immediately: accepting grants the analytics
 * consent field, loads the gtag library, and (re)configures GA4; declining
 * revokes every field and clears existing analytics cookies.
 *
 * @param accepted - The visitor's consent choice.
 */
export declare function setConsent(accepted: boolean): void;
