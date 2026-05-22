<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-unused-vars */
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { on as busOn, off as busOff } from '@/renderer/events/bus';
import { useRouter } from 'vue-router';

import { openFile } from '@/services/tauri-bridge';

import ActionToolbar from '@/features/explorer/components/ActionToolbar.vue';
import ContextMenu from '@/features/explorer/components/ContextMenu.vue';
import RenameModal from '@/components/ui/RenameModal.vue';
import PropertiesModal from '@/components/ui/PropertiesModal.vue';
import FolderIcon from '@/components/VueIcons/Folder/FolderIcon.vue';
import FileIcon from '@/components/VueIcons/File/FileIcon.vue';

import { useFileManagerStore } from '@/stores/file-manager';
import { useConfigStore } from '@/stores/config';
import type { FileEntry, RenameDialogState, RenameMode } from '@/types/file-manager';
import { useToast } from 'vue-toastification';

const store = useFileManagerStore();
const configStore = useConfigStore();
const router = useRouter();
const toast = useToast();
const selectedId = computed(() => store.selectedItem?.id ?? '');

const iconSize = computed(() => configStore.config.appearance.icon_size || 'medium');

const gridFolderSize = computed(() => {
	switch (iconSize.value) {
		case 'small': return 70;
		case 'large': return 130;
		case 'extra-large': return 160;
		default: return 100;
	}
});

const gridFileSize = computed(() => {
	switch (iconSize.value) {
		case 'small': return 40;
		case 'large': return 72;
		case 'extra-large': return 96;
		default: return 56;
	}
});

const listFolderSize = computed(() => {
	switch (iconSize.value) {
		case 'small': return 16;
		case 'large': return 24;
		case 'extra-large': return 28;
		default: return 20;
	}
});

const listFileSize = computed(() => {
	switch (iconSize.value) {
		case 'small': return 14;
		case 'large': return 22;
		case 'extra-large': return 26;
		default: return 18;
	}
});

const workspaceStyle = computed(() => {
	const size = iconSize.value;
	return {
		'--lfm-grid-item-width': size === 'small' ? '80px' : size === 'large' ? '120px' : size === 'extra-large' ? '150px' : '100px',
		'--lfm-grid-icon-container-size': size === 'small' ? '48px' : size === 'large' ? '80px' : size === 'extra-large' ? '110px' : '64px',
		'--lfm-list-folder-size': size === 'small' ? '16px' : size === 'large' ? '24px' : size === 'extra-large' ? '28px' : '20px',
	};
});

// ── Dialog / overlay state ──────────────────────────────────────────────────

const contextMenu = ref<{ visible: boolean; x: number; y: number; itemId: string }>({
	visible: false,
	x: 0,
	y: 0,
	itemId: '',
});

const renameDialog = ref<RenameDialogState>({
	visible: false,
	mode: 'simple',
	items: [],
	simpleName: '',
});

const propertiesDialog = ref<{ visible: boolean; item: FileEntry | null }>({
	visible: false,
	item: null,
});

// ── Drag selection state ─────────────────────────────────────────────────────

const isDragging = ref(false);
const dragStart = ref<{ x: number; y: number } | null>(null);
const dragEnd = ref<{ x: number; y: number } | null>(null);
const workspaceRef = ref<HTMLElement>();

// Computed style for the selection box
const selectionBoxStyle = computed(() => {
	if (!dragStart.value || !dragEnd.value) return {};
	const startX = Math.min(dragStart.value.x, dragEnd.value.x);
	const startY = Math.min(dragStart.value.y, dragEnd.value.y);
	const width = Math.abs(dragEnd.value.x - dragStart.value.x);
	const height = Math.abs(dragEnd.value.y - dragStart.value.y);

	return {
		left: `${startX}px`,
		top: `${startY}px`,
		width: `${width}px`,
		height: `${height}px`,
	};
});

function handleMouseDown(e: MouseEvent) {
	// Only start drag if clicking on the workspace background
	if (e.target === workspaceRef.value || (e.target as HTMLElement).classList.contains('LFM-workspace-content')) {
		e.preventDefault(); // Prevent default text selection
		isDragging.value = true;
		dragStart.value = { x: e.clientX, y: e.clientY };
		dragEnd.value = { x: e.clientX, y: e.clientY };
	}
}

