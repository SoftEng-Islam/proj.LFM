<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

import { openFile, convertFileSrc, getVideoThumbnail } from '@/services/tauri-bridge';

import ActionToolbar from '@/features/explorer/components/ActionToolbar.vue';
import ContextMenu from '@/features/explorer/components/ContextMenu.vue';
import RenameModal from '@/components/ui/RenameModal.vue';
import PropertiesModal from '@/components/ui/PropertiesModal.vue';
import FolderIcon from '@/components/ui/FolderIcon.vue';


import { useFileManagerStore } from '@/stores/file-manager';
import type { FileEntry } from '@/types/file-manager';
import { useToast } from 'vue-toastification';

const store = useFileManagerStore();
const router = useRouter();
const toast = useToast();
const selectedId = computed(() => store.selectedItem?.id ?? '');

// Context menu state
const contextMenu = ref<{ visible: boolean; x: number; y: number; itemId: string; }>({
	visible: false,
	x: 0,
	y: 0,
	itemId: '',
});

// Rename modal state
const renameDialog = ref<{ visible: boolean; path: string; currentName: string; }>({
	visible: false,
	path: '',
	currentName: '',
});

// Properties modal state
const propertiesDialog = ref<{ visible: boolean; item: FileEntry | null; }>({
	visible: false,
	item: null,
});

function openContextMenu(e: MouseEvent, itemId: string) {
	e.preventDefault();
	store.selectItem(itemId);
	contextMenu.value = { visible: true, x: e.clientX, y: e.clientY, itemId };
}

function closeContextMenu() {
	contextMenu.value.visible = false;
}

function openEmptyContextMenu(e: MouseEvent) {
	e.preventDefault();
	store.selectItem('');
	contextMenu.value = { visible: true, x: e.clientX, y: e.clientY, itemId: '' };
}

function openRenameDialog(path: string) {
	const name = path.split('/').pop() || '';
	renameDialog.value = { visible: true, path, currentName: name };
	closeContextMenu();
}

function openPropertiesDialog(itemId?: string) {
	const targetId = itemId || selectedId.value;
	if (!targetId) return;
	const item = store.currentEntries.find(e => e.id === targetId);
	if (item) {
		propertiesDialog.value = { visible: true, item };
	}
	closeContextMenu();
}

async function handleRename(newName: string) {
	const success = await store.renameItem(renameDialog.value.path, newName);
	if (success) {
		toast.success('Renamed successfully');
	} else {
		toast.error('Failed to rename');
	}
	renameDialog.value.visible = false;
}

// Determine icon type for non-folder entries
function isFolder(entry: { kind: string; }) {
	return entry.kind === 'folder';
}

function openItem(entry: FileEntry) {
	if (isFolder(entry)) {
		router.push(entry.id);
	} else {
		openFile(entry.id);
	}
}

// File type icon color map
const fileIconColors: Record<string, string> = {
	document: '#2b7cd3',
	image: '#e07000',
	video: '#6236cc',
	audio: '#1db954',
	archive: '#f1c40f',
	code: '#34495e',
	default: '#7f8c8d',
};

function getFileIconColor(category: string) {
	return fileIconColors[category] || fileIconColors.default;
}

// File category → emoji glyph (fallback icon)
const fileGlyphs: Record<string, string> = {
	document: '📄',
	image: '🖼',
	audio: '🎵',
	video: '🎬',
	archive: '📦',
	code: '📝',
	data: '📊',
	default: '📄',
};
function fileGlyph(category: string): string {
	return fileGlyphs[category] ?? fileGlyphs['default'] ?? '📄';
}

const formatDate = (dateStr: string) => {
	return new Intl.DateTimeFormat('en-US', {
		month: 'short', day: 'numeric', year: 'numeric',
	}).format(new Date(dateStr));
};

const workspaceRef = ref<HTMLElement>();

