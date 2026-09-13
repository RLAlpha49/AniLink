import { afterEach, describe, expect, test, vi } from "vitest";
import {
    CONSENT_BOOT_SCRIPT,
    CONSENT_EXPIRY_MS,
    CONSENT_STORAGE_KEY,
    GA_MEASUREMENT_ID,
    consentAccepted,
    consentChoiceNeeded,
    setConsent,
} from "../docs-src/lib/consent.mjs";

/**
 * Unit coverage for the consent-gating boot script (`CONSENT_BOOT_SCRIPT`)
 * and the SSR-safe wrappers in `docs-src/lib/consent.mjs` that the consent
 * banner (`ConsentBanner.vue`) drives via `consentChoiceNeeded`/`setConsent`.
 *
 * The boot script is authored as a string so the VitePress config and the
 * TypeDoc plugin can inline it into `<head>`. The suite evaluates that exact
 * string in a stubbed browser environment — a `new Function` wrapper over
 * mock `window`, `document`, and `localStorage` objects, with no new
 * dependencies — so the tests exercise the same code visitors' browsers
 * run, not a re-implementation.
 */

/** Script element double created by the boot script's loadGtagLibrary. */
interface StubScriptElement {
    async: boolean;
    src: string;
}

/** Minimal document surface the boot script touches. */
interface StubDocument {
    /** Cookie jar serialized as `name=value` pairs joined by `; `. */
    cookie: string;
    head: { appendChild(node: StubScriptElement): void };
    createElement(): StubScriptElement;
    querySelector(): null;
    /** Every script appended to `<head>`, in order. */
    appendedScripts: StubScriptElement[];
}

/** In-memory localStorage double — the boot script reads and writes one key. */
interface StubStorage {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
}

/** A dataLayer entry — a real array (applyChoice) or an Arguments object (gtag). */
type DataLayerEntry = { [index: number]: unknown };

/** The `window.__anilinkConsent` API the boot script defines. */
interface ConsentApi {
    accepted(): boolean;
    needsChoice(): boolean;
    set(accepted: boolean): void;
}

interface BootWindow {
    __anilinkConsent?: ConsentApi;
    dataLayer?: unknown[];
}

function createStubStorage(): StubStorage {
    const map = new Map<string, string>();
    return {
        getItem: (key: string): string | null => (map.has(key) ? map.get(key)! : null),
        setItem: (key: string, value: string): void => {
            map.set(key, String(value));
        },
    };
}

function createStubDocument(): StubDocument {
    const cookies = new Map<string, string>();
    const appendedScripts: StubScriptElement[] = [];
    const doc: StubDocument = {
        appendedScripts,
        cookie: "",
        head: {
            appendChild: (node: StubScriptElement): void => {
                appendedScripts.push(node);
            },
        },
        createElement: (): StubScriptElement => ({ async: false, src: "" }),
        querySelector: (): null => null,
    };
    Object.defineProperty(doc, "cookie", {
        get: (): string => [...cookies].map(([name, value]) => `${name}=${value}`).join("; "),
        set: (value: string): void => {
            const [pair, ...attributes] = value.split(";");
            const name = pair.split("=", 1)[0].trim();
            // `name=; Max-Age=0; path=/` is the boot script's deletion form.
            if (attributes.some((attribute) => attribute.trim() === "Max-Age=0")) {
                cookies.delete(name);
                return;
            }
            cookies.set(name, pair.slice(name.length + 1));
        },
    });
    return doc;
}

/**
 * Evaluate `CONSENT_BOOT_SCRIPT` against the stub environment.
 *
 * The boot script's `gtag()` helper pushes onto a bare `dataLayer`, which a
 * real browser resolves to `window.dataLayer` through the global scope; the
 * wrapper binds the same array under that name to reproduce it.
 */
function runBootScript(options: { storage?: StubStorage; document?: StubDocument } = {}): {
    window: BootWindow;
    dataLayer: unknown[];
    storage: StubStorage;
    document: StubDocument;
} {
    const storage = options.storage ?? createStubStorage();
    const doc = options.document ?? createStubDocument();
    const dataLayer: unknown[] = [];
    const window: BootWindow = { dataLayer };
    const boot = new Function(
        "window",
        "document",
        "localStorage",
        "dataLayer",
        CONSENT_BOOT_SCRIPT
    ) as (
        window: BootWindow,
        document: StubDocument,
        localStorage: StubStorage,
        dataLayer: unknown[]
    ) => void;
    boot(window, doc, storage, dataLayer);
    return { window, dataLayer, storage, document: doc };
}

/** Find a `["consent", action, fields]` entry pushed onto the dataLayer. */
function consentEntry(dataLayer: unknown[], action: string): DataLayerEntry | undefined {
    return dataLayer.find(
        (entry) =>
            (entry as DataLayerEntry)[0] === "consent" && (entry as DataLayerEntry)[1] === action
    ) as DataLayerEntry | undefined;
}

