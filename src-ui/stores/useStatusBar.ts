import { acceptHMRUpdate, defineStore } from "pinia";

export type StatusTab = "terminal" | "log" | "git" | "tasks";

interface StatusBarState {
    isWorkspaceOpen: boolean;
    activeTab: StatusTab;
}

export const useStatusBarStore = defineStore("statusBar", {
    state: (): StatusBarState => ({
        isWorkspaceOpen: false,
        activeTab: "log",
    }),

    actions: {
        openWorkspace(tab: StatusTab) {
            this.activeTab = tab;
            this.isWorkspaceOpen = true;
        },

        toggleWorkspace(tab: StatusTab) {
            if (this.isWorkspaceOpen && this.activeTab === tab) {
                this.isWorkspaceOpen = false;
                return;
            }
            this.activeTab = tab;
            this.isWorkspaceOpen = true;
        },

        closeWorkspace() {
            this.isWorkspaceOpen = false;
            console.log(`closeWorkspace(): Done!`);
        },
    },
});
if (import.meta.hot) {
    import.meta.hot.accept(acceptHMRUpdate(useStatusBarStore, import.meta.hot));
}
