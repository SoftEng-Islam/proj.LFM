import { defineStore } from "pinia";

export type StatusTab = "terminal" | "log" | "git" | "tasks";

interface StatusBarState {
    panelOpen: boolean;
    activeTab: StatusTab;
}

export const useStatusBarStore = defineStore("statusBar", {
    state: (): StatusBarState => ({
        panelOpen: false,
        activeTab: "log",
    }),

    actions: {
        openPanel(tab: StatusTab) {
            this.activeTab = tab;
            this.panelOpen = true;
        },

        togglePanel(tab: StatusTab) {
            if (this.panelOpen && this.activeTab === tab) {
                this.panelOpen = false;
                return;
            }

            this.activeTab = tab;
            this.panelOpen = true;
        },

        closePanel() {
            this.panelOpen = false;
        },
    },
});