function handleMouseMove(e: MouseEvent) {
	if (isDragging.value && dragStart.value) {
		dragEnd.value = { x: e.clientX, y: e.clientY };

		// Real-time selection update during drag
		const startX = Math.min(dragStart.value.x, dragEnd.value.x);
		const startY = Math.min(dragStart.value.y, dragEnd.value.y);
		const endX = Math.max(dragStart.value.x, dragEnd.value.x);
		const endY = Math.max(dragStart.value.y, dragEnd.value.y);

		const itemsToSelect: string[] = [];

		store.currentEntries.forEach((entry) => {
			const element = document.querySelector(`[data-item-id="${entry.id}"]`) as HTMLElement;
			if (element) {
				const rect = element.getBoundingClientRect();
				const itemCenterX = rect.left + rect.width / 2;
				const itemCenterY = rect.top + rect.height / 2;

				if (itemCenterX >= startX && itemCenterX <= endX && itemCenterY >= startY && itemCenterY <= endY) {
					itemsToSelect.push(entry.id);
				}
			}
		});

		// Update selection in real-time (only if not holding Ctrl)
		if (!(e.ctrlKey || e.metaKey)) {
			store.setSelectedItems(itemsToSelect);
		}
	}
}

function handleMouseUp(e: MouseEvent) {
	if (isDragging.value && dragStart.value && dragEnd.value) {
		// Calculate selection box
		const startX = Math.min(dragStart.value.x, dragEnd.value.x);
		const startY = Math.min(dragStart.value.y, dragEnd.value.y);
		const endX = Math.max(dragStart.value.x, dragEnd.value.x);
		const endY = Math.max(dragStart.value.y, dragEnd.value.y);

		// Find items within the selection box
		const workspaceRect = workspaceRef.value?.getBoundingClientRect();
		if (workspaceRect) {
			const itemsToSelect: string[] = [];

			store.currentEntries.forEach((entry) => {
				const element = document.querySelector(`[data-item-id="${entry.id}"]`) as HTMLElement;
				if (element) {
					const rect = element.getBoundingClientRect();
					const itemCenterX = rect.left + rect.width / 2;
					const itemCenterY = rect.top + rect.height / 2;

					if (itemCenterX >= startX && itemCenterX <= endX && itemCenterY >= startY && itemCenterY <= endY) {
						itemsToSelect.push(entry.id);
					}
				}
			});

			// Update selection (Ctrl adds to selection, otherwise replace)
			if (e.ctrlKey || e.metaKey) {
				// Add to existing selection
				itemsToSelect.forEach((id) => store.toggleItemSelection(id));
			} else {
				// Replace selection with final selection
				store.setSelectedItems(itemsToSelect);
			}
		}

		// Mark that we just finished a drag selection
		wasDragging.value = true;
	}

	isDragging.value = false;
	dragStart.value = null;
	dragEnd.value = null;
}

// Track if we just finished a drag to prevent click event from clearing selection
const wasDragging = ref(false);

function handleWorkspaceClick() {
	// Only clear selection if we weren't just dragging
	if (!wasDragging.value) {
		store.clearSelection();
	}
	wasDragging.value = false;
}

// ── Context menu helpers ────────────────────────────────────────────────────

function openContextMenu(e: MouseEvent, itemId: string) {
	e.preventDefault();
	// Only select the item if it's not already selected
	if (!store.selectedItemIds.has(itemId)) {
		store.selectItem(itemId);
	}
	contextMenu.value = { visible: true, x: e.clientX, y: e.clientY, itemId };
}

function closeContextMenu() {
	contextMenu.value.visible = false;
}

function openEmptyContextMenu(e: MouseEvent) {
	e.preventDefault();
	store.clearSelection();
	contextMenu.value = { visible: true, x: e.clientX, y: e.clientY, itemId: '' };
}

// ── Dialog openers ──────────────────────────────────────────────────────────

