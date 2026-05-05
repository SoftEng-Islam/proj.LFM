import { defineStore } from 'pinia';

export interface FileOperation {
  id: string;
  type: 'copy' | 'move' | 'delete' | 'compress';
  status: 'pending' | 'running' | 'completed' | 'failed';
  source: string;
  destination?: string;
  error?: string;
}

interface OperationsState {
  queue: FileOperation[];
}

export const useOperationsStore = defineStore('operations', {
  state: (): OperationsState => ({
    queue: [],
  }),

  actions: {
    addOperation(operation: FileOperation) {
      this.queue.push(operation);
    },

    updateOperation(id: string, updates: Partial<FileOperation>) {
      const operation = this.queue.find((item) => item.id === id);

      if (!operation) {
        return;
      }

      Object.assign(operation, updates);
    },
  },
});
