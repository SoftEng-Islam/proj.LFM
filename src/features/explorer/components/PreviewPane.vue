<script setup lang="ts">
import { computed } from 'vue';
import { useToast } from 'vue-toastification';

import BaseButton from '@/components/ui/BaseButton.vue';
import { accentThemeMap, categorySymbolMap, statusToneMap } from '@/features/explorer/workspace';
import { useFileManagerStore } from '@/stores/file-manager';

const store = useFileManagerStore();
const toast = useToast();

const selectedItem = computed(() => store.selectedItem);

function pinSelection() {
	if (!selectedItem.value) {
		return;
	}

	store.togglePinnedForSelection();
	toast.success(`${selectedItem.value.name} updated in pinned items.`);
}
</script>

<template>
	<aside v-if="selectedItem" class="surface-panel h-full rounded-[30px] p-5">
		<div class="flex items-start justify-between gap-4">
			<div class="flex items-start gap-4">
				<div
					class="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-[22px] text-sm font-semibold"
					:class="accentThemeMap[selectedItem.accent].chip"
				>
					{{ categorySymbolMap[selectedItem.category] }}
				</div>
				<div>
					<p class="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">{{ selectedItem.typeLabel }}</p>
					<h2 class="mt-2 text-xl font-semibold text-slate-950 dark:text-white">{{ selectedItem.name }}</h2>
					<p class="mt-2 max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">
						{{ selectedItem.preview }}
					</p>
				</div>
			</div>
			<span class="rounded-full px-3 py-1 text-xs font-medium" :class="statusToneMap[selectedItem.status]">
				{{ selectedItem.status }}
			</span>
		</div>

		<div class="mt-5 flex flex-wrap gap-2">
			<span
				v-for="tag in selectedItem.tags"
				:key="tag"
				class="rounded-full bg-slate-900/[0.05] px-3 py-1 text-xs text-slate-600 dark:bg-white/[0.08] dark:text-slate-300"
			>
				{{ tag }}
			</span>
		</div>

		<div class="mt-6 grid gap-3">
			<div class="rounded-[24px] bg-slate-900/[0.03] p-4 dark:bg-white/[0.05]">
				<p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Details</p>
				<div class="mt-4 space-y-3 text-sm">
					<div class="flex items-center justify-between gap-4">
						<span class="text-slate-500 dark:text-slate-400">Path</span>
						<span class="text-right text-slate-900 dark:text-white">{{ selectedItem.locationPath.join(' / ') }}</span>
					</div>
					<div class="flex items-center justify-between gap-4">
						<span class="text-slate-500 dark:text-slate-400">Size</span>
						<span class="text-slate-900 dark:text-white">{{ selectedItem.sizeLabel }}</span>
					</div>
					<div class="flex items-center justify-between gap-4">
						<span class="text-slate-500 dark:text-slate-400">Modified</span>
						<span class="text-slate-900 dark:text-white">
							{{ new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(selectedItem.modifiedAt)) }}
						</span>
					</div>
				</div>
			</div>

			<div class="rounded-[24px] bg-slate-900/[0.03] p-4 dark:bg-white/[0.05]">
				<p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Collaborators</p>
				<div class="mt-4 flex flex-wrap gap-2">
					<span
						v-for="person in selectedItem.collaborators"
						:key="person"
						class="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm dark:bg-white/10 dark:text-slate-100"
					>
						{{ person }}
					</span>
				</div>
			</div>

			<div class="rounded-[24px] bg-slate-900/[0.03] p-4 dark:bg-white/[0.05]">
				<p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Activity</p>
				<div class="mt-4 space-y-3">
					<div v-for="activity in store.activityFeed" :key="activity.id" class="rounded-2xl bg-white/80 p-3 dark:bg-white/8">
						<div class="flex items-center justify-between gap-4">
							<p class="font-medium text-slate-900 dark:text-white">{{ activity.title }}</p>
							<span class="text-xs text-slate-400">{{ activity.timeLabel }}</span>
						</div>
						<p class="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">{{ activity.summary }}</p>
					</div>
				</div>
			</div>
		</div>

		<div class="mt-6 flex gap-2">
			<BaseButton v-tooltip="'Pin or unpin the current selection'" variant="secondary" size="sm" class="flex-1" @click="pinSelection">
				Pin item
			</BaseButton>
			<BaseButton
				v-tooltip="'Placeholder for a native open action'"
				variant="quiet"
				size="sm"
				class="flex-1"
				@click="toast('Connect this action to a Tauri open command when backend wiring is ready.')"
			>
				Open
			</BaseButton>
		</div>
	</aside>
</template>
