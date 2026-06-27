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

/** Whether the user is currently drag-selecting */
const isDragging = ref(false);
/** Starting coordinates of the drag selection box */
const dragStart = ref<{ x: number; y: number } | null>(null);
/** Ending coordinates of the drag selection box */
const dragEnd = ref<{ x: number; y: number } | null>(null);
/** Reference to the workspace container element */
const workspaceRef = ref<HTMLElement>();
/** The item ID that acts as the anchor for Shift+Click range selections */
const selectionAnchorId = ref<string | null>(null);
/** The item ID that is currently focused (navigated to via arrow keys) */
const focusedItemId = ref<string | null>(null);
/** Array of cleanup functions for global event bus listeners */
const busCleanup: Array<() => void> = [];

/**
 * Smoothly scrolls the item with the given ID into view.
 * Uses requestAnimationFrame to ensure the DOM is up to date before scrolling.
 */
function scrollItemIntoView(id: string) {
	requestAnimationFrame(() => {
		const el = document.querySelector(`[data-item-id="${CSS.escape(id)}"]`);
		if (el) {
			el.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
			(el as HTMLElement).focus({ preventScroll: true });
		}
	});
}

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

/**
 * Starts drag selection when clicking on the workspace background.
 */
function handleMouseDown(e: MouseEvent) {
	if (e.target === workspaceRef.value || (e.target as HTMLElement).classList.contains('LFM-workspace-content')) {
		e.preventDefault();
		isDragging.value = true;
		dragStart.value = { x: e.clientX, y: e.clientY };
		dragEnd.value = { x: e.clientX, y: e.clientY };
	}
}

/**
 * Updates the drag selection box and selects items that fall within it.
 */
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

/**
 * Finalizes drag selection and applies the selection to the store.
 */
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
		focusedItemId.value = null;
	}
	wasDragging.value = false;
}

// ── Context menu helpers ────────────────────────────────────────────────────

function openContextMenu(e: MouseEvent, itemId: string) {
	e.preventDefault();
	if (!store.selectedItemIds.has(itemId)) {
		setPrimarySelection(itemId);
	}

	let x = e.clientX;
	let y = e.clientY;

	// Handle keyboard context menu invocation. A true mouse right-click has e.button === 2.
	// If triggered by keyboard, button is typically 0.
	if (e.button !== 2) {
		const itemEl = document.querySelector(`[data-item-id="${CSS.escape(itemId)}"]`);
		if (itemEl) {
			const rect = itemEl.getBoundingClientRect();
			x = rect.left + rect.width / 2;
			y = rect.top + rect.height / 2;
		} else if (e.target instanceof Element) {
			const rect = e.target.getBoundingClientRect();
			x = rect.left + rect.width / 2;
			y = rect.top + rect.height / 2;
		}
	}

	contextMenu.value = { visible: true, x, y, itemId };
}

function closeContextMenu() {
	contextMenu.value.visible = false;
}

function openEmptyContextMenu(e: MouseEvent) {
	e.preventDefault();

	// If a keyboard triggers the context menu on the empty space but we have a focused item,
	// redirect to the item's context menu.
	if (focusedItemId.value && e.button !== 2) {
		openContextMenu(e, focusedItemId.value);
		return;
	}

	store.clearSelection();
	selectionAnchorId.value = null;
	focusedItemId.value = null;
	contextMenu.value = {
		visible: true,
		x: e.clientX || window.innerWidth / 2,
		y: e.clientY || window.innerHeight / 2,
		itemId: ''
	};
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

/**
 * Dynamically calculates how many items fit in a single grid row.
 * It checks the `offsetTop` of rendered items to see how many share the first row.
 * This is robust against container resizing, gap changes, and item width changes.
 */
function currentItemsPerRow(): number {
	if (store.viewMode !== 'grid') return 1;
	const gridItems = document.querySelectorAll('.LFM-grid-item');
	if (gridItems.length === 0) return 1;

	const firstTop = (gridItems[0] as HTMLElement).offsetTop;
	let count = 0;
	for (let i = 0; i < gridItems.length; i++) {
		if ((gridItems[i] as HTMLElement).offsetTop === firstTop) {
			count++;
		} else {
			break;
		}
	}
	return Math.max(1, count);
}

/**
 * Returns the currently active selected ID, if any.
 */
function activeSelectedId(): string | null {
	return store.selectedItemIds.size > 0 ? selectedId.value : null;
}

/**
 * Sets a single item as the primary selection and anchors it for future range selections.
 */
function setPrimarySelection(itemId: string) {
	store.selectItem(itemId);
	selectionAnchorId.value = itemId;
	focusedItemId.value = itemId;
}

/**
 * Selects a range of items from the current anchor to the target item.
 * Used for Shift+Click and Shift+Arrow navigation.
 */
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
	focusedItemId.value = targetId;
}

