/**
 * usePanelResize — composable for managing the resizable right-side panels.
 *
 * Handles the details panel and AI chat panel widths, including:
 *  - Min/max constraints
 *  - Combined width reconciliation when both panels are open
 *  - Persisted widths via localStorage
 */

import { nextTick, onScopeDispose, ref, watch, type Ref } from "vue";

// ─── Layout constants ─────────────────────────────────────────────────────────

const NAV_WIDTH = 240;
const MIN_RIGHT_PANEL = 260;
const MAX_RIGHT_PANEL = 720;
const MIN_MAIN_CONTENT = 360;

// Status bar footer height range
const MIN_STATUS_BAR_HEIGHT = 24;
const MAX_STATUS_BAR_HEIGHT = 48;

// width
const DEFAULT_LEFT_SIDEBAR_WIDTH = 360;
const DEFAULT_DETAILS_PANEL_WIDTH = 360;
const DEFAULT_AI_CHAT_PANEL_WIDTH = 320;

// Height
const DEFAULT_STATUS_BAR_HEIGHT = 28;

// ─── Composable ───────────────────────────────────────────────────────────────

function getStoredNumber(key: string, fallback: number): number {
    if (typeof localStorage === "undefined") return fallback;

    const value = Number(localStorage.getItem(key));
    return Number.isFinite(value) ? value : fallback;
}

function usePersistedPanelSize(key: string, fallback: number): Ref<number> {
    const value = ref(getStoredNumber(key, fallback));
    let persistTimer: number | undefined;

    function persist(next: number) {
        if (typeof localStorage === "undefined") return;
        localStorage.setItem(key, String(next));
    }

    watch(value, (next) => {
        if (typeof window === "undefined") {
            persist(next);
            return;
        }

        if (persistTimer !== undefined) window.clearTimeout(persistTimer);
        persistTimer = window.setTimeout(() => {
            persistTimer = undefined;
            persist(next);
        }, 120);
    });

    onScopeDispose(() => {
        if (persistTimer !== undefined) {
            window.clearTimeout(persistTimer);
            persist(value.value);
        }
    });

    return value;
}

