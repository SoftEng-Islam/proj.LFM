import { defineStore } from 'pinia';
import type { FileEntry } from '@/services/filesystem.service';
import { readDirectory } from '@/services/filesystem.service';

interface ExplorerState {
  currentPath: string;
  files: FileEntry[];
  selectedFiles: string[];
  loading: boolean;
  error: string | null;
  history: string[];
}

export const useExplorerStore = defineStore('explorer', {
  state: (): ExplorerState => ({
    currentPath: '/',
    files: [],
    selectedFiles: [],
    loading: false,
    error: null,
    history: [],
  }),

  actions: {
    async openDirectory(path: string) {
      try {
        this.loading = true;
        this.error = null;

        const files = await readDirectory(path);

        this.files = files;
        this.currentPath = path;
        this.history.push(path);
      } catch (error) {
        this.error = String(error);
      } finally {
        this.loading = false;
      }
    },

    selectFile(path: string) {
      if (!this.selectedFiles.includes(path)) {
        this.selectedFiles.push(path);
      }
    },

    clearSelection() {
      this.selectedFiles = [];
    },
  },
});