// Keyboard Shortcuts
function handleKeydown(e: KeyboardEvent) {
	// Don't trigger shortcuts if user is typing in an input
	if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

	const selected = store.selectedItem;
	if (!selected && e.key !== 'v') return;

	// Navigation
	if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
		e.preventDefault();
		const items = store.currentEntries;
		const idx = items.findIndex(it => it.id === selectedId.value);
		let nextIdx = idx;

		if (e.key === 'ArrowRight') nextIdx = Math.min(idx + 1, items.length - 1);
		if (e.key === 'ArrowLeft') nextIdx = Math.max(idx - 1, 0);

		// Grid vertical navigation
		if (store.viewMode === 'grid') {
			const containerWidth = workspaceRef.value?.offsetWidth || window.innerWidth;
			// Each item is 100px + 4px gap roughly. Let's be more precise if possible.
			// But 104 is a good estimate.
			const itemsPerRow = Math.floor(containerWidth / 104) || 1;

			if (e.key === 'ArrowDown') nextIdx = Math.min(idx + itemsPerRow, items.length - 1);
			if (e.key === 'ArrowUp') nextIdx = Math.max(idx - itemsPerRow, 0);
		} else {
			// List view
			if (e.key === 'ArrowDown') nextIdx = Math.min(idx + 1, items.length - 1);
			if (e.key === 'ArrowUp') nextIdx = Math.max(idx - 1, 0);
		}

		const nextItem = items[nextIdx];
		if (nextItem) {
			store.selectItem(nextItem.id);
		}
		return;
	}

	// Actions
	if (e.key === 'Enter') {
		e.preventDefault();
		if (selected) openItem(selected);
	}

	if (e.key === 'F2') {
		e.preventDefault();
		if (selected) openRenameDialog(selected.id);
	}

	if (e.key === 'Delete') {
		e.preventDefault();
		store.deleteSelection();
	}

	if (e.key === 'Backspace') {
		// Go to parent directory
		const parts = store.currentPath.split('/').filter(Boolean);
		if (parts.length > 0) {
			parts.pop();
			const parent = '/' + parts.join('/');
			store.openSection(parent || '/');
		}
	}

	// Ctrl Shortcuts
	if (e.ctrlKey || e.metaKey) {
		if (e.key === 'c') {
			e.preventDefault();
			if (selected) {
				store.setClipboard([selected.id], 'copy');
				toast.info('Copied to clipboard');
			}
		}
		if (e.key === 'x') {
			e.preventDefault();
			if (selected) {
				store.setClipboard([selected.id], 'cut');
				toast.info('Cut to clipboard');
			}
		}
		if (e.key === 'v') {
			e.preventDefault();
			store.paste().then(() => toast.success('Pasted'));
		}
		if (e.key === 'a') {
			e.preventDefault();
			// Select all could be implemented here
		}
	}
}

import { onMounted, onUnmounted } from 'vue';
onMounted(() => {
	window.addEventListener('keydown', handleKeydown);
});
onUnmounted(() => {
	window.removeEventListener('keydown', handleKeydown);
});
</script>

