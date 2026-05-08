<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useToast } from 'vue-toastification';

import BaseButton from '@/components/ui/BaseButton.vue';
import { convertFileSrc, getVideoThumbnail } from '@/services/tauri-bridge';
import { useFileManagerStore } from '@/stores/file-manager';
import type { FileEntry } from '@/types/file-manager';
import type { AccentTone, FileStatus } from '@/types/file-manager';

const accentThemeMap: Record<
    AccentTone,
    {
        chip: string;
        bar: string;
        surface: string;
        ring: string;
        glow: string;
    }
> = {
    sky: {
        chip: 'bg-sky-500/12 text-sky-700 dark:bg-sky-400/12 dark:text-sky-200',
        bar: 'bg-sky-500',
        surface: 'from-sky-500/12 via-sky-500/3 to-transparent',
        ring: 'ring-sky-300/50',
        glow: 'shadow-[0_18px_34px_rgba(14,165,233,0.18)]',
    },
    emerald: {
        chip: 'bg-emerald-500/12 text-emerald-700 dark:bg-emerald-400/12 dark:text-emerald-200',
        bar: 'bg-emerald-500',
        surface: 'from-emerald-500/12 via-emerald-500/3 to-transparent',
        ring: 'ring-emerald-300/50',
        glow: 'shadow-[0_18px_34px_rgba(16,185,129,0.18)]',
    },
    amber: {
        chip: 'bg-amber-500/12 text-amber-700 dark:bg-amber-400/12 dark:text-amber-200',
        bar: 'bg-amber-500',
        surface: 'from-amber-500/12 via-amber-500/3 to-transparent',
        ring: 'ring-amber-300/50',
        glow: 'shadow-[0_18px_34px_rgba(245,158,11,0.18)]',
    },
    violet: {
        chip: 'bg-violet-500/12 text-violet-700 dark:bg-violet-400/12 dark:text-violet-200',
        bar: 'bg-violet-500',
        surface: 'from-violet-500/12 via-violet-500/3 to-transparent',
        ring: 'ring-violet-300/50',
        glow: 'shadow-[0_18px_34px_rgba(139,92,246,0.18)]',
    },
    rose: {
        chip: 'bg-rose-500/12 text-rose-700 dark:bg-rose-400/12 dark:text-rose-200',
        bar: 'bg-rose-500',
        surface: 'from-rose-500/12 via-rose-500/3 to-transparent',
        ring: 'ring-rose-300/50',
        glow: 'shadow-[0_18px_34px_rgba(244,63,94,0.18)]',
    },
    cyan: {
        chip: 'bg-cyan-500/12 text-cyan-700 dark:bg-cyan-400/12 dark:text-cyan-200',
        bar: 'bg-cyan-500',
        surface: 'from-cyan-500/12 via-cyan-500/3 to-transparent',
        ring: 'ring-cyan-300/50',
        glow: 'shadow-[0_18px_34px_rgba(6,182,212,0.18)]',
    },
    slate: {
        chip: 'bg-slate-500/12 text-slate-700 dark:bg-slate-400/12 dark:text-slate-200',
        bar: 'bg-slate-500',
        surface: 'from-slate-500/12 via-slate-500/3 to-transparent',
        ring: 'ring-slate-300/50',
        glow: 'shadow-[0_18px_34px_rgba(100,116,139,0.18)]',
    },
};

const statusToneMap: Record<FileStatus, string> = {
    synced: 'bg-emerald-500/12 text-emerald-700 dark:bg-emerald-400/12 dark:text-emerald-200',
    shared: 'bg-cyan-500/12 text-cyan-700 dark:bg-cyan-400/12 dark:text-cyan-200',
    draft: 'bg-amber-500/12 text-amber-700 dark:bg-amber-400/12 dark:text-amber-200',
    favorite: 'bg-rose-500/12 text-rose-700 dark:bg-rose-400/12 dark:text-rose-200',
    local: 'bg-slate-500/12 text-slate-700 dark:bg-slate-400/12 dark:text-slate-200',
    recent: 'bg-violet-500/12 text-violet-700 dark:bg-violet-400/12 dark:text-violet-200',
};

