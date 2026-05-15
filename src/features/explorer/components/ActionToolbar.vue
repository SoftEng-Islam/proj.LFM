<script setup lang="ts">
import { computed, ref } from 'vue';
import { useToast } from 'vue-toastification';
import { useFileManagerStore } from '@/stores/file-manager';
import { useConfigStore } from '@/stores/config';
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
const toast = useToast();

// Dropdown states
const showNewDropdown = ref(false);
const showSortDropdown = ref(false);
const showIconSizeDropdown = ref(false);
const showFilterDropdown = ref(false);

// Icon sizes
const iconSizes = ['small', 'medium', 'large', 'extra-large'];
const iconSizeLabels: Record<string, string> = {
  small: 'Small',
  medium: 'Medium',
  large: 'Large',
  'extra-large': 'Extra Large',
};

// Sort options
const sortOptions: Record<string, string> = {
  name: 'Name',
  size: 'Size',
  kind: 'Type',
  modified: 'Date modified',
  created: 'Date created',
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
		await store.refreshCurrentDirectory();
		toast.success(`File "${baseName}" created.`);
	} catch (error) {
		toast.error(`Failed to create file: ${error}`);
	}
	showNewDropdown.value = false;
}

function cycleSort() { store.cycleSortMode(); }
function setView(mode: 'grid' | 'list') { store.setViewMode(mode); }

function setSortMode(mode: string) {
	store.cycleSortMode(); // For now cycle through - can be expanded to set specific mode
	showSortDropdown.value = false;
}