function openRenameDialog(itemId?: string) {
	closeContextMenu();

	// If itemId is provided, only select it if it's not already selected
	if (itemId && !store.selectedItemIds.has(itemId)) {
		store.selectItem(itemId);
	}

	const selectedItems = store.selectedItems;
	const mode: RenameMode = selectedItems.length === 1 ? 'simple' : 'advanced';

	const items = selectedItems.map((item) => ({
		path: item.id,
		currentName: item.name,
	}));

	renameDialog.value = {
		visible: true,
		mode,
		items,
		simpleName: selectedItems[0]?.name || '',
	};
}

function openPropertiesDialog(itemId?: string) {
	const targetId = itemId || selectedId.value;
	if (!targetId) return;
	const item = store.currentEntries.find((e: FileEntry) => e.id === targetId);
	if (item) propertiesDialog.value = { visible: true, item };
	closeContextMenu();
}

async function handleSimpleRename(newName: string) {
	if (renameDialog.value.items.length === 0) return;
	const item = renameDialog.value.items[0];
	if (!item) return;
	const success = await store.renameItem(item.path, newName);
	toast[success ? 'success' : 'error'](success ? 'Renamed successfully' : 'Failed to rename');
	renameDialog.value.visible = false;
}

async function handleAdvancedRename(renames: Array<{ oldPath: string; newName: string }>) {
	const success = await store.batchRename(renames);
	toast[success ? 'success' : 'error'](success ? 'Renamed successfully' : 'Failed to rename');
	renameDialog.value.visible = false;
}

// ── Item helpers ────────────────────────────────────────────────────────────

function isFolder(entry: { kind: string }) {
	return entry.kind === 'folder';
}

function handleItemClick(entry: FileEntry, e: MouseEvent) {
	if (e.ctrlKey || e.metaKey) {
		store.toggleItemSelection(entry.id);
	} else {
		store.selectItem(entry.id);
	}
}

/**
 * Open a file or navigate into a directory.
 * Directories are pushed to the router (triggers openSection via route watch).
 * Files are opened via the Tauri backend with the system default application.
 */
function openItem(entry: FileEntry) {
	if (isFolder(entry)) {
		// Push to router — the route watcher in FileManagerView calls store.openSection
		router.push(entry.id);
	} else {
		// Tauri IPC: open with system default app
		openFile(entry.id);
	}
}

// ── Date formatter ──────────────────────────────────────────────────────────

const formatDate = (dateStr: string) =>
	new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(
		new Date(dateStr)
	);

// ── Keyboard shortcuts ──────────────────────────────────────────────────────

function handleKeydown(e: KeyboardEvent) {
	// Skip if typing in an input
	if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

	const selected = store.selectedItem;

	// Arrow key navigation
	if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
		e.preventDefault();
		const items = store.currentEntries;
		const idx = items.findIndex((it: FileEntry) => it.id === selectedId.value);
		let nextIdx = idx;

		if (e.key === 'ArrowRight') nextIdx = Math.min(idx + 1, items.length - 1);
		if (e.key === 'ArrowLeft') nextIdx = Math.max(idx - 1, 0);

		if (store.viewMode === 'grid') {
			const containerWidth = workspaceRef.value?.offsetWidth || window.innerWidth;
			const itemsPerRow = Math.floor(containerWidth / 104) || 1;
			if (e.key === 'ArrowDown') nextIdx = Math.min(idx + itemsPerRow, items.length - 1);
			if (e.key === 'ArrowUp') nextIdx = Math.max(idx - itemsPerRow, 0);
		} else {
			if (e.key === 'ArrowDown') nextIdx = Math.min(idx + 1, items.length - 1);
			if (e.key === 'ArrowUp') nextIdx = Math.max(idx - 1, 0);
		}

		const nextItem = items[nextIdx];
		if (nextItem) store.selectItem(nextItem.id);
		return;
	}

	// Enter — open selected item
	if (e.key === 'Enter') {
		e.preventDefault();
		if (selected) openItem(selected);
	}

	// F2 — rename
	if (e.key === 'F2') {
		e.preventDefault();
		if (selected) openRenameDialog(selected.id);
	}

	// Delete — trash selected
	if (e.key === 'Delete') {
		e.preventDefault();
		store.deleteSelection();
	}

	// Backspace — navigate to parent directory
	if (e.key === 'Backspace') {
		const parts = store.currentPath.split('/').filter(Boolean);
		if (parts.length > 0) {
			parts.pop();
			store.openSection('/' + parts.join('/') || '/');
		}
	}

	// Ctrl / Meta shortcuts
	if (e.ctrlKey || e.metaKey) {
		if (e.key === 'c') {
			e.preventDefault();
			if (selected) { store.setClipboard([selected.id], 'copy'); toast.info('Copied to clipboard'); }
		}
		if (e.key === 'x') {
			e.preventDefault();
			if (selected) { store.setClipboard([selected.id], 'cut'); toast.info('Cut to clipboard'); }
		}
		if (e.key === 'v') {
			e.preventDefault();
			store.paste().then(() => toast.success('Pasted'));
		}
		if (e.key === 'a') {
			e.preventDefault();
			// TODO: select all entries
		}
	}
}

