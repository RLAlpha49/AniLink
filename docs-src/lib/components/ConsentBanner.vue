<script setup lang="ts">
/**
 * Analytics consent banner for the AniLink docs.
 *
 * Shows at the bottom of the viewport until the visitor accepts or declines
 * analytics, and again once a stored choice has expired (12 months).
 * The banner applies the choice through the shared consent API
 * (`../consent.mjs`, backed by the boot script injected into <head>).
 * Accepting grants GA4 measurement; declining keeps it off and clears any
 * analytics cookies.
 * The GA4 boot script defaults every consent signal to "denied", so the
 * banner never gates measurement that has already started.
 *
 * A stored choice can always be changed. While it is valid, meaning
 * accepted or declined and not yet expired, a small settings button in the
 * bottom-right corner reopens the banner so the visitor can choose again.
 */
import { onMounted, ref } from "vue";
import { Cookie } from "@lucide/vue";
import { consentChoiceNeeded, setConsent } from "../consent.mjs";

const visible = ref(false);
const settingsAvailable = ref(false);

onMounted(() => {
    // Show only when no valid choice is stored: first visit, or the previous
    // choice expired (12 months) and the visitor should confirm it again.
    // Otherwise the banner stays closed and the settings button lets the
    // visitor reopen it.
    if (consentChoiceNeeded()) {
        visible.value = true;
    } else {
        settingsAvailable.value = true;
    }
});

/** Reopen the banner from the settings button. */
function openSettings(): void {
    visible.value = true;
}

/** Accept analytics: store the choice and grant consent. */
function accept(): void {
    visible.value = false;
    settingsAvailable.value = true;
    setConsent(true);
}

/** Decline analytics: store the choice and keep consent denied. */
function decline(): void {
    visible.value = false;
    settingsAvailable.value = true;
    setConsent(false);
}
</script>

<template>
    <ClientOnly>
        <Transition name="consent-slide">
            <div v-if="visible" class="consent-banner" role="region" aria-label="Analytics consent">
                <p class="consent-text">
                    This site uses Google Analytics to understand how visitors use the docs. See the
                    <a href="/privacy">privacy page</a> for details.
                </p>
                <div class="consent-actions">
                    <button type="button" class="consent-btn consent-accept" @click="accept">
                        Accept
                    </button>
                    <button type="button" class="consent-btn consent-decline" @click="decline">
                        Decline
                    </button>
                </div>
            </div>
        </Transition>
        <button
            v-if="settingsAvailable && !visible"
            type="button"
            class="consent-settings"
            aria-label="Analytics settings"
            title="Analytics settings"
            @click="openSettings"
        >
            <Cookie :size="15" aria-hidden="true" />
        </button>
    </ClientOnly>
</template>

<style scoped>
.consent-banner {
    position: fixed;
    bottom: 1rem;
    left: 50%;
    transform: translateX(-50%);
    z-index: 1200;
    display: flex;
    align-items: center;
    gap: 1rem;
    max-width: min(680px, calc(100vw - 2rem));
    padding: 0.75rem 1rem;
    background: var(--rd-bg);
    border: 1px solid var(--rd-border);
    border-radius: 10px;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.18);
    font-size: 0.82rem;
    color: var(--rd-text);
}

.consent-text {
    margin: 0;
    line-height: 1.45;
}

.consent-text a {
    color: var(--rd-accent);
    text-decoration: underline;
}

.consent-actions {
    display: flex;
    gap: 0.5rem;
    flex-shrink: 0;
}

.consent-btn {
    padding: 0.4rem 0.85rem;
    border-radius: 7px;
    border: 1px solid var(--rd-border);
    background: var(--rd-bg-soft);
    color: var(--rd-text);
    font-size: 0.8rem;
    cursor: pointer;
}

.consent-btn:hover {
    border-color: var(--rd-accent);
}

.consent-accept {
    background: var(--rd-accent);
    border-color: var(--rd-accent);
    color: var(--rd-bg);
}

/* The reopen control appears while a valid choice is stored and the banner
 * is closed. It sits below the search modal so it never renders above an
 * overlay. */
.consent-settings {
    position: fixed;
    bottom: 1rem;
    right: 1rem;
    z-index: 900;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2.1rem;
    height: 2.1rem;
    padding: 0;
    background: var(--rd-bg);
    border: 1px solid var(--rd-border);
    border-radius: 50%;
    box-shadow: 0 4px 18px rgba(0, 0, 0, 0.14);
    color: var(--rd-text);
    cursor: pointer;
}

.consent-settings:hover {
    border-color: var(--rd-accent);
    color: var(--rd-accent);
}

.consent-slide-enter-active,
.consent-slide-leave-active {
    transition:
        opacity 0.25s ease,
        transform 0.25s ease;
}

.consent-slide-enter-from,
.consent-slide-leave-to {
    opacity: 0;
    transform: translate(-50%, 12px);
}

@media (max-width: 560px) {
    .consent-banner {
        flex-direction: column;
        align-items: stretch;
        gap: 0.6rem;
    }

    .consent-actions {
        justify-content: flex-end;
    }
}
</style>
