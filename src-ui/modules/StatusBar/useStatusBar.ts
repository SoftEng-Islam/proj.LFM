import { ref } from "vue";

type StatusTab = "terminal" | "log" | "git" | "tasks";

const panelOpen = ref(false);
const activeTab = ref<StatusTab>("terminal");

export function useStatusBar() {
    function openPanel(tab: StatusTab) {
        activeTab.value = tab;
        panelOpen.value = true;
    }

    function togglePanel(tab: StatusTab) {
        if (panelOpen.value && activeTab.value === tab) {
            panelOpen.value = false;
            return;
        }

        activeTab.value = tab;
        panelOpen.value = true;
    }

    function closePanel() {
        panelOpen.value = false;
    }

    return {
        panelOpen,
        activeTab,
        openPanel,
        togglePanel,
        closePanel,
    };
}

export type { StatusTab };
