(() => {
    function appendAction(container, href, label) {
        const link = document.createElement("a");
        link.href = href;
        link.textContent = label;

        const arrow = document.createElement("span");
        arrow.setAttribute("aria-hidden", "true");
        arrow.textContent = "↗";
        link.append(" ", arrow);
        container.append(link);
    }

    function createThemeToggle(themeSelect) {
        const button = document.createElement("button");
        button.type = "button";
        button.id = "anilink-theme-toggle";

        const icon = document.createElement("span");
        icon.setAttribute("aria-hidden", "true");
        button.append(icon);

        function updateThemeToggle() {
            const followsDark =
                document.documentElement.dataset.theme === "dark" ||
                (document.documentElement.dataset.theme === "os" &&
                    window.matchMedia?.("(prefers-color-scheme: dark)").matches === true);
            const nextTheme = followsDark ? "light" : "dark";
            icon.textContent = followsDark ? "☀" : "☾";
            button.ariaLabel = `Switch to ${nextTheme} theme`;
            button.title = button.ariaLabel;
        }

        button.addEventListener("click", () => {
            if (!themeSelect) return;
            themeSelect.value =
                document.documentElement.dataset.theme === "dark" ? "light" : "dark";
            themeSelect.dispatchEvent(new Event("change", { bubbles: true }));
            updateThemeToggle();
        });
        themeSelect?.addEventListener("change", updateThemeToggle);
        updateThemeToggle();
        return button;
    }

    function initializeHeader() {
        const container = document.getElementById("tsd-toolbar-links");
        if (!container || container.dataset.anilinkHeaderReady === "true") return;

        const base = document.documentElement.dataset.base || "./";
        const typedocRoot = new URL(base, document.baseURI);
        const docsHref = new URL("../", typedocRoot);

        appendAction(container, docsHref.href, "Docs");
        appendAction(container, "https://github.com/RLAlpha49/AniLink", "GitHub");

        const themeToggle = createThemeToggle(document.getElementById("tsd-theme"));
        const menuTrigger = document.getElementById("tsd-toolbar-menu-trigger");
        if (menuTrigger) {
            menuTrigger.before(themeToggle);
        } else {
            container.after(themeToggle);
        }
        container.dataset.anilinkHeaderReady = "true";
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initializeHeader, { once: true });
    } else {
        initializeHeader();
    }
})();