/**
 * Toggles the selection state of the currently focused item.
 */
function toggleFocusedSelection() {
	const focusedId = focusedItemId.value || activeSelectedId() || selectionAnchorId.value || store.currentEntries[0]?.id;
	if (!focusedId) return;
	store.toggleItemSelection(focusedId);
	selectionAnchorId.value = focusedId;
	focusedItemId.value = focusedId;
}

/**
 * Moves focus (and potentially selection) in the specified direction.
 * @param direction Direction to navigate ('up', 'down', 'left', 'right')
 * @param extend If true, extends the selection to the new target (Shift key behavior)
 * @param keepSelection If true, only moves focus, leaving selection as is (Ctrl/Meta key behavior)
 */
function moveSelection(direction: 'up' | 'down' | 'left' | 'right', extend: boolean, keepSelection: boolean) {
	const items = store.currentEntries;
	if (items.length === 0) return;

	if (!focusedItemId.value && !activeSelectedId() && !selectionAnchorId.value) {
		const firstItem = items[0];
		if (firstItem) {
			setPrimarySelection(firstItem.id);
			scrollItemIntoView(firstItem.id);
		}
		return;
	}

	const currentId = focusedItemId.value || activeSelectedId() || selectionAnchorId.value || items[0]?.id;
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
		scrollItemIntoView(target.id);
		return;
	}

	if (keepSelection) {
		focusedItemId.value = target.id;
		scrollItemIntoView(target.id);
		return;
	}

	setPrimarySelection(target.id);
	scrollItemIntoView(target.id);
}

/**
 * Generates dynamic Tailwind classes for grid view items.
 * Uses `!important` to ensure dynamic backgrounds override any static base classes.
 */
function fileEntryClass(id: string, isHidden?: boolean) {
	const isSelected = store.selectedItemIds.has(id);
	const isFocused = focusedItemId.value === id;
	return {
		'!bg-[color-mix(in_srgb,var(--color-primary)_24%,transparent)] !border-[var(--color-primary)]': isSelected && isFocused,
		'!bg-[color-mix(in_srgb,var(--color-primary)_14%,transparent)] !border-[var(--color-primary)]': isSelected && !isFocused,
		'!bg-[color-mix(in_srgb,var(--color-primary)_8%,transparent)] !border-[color-mix(in_srgb,var(--color-base-content)_20%,transparent)]': isFocused && !isSelected,
		'opacity-[0.58]': !!isHidden && store.hiddenFilesVisualStyle !== 'normal',
	};
}

/**
 * Generates dynamic Tailwind classes for list view rows.
 * Uses `!important` to ensure dynamic backgrounds override any static base classes.
 */
function listEntryClass(id: string, isHidden?: boolean) {
	const isSelected = store.selectedItemIds.has(id);
	const isFocused = focusedItemId.value === id;
	return {
		'!bg-[color-mix(in_srgb,var(--color-primary)_24%,transparent)]': isSelected && isFocused,
		'!bg-[color-mix(in_srgb,var(--color-primary)_14%,transparent)]': isSelected && !isFocused,
		'!bg-[color-mix(in_srgb,var(--color-primary)_8%,transparent)]': isFocused && !isSelected,
		'opacity-[0.58]': !!isHidden && store.hiddenFilesVisualStyle !== 'normal',
	};
}

function iconFilterClass(isHidden?: boolean) {
	if (!isHidden || store.hiddenFilesVisualStyle === 'normal') return '';
	if (store.hiddenFilesVisualStyle === 'blurred') return 'grayscale-[0.4] saturate-[0.75] blur-[0.7px]';
	return 'grayscale-[0.4] saturate-[0.75]';
}

