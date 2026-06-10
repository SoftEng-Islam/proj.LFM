import { computed, ref } from "vue";

const statusTabs = ["terminal", "log", "git", "tasks"] as const;
type StatusTab = (typeof statusTabs)[number];

const panelOpen = ref(false);
const activeTab = ref<StatusTab>("terminal");
const activePanelTab = computed<StatusTab | null>(() => (panelOpen.value ? activeTab.value : null));

function isStatusTab(value: string): value is StatusTab {
    return statusTabs.includes(value as StatusTab);
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

    return {
        panelOpen,
        activeTab,
        activePanelTab,
        openPanel,
        togglePanel,
        selectTab,
        closePanel,
    };
}

export { isStatusTab, statusTabs };
export type { StatusTab };
