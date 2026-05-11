<script setup lang="ts">
import { computed, ref } from 'vue';
import { useToast } from 'vue-toastification';
import { useFileManagerStore } from '@/stores/file-manager';

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

const store = useFileManagerStore();
const toast = useToast();

const showNewDropdown = ref(false);

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
	toast.success(`${dir.name} created.`);
	showNewDropdown.value = false;
}

function createFile(type: string) {
	toast.info(`Creating new ${type}...`);
	showNewDropdown.value = false;
	// Implementation for specific file types would go here
}

function cycleSort() { store.cycleSortMode(); }
function setView(mode: 'grid' | 'list') { store.setViewMode(mode); }

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
					button.LFM-dropdown-item(@click="createFile('Document')")
						IconDescription.text-blue-400
						span Text Document
					button.LFM-dropdown-item(@click="createFile('Script')")
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
			button.LFM-ribbon-btn(title="Filter")
				IconFilterAlt.text-violet-500

			button.LFM-ribbon-btn.LFM-ribbon-btn--dropdown(title="Sort by" @click="cycleSort")
				IconSort.text-sky-500
				span.LFM-ribbon-btn-label {{ sortLabel }}
				span.LFM-ribbon-btn-arrow ▾

			.LFM-ribbon-sep

			button.LFM-ribbon-btn(:class="{ 'LFM-ribbon-btn--active': store.viewMode !== 'list' }" title="Grid View" @click="setView('grid')")
				IconGridView.text-indigo-500
			button.LFM-ribbon-btn(:class="{ 'LFM-ribbon-btn--active': store.viewMode === 'list' }" title="List View" @click="setView('list')")
				IconTableRows.text-indigo-500

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

.LFM-dropdown-divider
	height: 1px
	background: var(--LFM-border)
	margin: 4px
</style>