export function usePanelResize() {
    const leftSidebarOpen = ref(true);
    const detailsOpen = ref(true);
    const aiChatOpen = ref(false);
    const statusBarOpen = ref(true);

    const leftSidebarWidth = usePersistedPanelSize("lfm-left-sidebar-width", DEFAULT_LEFT_SIDEBAR_WIDTH);
    const detailsPanelWidth = usePersistedPanelSize("lfm-details-panel-width", DEFAULT_DETAILS_PANEL_WIDTH);
    const aiChatPanelWidth = usePersistedPanelSize("lfm-ai-chat-panel-width", DEFAULT_AI_CHAT_PANEL_WIDTH);

    // Status
    const statusBarHeight = usePersistedPanelSize("lfm-status-bar-height", DEFAULT_STATUS_BAR_HEIGHT);

    /** Maximum combined width for both right panels given the current viewport. */
    function maxCombinedWidth(): number {
        if (typeof window === "undefined") return MAX_RIGHT_PANEL * 2;
        return Math.max(MIN_RIGHT_PANEL * 2, window.innerWidth - NAV_WIDTH - MIN_MAIN_CONTENT);
    }

    function setLeftSidebarWidth(next: number) {
        const cap = maxCombinedWidth();
        let w = Math.round(Math.min(MAX_RIGHT_PANEL, Math.max(MIN_RIGHT_PANEL, next)));

        if (aiChatOpen.value) {
            w = Math.min(w, cap - Math.max(MIN_RIGHT_PANEL, aiChatPanelWidth.value));
            w = Math.max(MIN_RIGHT_PANEL, w);
        } else {
            w = Math.min(w, Math.max(MIN_RIGHT_PANEL, cap));
        }

        leftSidebarWidth.value = w;
    }

    function resetLeftSidebarWidth() {
        leftSidebarWidth.value = DEFAULT_LEFT_SIDEBAR_WIDTH;
        reconcilePanelWidths();
    }

    function setDetailsPanelWidth(next: number) {
        const cap = maxCombinedWidth();
        let w = Math.round(Math.min(MAX_RIGHT_PANEL, Math.max(MIN_RIGHT_PANEL, next)));

        if (aiChatOpen.value) {
            w = Math.min(w, cap - Math.max(MIN_RIGHT_PANEL, aiChatPanelWidth.value));
            w = Math.max(MIN_RIGHT_PANEL, w);
        } else {
            w = Math.min(w, Math.max(MIN_RIGHT_PANEL, cap));
        }

        detailsPanelWidth.value = w;
    }

    function setAiChatPanelWidth(next: number) {
        const cap = maxCombinedWidth();
        let w = Math.round(Math.min(MAX_RIGHT_PANEL, Math.max(MIN_RIGHT_PANEL, next)));

        if (detailsOpen.value) {
            w = Math.min(w, cap - Math.max(MIN_RIGHT_PANEL, detailsPanelWidth.value));
            w = Math.max(MIN_RIGHT_PANEL, w);
        } else {
            w = Math.min(w, Math.max(MIN_RIGHT_PANEL, cap));
        }

        aiChatPanelWidth.value = w;
    }

    /** Ensure the combined panel widths stay within the available viewport. */
    function reconcilePanelWidths() {
        if (!detailsOpen.value && !aiChatOpen.value) return;

        if (leftSidebarOpen.value) setLeftSidebarWidth(leftSidebarWidth.value);
        if (detailsOpen.value) setDetailsPanelWidth(detailsPanelWidth.value);
        if (aiChatOpen.value) setAiChatPanelWidth(aiChatPanelWidth.value);

        if (detailsOpen.value && aiChatOpen.value) {
            const cap = maxCombinedWidth();
            const sum = detailsPanelWidth.value + aiChatPanelWidth.value;

            if (sum > cap) {
                let over = sum - cap;
                const nextAi = Math.max(MIN_RIGHT_PANEL, aiChatPanelWidth.value - over);
                over -= aiChatPanelWidth.value - nextAi;
                aiChatPanelWidth.value = nextAi;
                if (over > 0) {
                    detailsPanelWidth.value = Math.max(MIN_RIGHT_PANEL, detailsPanelWidth.value - over);
                }
            }
        }
    }

    function resetDetailsPanelWidth() {
        detailsPanelWidth.value = DEFAULT_DETAILS_PANEL_WIDTH;
        reconcilePanelWidths();
    }

    function resetAiChatPanelWidth() {
        aiChatPanelWidth.value = DEFAULT_AI_CHAT_PANEL_WIDTH;
        reconcilePanelWidths();
    }

    function setStatusBarHeight(next: number) {
        const h = Math.round(Math.min(MAX_STATUS_BAR_HEIGHT, Math.max(MIN_STATUS_BAR_HEIGHT, next)));
        statusBarHeight.value = h;
    }

    function resetStatusBarHeight() {
        statusBarHeight.value = DEFAULT_STATUS_BAR_HEIGHT;
    }

    function toggleDetails() {
        detailsOpen.value = !detailsOpen.value;
    }

    function toggleAiChat() {
        aiChatOpen.value = !aiChatOpen.value;
    }

    // Re-reconcile widths whenever either panel opens or closes
    watch([detailsOpen, aiChatOpen], () => {
        void nextTick(() => reconcilePanelWidths());
    });

    return {
        leftSidebarOpen,
        detailsOpen,
        aiChatOpen,
        statusBarOpen,
        statusBarHeight,
        leftSidebarWidth,
        detailsPanelWidth,
        aiChatPanelWidth,
        setLeftSidebarWidth,
        setDetailsPanelWidth,
        setAiChatPanelWidth,
        setStatusBarHeight,
        reconcilePanelWidths,
        resetLeftSidebarWidth,
        resetDetailsPanelWidth,
        resetAiChatPanelWidth,
        resetStatusBarHeight,
        toggleDetails,
        toggleAiChat,
    };
}
