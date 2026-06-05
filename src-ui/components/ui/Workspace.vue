<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-unused-vars */
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { on as busOn } from '@/renderer/events/bus';
import { useRouter } from 'vue-router';

import { openFile } from '@/services/tauri-bridge';

import ActionToolbar from '@/modules/ActionToolbar/ActionToolbar.vue';
import ContextMenu from '@/components/ui/ContextMenu.vue';
import RenameModal from '@/components/ui/RenameModal.vue';
import PropertiesModal from '@/components/ui/PropertiesModal.vue';
import FolderIcon from '@/components/VueIcons/Folder/FolderIcon.vue';
import FileIcon from '@/components/VueIcons/File/FileIcon.vue';

import { useFileManagerStore } from '@/stores/file-manager';
import { useConfigStore } from '@/stores/config';
import type { FileEntry, RenameDialogState, RenameMode } from '@/types/file-manager';

const store = useFileManagerStore();
const configStore = useConfigStore();
const router = useRouter();
const toast = { success: console.log, error: console.error, info: console.log, warning: console.warn };
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
const selectionAnchorId = ref<string | null>(null);
const busCleanup: Array<() => void> = [];

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
	if (e.target === workspaceRef.value || (e.target as HTMLElement).classList.contains('LFM-workspace-content')) {
		e.preventDefault();
		isDragging.value = true;
		dragStart.value = { x: e.clientX, y: e.clientY };
		dragEnd.value = { x: e.clientX, y: e.clientY };
	}
}

function handleMouseMove(e: MouseEvent) {
	if (isDragging.value && dragStart.value) {
		dragEnd.value = { x: e.clientX, y: e.clientY };

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

		if (!(e.ctrlKey || e.metaKey)) {
			store.setSelectedItems(itemsToSelect);
		}
	}
}

function handleMouseUp(e: MouseEvent) {
	if (isDragging.value && dragStart.value && dragEnd.value) {
		const startX = Math.min(dragStart.value.x, dragEnd.value.x);
		const startY = Math.min(dragStart.value.y, dragEnd.value.y);
		const endX = Math.max(dragStart.value.x, dragEnd.value.x);
		const endY = Math.max(dragStart.value.y, dragEnd.value.y);

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

			if (e.ctrlKey || e.metaKey) {
				itemsToSelect.forEach((id) => store.toggleItemSelection(id));
			} else {
				store.setSelectedItems(itemsToSelect);
			}
		}

		wasDragging.value = true;
	}

	isDragging.value = false;
	dragStart.value = null;
	dragEnd.value = null;
}

const wasDragging = ref(false);

function handleWorkspaceClick() {
	if (!wasDragging.value) {
		store.clearSelection();
		selectionAnchorId.value = null;
	}
	wasDragging.value = false;
}

// ── Context menu helpers ────────────────────────────────────────────────────

function openContextMenu(e: MouseEvent, itemId: string) {
	e.preventDefault();
	if (!store.selectedItemIds.has(itemId)) {
		setPrimarySelection(itemId);
	}
	contextMenu.value = { visible: true, x: e.clientX, y: e.clientY, itemId };
}

function closeContextMenu() {
	contextMenu.value.visible = false;
}

function openEmptyContextMenu(e: MouseEvent) {
	e.preventDefault();
	store.clearSelection();
	selectionAnchorId.value = null;
	contextMenu.value = { visible: true, x: e.clientX, y: e.clientY, itemId: '' };
}

// ── Dialog openers ──────────────────────────────────────────────────────────