function handleItemClick(entry: FileEntry, e: MouseEvent) {
	focusedItemId.value = entry.id;

	// Ensure the clicked element receives actual DOM focus so keyboard events target it
	const currentTarget = e.currentTarget as HTMLElement | null;
	if (currentTarget) currentTarget.focus({ preventScroll: true });

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
		busOn('shortcut:navigate', (payload: { direction: 'up' | 'down' | 'left' | 'right'; extend: boolean; keepSelection?: boolean }) => { moveSelection(payload.direction, payload.extend, payload.keepSelection || false); })
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
			focusedItemId.value = null;
		})
	);

	// Open the correct full context menu for the currently focused or selected item.
	// This is triggered by the physical ContextMenu/Apps key on the keyboard.
	busCleanup.push(
		busOn('shortcut:context-menu', () => {
			const targetId = focusedItemId.value || activeSelectedId();
			if (targetId) {
				// Locate the item in the DOM and position the menu at its center
				const el = document.querySelector(`[data-item-id="${CSS.escape(targetId)}"]`);
				if (el) {
					const rect = el.getBoundingClientRect();
					contextMenu.value = {
						visible: true,
						x: rect.left + rect.width / 2,
						y: rect.top + rect.height / 2,
						itemId: targetId,
					};
				}
			} else {
				// No item focused — open the background context menu in the center
				contextMenu.value = {
					visible: true,
					x: window.innerWidth / 2,
					y: window.innerHeight / 2,
					itemId: '',
				};
			}
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
			.LFM-nav-error-title(class="text-[18px] font-semibold text-(--color-base-content)")
				| {{ store.navError.kind === 'permission' ? 'Access Denied' : store.navError.kind === 'not-found' ? 'Not Found' : 'Cannot Open Directory' }}
			.LFM-nav-error-desc(class="text-[13px] text-(--color-base-content) opacity-60 max-w-90 leading-relaxed")
				| {{ store.navError.kind === 'permission' ? "You don't have permission to view this directory." : store.navError.kind === 'not-found' ? 'This directory no longer exists.' : 'An error occurred while trying to open this directory.' }}
			.LFM-nav-error-path(class="text-[11px] font-mono bg-[color-mix(in_srgb,var(--color-base-content)_6%,transparent)] text-(--color-base-content) opacity-70 py-1 px-3 rounded max-w-full overflow-hidden text-ellipsis whitespace-nowrap") {{ store.navError.path }}
			button.LFM-nav-error-btn(
				@click="store.navError = null"
				class="mt-1 py-2 px-5 rounded-md bg-(--color-base-100) border border-[color-mix(in_srgb,var(--color-base-content)_10%,transparent)] text-(--color-base-content) text-[13px] cursor-pointer transition-[background,border-color] duration-150 hover:bg-[color-mix(in_srgb,var(--color-base-content)_6%,transparent)] hover:border-(--color-primary)"
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
					v-for="entry in store.sortedAndFilteredEntries"
					:key="entry.id"
					type="button"
					class="flex flex-col items-center w-(--lfm-grid-item-width,100px) pt-2 pb-1.5 px-1 rounded border-2 border-transparent bg-transparent cursor-pointer text-(--color-base-content) transition-[background,border-color] duration-100 text-center outline-none hover:bg-[color-mix(in_srgb,var(--color-primary)_8%,transparent)]"
					:class="fileEntryClass(entry.id, entry.isHidden)"
					:aria-selected="store.selectedItemIds.has(entry.id)"
					:title="entry.name"
					:data-item-id="entry.id"
					@click="handleItemClick(entry, $event)"
					@dblclick="openItem(entry)"
					@contextmenu="(e) => openContextMenu(e, entry.id)"
				)
					.LFM-grid-item-icon(
						class="flex items-center justify-center h-(--lfm-grid-icon-container-size,64px) w-(--lfm-grid-icon-container-size,64px) transition-all"
						:class="iconFilterClass(entry.isHidden)"
					)
						FolderIcon(v-if="isFolder(entry)" :size="gridFolderSize" :color="'orange'")
						img.LFM-media-thumbnail(
							v-else-if="entry.preview"
							:src="entry.preview"
							loading="lazy"
							decoding="async"
							class="max-w-(--lfm-grid-icon-container-size,64px) max-h-(--lfm-grid-icon-container-size,64px) object-cover rounded shadow-[0_1px_3px_rgba(0,0,0,0.2)]"
						)
						FileIcon(v-else :name="entry.name" :path="entry.id" :size="gridFileSize")
					span.LFM-grid-item-name(class="mt-1.5 text-[11px] leading-[1.3] max-w-[calc(var(--lfm-grid-item-width,100px)-8px)] overflow-hidden text-ellipsis line-clamp-2 wrap-break-word") {{ entry.name }}

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
					v-for="row in store.sortedAndFilteredEntries"
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