<script setup lang="ts">
import { computed, ref } from 'vue';

import { useFileManagerStore } from '@/stores/file-manager';
import { useConfigStore } from '@/stores/config';
import type { LfmConfigAppearance } from '@/schemas/config.schema';
import type { SortMode } from '@/types/file-manager';
import { createFile as createFileCmd, createDirRecursive as createDirCmd } from '@/services/tauri-bridge';

// Icons
import IconAdd from '~icons/material-symbols/add';
import IconContentCut from '~icons/material-symbols/content-cut';
import IconContentCopy from '~icons/material-symbols/content-copy';
import IconContentPaste from '~icons/material-symbols/content-paste';
import IconShortcut from '~icons/material-symbols/open-in-new';
import IconEdit from '~icons/material-symbols/edit';
import IconSettings from '~icons/material-symbols/settings';
import IconDelete from '~icons/material-symbols/delete';
import IconMoreHoriz from '~icons/material-symbols/more-horiz';
import IconFilterAlt from '~icons/material-symbols/filter-alt';
import IconSort from '~icons/material-symbols/sort';
import IconGridView from '~icons/material-symbols/grid-view';
import IconTableRows from '~icons/material-symbols/table-rows';
import IconSideNavigation from '~icons/material-symbols/side-navigation';
import IconFolder from '~icons/material-symbols/folder';
import IconDescription from '~icons/material-symbols/description';
import IconTerminal from '~icons/material-symbols/terminal';
import IconUploadFile from '~icons/material-symbols/upload-file';

const store = useFileManagerStore();
const configStore = useConfigStore();
const toast = { success: console.log, error: console.error, info: console.log, warning: console.warn };

// Dropdown states
const showNewDropdown = ref(false);
const showSortDropdown = ref(false);
const showIconSizeDropdown = ref(false);
const showFilterDropdown = ref(false);

// Icon sizes
const iconSizes: LfmConfigAppearance['icon_size'][] = ['small', 'medium', 'large', 'extra-large'];
const iconSizeLabels: Record<string, string> = {
  small: 'Small',
  medium: 'Medium',
  large: 'Large',
  'extra-large': 'Extra Large',
};

// Sort options
const sortOptions: Record<SortMode, string> = {
  name: 'Name',
  size: 'Size',
  kind: 'Type',
  modified: 'Date modified',
};

const currentIconSize = computed(() => configStore.config.appearance.icon_size);
const currentSortMode = computed(() => store.sortMode);

const sortLabel = computed(() => {
	switch (store.sortMode) {
		case 'name': return 'Name';
		case 'size': return 'Size';
		case 'kind': return 'Type';
		case 'modified':
		default: return 'Modified';
	}
});

function createDirectory() {
	const dir = store.createDirectory();
	showNewDropdown.value = false;
	toast.success(`Directory "${dir.name}" created.`);
}

async function createNewFile(type: string) {
	const baseName = type === 'Document' ? 'Untitled.txt' : 'Untitled.sh';
	const fullPath = `${store.currentPath}/${baseName}`;
	try {
		await createFileCmd(fullPath);
		await store.refresh();
		toast.success(`File "${baseName}" created.`);
	} catch (error) {
		toast.error(`Failed to create file: ${error}`);
	}
	showNewDropdown.value = false;
}

function cycleSort() { store.cycleSortMode(); }
function setView(mode: 'grid' | 'list') { store.setViewMode(mode); }

function setSortMode(mode: SortMode) {
	store.setSortMode(mode);
	showSortDropdown.value = false;
}

function setIconSize(size: LfmConfigAppearance['icon_size']) {
	configStore.config.appearance.icon_size = size;
	configStore.applyLiveConfig();
	showIconSizeDropdown.value = false;
}

function toggleViewMode() {
	const newMode = store.viewMode === 'grid' ? 'list' : 'grid';
	store.setViewMode(newMode);
}

