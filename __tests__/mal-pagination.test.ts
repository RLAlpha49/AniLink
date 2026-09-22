import { describe, expect, test, vi } from "vitest";
import {
    malPaginate,
    malPaginatePages,
    type MalPage,
    type MalPaginateOptions,
} from "../src/apis/rest/mal/Paginator";
import { AniLinkValidationError } from "../src/base/AniLinkError";

/** A minimal MAL list page shape used by the paginator tests. */
interface TestPage extends MalPage<{ id: number }> {
    data: { id: number }[];
}

/**
 * Build a `fetchPage` stub serving `total` items in `perPage`-sized pages,
 * recording every `(page, perPage, signal)` call. The stub mirrors MAL's
 * real contract: every page that is followed by more data carries a
 * `paging.next` URL, and the final page carries no `paging` node at all —
 * even when it comes back full — so the paginator's `paging`-aware
 * terminal detection ends the traversal without a confirmation request.
 */
function stubPages(total: number, perPage: number) {
    const fetchPage = vi.fn(async (page: number): Promise<TestPage> => {
        const offset = (page - 1) * perPage;
        const data = Array.from({ length: Math.min(perPage, total - offset) }, (_, i) => ({
            id: offset + i + 1,
        }));
        return { data, ...(offset + perPage < total ? { paging: { next: "https://next" } } : {}) };
    });
    return { fetchPage, expectedPages: Math.ceil(total / perPage) };
}

