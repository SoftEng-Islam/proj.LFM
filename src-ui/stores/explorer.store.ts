/**
 * Explorer store — tracks the current directory view state.
 *
 * Responsibilities:
 *  - Current path
 *  - Loaded file entries
 *  - Selected file set
 *  - Navigation history
 *  - Hidden file toggle
 */

import { ref } from 'vue';
import { acceptHMRUpdate, defineStore } from 'pinia';

import { readDirectory } from '@/services/tauri-bridge';
import { mapFileMetaToEntry } from '@/services/mappers';
import type { FileEntry } from '@/types/file-manager';

export const useExplorerStore = defineStore('explorer', () => {
	const currentPath = ref('/');
	const files = ref<FileEntry[]>([]);
	const selectedFiles = ref<Set<string>>(new Set());
	const loading = ref(false);
	const error = ref<string | null>(null);
	const history = ref<string[]>([]);
	const showHiddenFiles = ref(true);

	async function openDirectory(path: string) {
		loading.value = true;
		error.value = null;

		try {
			const info = await readDirectory(path);
			const entries = info.files.map((meta) => mapFileMetaToEntry(meta));

			files.value = showHiddenFiles.value
				? entries
				: entries.filter((f) => !f.name.startsWith('.'));

			currentPath.value = path;
			history.value.push(path);
		} catch (err) {
			error.value = String(err);
		} finally {
			loading.value = false;
		}
	}

	function selectFile(path: string) {
		selectedFiles.value.add(path);
	}

	function unselectFile(path: string) {
		selectedFiles.value.delete(path);
	}

	function clearSelection() {
		selectedFiles.value.clear();
	}

	function toggleHiddenFiles() {
		showHiddenFiles.value = !showHiddenFiles.value;
	}

	return {
		currentPath,
		files,
		selectedFiles,
		loading,
		error,
		history,
		showHiddenFiles,
		openDirectory,
		selectFile,
		unselectFile,
		clearSelection,
		toggleHiddenFiles,
	};
});

if (import.meta.hot) {
	import.meta.hot.accept(acceptHMRUpdate(useExplorerStore, import.meta.hot));
}