const categorySymbolMap: Record<string, string> = {
    folder: 'F',
    document: 'D',
    spreadsheet: 'X',
    image: 'P',
    video: 'V',
    archive: 'Z',
    code: '</>',
    pdf: 'PDF',
    audio: 'A',
};

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

<template lang="pug">
aside(v-if="selectedItem", class="surface-panel h-full rounded-[30px] p-5")
	.flex.items-start.justify-between.gap-4
		.flex.items-start.gap-4
			div(
				class="relative inline-flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[22px] text-sm font-semibold",
				:class="accentThemeMap[selectedItem.accent].chip"
			)
				img(
					v-if="selectedItem.preview"
					:src="selectedItem.preview"
					class="h-full w-full object-cover"
				)
				span(v-else) {{ categorySymbolMap[selectedItem.category] || '?' }}
			div
				p(class="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400") {{ selectedItem.typeLabel }}
				h2(class="mt-2 text-xl font-semibold text-slate-950 dark:text-white") {{ selectedItem.name }}
				p(class="mt-2 max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400") {{ selectedItem.typeLabel }}

		span(class="rounded-full px-3 py-1 text-xs font-medium", :class="statusToneMap[selectedItem.status]")
			| {{ selectedItem.status }}

	.mt-5.flex.flex-wrap.gap-2
		span(
			v-for="tag in selectedItem.tags"
			:key="tag"
			class="rounded-full bg-slate-900/[0.05] px-3 py-1 text-xs text-slate-600 dark:bg-white/[0.08] dark:text-slate-300"
		)
			| {{ tag }}

	.mt-6.grid.gap-3
		div(class="rounded-[24px] bg-slate-900/[0.03] p-4 dark:bg-white/[0.05]")
			p(class="text-xs font-bold uppercase tracking-[0.24em] text-slate-400") Details
			.mt-4.space-y-3.text-sm
				.flex.items-center.justify-between.gap-4
					span(class="text-slate-500 dark:text-slate-400") Path
					span(class="text-xs text-right text-slate-900 dark:text-white") {{ selectedItem.locationPath.join('/') }}
					<!-- Copy Path Button -->
					span(class="bg-green-500 w-6 h-6 rounded-sm")
				.flex.items-center.justify-between.gap-4
					<!-- Size or items count -->
					span(class="text-slate-500 dark:text-slate-400") Size
					span(class="text-slate-900 dark:text-white") {{ selectedItem.sizeLabel }}
				.flex.items-center.justify-between.gap-4
					span(class="text-slate-500 dark:text-slate-400") Modified
					span(class="text-slate-900 dark:text-white")
						| {{ new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(selectedItem.modifiedAt)) }}

		div(class="rounded-[24px] bg-slate-900/[0.03] p-4 dark:bg-white/[0.05]")
			p(class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400") Collaborators
			.mt-4.flex.flex-wrap.gap-2
				span(
					v-for="person in selectedItem.collaborators"
					:key="person"
					class="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm dark:bg-white/10 dark:text-slate-100"
				)
					| {{ person }}

		div(class="rounded-[24px] bg-slate-900/[0.03] p-4 dark:bg-white/[0.05]")
			p(class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400") Activity
			.mt-4.space-y-3
				div(
					v-for="activity in store.activityFeed"
					:key="activity.id"
					class="rounded-2xl bg-white/80 p-3 dark:bg-white/8"
				)
					.flex.items-center.justify-between.gap-4
						p(class="font-medium text-slate-900 dark:text-white") {{ activity.title }}
						span(class="text-xs text-slate-400") {{ activity.timeLabel }}
					p(class="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400") {{ activity.summary }}

	.mt-6.flex.gap-2
		BaseButton(
			v-tooltip="'Pin or unpin the current selection'"
			variant="secondary"
			size="sm"
			class="flex-1"
			@click="pinSelection"
		) Pin item

		BaseButton(
			v-tooltip="'Placeholder for a native open action'"
			variant="quiet"
			size="sm"
			class="flex-1"
			@click="toast('Connect this action to a Tauri open command when backend wiring is ready.')"
		) Open
</template>

<style lang="sass"></style>