describe("malPaginate", () => {
    test("collects items across pages and stops on a short page", async () => {
        const { fetchPage, expectedPages } = stubPages(250, 100);

        const result = await malPaginate(fetchPage, { perPage: 100, concurrency: 1 });

        expect(fetchPage).toHaveBeenCalledTimes(expectedPages);
        expect(fetchPage).toHaveBeenNthCalledWith(1, 1, 100, expect.any(AbortSignal));
        expect(fetchPage).toHaveBeenNthCalledWith(2, 2, 100, expect.any(AbortSignal));
        expect(result.items).toHaveLength(250);
        expect(result.items[0]).toEqual({ id: 1 });
        expect(result.items[249]).toEqual({ id: 250 });
        expect(result.pageCount).toBe(3);
        expect(result.truncated).toBe(false);
        expect(result.pages).toHaveLength(3);
        expect(result.pages[0].paging).toEqual({ next: "https://next" });
        expect(result.pages[2].paging).toBeUndefined();
    });

    test("honors maxPages and reports truncated", async () => {
        const { fetchPage } = stubPages(1000, 100);

        const result = await malPaginate(fetchPage, { perPage: 100, maxPages: 3 });

        expect(fetchPage).toHaveBeenCalledTimes(3);
        expect(result.pageCount).toBe(3);
        expect(result.items).toHaveLength(300);
        expect(result.truncated).toBe(true);
    });

    test("forwards signal to fetchPage and stops on abort with a partial result", async () => {
        const controller = new AbortController();
        const fullPage = (page: number): TestPage => ({
            data: Array.from({ length: 100 }, (_, i) => ({ id: (page - 1) * 100 + i + 1 })),
            paging: { next: "https://next" },
        });
        const fetchPage = vi.fn(
            (page: number): Promise<TestPage> =>
                new Promise((resolve, reject) => {
                    if (page === 2) {
                        controller.abort();
                        reject(new Error("aborted"));
                        return;
                    }
                    resolve(fullPage(page));
                })
        );

        const result = await malPaginate(fetchPage, { signal: controller.signal, concurrency: 1 });

        expect(fetchPage).toHaveBeenCalledTimes(2);
        expect(result.items).toHaveLength(100);
        expect(result.items[0]).toEqual({ id: 1 });
        expect(result.pageCount).toBe(1);
        expect(result.truncated).toBe(false);
    });

    test("issues requests strictly sequentially at the default concurrency", async () => {
        const { fetchPage } = stubPages(450, 100);
        let inFlight = 0;
        let maxInFlight = 0;
        const tracked = vi.fn(async (...args: Parameters<typeof fetchPage>) => {
            inFlight += 1;
            maxInFlight = Math.max(maxInFlight, inFlight);
            try {
                return await fetchPage(...args);
            } finally {
                inFlight -= 1;
            }
        });

        await malPaginate(tracked);

        expect(maxInFlight).toBe(1);
        expect(tracked).toHaveBeenCalledTimes(5);
    });

    test("ends an exact-multiple list on its full final page without a confirmation request", async () => {
        // 500 items at perPage 100: pages 1-5 all come back full, so the
        // short-page heuristic alone cannot know the list ended. MAL's own
        // contract attaches a `paging` node with no `next` URL to the final
        // page, and the paginator treats that as authoritative — the
        // traversal stops at page 5 instead of spending a sixth request on a
        // guaranteed-empty page.
        const fetchPage = vi.fn(async (page: number): Promise<TestPage> => {
            const offset = (page - 1) * 100;
            const data = Array.from({ length: 100 }, (_, i) => ({ id: offset + i + 1 }));
            return {
                data,
                ...(page < 5 ? { paging: { next: "https://next" } } : { paging: {} }),
            };
        });

        const result = await malPaginate(fetchPage, { perPage: 100 });

        expect(fetchPage).toHaveBeenCalledTimes(5);
        expect(result.pageCount).toBe(5);
        expect(result.items).toHaveLength(500);
        expect(result.truncated).toBe(false);
    });

    test("falls back to the short-page heuristic when the paging node is absent", async () => {
        // A payload with no `paging` node at all (a malformed or stripped
        // response) must still end the traversal at its short page instead
        // of looping forever — the heuristic remains the fallback path.
        const fetchPage = vi.fn(async (page: number): Promise<TestPage> => {
            const data =
                page < 3
                    ? Array.from({ length: 100 }, (_, i) => ({ id: (page - 1) * 100 + i + 1 }))
                    : [];
            return { data };
        });

        const result = await malPaginate(fetchPage, { perPage: 100 });

        expect(fetchPage).toHaveBeenCalledTimes(3);
        expect(result.pageCount).toBe(3);
        expect(result.items).toHaveLength(200);
        expect(result.truncated).toBe(false);
    });

    test("continues past a short page that still carries a paging.next URL", async () => {
        // The one shape where the paging-authoritative and short-page
        // readings diverge in the "continue" direction: a short page with a
        // `paging: { next }` node. The `paging` node is authoritative, so
        // the traversal continues instead of stopping at the short page.
        const fetchPage = vi.fn(async (page: number): Promise<TestPage> => {
            // Page 1 comes back short (40 of 100) but carries a next URL;
            // page 2 is the full final page with an empty paging node.
            const data =
                page === 1
                    ? Array.from({ length: 40 }, (_, i) => ({ id: i + 1 }))
                    : Array.from({ length: 100 }, (_, i) => ({ id: 40 + i + 1 }));
            return {
                data,
                ...(page === 1 ? { paging: { next: "https://next" } } : { paging: {} }),
            };
        });

        const result = await malPaginate(fetchPage, { perPage: 100 });

        expect(fetchPage).toHaveBeenCalledTimes(2);
        expect(result.pageCount).toBe(2);
        expect(result.items).toHaveLength(140);
        expect(result.truncated).toBe(false);
    });

    test("ends the traversal on malformed data even when a paging.next node is present", async () => {
        // A broken payload (missing `data`) must end the traversal in every
        // branch — a `paging.next` node must not keep the traversal
        // launching pages up to the `maxPages` guard. The streaming helper
        // is the one that could loop: its terminal predicate must treat
        // malformed data as terminal.
        const fetchPage = vi.fn(async (page: number): Promise<TestPage> => {
            if (page === 1) {
                return {
                    data: Array.from({ length: 100 }, (_, i) => ({ id: i + 1 })),
                    paging: { next: "https://next" },
                };
            }
            return { paging: { next: "https://next" } } as unknown as TestPage;
        });

        const pages: TestPage[] = [];
        for await (const page of malPaginatePages(fetchPage, { perPage: 100, maxPages: 5 })) {
            pages.push(page);
        }

        expect(fetchPage).toHaveBeenCalledTimes(2);
        expect(pages).toHaveLength(2);
    });

    test("clamps perPage at 100 and rejects non-positive values", async () => {
        const { fetchPage } = stubPages(150, 100);

        await malPaginate(fetchPage, { perPage: 500 });
        expect(fetchPage).toHaveBeenNthCalledWith(1, 1, 100, expect.any(AbortSignal));

        await expect(malPaginate(fetchPage, { perPage: 0 })).rejects.toThrow(TypeError);
        await expect(malPaginate(fetchPage, { perPage: -5 })).rejects.toThrow(TypeError);
        await expect(malPaginate(fetchPage, { maxPages: 0 })).rejects.toThrow(TypeError);
    });

    test("onPage fires once per collected page; a throwing onPage is reported and swallowed", async () => {
        const { fetchPage, expectedPages } = stubPages(250, 100);
        const onPage = vi.fn();
        const onHookError = vi.fn();

        await malPaginate(fetchPage, { perPage: 100, onPage, onHookError });

        expect(onPage).toHaveBeenCalledTimes(expectedPages);
        expect(onPage).toHaveBeenNthCalledWith(1, {
            paging: { next: "https://next" },
            items: expect.any(Array),
        });
        expect(onHookError).not.toHaveBeenCalled();

        const throwing = vi.fn(() => {
            throw new Error("observer broke");
        });
        const result = await malPaginate(fetchPage, {
            perPage: 100,
            onPage: throwing,
            onHookError,
        });

        expect(throwing).toHaveBeenCalledTimes(expectedPages);
        expect(onHookError).toHaveBeenCalledWith("onPage", expect.any(Error));
        expect(result.items).toHaveLength(250);
    });

    test("rotates the offset math with startPage", async () => {
        const { fetchPage } = stubPages(1000, 100);

        const result = await malPaginate(fetchPage, { perPage: 100, startPage: 3, maxPages: 1 });

        expect(fetchPage).toHaveBeenNthCalledWith(1, 3, 100, expect.any(AbortSignal));
        expect(result.items[0]).toEqual({ id: 201 });
        expect(result.pageCount).toBe(1);
    });

    test("throws when a page response has no data key", async () => {
        const fetchPage = vi.fn(async () => ({ paging: { next: "https://next" } }) as never);

        await expect(malPaginate(fetchPage, { perPage: 100 })).rejects.toBeInstanceOf(
            AniLinkValidationError
        );
    });
});

