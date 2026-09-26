// @vitest-environment happy-dom

import { afterEach, describe, expect, test, vi } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { nextTick, type DefineComponent } from "vue";
import ConsentBanner from "../docs-src/lib/components/ConsentBanner.vue";
import HomeCodePanel from "../docs-src/lib/components/home/HomeCodePanel.vue";
import ProviderTabs from "../docs-src/lib/components/ProviderTabs.vue";
import SemanticSearch from "../docs-src/lib/components/SemanticSearch.vue";
import TocMinimap from "../docs-src/lib/components/TocMinimap.vue";
import {
    HEADING_DETECTION_OFFSET,
    HEADING_SCROLL_OFFSET,
    selectVisibleSections,
    type PageHeading,
} from "../docs-src/lib/useHeadingScrollSpy";
import {
    CONSENT_BOOT_SCRIPT,
    CONSENT_EXPIRY_MS,
    CONSENT_STORAGE_KEY,
    GA_MEASUREMENT_ID,
    consentAccepted,
    consentChoiceNeeded,
    setConsent,
} from "../docs-src/lib/consent.mjs";

declare module "vue" {
    export interface GlobalComponents {
        ClientOnly: DefineComponent;
    }
}

vi.mock("../docs-src/lib/useShikiHighlighter", () => ({
    highlightTypeScript: vi.fn().mockResolvedValue(""),
}));

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
    /** Cookie assignments made by the boot script. */
    cookieWrites: string[];
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
    const cookieWrites: string[] = [];
    const doc: StubDocument = {
        appendedScripts,
        cookie: "",
        cookieWrites,
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
            cookieWrites.push(value);
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
function runBootScript(
    options: {
        storage?: StubStorage;
        document?: StubDocument;
        navigator?: { globalPrivacyControl?: boolean };
    } = {}
): {
    window: BootWindow;
    dataLayer: unknown[];
    storage: StubStorage;
    document: StubDocument;
} {
    const storage = options.storage ?? createStubStorage();
    const doc = options.document ?? createStubDocument();
    const navigator = options.navigator ?? {};
    const dataLayer: unknown[] = [];
    const window: BootWindow = { dataLayer };
    const boot = new Function(
        "window",
        "document",
        "localStorage",
        "dataLayer",
        "navigator",
        CONSENT_BOOT_SCRIPT
    ) as (
        window: BootWindow,
        document: StubDocument,
        localStorage: StubStorage,
        dataLayer: unknown[],
        navigator: { globalPrivacyControl?: boolean }
    ) => void;
    boot(window, doc, storage, dataLayer, navigator);
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

    test("Global Privacy Control denies analytics and clears parent-domain GA cookies", () => {
        const storage = createStubStorage();
        storage.setItem(
            CONSENT_STORAGE_KEY,
            JSON.stringify({ choice: "accepted", at: Date.now() })
        );
        const doc = createStubDocument();
        doc.cookie = "_ga=GA1.1.111; Domain=alpha49.com; Path=/";
        doc.cookie = `_ga_${GA_MEASUREMENT_ID}=GS1.1.222; Domain=alpha49.com; Path=/`;
        const { window, dataLayer, document } = runBootScript({
            storage,
            document: doc,
            navigator: { globalPrivacyControl: true },
        });

        expect(window.__anilinkConsent?.accepted()).toBe(false);
        expect(consentEntry(dataLayer, "default")?.[2]).toMatchObject({
            analytics_storage: "denied",
        });
        expect(document.appendedScripts).toHaveLength(0);
        expect(document.cookieWrites).toContain("_ga=; Max-Age=0; path=/; domain=alpha49.com");
        expect(document.cookieWrites).toContain(
            `_ga_${GA_MEASUREMENT_ID}=; Max-Age=0; path=/; domain=alpha49.com`
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

describe("ConsentBanner.vue", () => {
    let mountedWrapper: VueWrapper | undefined;

    async function mountConsentBanner(needsChoice: boolean) {
        const needsChoiceMock = vi.fn(() => needsChoice);
        const setMock = vi.fn();
        Object.defineProperty(window, "__anilinkConsent", {
            configurable: true,
            value: { needsChoice: needsChoiceMock, set: setMock },
        });

        const wrapper = mount(ConsentBanner, {
            global: {
                stubs: {
                    ClientOnly: { template: "<div><slot /></div>" },
                    Transition: true,
                },
            },
        });
        mountedWrapper = wrapper;
        await nextTick();
        return { needsChoiceMock, setMock, wrapper };
    }

    afterEach(() => {
        mountedWrapper?.unmount();
        mountedWrapper = undefined;
        Reflect.deleteProperty(window, "__anilinkConsent");
    });

    test("shows the banner when a choice is needed", async () => {
        const { needsChoiceMock, wrapper } = await mountConsentBanner(true);

        expect(needsChoiceMock).toHaveBeenCalledTimes(1);
        expect(wrapper.find('[role="region"][aria-label="Analytics consent"]').exists()).toBe(true);
        expect(wrapper.find('button[aria-label="Analytics settings"]').exists()).toBe(false);
    });

    test("shows the settings control when a valid choice exists", async () => {
        const { wrapper } = await mountConsentBanner(false);

        expect(wrapper.find('[role="region"][aria-label="Analytics consent"]').exists()).toBe(
            false
        );
        expect(wrapper.find('button[aria-label="Analytics settings"]').exists()).toBe(true);
    });

    test("accepting stores the choice and closes the banner", async () => {
        const { setMock, wrapper } = await mountConsentBanner(true);

        await wrapper.get("button.consent-accept").trigger("click");

        expect(setMock).toHaveBeenCalledWith(true);
        expect(wrapper.find('[role="region"][aria-label="Analytics consent"]').exists()).toBe(
            false
        );
        expect(wrapper.find('button[aria-label="Analytics settings"]').exists()).toBe(true);
    });

    test("declining stores the choice and closes the banner", async () => {
        const { setMock, wrapper } = await mountConsentBanner(true);

        await wrapper.get("button.consent-decline").trigger("click");

        expect(setMock).toHaveBeenCalledWith(false);
        expect(wrapper.find('[role="region"][aria-label="Analytics consent"]').exists()).toBe(
            false
        );
        expect(wrapper.find('button[aria-label="Analytics settings"]').exists()).toBe(true);
    });

    test("reopens the banner from the settings control", async () => {
        const { wrapper } = await mountConsentBanner(false);

        await wrapper.get('button[aria-label="Analytics settings"]').trigger("click");

        expect(wrapper.find('[role="region"][aria-label="Analytics consent"]').exists()).toBe(true);
        expect(wrapper.find('button[aria-label="Analytics settings"]').exists()).toBe(false);
    });
});

describe("docs UI components", () => {
    const wrappers: VueWrapper[] = [];

    function track<T extends VueWrapper>(wrapper: T): T {
        wrappers.push(wrapper);
        return wrapper;
    }

    afterEach(() => {
        for (const wrapper of wrappers.splice(0)) wrapper.unmount();
        localStorage.removeItem("anilink-search-recent");
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    test("ProviderTabs honors its initial provider and connects tabs to their panels", () => {
        const wrapper = track(mount(ProviderTabs, { props: { initial: "mal" } }));
        const tabs = wrapper.findAll('[role="tab"]');
        const panels = wrapper.findAll('[role="tabpanel"]');

        expect(tabs[0].attributes("aria-selected")).toBe("false");
        expect(tabs[1].attributes("aria-selected")).toBe("true");
        expect(tabs[0].attributes("tabindex")).toBe("-1");
        expect(tabs[1].attributes("tabindex")).toBe("0");
        expect(tabs[0].attributes("aria-controls")).toBe(panels[0].attributes("id"));
        expect(tabs[1].attributes("aria-controls")).toBe(panels[1].attributes("id"));
        expect(panels[0].attributes("aria-labelledby")).toBe(tabs[0].attributes("id"));
        expect(panels[1].attributes("aria-labelledby")).toBe(tabs[1].attributes("id"));
    });

    test("ProviderTabs moves focus through the tab order with left and right wraparound", async () => {
        const wrapper = track(mount(ProviderTabs));
        const tabs = wrapper.findAll('[role="tab"]');
        const firstTabFocus = vi.spyOn(tabs[0].element as HTMLButtonElement, "focus");
        const secondTabFocus = vi.spyOn(tabs[1].element as HTMLButtonElement, "focus");

        await tabs[0].trigger("keydown", { key: "ArrowRight" });
        expect(tabs[1].attributes("aria-selected")).toBe("true");
        expect(secondTabFocus).toHaveBeenCalledOnce();

        await tabs[1].trigger("keydown", { key: "ArrowRight" });
        expect(tabs[0].attributes("aria-selected")).toBe("true");
        expect(firstTabFocus).toHaveBeenCalledOnce();

        await tabs[0].trigger("keydown", { key: "ArrowLeft" });
        expect(tabs[1].attributes("aria-selected")).toBe("true");
        expect(secondTabFocus).toHaveBeenCalledTimes(2);
    });

    test("TocMinimap emits the selected heading id without a browser hash jump", async () => {
        const tocHeaders: PageHeading[] = [{ id: "intro", title: "Introduction", level: 2 }];
        const wrapper = track(
            mount(TocMinimap, {
                props: {
                    tocHeaders,
                    scrollProgress: 0,
                    scrollViewport: { start: 0, end: 1 },
                },
            })
        );

        await wrapper.get('a[href="#intro"]').trigger("click");

        expect(wrapper.emitted("navigate")).toEqual([["intro"]]);
    });

    test("TocMinimap hides the viewport indicator when there are no headings", () => {
        const wrapper = track(
            mount(TocMinimap, {
                props: {
                    tocHeaders: [],
                    scrollProgress: 0,
                    scrollViewport: { start: 0, end: 1 },
                },
            })
        );

        expect((wrapper.get(".docs-toc-indicator").element as HTMLElement).style.display).toBe(
            "none"
        );
    });

    test("SemanticSearch clears recent queries from the UI and localStorage", async () => {
        localStorage.setItem("anilink-search-recent", JSON.stringify(["AniList auth", "MAL"]));
        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue({
                json: async () => ({ model: "test", dim: 2, docs: [] }),
            })
        );
        const wrapper = track(mount(SemanticSearch, { props: { open: true } }));
        await nextTick();

        expect(wrapper.findAll(".ss-recent-item").map((item) => item.text())).toEqual([
            "AniList auth",
            "MAL",
        ]);
        await wrapper.get(".ss-recent-clear").trigger("click");

        expect(localStorage.getItem("anilink-search-recent")).toBeNull();
        expect(wrapper.find(".ss-recent").exists()).toBe(false);
    });

    test("HomeCodePanel copies the example and announces success", async () => {
        const writeText = vi.fn().mockResolvedValue(undefined);
        vi.stubGlobal("navigator", { clipboard: { writeText } });
        const wrapper = track(mount(HomeCodePanel));

        await wrapper.get(".al-code-copy").trigger("click");
        await vi.waitFor(() => expect(wrapper.get(".al-code-copy").text()).toContain("Copied"));

        expect(writeText).toHaveBeenCalledOnce();
        expect(writeText.mock.calls[0][0]).toContain("new AniLink");
    });

    test("HomeCodePanel reports when the clipboard rejects the copy request", async () => {
        const writeText = vi.fn().mockRejectedValue(new Error("clipboard denied"));
        vi.stubGlobal("navigator", { clipboard: { writeText } });
        const wrapper = track(mount(HomeCodePanel));

        await wrapper.get(".al-code-copy").trigger("click");
        await vi.waitFor(() =>
            expect(wrapper.get(".al-code-copy").attributes("title")).toBe("Copy failed")
        );

        expect(writeText).toHaveBeenCalledOnce();
    });

    test("active-heading detection keeps its 72px threshold separate from the 80px scroll offset", () => {
        const positions = [
            { id: "short", top: 0, bottom: 75 },
            { id: "next", top: 75, bottom: 160 },
        ];

        expect(HEADING_DETECTION_OFFSET).toBe(72);
        expect(HEADING_SCROLL_OFFSET).toBe(80);
        expect(selectVisibleSections(positions, 0, 100, HEADING_DETECTION_OFFSET).indices).toEqual([
            0, 1,
        ]);
        expect(selectVisibleSections(positions, 0, 100, HEADING_SCROLL_OFFSET).indices).toEqual([
            1,
        ]);
    });
});
