/**
 * Shared analytics-consent contract for the AniLink docs.
 *
 * Both docs sites (the VitePress site and the TypeDoc API reference) load
 * Google Analytics 4. GA4 cookies are not strictly necessary, so the site
 * defaults every consent signal to "denied" and only enables measurement
 * after the visitor accepts in the consent banner. The boot script below is
 * inlined into both sites at build time; it must stay dependency-free
 * and SSR-safe (it runs before the page hydrates).
 *
 * The boot script is the single implementation of the consent logic. It
 * defines a `window.__anilinkConsent` API (`accepted`, `needsChoice`, `set`)
 * that both sites call, so the VitePress bundle and the TypeDoc inline
 * script cannot drift apart. The module functions below are thin wrappers
 * over that API.
 *
 * Advertising consent signals (`ad_storage`, `ad_user_data`,
 * `ad_personalization`) are permanently denied. The docs run no ads and
 * build no personalization profiles, so accepting grants analytics
 * measurement only.
 *
 * The Global Privacy Control signal overrides a previously stored
 * acceptance. While the signal is active, analytics stays denied and the
 * consent banner stays closed.
 *
 * The site never fetches the gtag library from Google until the visitor
 * accepts; declining or ignoring the banner makes no third-party analytics
 * request. A stored choice expires after 12 months, after which the banner
 * reappears and measurement stays off until the visitor chooses again.
 *
 * The file is plain JavaScript (no TypeScript syntax) so the VitePress
 * config bundler can import it and the TypeDoc plugin can extract the boot
 * script as text.
 */

/** GA4 measurement ID: the single definition shared by every site. */
export const GA_MEASUREMENT_ID = "G-E7DTXPFY3D";

/** localStorage key holding the visitor's choice. */
export const CONSENT_STORAGE_KEY = "anilink-analytics-consent";

/** How long a stored choice stays valid before the banner reappears. */
export const CONSENT_EXPIRY_MS = 365 * 24 * 60 * 60 * 1000;

/** Parent domain used by GA4's automatic cookie scope on the production docs host. */
const GA_COOKIE_DOMAIN = "alpha49.com";

/**
 * Inline boot script: the single implementation of the consent contract.
 *
 * Defines `window.__anilinkConsent` (`accepted()`, `needsChoice()`,
 * `set(accepted)`) and runs the boot sequence: default every GA4 consent
 * signal to "denied", then, only if a fresh stored choice is "accepted",
 * grant analytics, load the gtag library, and start measurement. Declining
 * (or never answering) leaves measurement off: no cookies, no hits, and no
 * request to Google. Declining after an earlier acceptance also
 * deletes any `_ga` cookies that consent no longer covers.
 *
 * Stored format: `{"choice":"accepted"|"denied","at":<epoch ms>}`. The
 * script treats a choice older than the expiry as unanswered, so the banner
 * reappears and measurement stays off until the visitor chooses again.
 */
export const CONSENT_BOOT_SCRIPT = `(() => {
  function globalPrivacyControlEnabled() {
    return typeof navigator !== "undefined" && navigator.globalPrivacyControl === true;
  }
  function readChoice() {
    try {
      const raw = localStorage.getItem("${CONSENT_STORAGE_KEY}");
      if (!raw) return null;
      let parsed = null;
      try { parsed = JSON.parse(raw); } catch (e) { parsed = null; }
      if (parsed === null || typeof parsed !== "object") return null;
      if (parsed.choice !== "accepted" && parsed.choice !== "denied") return null;
      if (typeof parsed.at !== "number") return null;
      if (Date.now() - parsed.at > ${CONSENT_EXPIRY_MS}) return null;
      return parsed.choice;
    } catch (e) {
      return null;
    }
  }
  function clearAnalyticsCookies() {
    try {
      const cookies = document.cookie ? document.cookie.split(";") : [];
      const names = new Set();
      for (const entry of cookies) {
        const name = entry.split("=", 1)[0].trim();
        if (name.indexOf("_ga") === 0) {
          names.add(name);
        }
      }
      for (const name of names) {
        document.cookie = name + "=; Max-Age=0; path=/";
        document.cookie = name + "=; Max-Age=0; path=/; domain=${GA_COOKIE_DOMAIN}";
      }
    } catch (e) {
      /* Cookie access unavailable. Nothing to clear. */
    }
  }
  function loadGtagLibrary() {
    if (document.querySelector('script[src*="googletagmanager.com/gtag/js"]')) return;
    const s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}";
    document.head.appendChild(s);
  }
  function applyChoice(accepted) {
    const granted = accepted && !globalPrivacyControlEnabled();
    try {
      localStorage.setItem(
        "${CONSENT_STORAGE_KEY}",
        JSON.stringify({ choice: granted ? "accepted" : "denied", at: Date.now() })
      );
    } catch (e) {
      /* Storage unavailable. Nothing to persist. */
    }
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(["consent", "update", {
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      analytics_storage: granted ? "granted" : "denied"
    }]);
    if (granted) {
      window.dataLayer.push(["js", new Date()]);
      window.dataLayer.push(["config", "${GA_MEASUREMENT_ID}"]);
      loadGtagLibrary();
    } else {
      clearAnalyticsCookies();
    }
  }
  window.__anilinkConsent = {
    accepted: function () { return !globalPrivacyControlEnabled() && readChoice() === "accepted"; },
    needsChoice: function () { return !globalPrivacyControlEnabled() && readChoice() === null; },
    globalPrivacyControl: globalPrivacyControlEnabled,
    set: applyChoice
  };
  try {
    const gpcEnabled = globalPrivacyControlEnabled();
    const granted = !gpcEnabled && readChoice() === "accepted";
    if (gpcEnabled) clearAnalyticsCookies();
    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    gtag("consent", "default", {
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      analytics_storage: granted ? "granted" : "denied",
      wait_for_update: 500
    });
    if (granted) {
      gtag("js", new Date());
      gtag("config", "${GA_MEASUREMENT_ID}");
      loadGtagLibrary();
    }
  } catch (e) {
    /* Storage unavailable. Leave consent denied. */
  }
})();`;

/** The shared consent API injected by the boot script, when present. */
function consentApi() {
    if (typeof window === "undefined") return undefined;
    return window.__anilinkConsent;
}

/** True when the stored choice is "accepted". SSR-safe. */
export function consentAccepted() {
    return consentApi()?.accepted() ?? false;
}

/**
 * True when no valid stored choice exists (none, malformed, or expired).
 * SSR-safe: defaults to true. Before the boot script has run (or during
 * SSR), no choice is known, so the banner shows and measurement stays off.
 */
export function consentChoiceNeeded() {
    return consentApi()?.needsChoice() ?? true;
}

/** True when the browser's Global Privacy Control signal is active. */
export function consentGlobalPrivacyControlEnabled() {
    return consentApi()?.globalPrivacyControl?.() ?? false;
}

/**
 * Persist a choice and apply it immediately: "accepted" grants the analytics
 * consent field, loads the gtag library, and (re)configures GA4; "denied"
 * revokes every field and clears existing analytics cookies.
 *
 * Delegates to the boot script's `window.__anilinkConsent` API, the same
 * implementation the TypeDoc banner calls, so both sites behave
 * identically. No-op until the boot script has run.
 *
 * @param {boolean} accepted - The visitor's consent choice.
 */
export function setConsent(accepted) {
    consentApi()?.set(accepted);
}