describe("malPaginatePages", () => {
    test("yields pages in order and ends on a short page", async () => {
        const { fetchPage, expectedPages } = stubPages(250, 100);
        const seen: number[] = [];

        for await (const page of malPaginatePages(fetchPage, { perPage: 100 })) {
            seen.push(page.data.length);
        }

        expect(seen).toEqual([100, 100, 50]);
        expect(fetchPage).toHaveBeenCalledTimes(expectedPages);
    });

    test("stops on consumer early exit", async () => {
        const { fetchPage } = stubPages(1000, 100);
        let yielded = 0;

        for await (const page of malPaginatePages(fetchPage, { perPage: 100 })) {
            yielded += 1;
            expect(page.data).toHaveLength(100);
            if (yielded === 2) break;
        }

        expect(yielded).toBe(2);
    });

    test("honors maxPages", async () => {
        const { fetchPage } = stubPages(1000, 100);
        const seen: number[] = [];

        for await (const page of malPaginatePages(fetchPage, { perPage: 100, maxPages: 2 })) {
            seen.push(page.data.length);
        }

        expect(seen).toEqual([100, 100]);
        expect(fetchPage).toHaveBeenCalledTimes(2);
    });

    test("respects startPage rotation", async () => {
        const { fetchPage } = stubPages(1000, 100);

        for await (const page of malPaginatePages(fetchPage, { perPage: 100, startPage: 3 })) {
            expect(page.data[0]).toEqual({ id: 201 });
            break;
        }

        expect(fetchPage).toHaveBeenNthCalledWith(1, 3, 100, expect.any(AbortSignal));
    });

    test("returns nothing when the signal is already aborted", async () => {
        const { fetchPage } = stubPages(250, 100);
        const controller = new AbortController();
        controller.abort();

        const seen: number[] = [];
        for await (const page of malPaginatePages(fetchPage, { signal: controller.signal })) {
            seen.push(page.data.length);
        }

        expect(seen).toEqual([]);
        expect(fetchPage).not.toHaveBeenCalled();
    });

    test("propagates a fetch rejection when the signal did not abort", async () => {
        const fetchPage = vi.fn(async (): Promise<TestPage> => {
            throw new Error("network down");
        });

        await expect(async () => {
            for await (const page of malPaginatePages(fetchPage)) {
                void page;
            }
        }).rejects.toThrow("network down");
    });

    test("stops with a partial yield when the signal aborts mid-traversal", async () => {
        const controller = new AbortController();
        const fetchPage = vi.fn((page: number): Promise<TestPage> => {
            if (page === 2) {
                controller.abort();
                return Promise.reject(new Error("aborted"));
            }
            return Promise.resolve({
                data: Array.from({ length: 100 }, (_, i) => ({ id: i + 1 })),
                paging: { next: "https://next" },
            });
        });

        const seen: number[] = [];
        for await (const page of malPaginatePages(fetchPage, { signal: controller.signal })) {
            seen.push(page.data.length);
        }

        expect(seen).toEqual([100]);
    });
});

describe("MalPaginateOptions", () => {
    test("accepts the documented option surface", () => {
        const options: MalPaginateOptions = {
            perPage: 100,
            startPage: 1,
            maxPages: 10,
            concurrency: 1,
            signal: new AbortController().signal,
            onPage: () => {},
            onHookError: () => {},
            diagnostics: "warn",
        };
        expect(options.perPage).toBe(100);
    });
});