function openRenameDialog(itemId?: string) {
	closeContextMenu();
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

function currentGridStride(): number {
	switch (iconSize.value) {
		case 'small': return 84;
		case 'large': return 124;
		case 'extra-large': return 154;
		default: return 104;
	}
}

function currentItemsPerRow(): number {
	if (store.viewMode !== 'grid') return 1;
	const containerWidth = workspaceRef.value?.offsetWidth || window.innerWidth;
	return Math.max(1, Math.floor(containerWidth / currentGridStride()));
}

function activeSelectedId(): string | null {
	return store.selectedItemIds.size > 0 ? selectedId.value : null;
}

function setPrimarySelection(itemId: string) {
	store.selectItem(itemId);
	selectionAnchorId.value = itemId;
}

function setRangeSelection(targetId: string) {
	const items = store.currentEntries;
	if (items.length === 0) return;

	const anchorId = selectionAnchorId.value || activeSelectedId() || targetId;
	const anchorIndex = items.findIndex((item) => item.id === anchorId);
	const targetIndex = items.findIndex((item) => item.id === targetId);
	if (anchorIndex === -1 || targetIndex === -1) {
		setPrimarySelection(targetId);
		return;
	}

	const [start, end] = anchorIndex < targetIndex ? [anchorIndex, targetIndex] : [targetIndex, anchorIndex];
	store.setSelectedItems(items.slice(start, end + 1).map((item) => item.id));
}

function toggleFocusedSelection() {
	const focusedId = activeSelectedId() || selectionAnchorId.value || store.currentEntries[0]?.id;
	if (!focusedId) return;
	store.toggleItemSelection(focusedId);
	selectionAnchorId.value = focusedId;
}

function moveSelection(direction: 'up' | 'down' | 'left' | 'right', extend: boolean) {
	const items = store.currentEntries;
	if (items.length === 0) return;

	if (!activeSelectedId() && !selectionAnchorId.value) {
		const firstItem = items[0];
		if (firstItem) setPrimarySelection(firstItem.id);
		return;
	}

	const currentId = activeSelectedId() || selectionAnchorId.value || items[0]?.id;
	if (!currentId) return;

	const currentIndex = items.findIndex((item) => item.id === currentId);
	const safeIndex = currentIndex === -1 ? 0 : currentIndex;
	let nextIndex = safeIndex;

	switch (direction) {
		case 'left': nextIndex = Math.max(0, safeIndex - 1); break;
		case 'right': nextIndex = Math.min(items.length - 1, safeIndex + 1); break;
		case 'up': nextIndex = Math.max(0, safeIndex - currentItemsPerRow()); break;
		case 'down': nextIndex = Math.min(items.length - 1, safeIndex + currentItemsPerRow()); break;
	}

	const target = items[nextIndex];
	if (!target) return;

	if (extend) {
		if (!selectionAnchorId.value) {
			selectionAnchorId.value = currentId;
		}
		setRangeSelection(target.id);
		return;
	}

	setPrimarySelection(target.id);
}

// Replaced custom CSS logic with Tailwind classes
function fileEntryClass(id: string, isHidden?: boolean) {
	return {
		'bg-[color-mix(in_srgb,var(--color-primary)_14%,transparent)] border-[var(--color-primary)]': store.selectedItemIds.has(id),
		'opacity-[0.58]': !!isHidden && store.hiddenFilesVisualStyle !== 'normal',
	};
}

function listEntryClass(id: string, isHidden?: boolean) {
	return {
		'bg-[color-mix(in_srgb,var(--color-primary)_14%,transparent)]': store.selectedItemIds.has(id),
		'opacity-[0.58]': !!isHidden && store.hiddenFilesVisualStyle !== 'normal',
	};
}

function iconFilterClass(isHidden?: boolean) {
	if (!isHidden || store.hiddenFilesVisualStyle === 'normal') return '';
	if (store.hiddenFilesVisualStyle === 'blurred') return 'grayscale-[0.4] saturate-[0.75] blur-[0.7px]';
	return 'grayscale-[0.4] saturate-[0.75]';
}

function handleItemClick(entry: FileEntry, e: MouseEvent) {
	if (e.shiftKey) {
		if (!selectionAnchorId.value) selectionAnchorId.value = activeSelectedId() || entry.id;
		setRangeSelection(entry.id);
		return;
	}

	if (e.ctrlKey || e.metaKey) {
		store.toggleItemSelection(entry.id);
		selectionAnchorId.value = entry.id;
	} else {
		setPrimarySelection(entry.id);
	}
}

function openItem(entry: FileEntry) {
	if (isFolder(entry)) {
		router.push(entry.id);
	} else {
		openFile(entry.id);
	}
}

const formatDate = (dateStr: string) =>
	new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(
		new Date(dateStr)
	);

onMounted(() => {
	window.addEventListener('mousedown', handleMouseDown);
	window.addEventListener('mousemove', handleMouseMove);
	window.addEventListener('mouseup', handleMouseUp);

	busCleanup.push(
		busOn('shortcut:rename', () => { if (store.selectedItem) openRenameDialog(store.selectedItem.id); })
	);
	busCleanup.push(
		busOn('shortcut:navigate', (payload: { direction: 'up' | 'down' | 'left' | 'right'; extend: boolean }) => { moveSelection(payload.direction, payload.extend); })
	);
	busCleanup.push(
		busOn('shortcut:toggle-selection', () => { toggleFocusedSelection(); })
	);
	busCleanup.push(
		busOn('shortcut:toggle-selection-focused', () => { toggleFocusedSelection(); })
	);
	busCleanup.push(
		busOn('shortcut:escape', () => {
			if (contextMenu.value.visible) { closeContextMenu(); return; }
			if (renameDialog.value.visible) { renameDialog.value.visible = false; return; }
			if (propertiesDialog.value.visible) { propertiesDialog.value.visible = false; return; }
			store.clearSelection();
			selectionAnchorId.value = null;
		})
	);
});

onUnmounted(() => {
	window.removeEventListener('mousedown', handleMouseDown);
	window.removeEventListener('mousemove', handleMouseMove);
	window.removeEventListener('mouseup', handleMouseUp);
	while (busCleanup.length > 0) {
		busCleanup.pop()?.();
	}
});
</script>

<template lang="pug">
.LFM-workspace(
	ref="workspaceRef"
	:style="workspaceStyle"
	class="flex flex-col h-full bg-(--color-base-100)"
)
	ActionToolbar(@rename="openRenameDialog" @properties="openPropertiesDialog")

	.LFM-workspace-content(
		class="flex-1 overflow-y-auto overflow-x-hidden p-2 relative select-none"
		@contextmenu.self="openEmptyContextMenu"
		@click.self="handleWorkspaceClick"
	)
		//- Selection box overlay
		.LFM-selection-box(
			v-if="isDragging && dragStart && dragEnd"
			:style="selectionBoxStyle"
			class="fixed border border-(--color-primary) bg-[rgba(43,124,211,0.1)] pointer-events-none z-1000"
		)

		//- ── Permission / read error empty state ─────────────────────────
		.LFM-nav-error(
			v-if="store.navError"
			class="flex flex-col items-center justify-center gap-3 h-full min-h-75 py-12 px-6 text-center"
		)
			.LFM-nav-error-icon(class="flex items-center justify-center w-24 h-24 rounded-full bg-red-500/10 text-red-500/80 mb-2")
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
			.LFM-nav-error-title(class="text-[18px] font-semibold text-[var(--color-base-content)]")
				| {{ store.navError.kind === 'permission' ? 'Access Denied' : store.navError.kind === 'not-found' ? 'Not Found' : 'Cannot Open Directory' }}
			.LFM-nav-error-desc(class="text-[13px] text-[var(--color-base-content)] opacity-60 max-w-[360px] leading-relaxed")
				| {{ store.navError.kind === 'permission' ? "You don't have permission to view this directory." : store.navError.kind === 'not-found' ? 'This directory no longer exists.' : 'An error occurred while trying to open this directory.' }}
			.LFM-nav-error-path(class="text-[11px] font-mono bg-[color-mix(in_srgb,var(--color-base-content)_6%,transparent)] text-[var(--color-base-content)] opacity-70 py-1 px-3 rounded max-w-full overflow-hidden text-ellipsis whitespace-nowrap") {{ store.navError.path }}
			button.LFM-nav-error-btn(
				@click="store.navError = null"
				class="mt-1 py-2 px-5 rounded-md bg-[var(--color-base-100)] border border-[color-mix(in_srgb,var(--color-base-content)_10%,transparent)] text-[var(--color-base-content)] text-[13px] cursor-pointer transition-[background,border-color] duration-150 hover:bg-[color-mix(in_srgb,var(--color-base-content)_6%,transparent)] hover:border-[var(--color-primary)]"
			) Go Back

		//- ── Normal file view ────────────────────────────────────────────
		template(v-else)
			//- Grid view (Updated dynamically scaling utility class)
			.LFM-grid(
				v-if="store.viewMode !== 'list'"
				@contextmenu.self="openEmptyContextMenu"
				@click.self="handleWorkspaceClick"
				class="grid grid-cols-[repeat(auto-fill,minmax(var(--lfm-grid-item-width,100px),1fr))] gap-4 p-4 mx-auto"
				)
				button.LFM-grid-item(
					v-for="entry in store.currentEntries"
					:key="entry.id"
					type="button"
					class="flex flex-col items-center w-[var(--lfm-grid-item-width,100px)] pt-2 pb-[6px] px-1 rounded border-2 border-transparent bg-transparent cursor-pointer text-[var(--color-base-content)] transition-[background,border-color] duration-100 text-center outline-none hover:bg-[color-mix(in_srgb,var(--color-primary)_8%,transparent)]"
					:class="fileEntryClass(entry.id, entry.isHidden)"
					:aria-selected="store.selectedItemIds.has(entry.id)"
					:title="entry.name"
					:data-item-id="entry.id"
					@click="handleItemClick(entry, $event)"
					@dblclick="openItem(entry)"
					@contextmenu="(e) => openContextMenu(e, entry.id)"
				)
					.LFM-grid-item-icon(
						class="flex items-center justify-center h-[var(--lfm-grid-icon-container-size,64px)] w-[var(--lfm-grid-icon-container-size,64px)] transition-all"
						:class="iconFilterClass(entry.isHidden)"
					)
						FolderIcon(v-if="isFolder(entry)" :size="gridFolderSize" :color="'orange'")
						img.LFM-media-thumbnail(
							v-else-if="entry.preview"
							:src="entry.preview"
							loading="lazy"
							decoding="async"
							class="max-w-[var(--lfm-grid-icon-container-size,64px)] max-h-[var(--lfm-grid-icon-container-size,64px)] object-cover rounded shadow-[0_1px_3px_rgba(0,0,0,0.2)]"
						)
						FileIcon(v-else :name="entry.name" :path="entry.id" :size="gridFileSize")
					span.LFM-grid-item-name(class="mt-[6px] text-[11px] leading-[1.3] max-w-[calc(var(--lfm-grid-item-width,100px)-8px)] overflow-hidden text-ellipsis line-clamp-2 break-words") {{ entry.name }}

			//- List view
			.LFM-list(
				v-else
				@contextmenu.self="openEmptyContextMenu"
				@click.self="handleWorkspaceClick"
				class="w-full"
			)
				.LFM-list-header(class="grid grid-cols-[minmax(0,2fr)_1.2fr_1fr_0.7fr] gap-1 py-1 px-2 border-b border-[color-mix(in_srgb,var(--color-base-content)_10%,transparent)] text-[11px] font-semibold text-(--color-base-content) cursor-pointer select-none")
					span.LFM-list-col(class="flex items-center gap-1.5 overflow-hidden whitespace-nowrap text-ellipsis") Name
					span.LFM-list-col(class="flex items-center gap-1.5 overflow-hidden whitespace-nowrap text-ellipsis") Date modified
					span.LFM-list-col(class="flex items-center gap-1.5 overflow-hidden whitespace-nowrap text-ellipsis") Type
					span.LFM-list-col(class="flex items-center gap-1.5 overflow-hidden whitespace-nowrap text-ellipsis justify-end") Size
				button.LFM-list-row(
					v-for="row in store.currentEntries"
					:key="row.id"
					type="button"
					class="grid grid-cols-[minmax(0,2fr)_1.2fr_1fr_0.7fr] gap-1 py-0.75 px-2 border-b border-t-0 border-l-0 border-r-0 border-[color-mix(in_srgb,var(--color-base-content)_10%,transparent)] bg-transparent cursor-pointer text-(--color-base-content) text-[12px] text-left w-full transition-colors duration-75 hover:bg-[color-mix(in_srgb,var(--color-base-content)_6%,transparent)]"
					:class="listEntryClass(row.id, row.isHidden)"
					:data-item-id="row.id"
					@click="handleItemClick(row, $event)"
					@dblclick="openItem(row)"
					@contextmenu="(e) => openContextMenu(e, row.id)"
				)
					.LFM-list-col(class="flex items-center gap-1.5 overflow-hidden whitespace-nowrap text-ellipsis")
						.LFM-list-file-icon(
							class="w-5.5 h-5.5 flex items-center justify-center shrink-0 transition-all"
							:class="iconFilterClass(row.isHidden)"
						)
							FolderIcon(v-if="isFolder(row)" :size="listFolderSize" :color="'orange'")
							img.LFM-list-media-thumbnail(
								v-else-if="row.preview"
								:src="row.preview"
								loading="lazy"
								decoding="async"
								class="w-(--lfm-list-folder-size,20px) h-(--lfm-list-folder-size,20px) object-cover rounded-sm"
							)
							FileIcon(v-else :name="row.name" :path="row.id" :size="listFileSize")
						span.LFM-list-item-name(class="overflow-hidden text-ellipsis whitespace-nowrap") {{ row.name }}
					span.LFM-list-col(class="flex items-center gap-1.5 overflow-hidden whitespace-nowrap text-ellipsis") {{ formatDate(row.modifiedAt) }}
					span.LFM-list-col(class="flex items-center gap-1.5 overflow-hidden whitespace-nowrap text-ellipsis") {{ row.typeLabel }}
					span.LFM-list-col(class="flex items-center gap-1.5 overflow-hidden whitespace-nowrap text-ellipsis justify-end") {{ row.sizeLabel }}

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