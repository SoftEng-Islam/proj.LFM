<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useOperationsStore } from '@/stores/operations.store';
import type { FileOperation } from '@/stores/operations.store';

const operations = useOperationsStore();
const { queue } = storeToRefs(operations);

type OperationStatus = FileOperation['status'];

function statusLabel(status: OperationStatus): string {
	switch (status) {
		case 'running':
			return 'Running';
		case 'pending':
			return 'Pending';
		case 'completed':
			return 'Completed';
		case 'failed':
			return 'Failed';
	}
}

function statusClass(status: OperationStatus): string {
	switch (status) {
		case 'completed':
			return 'bg-green-900/50 text-green-300';
		case 'running':
			return 'bg-blue-900/50 text-blue-300';
		case 'pending':
			return 'bg-yellow-900/50 text-yellow-300';
		case 'failed':
			return 'bg-red-900/50 text-red-300';
	}
}
</script>

<template lang="pug">
div(class="flex h-full flex-col gap-3 text-xs text-(--color-base-content)")
	div(class="rounded-md bg-(--color-base-200) p-3")
		p(class="font-medium text-(--color-base-content)/50") Active Operations
		p(class="text-(--color-base-content) text-[11px] mt-1")
			| File operations queue

	div(class="flex-1 overflow-auto rounded-md bg-(--color-base-200) p-3")
		div(v-if="queue.length === 0" class="text-(--color-base-content)/50")
			| No running operations.

		div(v-else class="space-y-2")
			div(
				v-for="operation in queue"
				:key="operation.id"
				class="rounded-md border border-slate-700 bg-slate-800 p-2"
			)
				div(class="flex items-center justify-between gap-2 mb-1")
					div(class="font-medium text-slate-100") {{ operation.type }}

					span(
						class="rounded px-1.5 py-0.5 text-[10px] font-medium"
						:class="statusClass(operation.status)"
					) {{ statusLabel(operation.status) }}

				div(class="text-slate-400 text-[11px]")
					div
						| Source: {{ operation.source }}

					div(v-if="operation.destination")
						| Dest: {{ operation.destination }}

					div(
						v-if="operation.error"
						class="text-red-400 mt-1"
					)
						| Error: {{ operation.error }}
</template>