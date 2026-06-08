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
			return 'bg-emerald-100 text-emerald-800';
		case 'running':
			return 'bg-sky-100 text-sky-800';
		case 'pending':
			return 'bg-amber-100 text-amber-800';
		case 'failed':
			return 'bg-rose-100 text-rose-800';
	}
}
</script>

<template lang="pug">
div(class="flex h-full flex-col gap-3 text-sm text-base-content")
	div(class="rounded-md border border-base-content/10 bg-base-100 p-4")
		p(class="font-semibold") Active file operations
		p(class="mt-1 text-xs text-base-content/60")
			| Shows the current copy/move/delete/compress queue.

	div(class="flex-1 overflow-auto rounded-md border border-base-content/10 bg-base-200 p-3")
		div(v-if="queue.length === 0" class="text-base-content/60")
			| No running operations.

		div(v-else class="space-y-3")
			div(
				v-for="operation in queue"
				:key="operation.id"
				class="rounded-md border border-base-content/10 bg-base-100 p-3"
			)
				div(class="flex items-center justify-between gap-3 text-sm")
					div(class="font-medium") {{ operation.type }}

					span(
						class="rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em]"
						:class="statusClass(operation.status)"
					) {{ statusLabel(operation.status) }}

				div(class="mt-2 text-xs text-base-content/60")
					div
						| Source: {{ operation.source }}

					div(v-if="operation.destination")
						| Destination: {{ operation.destination }}

					div(
						v-if="operation.error"
						class="mt-2 text-rose-700"
					)
						| Error: {{ operation.error }}
</template>