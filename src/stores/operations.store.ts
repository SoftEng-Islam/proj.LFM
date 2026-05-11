/**
 * Operations store — tracks the queue of background file operations.
 *
 * Each operation (copy, move, delete, compress) is tracked here so the UI
 * can show progress indicators and allow pause/resume in the future.
 */

import { ref } from 'vue';
import { acceptHMRUpdate, defineStore } from 'pinia';

export interface FileOperation {
	id: string;
	type: 'copy' | 'move' | 'delete' | 'compress';
	status: 'pending' | 'running' | 'completed' | 'failed';
	source: string;
	destination?: string;
	error?: string;
}

export const useOperationsStore = defineStore('operations', () => {
	const queue = ref<FileOperation[]>([]);

	function addOperation(operation: FileOperation) {
		queue.value.push(operation);
	}

	function updateOperation(id: string, updates: Partial<FileOperation>) {
		const operation = queue.value.find((item) => item.id === id);
		if (operation) Object.assign(operation, updates);
	}

	function removeCompleted() {
		queue.value = queue.value.filter((op) => op.status !== 'completed');
	}

	return {
		queue,
		addOperation,
		updateOperation,
		removeCompleted,
	};
});

if (import.meta.hot) {
	import.meta.hot.accept(acceptHMRUpdate(useOperationsStore, import.meta.hot));
}
