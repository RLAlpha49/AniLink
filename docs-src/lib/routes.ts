/** Normalize clean and generated VitePress paths to the same route form. */
export function normalizePath(path: string): string {
    const withoutHash = path.split("#", 1)[0] || "/";
    const withoutHtml = withoutHash.replace(/\.html$/, "");
    let normalized = withoutHtml;
    while (normalized.length > 1 && normalized.endsWith("/")) {
        normalized = normalized.slice(0, -1);
    }
    return normalized;
}

/** Return whether a link points to the current route. */
export function isExactRoute(currentPath: string, link: string): boolean {
    return normalizePath(currentPath) === normalizePath(link);
}

/** Return whether the current route is this link or one of its descendants. */
export function isDescendantRoute(currentPath: string, link: string): boolean {
    const current = normalizePath(currentPath);
    const parent = normalizePath(link);
    return parent === "/" ? true : current === parent || current.startsWith(`${parent}/`);
}