const emit = defineEmits<{
	rename: [path: string];
	delete: [];
	properties: [];
}>();

function triggerRename() {
	if (store.selectedItem) {
		emit('rename', store.selectedItem.id);
	} else {
		toast.info('Select an item to rename');
	}
}

function triggerProperties() {
	if (store.selectedItem) {
		emit('properties');
	} else {
		toast.info('Select an item to view properties');
	}
}

function triggerDelete() {
	if (store.selectedItem) {
		store.deleteSelection();
	} else {
		toast.info('Select an item to delete');
	}
}

function triggerCut() {
	if (store.selectedItem) {
		store.setClipboard([store.selectedItem.id], 'cut');
		toast.info('Item cut to clipboard');
	} else {
		toast.info('Select an item to cut');
	}
}

function triggerCopy() {
	if (store.selectedItem) {
		store.setClipboard([store.selectedItem.id], 'copy');
		toast.info('Item copied to clipboard');
	} else {
		toast.info('Select an item to copy');
	}
}

async function triggerPaste() {
	await store.paste();
	toast.success('Pasted');
}
</script>

<template lang="pug">
div(class="border-b border-base-content/10 bg-base-300 shrink-0")
	div(class="flex items-center justify-between h-[44px] px-3 gap-1" role="toolbar" aria-label="Command bar")
		div(class="flex items-center gap-0.5")
			//- New Dropdown
			div(class="relative")
				button(class="inline-flex items-center justify-center gap-1.5 h-[34px] px-3 rounded-md bg-base-100 border border-base-content/10 shadow-sm cursor-pointer text-base-content text-[18px] transition-all duration-150 whitespace-nowrap font-semibold hover:bg-base-content/5 active:bg-base-content/10" title="New" @click="showNewDropdown = !showNewDropdown")
					IconAdd(class="text-[20px] text-blue-500")
					span(class="text-[13px]") New
					span(class="text-[10px] opacity-50") ▾

				div(class="absolute top-full left-0 mt-1 bg-base-100 border border-base-content/10 rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.15)] p-1 z-[100] min-w-[160px]" v-if="showNewDropdown")
					button(class="flex items-center gap-2.5 w-full px-3 py-2 rounded bg-transparent border-none cursor-pointer text-base-content text-[13px] text-left transition-colors duration-150 hover:bg-base-content/5" @click="createDirectory")
						IconFolder(class="text-amber-500")
						span Directory
					div(class="h-[1px] bg-base-content/10 m-1")
					button(class="flex items-center gap-2.5 w-full px-3 py-2 rounded bg-transparent border-none cursor-pointer text-base-content text-[13px] text-left transition-colors duration-150 hover:bg-base-content/5" @click="createNewFile('Document')")
						IconDescription(class="text-blue-400")
						span Text Document
					button(class="flex items-center gap-2.5 w-full px-3 py-2 rounded bg-transparent border-none cursor-pointer text-base-content text-[13px] text-left transition-colors duration-150 hover:bg-base-content/5" @click="createNewFile('Script')")
						IconTerminal(class="text-emerald-500")
						span Bash Script

			div(class="w-[1px] h-6 bg-base-content/10 mx-1.5 opacity-50")

			button(class="inline-flex items-center justify-center gap-1.5 h-[34px] px-2 rounded-md bg-transparent border-none cursor-pointer text-base-content text-[18px] transition-all duration-150 whitespace-nowrap hover:bg-base-content/5 active:bg-base-content/10" title="Cut" @click="triggerCut")
				IconContentCut(class="text-slate-400")
			button(class="inline-flex items-center justify-center gap-1.5 h-[34px] px-2 rounded-md bg-transparent border-none cursor-pointer text-base-content text-[18px] transition-all duration-150 whitespace-nowrap hover:bg-base-content/5 active:bg-base-content/10" title="Copy" @click="triggerCopy")
				IconContentCopy(class="text-blue-500")
			button(class="inline-flex items-center justify-center gap-1.5 h-[34px] px-2 rounded-md bg-transparent border-none cursor-pointer text-base-content text-[18px] transition-all duration-150 whitespace-nowrap hover:bg-base-content/5 active:bg-base-content/10" title="Paste" @click="triggerPaste")
				IconContentPaste(class="text-emerald-500")
			button(class="inline-flex items-center justify-center gap-1.5 h-[34px] px-2 rounded-md bg-transparent border-none cursor-pointer text-base-content text-[18px] transition-all duration-150 whitespace-nowrap hover:bg-base-content/5 active:bg-base-content/10" title="Shortcut")
				IconShortcut(class="text-cyan-500")
			button(class="inline-flex items-center justify-center gap-1.5 h-[34px] px-2 rounded-md bg-transparent border-none cursor-pointer text-base-content text-[18px] transition-all duration-150 whitespace-nowrap hover:bg-base-content/5 active:bg-base-content/10" title="Rename" @click="triggerRename")
				IconEdit(class="text-amber-500")
			button(class="inline-flex items-center justify-center gap-1.5 h-[34px] px-2 rounded-md bg-transparent border-none cursor-pointer text-base-content text-[18px] transition-all duration-150 whitespace-nowrap hover:bg-base-content/5 active:bg-base-content/10" title="Properties" @click="triggerProperties")
				IconSettings(class="text-slate-500")
			button(class="inline-flex items-center justify-center gap-1.5 h-[34px] px-2 rounded-md bg-transparent border-none cursor-pointer text-base-content text-[18px] transition-all duration-150 whitespace-nowrap hover:bg-base-content/5 active:bg-base-content/10" title="Delete" @click="triggerDelete")
				IconDelete(class="text-rose-500")
			button(class="inline-flex items-center justify-center gap-1.5 h-[34px] px-2 rounded-md bg-transparent border-none cursor-pointer text-base-content text-[18px] transition-all duration-150 whitespace-nowrap hover:bg-base-content/5 active:bg-base-content/10" title="More")
				IconMoreHoriz(class="opacity-50")

		div(class="flex items-center gap-0.5")
			//- Filter dropdown
			div(class="relative")
				button(class="inline-flex items-center justify-center gap-1.5 h-[34px] px-2 rounded-md bg-transparent border-none cursor-pointer text-base-content text-[18px] transition-all duration-150 whitespace-nowrap hover:bg-base-content/5 active:bg-base-content/10" title="Filter" @click="showFilterDropdown = !showFilterDropdown")
					IconFilterAlt(class="text-violet-500")
				
				div(class="absolute top-full left-0 mt-1 bg-base-100 border border-base-content/10 rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.15)] p-1 z-[100] min-w-[160px]" v-if="showFilterDropdown")
					button(class="flex items-center gap-2.5 w-full px-3 py-2 rounded bg-transparent border-none cursor-pointer text-base-content text-[13px] text-left transition-colors duration-150 hover:bg-base-content/5")
						input(class="w-full px-3 py-2 border border-base-content/10 rounded bg-base-200 text-base-content text-[13px] outline-none focus:border-primary" type="text" placeholder="Filter files...")
					div(class="h-[1px] bg-base-content/10 m-1")
					button(class="flex items-center gap-2.5 w-full px-3 py-2 rounded bg-transparent border-none cursor-pointer text-base-content text-[13px] text-left transition-colors duration-150 hover:bg-base-content/5") Filter by name
					button(class="flex items-center gap-2.5 w-full px-3 py-2 rounded bg-transparent border-none cursor-pointer text-base-content text-[13px] text-left transition-colors duration-150 hover:bg-base-content/5") Filter by type
					button(class="flex items-center gap-2.5 w-full px-3 py-2 rounded bg-transparent border-none cursor-pointer text-base-content text-[13px] text-left transition-colors duration-150 hover:bg-base-content/5") Filter by size

			//- Sort dropdown
			div(class="relative")
				button(class="inline-flex items-center justify-center gap-1.5 h-[34px] px-2 rounded-md bg-transparent border border-base-content/10 cursor-pointer text-base-content text-[16px] transition-all duration-150 whitespace-nowrap hover:bg-base-content/5 active:bg-base-content/10" title="Sort by" @click="showSortDropdown = !showSortDropdown")
					IconSort(class="text-sky-500")
					span(class="text-[13px]") {{ sortOptions[store.sortMode] || 'Modified' }}
					span(class="text-[10px] opacity-50") ▾
				
				div(class="absolute top-full left-0 mt-1 bg-base-100 border border-base-content/10 rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.15)] p-1 z-[100] min-w-[160px]" v-if="showSortDropdown")
					button(
						class="flex items-center gap-2.5 w-full px-3 py-2 rounded bg-transparent border-none cursor-pointer text-base-content text-[13px] text-left transition-colors duration-150 hover:bg-base-content/5"
						v-for="(label, mode) in sortOptions"
						:key="mode"
						:class="{ 'bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] text-primary font-semibold': store.sortMode === mode }"
						@click="setSortMode(mode)"
					) {{ label }}

			div(class="w-[1px] h-6 bg-base-content/10 mx-1.5 opacity-50")

			//- Icon size dropdown
			div(class="relative")
				button(class="inline-flex items-center justify-center gap-1.5 h-[34px] px-2 rounded-md bg-transparent border border-base-content/10 cursor-pointer text-base-content text-[16px] transition-all duration-150 whitespace-nowrap hover:bg-base-content/5 active:bg-base-content/10" title="Icon size" @click="showIconSizeDropdown = !showIconSizeDropdown")
					span(class="text-[13px]") {{ iconSizeLabels[currentIconSize] || 'Medium' }}
					span(class="text-[10px] opacity-50") ▾
				
				div(class="absolute top-full left-0 mt-1 bg-base-100 border border-base-content/10 rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.15)] p-1 z-[100] min-w-[160px]" v-if="showIconSizeDropdown")
					button(
						class="flex items-center gap-2.5 w-full px-3 py-2 rounded bg-transparent border-none cursor-pointer text-base-content text-[13px] text-left transition-colors duration-150 hover:bg-base-content/5"
						v-for="size in iconSizes"
						:key="size"
						:class="{ 'bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] text-primary font-semibold': currentIconSize === size }"
						@click="setIconSize(size)"
					) {{ iconSizeLabels[size] }}

			div(class="w-[1px] h-6 bg-base-content/10 mx-1.5 opacity-50")

			//- Combined view mode toggle button
			button(
				class="inline-flex items-center justify-center gap-1.5 h-[34px] px-2 rounded-md bg-transparent border-none cursor-pointer text-base-content text-[18px] transition-all duration-150 whitespace-nowrap hover:bg-base-content/5 active:bg-base-content/10"
				:class="{ 'bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] text-primary': store.viewMode !== 'list' }"
				:title="store.viewMode === 'grid' ? 'Switch to list view' : 'Switch to grid view'"
				@click="toggleViewMode"
			)
				component(:is="store.viewMode === 'grid' ? IconTableRows : IconGridView" class="text-indigo-500")

			div(class="w-[1px] h-6 bg-base-content/10 mx-1.5 opacity-50")

			//- Details Pane Toggle Button: Shows/hides the Preview/Details sidebar panel
			button(class="inline-flex items-center justify-center gap-1.5 h-[34px] px-2 rounded-md bg-transparent border-none cursor-pointer text-base-content text-[18px] transition-all duration-150 whitespace-nowrap hover:bg-base-content/5 active:bg-base-content/10" :class="{ 'bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] text-primary': store.detailsOpen }" title="Details Pane" @click="store.toggleDetails()")
				IconSideNavigation(class="text-fuchsia-500")
</template>
