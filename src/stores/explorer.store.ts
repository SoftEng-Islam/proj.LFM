import { defineStore } from 'pinia';
import type { FileEntry } from '@/services/filesystem.service';
import { readDirectory } from '@/services/filesystem.service';

interface ExplorerState {
    currentPath: string;
    files: FileEntry[];
    selectedFiles: Set<string>;
    loading: boolean;
    error: string | null;
    history: string[];
    showHiddenFiles: boolean;
}

export const useExplorerStore = defineStore('explorer', {
    state: (): ExplorerState => ({
        currentPath: '/',
        files: [],
        selectedFiles: new Set<string>(),
        loading: false,
        error: null,
        history: [],
        showHiddenFiles: true,
    }),

    actions: {
        async openDirectory(path: string) {
            try {
                this.loading = true;
                this.error = null;

                const files = await readDirectory(path);

                this.files = this.showHiddenFiles ? files : files.filter((file) => !file.name.startsWith('.'));

                this.currentPath = path;
                this.history.push(path);
            } catch (error) {
                this.error = String(error);
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
