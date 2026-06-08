/**
 * Explorer store — tracks the current directory view state.
 *
 * Responsibilities:
 * - Current path
 * - Loaded file entries
 * - Selected file set
 * - Navigation history
 * - Hidden file toggle
 */

import { acceptHMRUpdate, defineStore } from "pinia";
import { readDirectory } from "@/services/tauri-bridge";
import { mapFileMetaToEntry } from "@/services/mappers";
import type { FileEntry } from "@/types/file-manager";

export const useExplorerStore = defineStore("explorer", {
    // 1. State replaces `ref()`
    state: () => ({
        currentPath: "/",
        files: [] as FileEntry[],
        selectedFiles: new Set<string>(),
        loading: false,
        error: null as string | null,
        history: [] as string[],
        showHiddenFiles: true,
    }),

    // 2. Actions replace standard functions
    actions: {
        async openDirectory(path: string) {
            this.loading = true;
            this.error = null;

            try {
                const info = await readDirectory(path);
                const entries = info.files.map((meta) => mapFileMetaToEntry(meta));

                this.files = this.showHiddenFiles ? entries : entries.filter((f) => !f.name.startsWith("."));

                this.currentPath = path;
                this.history.push(path);
            } catch (err) {
                this.error = String(err);
            } finally {
                this.loading = false;
            }
        },

        selectFile(path: string) {
            this.selectedFiles.add(path);
        },

        unselectFile(path: string) {
            this.selectedFiles.delete(path);
        },

        clearSelection() {
            this.selectedFiles.clear();
        },

        toggleHiddenFiles() {
            this.showHiddenFiles = !this.showHiddenFiles;
        },
    },
});

if (import.meta.hot) {
    import.meta.hot.accept(acceptHMRUpdate(useExplorerStore, import.meta.hot));
}