function setIconSize(size: string) {
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
.LFM-toolbar
	.LFM-ribbon(role="toolbar" aria-label="Command bar")
		.LFM-ribbon-group
			//- New Dropdown
			.relative
				button.LFM-ribbon-btn.LFM-ribbon-btn--new(title="New" @click="showNewDropdown = !showNewDropdown")
					IconAdd.LFM-ribbon-btn-icon.text-blue-500
					span.LFM-ribbon-btn-label New
					span.LFM-ribbon-btn-arrow ▾

				.LFM-dropdown-menu(v-if="showNewDropdown")
					button.LFM-dropdown-item(@click="createDirectory")
						IconFolder.text-amber-500
						span Directory
					.LFM-dropdown-divider
					button.LFM-dropdown-item(@click="createNewFile('Document')")
						IconDescription.text-blue-400
						span Text Document
					button.LFM-dropdown-item(@click="createNewFile('Script')")
						IconTerminal.text-emerald-500
						span Bash Script

			.LFM-ribbon-sep

			button.LFM-ribbon-btn(title="Cut" @click="triggerCut")
				IconContentCut.text-slate-400
			button.LFM-ribbon-btn(title="Copy" @click="triggerCopy")
				IconContentCopy.text-blue-500
			button.LFM-ribbon-btn(title="Paste" @click="triggerPaste")
				IconContentPaste.text-emerald-500
			button.LFM-ribbon-btn(title="Shortcut")
				IconShortcut.text-cyan-500
			button.LFM-ribbon-btn(title="Rename" @click="triggerRename")
				IconEdit.text-amber-500
			button.LFM-ribbon-btn(title="Properties" @click="triggerProperties")
				IconSettings.text-slate-500
			button.LFM-ribbon-btn(title="Delete" @click="triggerDelete")
				IconDelete.text-rose-500
			button.LFM-ribbon-btn(title="More")
				IconMoreHoriz.opacity-50

		.LFM-ribbon-right
			//- Filter dropdown
			.relative
				button.LFM-ribbon-btn(title="Filter" @click="showFilterDropdown = !showFilterDropdown")
					IconFilterAlt.text-violet-500
				
				.LFM-dropdown-menu(v-if="showFilterDropdown")
					button.LFM-dropdown-item
						input.LFM-filter-input(type="text" placeholder="Filter files...")
					.LFM-dropdown-divider
					button.LFM-dropdown-item Filter by name
					button.LFM-dropdown-item Filter by type
					button.LFM-dropdown-item Filter by size

			//- Sort dropdown
			.relative
				button.LFM-ribbon-btn.LFM-ribbon-btn--dropdown(title="Sort by" @click="showSortDropdown = !showSortDropdown")
					IconSort.text-sky-500
					span.LFM-ribbon-btn-label {{ sortOptions[store.sortMode] || 'Modified' }}
					span.LFM-ribbon-btn-arrow ▾
				
				.LFM-dropdown-menu(v-if="showSortDropdown")
					button.LFM-dropdown-item(
						v-for="(label, mode) in sortOptions"
						:key="mode"
						:class="{ 'LFM-dropdown-item--active': store.sortMode === mode }"
						@click="setSortMode(mode)"
					) {{ label }}

			.LFM-ribbon-sep

			//- Icon size dropdown
			.relative
				button.LFM-ribbon-btn.LFM-ribbon-btn--dropdown(title="Icon size" @click="showIconSizeDropdown = !showIconSizeDropdown")
					span.LFM-ribbon-btn-label {{ iconSizeLabels[currentIconSize] || 'Medium' }}
					span.LFM-ribbon-btn-arrow ▾
				
				.LFM-dropdown-menu(v-if="showIconSizeDropdown")
					button.LFM-dropdown-item(
						v-for="size in iconSizes"
						:key="size"
						:class="{ 'LFM-dropdown-item--active': currentIconSize === size }"
						@click="setIconSize(size)"
					) {{ iconSizeLabels[size] }}

			.LFM-ribbon-sep

			//- Combined view mode toggle button
			button.LFM-ribbon-btn(
				:class="{ 'LFM-ribbon-btn--active': store.viewMode !== 'list' }"
				:title="store.viewMode === 'grid' ? 'Switch to list view' : 'Switch to grid view'"
				@click="toggleViewMode"
			)
				component(:is="store.viewMode === 'grid' ? IconTableRows : IconGridView").text-indigo-500

			.LFM-ribbon-sep

			//- Details Pane Toggle Button: Shows/hides the Preview/Details sidebar panel
			button.LFM-ribbon-btn(:class="{ 'LFM-ribbon-btn--active': store.detailsOpen }" title="Details Pane" @click="store.toggleDetails()")
				IconSideNavigation.text-fuchsia-500
</template>

<style lang="sass" scoped>
@reference "tailwindcss"

.LFM-toolbar
	border-bottom: 1px solid var(--LFM-border)
	background: var(--LFM-toolbar)
	flex-shrink: 0

.LFM-ribbon
	display: flex
	align-items: center
	justify-content: space-between
	height: 44px
	padding: 0 12px
	gap: 4px

.LFM-ribbon-group,
.LFM-ribbon-right
	display: flex
	align-items: center
	gap: 2px

.LFM-ribbon-sep
	width: 1px
	height: 24px
	background: var(--LFM-border)
	margin: 0 6px
	opacity: 0.5

.LFM-ribbon-btn
	display: inline-flex
	align-items: center
	justify-content: center
	gap: 6px
	height: 34px
	padding: 0 8px
	border-radius: 6px
	background: transparent
	border: none
	cursor: pointer
	color: var(--LFM-text)
	font-size: 18px
	transition: all 150ms ease
	white-space: nowrap

	&:hover
		background: var(--LFM-hover)

	&:active
		background: var(--LFM-active)

	&--active
		background: var(--LFM-blue-subtle)
		color: var(--LFM-blue)

	&--new
		font-weight: 600
		background: var(--LFM-panel)
		border: 1px solid var(--LFM-border)
		padding: 0 12px
		@apply shadow-sm

	&--dropdown
		border: 1px solid var(--LFM-border)
		font-size: 16px

.LFM-ribbon-btn-icon
	font-size: 20px

.LFM-ribbon-btn-label
	font-size: 13px

.LFM-ribbon-btn-arrow
	font-size: 10px
	opacity: 0.5

/* Dropdown */
.LFM-dropdown-menu
	position: absolute
	top: 100%
	left: 0
	margin-top: 4px
	background: var(--LFM-panel)
	border: 1px solid var(--LFM-border)
	border-radius: 8px
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15)
	padding: 4px
	z-index: 100
	min-width: 160px

.LFM-dropdown-item
	display: flex
	align-items: center
	gap: 10px
	width: 100%
	padding: 8px 12px
	border-radius: 4px
	background: transparent
	border: none
	cursor: pointer
	color: var(--LFM-text)
	font-size: 13px
	text-align: left
	transition: background 150ms

	&:hover
		background: var(--LFM-hover)

.LFM-filter-input
	width: 100%
	padding: 8px 12px
	border: 1px solid var(--LFM-border)
	border-radius: 4px
	background: var(--LFM-bg)
	color: var(--LFM-text)
	font-size: 13px
	outline: none

	&:focus
		border-color: hsl(var(--p))

.LFM-dropdown-item--active
	background: var(--LFM-blue-subtle)
	color: hsl(var(--p))
	font-weight: 600

.LFM-dropdown-divider
	height: 1px
	background: var(--LFM-border)
	margin: 4px
</style>
