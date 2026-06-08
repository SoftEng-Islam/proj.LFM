<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { getLogHistory, subscribeLogEntries } from '@/services/logger';
import type { LogEntry } from '@/services/logger';

const entries = ref<LogEntry[]>([]);
let unsubscribe: (() => void) | null = null;

onMounted(() => {
	entries.value = getLogHistory();
	unsubscribe = subscribeLogEntries((entry: LogEntry) => {
	});
});

onBeforeUnmount(() => {
	unsubscribe?.();
});
</script>

<template lang="pug">
div(class="flex h-full flex-col gap-3 text-xs")
	div(class="rounded-md border border-slate-700 bg-slate-800 p-3")
		p(class="font-medium text-slate-200") Application logs
		p(class="text-slate-400 mt-1") Real-time log feed from frontend events.

	div(class="flex-1 overflow-auto rounded-md border border-slate-700 bg-slate-950 p-3")
		div(v-if="entries.length === 0" class="text-slate-500") No logs yet.
		div(v-else class="space-y-2")
			div(v-for="entry in entries" :key="entry.id" class="rounded-md border border-slate-700 bg-slate-800 p-2")
				div(class="flex items-center justify-between gap-3 text-slate-400 mb-1")
					span {{ entry.timestamp }}
					span(class="rounded px-1.5 py-0.5 text-[10px] font-medium" :class="{ 'bg-blue-900/50 text-blue-300': entry.level === 'debug', 'bg-green-900/50 text-green-300': entry.level === 'info', 'bg-yellow-900/50 text-yellow-300': entry.level === 'warn', 'bg-red-900/50 text-red-300': entry.level === 'error', }") {{ entry.level.toUpperCase() }}
				div(class="text-slate-300 text-xs") {{ entry.message }}
</template>