describe("CONSENT_BOOT_SCRIPT", () => {
    test("defaults every consent signal to denied and fetches nothing with no stored choice", () => {
        const { window, dataLayer, document } = runBootScript();

        expect(window.__anilinkConsent?.needsChoice()).toBe(true);
        expect(window.__anilinkConsent?.accepted()).toBe(false);
        expect(consentEntry(dataLayer, "default")?.[2]).toMatchObject({
            ad_storage: "denied",
            ad_user_data: "denied",
            ad_personalization: "denied",
            analytics_storage: "denied",
        });
        // No gtag library fetch and no measurement configuration.
        expect(document.appendedScripts).toHaveLength(0);
        expect(dataLayer.some((entry) => (entry as DataLayerEntry)[0] === "config")).toBe(false);
    });

    test("a fresh stored accepted choice grants analytics and loads the gtag library", () => {
        const storage = createStubStorage();
        storage.setItem(
            CONSENT_STORAGE_KEY,
            JSON.stringify({ choice: "accepted", at: Date.now() })
        );
        const { window, dataLayer, document } = runBootScript({ storage });

        expect(window.__anilinkConsent?.accepted()).toBe(true);
        expect(window.__anilinkConsent?.needsChoice()).toBe(false);
        expect(consentEntry(dataLayer, "default")?.[2]).toMatchObject({
            analytics_storage: "granted",
        });
        expect(
            dataLayer.some(
                (entry) =>
                    (entry as DataLayerEntry)[0] === "config" &&
                    (entry as DataLayerEntry)[1] === GA_MEASUREMENT_ID
            )
        ).toBe(true);
        expect(document.appendedScripts).toHaveLength(1);
        expect(document.appendedScripts[0]?.src).toBe(
            `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`
        );
    });

    test("declining pushes a denied consent update and clears _ga cookies", () => {
        const storage = createStubStorage();
        const doc = createStubDocument();
        doc.cookie = "_ga=GA1.1.111";
        doc.cookie = `_ga_${GA_MEASUREMENT_ID}=GS1.1.222`;
        doc.cookie = "anilink-docs-theme=dark";
        const { window, dataLayer } = runBootScript({ storage, document: doc });

        window.__anilinkConsent?.set(false);

        expect(consentEntry(dataLayer, "update")?.[2]).toMatchObject({
            ad_storage: "denied",
            ad_user_data: "denied",
            ad_personalization: "denied",
            analytics_storage: "denied",
        });
        expect(JSON.parse(storage.getItem(CONSENT_STORAGE_KEY) ?? "null")).toMatchObject({
            choice: "denied",
        });
        // Only the _ga-prefixed cookies are removed; other cookies survive.
        expect(doc.cookie).toContain("anilink-docs-theme=dark");
        expect(doc.cookie).not.toContain("_ga");
    });

    test("a stored choice older than CONSENT_EXPIRY_MS reads as unanswered", () => {
        const storage = createStubStorage();
        storage.setItem(
            CONSENT_STORAGE_KEY,
            JSON.stringify({
                choice: "accepted",
                at: Date.now() - CONSENT_EXPIRY_MS - 60_000,
            })
        );
        const { window, dataLayer, document } = runBootScript({ storage });

        expect(window.__anilinkConsent?.needsChoice()).toBe(true);
        expect(window.__anilinkConsent?.accepted()).toBe(false);
        expect(consentEntry(dataLayer, "default")?.[2]).toMatchObject({
            analytics_storage: "denied",
        });
        expect(document.appendedScripts).toHaveLength(0);
    });

    test("malformed stored JSON reads as unanswered", () => {
        const storage = createStubStorage();
        storage.setItem(CONSENT_STORAGE_KEY, "not json {");
        const { window, dataLayer, document } = runBootScript({ storage });

        expect(window.__anilinkConsent?.needsChoice()).toBe(true);
        expect(consentEntry(dataLayer, "default")?.[2]).toMatchObject({
            analytics_storage: "denied",
        });
        expect(document.appendedScripts).toHaveLength(0);
    });

    test("a stored choice with an unrecognized value reads as unanswered", () => {
        const storage = createStubStorage();
        storage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({ choice: "maybe", at: Date.now() }));
        const { window } = runBootScript({ storage });

        expect(window.__anilinkConsent?.needsChoice()).toBe(true);
    });

    test("accepting through the banner API stores the choice, grants consent, and loads the gtag library", () => {
        const { window, dataLayer, document, storage } = runBootScript();

        window.__anilinkConsent?.set(true);

        expect(consentEntry(dataLayer, "update")?.[2]).toMatchObject({
            analytics_storage: "granted",
        });
        expect(JSON.parse(storage.getItem(CONSENT_STORAGE_KEY) ?? "null")).toMatchObject({
            choice: "accepted",
        });
        expect(document.appendedScripts).toHaveLength(1);
        expect(document.appendedScripts[0]?.src).toContain("googletagmanager.com/gtag/js");
    });
});

describe("SSR fallbacks (window undefined)", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    test("consentAccepted defaults to false", () => {
        vi.stubGlobal("window", undefined);
        expect(consentAccepted()).toBe(false);
    });

    test("consentChoiceNeeded defaults to true so the banner renders", () => {
        vi.stubGlobal("window", undefined);
        expect(consentChoiceNeeded()).toBe(true);
    });

    test("setConsent is a no-op that does not throw", () => {
        vi.stubGlobal("window", undefined);
        expect(() => setConsent(true)).not.toThrow();
        expect(() => setConsent(false)).not.toThrow();
    });
});