onMounted(() => window.addEventListener('keydown', handleKeydown));
onMounted(() => {
	window.addEventListener('keydown', handleKeydown);
	window.addEventListener('mousedown', handleMouseDown);
	window.addEventListener('mousemove', handleMouseMove);
	window.addEventListener('mouseup', handleMouseUp);

	// Listen for global rename shortcut (F2) and open rename dialog
	busOn('shortcut:rename', () => {
		// Ignore if typing in input or textarea
		const active = document.activeElement;
		if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) return;
		const selected = store.selectedItem;
		if (selected) openRenameDialog(selected.id);
	});
});

onUnmounted(() => {
	window.removeEventListener('keydown', handleKeydown);
	window.removeEventListener('mousedown', handleMouseDown);
	window.removeEventListener('mousemove', handleMouseMove);
	window.removeEventListener('mouseup', handleMouseUp);
	busOff('shortcut:rename');
});
</script>

<template lang="pug">
.LFM-workspace(ref="workspaceRef" :style="workspaceStyle")
	ActionToolbar(@rename="openRenameDialog" @properties="openPropertiesDialog")

	.LFM-workspace-content(@contextmenu.self="openEmptyContextMenu" @click.self="handleWorkspaceClick")
		//- Selection box overlay
		.LFM-selection-box(
			v-if="isDragging && dragStart && dragEnd"
			:style="selectionBoxStyle"
		)

		//- ── Permission / read error empty state ─────────────────────────
		.LFM-nav-error(v-if="store.navError")
			.LFM-nav-error-icon
				svg(v-if="store.navError.kind === 'permission'" xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round")
					rect(x="3" y="11" width="18" height="11" rx="2" ry="2")
					path(d="M7 11V7a5 5 0 0 1 10 0v4")
				svg(v-else-if="store.navError.kind === 'not-found'" xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round")
					circle(cx="11" cy="11" r="8")
					line(x1="21" y1="21" x2="16.65" y2="16.65")
				svg(v-else xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round")
					path(d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z")
					line(x1="12" y1="9" x2="12" y2="13")
					line(x1="12" y1="17" x2="12.01" y2="17")
			.LFM-nav-error-title
				| {{ store.navError.kind === 'permission' ? 'Access Denied' : store.navError.kind === 'not-found' ? 'Not Found' : 'Cannot Open Directory' }}
			.LFM-nav-error-desc
				| {{ store.navError.kind === 'permission' ? "You don't have permission to view this directory." : store.navError.kind === 'not-found' ? 'This directory no longer exists.' : 'An error occurred while trying to open this directory.' }}
			.LFM-nav-error-path {{ store.navError.path }}
			button.LFM-nav-error-btn(@click="store.navError = null") Go Back

		//- ── Normal file view ────────────────────────────────────────────
		template(v-else)
			//- Grid view
			.LFM-grid(v-if="store.viewMode !== 'list'" @contextmenu.self="openEmptyContextMenu" @click.self="handleWorkspaceClick")
				button(
					v-for="entry in store.currentEntries"
					:key="entry.id"
					type="button"
					class="LFM-grid-item"
					:class="{
						'LFM-grid-item--selected': store.selectedItemIds.has(entry.id),
						'LFM-file-entry--hidden': entry.isHidden,
						'LFM-file-entry--hidden-blurred': entry.isHidden && store.hiddenFilesVisualStyle === 'blurred',
						'LFM-file-entry--hidden-normal': entry.isHidden && store.hiddenFilesVisualStyle === 'normal',
					}"
					:aria-selected="store.selectedItemIds.has(entry.id)"
					:title="entry.name"
					:data-item-id="entry.id"
					@click="handleItemClick(entry, $event)"
					@dblclick="openItem(entry)"
					@contextmenu="(e) => openContextMenu(e, entry.id)"
				)
					.LFM-grid-item-icon
						FolderIcon(v-if="isFolder(entry)" :size="gridFolderSize" :color="'orange'")
						img.LFM-media-thumbnail(v-else-if="entry.preview" :src="entry.preview" loading="lazy" decoding="async")
						FileIcon(v-else :name="entry.name" :path="entry.id" :size="gridFileSize")
					span.LFM-grid-item-name {{ entry.name }}

			//- List view
			.LFM-list(v-else @contextmenu.self="openEmptyContextMenu" @click.self="handleWorkspaceClick")
				.LFM-list-header
					span.LFM-list-col.LFM-list-col--name Name
					span.LFM-list-col Date modified
					span.LFM-list-col Type
					span.LFM-list-col.LFM-list-col--right Size
				button(
					v-for="row in store.currentEntries"
					:key="row.id"
					type="button"
					class="LFM-list-row"
					:class="{
						'LFM-list-row--selected': store.selectedItemIds.has(row.id),
						'LFM-file-entry--hidden': row.isHidden,
						'LFM-file-entry--hidden-blurred': row.isHidden && store.hiddenFilesVisualStyle === 'blurred',
						'LFM-file-entry--hidden-normal': row.isHidden && store.hiddenFilesVisualStyle === 'normal',
					}"
					:data-item-id="row.id"
					@click="handleItemClick(row, $event)"
					@dblclick="openItem(row)"
					@contextmenu="(e) => openContextMenu(e, row.id)"
				)
					.LFM-list-col.LFM-list-col--name
						.LFM-list-file-icon
							FolderIcon(v-if="isFolder(row)" :size="listFolderSize" :color="'orange'")
							img.LFM-list-media-thumbnail(v-else-if="row.preview" :src="row.preview" loading="lazy" decoding="async")
							FileIcon(v-else :name="row.name" :path="row.id" :size="listFileSize")
						span.LFM-list-item-name {{ row.name }}
					span.LFM-list-col {{ formatDate(row.modifiedAt) }}
					span.LFM-list-col {{ row.typeLabel }}
					span.LFM-list-col.LFM-list-col--right {{ row.sizeLabel }}

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
		:state="renameDialog"
		@close="renameDialog.visible = false"
		@submit-simple="handleSimpleRename"
		@submit-advanced="handleAdvancedRename"
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
	background: var(--color-base-100)

.LFM-workspace-content
	flex: 1
	overflow-y: auto
	overflow-x: hidden
	padding: 8px
	position: relative
	user-select: none

.LFM-selection-box
	position: fixed
	border: 1px solid var(--color-primary)
	background: rgba(43, 124, 211, 0.1)
	pointer-events: none
	z-index: 1000

.LFM-grid
	display: flex
	flex-wrap: wrap
	gap: 4px
	align-content: flex-start

.LFM-grid-item
	display: flex
	flex-direction: column
	align-items: center
	width: var(--lfm-grid-item-width, 100px)
	padding: 8px 4px 6px
	border-radius: 4px
	border: 2px solid transparent
	background: transparent
	cursor: pointer
	color: var(--color-base-content)
	transition: background 100ms, border-color 100ms
	text-align: center
	outline: none

	&:hover
		background: color-mix(in srgb, var(--color-primary) 8%, transparent)

	&--selected
		background: color-mix(in srgb, var(--color-primary) 14%, transparent)
		border-color: var(--color-primary)

.LFM-grid-item-icon
	display: flex
	align-items: center
	justify-content: center
	height: var(--lfm-grid-icon-container-size, 64px)
	width: var(--lfm-grid-icon-container-size, 64px)

.LFM-grid-item-name
	margin-top: 6px
	font-size: 11px
	line-height: 1.3
	max-width: calc(var(--lfm-grid-item-width, 100px) - 8px)
	overflow: hidden
	text-overflow: ellipsis
	display: -webkit-box
	-webkit-line-clamp: 2
	-webkit-box-orient: vertical
	word-break: break-word

.LFM-media-thumbnail
	max-width: var(--lfm-grid-icon-container-size, 64px)
	max-height: var(--lfm-grid-icon-container-size, 64px)
	object-fit: cover
	border-radius: 4px
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2)

.LFM-list-media-thumbnail
	width: var(--lfm-list-folder-size, 20px)
	height: var(--lfm-list-folder-size, 20px)
	object-fit: cover
	border-radius: 3px

.LFM-list
	width: 100%

.LFM-list-header
	display: grid
	grid-template-columns: minmax(0, 2fr) 1.2fr 1fr 0.7fr
	gap: 4px
	padding: 4px 8px
	border-bottom: 1px solid color-mix(in srgb, var(--color-base-content) 10%, transparent)
	font-size: 11px
	font-weight: 600
	color: var(--color-base-content)
	cursor: pointer
	user-select: none

.LFM-list-row
	display: grid
	grid-template-columns: minmax(0, 2fr) 1.2fr 1fr 0.7fr
	gap: 4px
	padding: 3px 8px
	border-bottom: 1px solid color-mix(in srgb, var(--color-base-content) 10%, transparent)
	background: transparent
	border-left: none
	border-right: none
	border-top: none
	cursor: pointer
	color: var(--color-base-content)
	font-size: 12px
	text-align: left
	width: 100%
	transition: background 80ms

	&:hover
		background: color-mix(in srgb, var(--color-base-content) 6%, transparent)

	&--selected
		background: color-mix(in srgb, var(--color-primary) 14%, transparent)

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
	width: 22px
	height: 22px
	display: flex
	align-items: center
	justify-content: center
	flex-shrink: 0

.LFM-list-item-name
	overflow: hidden
	text-overflow: ellipsis
	white-space: nowrap

.LFM-file-entry--hidden
	opacity: 0.58

	.LFM-grid-item-icon,
	.LFM-list-file-icon
		filter: grayscale(0.4) saturate(0.75)

.LFM-file-entry--hidden-blurred
	.LFM-grid-item-icon,
	.LFM-list-file-icon
		filter: grayscale(0.4) saturate(0.75) blur(0.7px)

.LFM-file-entry--hidden-normal
	opacity: 1

	.LFM-grid-item-icon,
	.LFM-list-file-icon
		filter: none

// ── Navigation error empty state ──────────────────────────────────────────────
.LFM-nav-error
	display: flex
	flex-direction: column
	align-items: center
	justify-content: center
	gap: 12px
	height: 100%
	min-height: 300px
	padding: 48px 24px
	text-align: center

.LFM-nav-error-icon
	display: flex
	align-items: center
	justify-content: center
	width: 96px
	height: 96px
	border-radius: 50%
	background: rgba(239, 68, 68, 0.1)
	color: rgba(239, 68, 68, 0.8)
	margin-bottom: 8px

.LFM-nav-error-title
	font-size: 18px
	font-weight: 600
	color: var(--color-base-content)

.LFM-nav-error-desc
	font-size: 13px
	color: var(--color-base-content)
	opacity: 0.6
	max-width: 360px
	line-height: 1.5

.LFM-nav-error-path
	font-size: 11px
	font-family: monospace
	background: color-mix(in srgb, var(--color-base-content) 6%, transparent)
	color: var(--color-base-content)
	opacity: 0.7
	padding: 4px 12px
	border-radius: 4px
	max-width: 100%
	overflow: hidden
	text-overflow: ellipsis
	white-space: nowrap

.LFM-nav-error-btn
	margin-top: 4px
	padding: 8px 20px
	border-radius: 6px
	background: var(--color-base-100)
	border: 1px solid color-mix(in srgb, var(--color-base-content) 10%, transparent)
	color: var(--color-base-content)
	font-size: 13px
	cursor: pointer
	transition: background 150ms, border-color 150ms

	&:hover
		background: color-mix(in srgb, var(--color-base-content) 6%, transparent)
		border-color: var(--color-primary)
</style>
