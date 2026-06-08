/**
 * Operations store — tracks the queue of background file operations.
 *
 * Each operation (copy, move, delete, compress) is tracked here so the UI
 * can show progress indicators and allow pause/resume in the future.
 */

import { acceptHMRUpdate, defineStore } from "pinia";

export interface FileOperation {
    id: string;
    type: "copy" | "move" | "delete" | "compress";
    status: "pending" | "running" | "completed" | "failed";
    source: string;
    destination?: string;
    error?: string;
}

export const useOperationsStore = defineStore("operations", {
    // ── State ─────────────────────────────────────────────────────────────────
    state: () => ({
        queue: [] as FileOperation[],
    }),

    // ── Actions ───────────────────────────────────────────────────────────────
    actions: {
        addOperation(operation: FileOperation) {
            this.queue.push(operation);
        },

        updateOperation(id: string, updates: Partial<FileOperation>) {
            const operation = this.queue.find((item) => item.id === id);
            if (operation) {
                Object.assign(operation, updates);
            }
        },

        removeCompleted() {
            this.queue = this.queue.filter((op) => op.status !== "completed");
        },
    },
});

if (import.meta.hot) {
    import.meta.hot.accept(acceptHMRUpdate(useOperationsStore, import.meta.hot));
}