<template lang="pug">
.LFM-workspace(ref="workspaceRef")
	ActionToolbar(@rename="openRenameDialog" @properties="openPropertiesDialog")

	.LFM-workspace-content(@contextmenu.self="openEmptyContextMenu" @click.self="store.selectItem('')")
		div(v-if="store.viewMode !== 'list'", class="LFM-grid" @contextmenu.self="openEmptyContextMenu" @click.self="store.selectItem('')")
			button(
				v-for="entry in store.currentEntries"
				:key="entry.id"
				type="button"
				class="LFM-grid-item"
				:class="{ 'LFM-grid-item--selected': selectedId === entry.id }"
				:aria-selected="selectedId === entry.id"
				:title="entry.name"
				@click="store.selectItem(entry.id)"
				@dblclick="openItem(entry)"
				@contextmenu="(e) => openContextMenu(e, entry.id)"
			)
				.LFM-grid-item-icon
					// FolderIcon component expects size as a number, not a string
					FolderIcon(
						v-if="isFolder(entry)"
						:size="164"
						class="text-amber-500"
					)
					img.LFM-media-thumbnail(
						v-else-if="entry.preview"
						:src="entry.preview"
						loading="lazy"
					)
					.LFM-file-icon(
						v-else
						:style="{ background: getFileIconColor(entry.category) }"
					)
						//- Video icon placeholder
						svg(v-if="entry.category === 'video'" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round")
							polygon(points="23 7 16 12 23 17 23 7")
							rect(x="1" y="5" width="15" height="14" rx="2" ry="2")
						//- Audio icon placeholder
						svg(v-else-if="entry.category === 'audio'" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round")
							path(d="M9 18V5l12-2v13")
							circle(cx="6" cy="18" r="3")
							circle(cx="18" cy="16" r="3")
						//- Default file icon placeholder
						svg(v-else width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round")
							path(d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z")
							polyline(points="13 2 13 9 20 9")

				span(class="LFM-grid-item-name") {{ entry.name }}

		div(v-else, class="LFM-list" @contextmenu.self="openEmptyContextMenu" @click.self="store.selectItem('')")
			.LFM-list-header
				span(class="LFM-list-col LFM-list-col--name") Name
				span(class="LFM-list-col") Date modified
				span(class="LFM-list-col") Type
				span(class="LFM-list-col LFM-list-col--right") Size

			button(
				v-for="row in store.currentEntries"
				:key="row.id"
				type="button"
				class="LFM-list-row"
				:class="{ 'LFM-list-row--selected': selectedId === row.id }"
				@click="store.selectItem(row.id)"
				@dblclick="openItem(row)"
				@contextmenu="(e) => openContextMenu(e, row.id)"
			)
				div(class="LFM-list-col LFM-list-col--name")
					.LFM-list-file-icon(
						:style="{ background: getFileIconColor(row.category) }"
					)
						span(v-if="isFolder(row)")
							svg(width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round")
								path(d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z")
						img.LFM-list-media-thumbnail(
							v-else-if="row.preview"
							:src="row.preview"
							loading="lazy"
						)
						svg(v-else-if="row.category === 'video'" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round")
							polygon(points="23 7 16 12 23 17 23 7")
							rect(x="1" y="5" width="15" height="14" rx="2" ry="2")
						svg(v-else-if="row.category === 'audio'" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round")
							path(d="M9 18V5l12-2v13")
							circle(cx="6" cy="18" r="3")
							circle(cx="18" cy="16" r="3")
						svg(v-else width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round")
							path(d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z")
							polyline(points="13 2 13 9 20 9")

					span(class="LFM-list-item-name") {{ row.name }}

				span(class="LFM-list-col") {{ formatDate(row.modifiedAt) }}
				span(class="LFM-list-col") {{ row.typeLabel }}
				span(class="LFM-list-col LFM-list-col--right") {{ row.sizeLabel }}

	ContextMenu(
		v-if="contextMenu.visible"
		:x="contextMenu.x"
		:y="contextMenu.y"
		:item-name="contextMenu.itemId.split('/').pop()"
		:file-path="contextMenu.itemId"
		@close="closeContextMenu"
		@rename="openRenameDialog(contextMenu.itemId)"
		@properties="openPropertiesDialog(contextMenu.itemId)"
	)
	RenameModal(
		v-if="renameDialog.visible"
		:show="renameDialog.visible"
		:current-name="renameDialog.currentName"
		@close="renameDialog.visible = false"
		@submit="handleRename"
	)
	PropertiesModal(
		v-if="propertiesDialog.visible && propertiesDialog.item"
		:show="propertiesDialog.visible"
		:item="propertiesDialog.item"
		@close="propertiesDialog.visible = false"
	)
</template>

<style lang="sass" scoped>
.LFM-workspace
	display: flex
	flex-direction: column
	height: 100%
	background: var(--LFM-panel)

.LFM-workspace-content
	flex: 1
	overflow-y: auto
	overflow-x: hidden
	padding: 8px

.LFM-grid
	display: flex
	flex-wrap: wrap
	gap: 4px
	align-content: flex-start

.LFM-grid-item
	display: flex
	flex-direction: column
	align-items: center
	width: 100px
	padding: 8px 4px 6px
	border-radius: 4px
	border: 2px solid transparent
	background: transparent
	cursor: pointer
	color: var(--LFM-text)
	transition: background 100ms, border-color 100ms
	text-align: center
	outline: none

	&:hover
		background: var(--LFM-item-hover)

	&--selected
		background: var(--LFM-selected)
		border-color: var(--LFM-item-selected-border)

.LFM-grid-item-icon
	display: flex
	align-items: center
	justify-content: center
	height: 64px
	width: 64px

.LFM-file-icon
	width: 52px
	height: 64px
	border-radius: 3px
	display: flex
	flex-direction: column
	align-items: center
	justify-content: center
	position: relative

	&::before
		content: ''
		position: absolute
		top: 0
		right: 0
		width: 0
		height: 0
		border-style: solid
		border-width: 0 12px 12px 0
		border-color: transparent rgba(255, 255, 255, 0.3) transparent transparent

.LFM-file-icon-glyph
	font-size: 20px
	filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))

.LFM-media-thumbnail
	max-width: 64px
	max-height: 64px
	object-fit: cover
	border-radius: 4px
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2)

.LFM-list-media-thumbnail
	width: 16px
	height: 16px
	object-fit: cover
	border-radius: 2px
	margin-right: 8px

.LFM-grid-item-name
	margin-top: 6px
	font-size: 11px
	line-height: 1.3
	max-width: 92px
	overflow: hidden
	text-overflow: ellipsis
	display: -webkit-box
	-webkit-line-clamp: 2
	-webkit-box-orient: vertical
	word-break: break-word

.LFM-list
	width: 100%

.LFM-list-header
	display: grid
	grid-template-columns: minmax(0, 2fr) 1.2fr 1fr 0.7fr
	gap: 4px
	padding: 4px 8px
	border-bottom: 1px solid var(--LFM-border)
	font-size: 11px
	font-weight: 600
	color: var(--LFM-text)
	cursor: pointer
	user-select: none

.LFM-list-row
	display: grid
	grid-template-columns: minmax(0, 2fr) 1.2fr 1fr 0.7fr
	gap: 4px
	padding: 3px 8px
	border-bottom: 1px solid var(--LFM-border)
	background: transparent
	border-left: none
	border-right: none
	border-top: none
	cursor: pointer
	color: var(--LFM-text)
	font-size: 12px
	text-align: left
	width: 100%
	transition: background 80ms

	&:hover
		background: var(--LFM-hover)

	&--selected
		background: var(--LFM-selected)

.LFM-list-col
	display: flex
	align-items: center
	gap: 6px
	overflow: hidden
	white-space: nowrap
	text-overflow: ellipsis

	&--name
		gap: 6px

	&--right
		justify-content: flex-end

.LFM-list-file-icon
	width: 16px
	height: 16px
	border-radius: 2px
	display: flex
	align-items: center
	justify-content: center
	flex-shrink: 0

.LFM-list-item-name
	overflow: hidden
	text-overflow: ellipsis
	white-space: nowrap
</style>
