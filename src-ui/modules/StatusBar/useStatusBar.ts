import { computed, ref } from "vue";

const statusTabs = ["terminal", "log", "git", "tasks"] as const;
type StatusTab = (typeof statusTabs)[number];

const MIN_PANEL_HEIGHT = 180;
const MAX_PANEL_HEIGHT = 560;
const DEFAULT_PANEL_HEIGHT = 300;

const panelOpen = ref(false);
const activeTab = ref<StatusTab>("terminal");
const panelHeight = ref(DEFAULT_PANEL_HEIGHT);
const activePanelTab = computed<StatusTab | null>(() => (panelOpen.value ? activeTab.value : null));

function isStatusTab(value: string): value is StatusTab {
    return statusTabs.includes(value as StatusTab);
}

function clampPanelHeight(height: number) {
    return Math.round(Math.min(MAX_PANEL_HEIGHT, Math.max(MIN_PANEL_HEIGHT, height)));
}

export function useStatusBar() {
    function openPanel(tab: StatusTab = activeTab.value) {
        activeTab.value = tab;
        panelOpen.value = true;
    }

    function togglePanel(tab: StatusTab = activeTab.value) {
        if (panelOpen.value && activeTab.value === tab) {
            panelOpen.value = false;
            return;
        }

        activeTab.value = tab;
        panelOpen.value = true;
    }

    function selectTab(tab: StatusTab) {
        activeTab.value = tab;
    }

    function closePanel() {
        panelOpen.value = false;
    }

    function setPanelHeight(height: number) {
        panelHeight.value = clampPanelHeight(height);
    }

    return {
        panelOpen,
        activeTab,
        activePanelTab,
        panelHeight,
        openPanel,
        togglePanel,
        selectTab,
        closePanel,
        setPanelHeight,
    };
}

export { DEFAULT_PANEL_HEIGHT, MAX_PANEL_HEIGHT, MIN_PANEL_HEIGHT, clampPanelHeight, isStatusTab, statusTabs };
export type { StatusTab };
