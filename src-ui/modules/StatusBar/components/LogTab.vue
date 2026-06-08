<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { getLogHistory, subscribeLogEntries, LogEntry } from '@/services/logger';

const entries = ref<LogEntry[]>([]);
let unsubscribe: (() => void) | null = null;

onMounted(() => {
	entries.value = getLogHistory();
	unsubscribe = subscribeLogEntries((entry) => {
		entries.value.push(entry);
		if (entries.value.length > 200) {
			entries.value.shift();
		}
	});
});

onBeforeUnmount(() => {
	unsubscribe?.();
});
</script>

<template>
	<div class="flex h-full flex-col gap-3 text-sm text-base-content">
		<div class="rounded-md border border-base-content/10 bg-base-100 p-3">
			<p class="font-medium">Application logs</p>
			<p class="text-xs text-base-content/60">Reactive log feed generated from frontend logger events.</p>
		</div>

		<div class="flex-1 overflow-auto rounded-md border border-base-content/10 bg-base-200 p-3">
			<div v-if="entries.length === 0" class="text-sm text-base-content/70">
				No logs yet.
			</div>
			<div v-else class="space-y-2">
				<div v-for="entry in entries" :key="entry.id" class="rounded-md border border-base-content/5 bg-base-100 p-2">
					<div class="flex items-center justify-between gap-3 text-xs text-base-content/70">
						<span>{{ entry.timestamp }}</span>
						<span class="rounded-full bg-base-content/5 px-2 py-0.5 text-[11px] uppercase tracking-[0.08em]">
							{{ entry.level }}
						</span>
					</div>
					<div class="mt-1 text-sm text-base-content">{{ entry.message }}</div>
				</div>
			</div>
		</div>
	</div>
</template>
