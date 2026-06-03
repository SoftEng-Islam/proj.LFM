<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useFileManagerStore } from '@/stores/file-manager';


// Icons
import IconOpen from '~icons/material-symbols/open-in-new';
import IconTab from '~icons/material-symbols/tab';
import IconWindow from '~icons/material-symbols/window';
import IconPane from '~icons/material-symbols/splitscreen';
import IconLink from '~icons/material-symbols/link';
import IconFolder from '~icons/material-symbols/folder-zip';
import IconShortcut from '~icons/material-symbols/open-in-new';
import IconPushPin from '~icons/material-symbols/push-pin';
import IconArchive from '~icons/material-symbols/archive';
import IconSend from '~icons/material-symbols/send';
import IconTerminal from '~icons/material-symbols/terminal';
import IconLabel from '~icons/material-symbols/label';
import IconMore from '~icons/material-symbols/more-horiz';
import IconAdd from '~icons/material-symbols/add';

import IconCut from '~icons/material-symbols/content-cut';
import IconCopy from '~icons/material-symbols/content-copy';
import IconPaste from '~icons/material-symbols/content-paste';
import IconEdit from '~icons/material-symbols/edit';
import IconDelete from '~icons/material-symbols/delete';
import IconSettings from '~icons/material-symbols/settings';

const props = defineProps<{
	x: number;
	y: number;
	itemName?: string;
	filePath?: string;
}>();

const emit = defineEmits<{
	close: [];
	rename: [];
	properties: [];
}>();

const store = useFileManagerStore();
const router = useRouter();
const toast = { success: console.log, error: console.error, info: console.log, warning: console.warn };
const menuRef = ref<HTMLElement>();

function close() { emit('close'); }
function onKeydown(e: KeyboardEvent) { if (e.key === 'Escape') close(); }
function onClickOutside(e: MouseEvent) {
	if (menuRef.value && !menuRef.value.contains(e.target as Node)) close();
}

onMounted(() => {
	document.addEventListener('mousedown', onClickOutside, true);
	document.addEventListener('keydown', onKeydown);
});
onBeforeUnmount(() => {
	document.removeEventListener('mousedown', onClickOutside, true);
	document.removeEventListener('keydown', onKeydown);
});

// Actions
async function handleOpen() {
	if (props.filePath) {
		const isFolder = !props.filePath.includes('.') || props.filePath.endsWith('/');
		if (isFolder) {
			store.openSection(props.filePath);
		} else {
			await store.openItem(props.filePath);
		}
	}
	close();
}

function handleOpenNewTab() {
	if (!props.filePath) {
		close();
		return;
	}

	const addedTabId = store.addTab(props.filePath);
	const addedTab = store.windowTabs.find((t) => t.id === addedTabId);

	if (addedTab) {
		const isFolder = !props.filePath.includes('.') || props.filePath.endsWith('/');
		if (isFolder) {
			router.push({ path: addedTab.path, query: { tab: addedTab.id } });
		}
	}

	close();
}

async function handleCopyPath() {
	if (props.filePath) {
		try {
			await navigator.clipboard.writeText(props.filePath);
			toast.success('Path copied to clipboard');
		} catch (e) {
			toast.error('Failed to copy path');
		}
	}
	close();
}

async function handleDelete() {
	if (props.filePath) {
		try {
			const success = await store.deleteSelection();
			if (success) {
				toast.success('Deleted');
			}
		} catch (e) {
			toast.error('Delete failed');
		}
	}
	close();
}

async function handleOpenTerminal() {
	const path = props.filePath || store.currentPath;
	store.openInTerminal(path);
	close();
}

function handleCut() {
	if (props.filePath) {
		store.setClipboard([props.filePath], 'cut');
		toast.info('Item cut to clipboard');
	}
	close();
}

function handleCopy() {
	if (props.filePath) {
		store.setClipboard([props.filePath], 'copy');
		toast.info('Item copied to clipboard');
	}
	close();
}

async function handlePaste() {
	await store.paste();
	toast.success('Pasted');
	close();
}

const commandActions = computed(() => [
	{ icon: IconCut, title: 'Cut', action: handleCut, disabled: !props.filePath },
	{ icon: IconCopy, title: 'Copy', action: handleCopy, disabled: !props.filePath },
	{ icon: IconPaste, title: 'Paste', action: handlePaste, disabled: !store.clipboard.paths.length },
	{ icon: IconEdit, title: 'Rename', action: () => { emit('rename'); close(); }, disabled: !props.filePath },
	{ icon: IconDelete, title: 'Delete', action: handleDelete, disabled: !props.filePath },
	{ icon: IconSettings, title: 'Properties', action: () => { emit('properties'); close(); }, disabled: !props.filePath },
]);

const menuItems = computed(() => {
	if (!props.filePath) {
		return [
			{ icon: IconAdd, label: 'New Directory', action: () => { store.createDirectory(); close(); } },
			{ icon: IconPaste, label: 'Paste', action: handlePaste, disabled: !store.clipboard.paths.length },
			{ divider: true },
			{ icon: IconTerminal, label: 'Open in Terminal', action: handleOpenTerminal },
			{ icon: IconSettings, label: 'Properties', action: () => { emit('properties'); close(); } },
		];
	}

	return [
		{ icon: IconOpen, label: 'Open', action: handleOpen },
		{ icon: IconTab, label: 'Open in New Tab', action: handleOpenNewTab },
		{ icon: IconWindow, label: 'Open in New Window', action: () => close() },
		{ icon: IconPane, label: 'Open in New Pane', action: () => close() },
		{ divider: true },
		{ icon: IconPaste, label: 'Paste', action: handlePaste, disabled: !store.clipboard.paths.length },
		{ divider: true },
		{ icon: IconLink, label: 'Copy Item Path', action: handleCopyPath },
		{ icon: IconFolder, label: 'Create Directory from Selection', action: () => close() },
		{ icon: IconShortcut, label: 'Create Shortcut', action: () => close() },
		{ icon: IconPushPin, label: 'Pin to Sidebar', action: () => { store.togglePinnedForSelection(); close(); } },
		{ divider: true },
		{ icon: IconArchive, label: 'Compress', hasArrow: true, action: () => close() },
		{ icon: IconSend, label: 'Send To', hasArrow: true, action: () => close() },
		{ divider: true },
		{ icon: IconTerminal, label: 'Open in Terminal', action: handleOpenTerminal },
		{ icon: IconLabel, label: 'Edit Tags', hasArrow: true, action: () => close() },
		{ divider: true },
		{ icon: IconMore, label: 'Show more options', hasArrow: true, action: () => close() },
	];
});
</script>

<template lang="pug">
Teleport(to="body")
	div(ref="menuRef" class="LFM-context-menu" :style="{ left: `${x}px`, top: `${y}px` }" role="menu")
		div(class="LFM-context-toolbar")
			button(v-for="cmd in commandActions" :key="cmd.title" class="LFM-context-cmd" :class="{ 'LFM-context-cmd--disabled': cmd.disabled }" :title="cmd.title" :disabled="cmd.disabled" @click="cmd.action")
				component(:is="cmd.icon" class="LFM-context-cmd-icon")

		div(class="LFM-context-divider")

		template(v-for="(item, i) in menuItems" :key="i")
			div(v-if="'divider' in item && item.divider" class="LFM-context-divider")
			button(v-else-if="'label' in item" class="LFM-context-item" :class="{ 'LFM-context-item--disabled': item.disabled }" role="menuitem" :disabled="item.disabled" @click="item.action && item.action()")
				component(:is="item.icon" class="LFM-context-item-icon")
				span(class="LFM-context-item-label") {{ item.label }}
				span(v-if="'hasArrow' in item && item.hasArrow" class="LFM-context-item-arrow") ›
</template>

<style scoped>
@reference "tailwindcss";

.LFM-context-menu {
	position: fixed;
	z-index: 9999;
	min-width: 260px;
	background: var(--color-base-100);
	backdrop-filter: blur(12px);
	border: 1px solid color-mix(in srgb, var(--color-base-content) 12%, transparent);
	border-radius: 12px;
	box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4);
	padding: 6px;
	color: var(--color-base-content);
	font-size: 13px;
	user-select: none;
	animation: menu-pop 150ms ease-out;
}

@keyframes menu-pop {
	from {
		opacity: 0;
		transform: scale(0.95) translateY(-10px);
	}

	to {
		opacity: 1;
		transform: scale(1) translateY(0);
	}
}

.LFM-context-toolbar {
	display: flex;
	align-items: center;
	justify-content: space-around;
	padding: 4px;
}

.LFM-context-cmd {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 36px;
	height: 36px;
	border-radius: 8px;
	background: transparent;
	border: none;
	cursor: pointer;
	color: var(--color-base-content);
	transition: all 150ms ease;
}

.LFM-context-cmd:hover:not(:disabled) {
	background: color-mix(in srgb, var(--color-base-content) 8%, transparent);
	color: var(--color-primary);
}

.LFM-context-cmd--disabled {
	opacity: 0.3;
	cursor: default;
}

.LFM-context-cmd-icon {
	font-size: 18px;
}

.LFM-context-divider {
	height: 1px;
	background: color-mix(in srgb, var(--color-base-content) 10%, transparent);
	margin: 6px 4px;
	opacity: 0.6;
}

.LFM-context-item {
	display: flex;
	align-items: center;
	gap: 12px;
	width: 100%;
	padding: 8px 12px;
	border-radius: 6px;
	background: transparent;
	border: none;
	cursor: pointer;
	color: var(--color-base-content);
	text-align: left;
	transition: all 150ms ease;
}

.LFM-context-item:hover:not(:disabled) {
	background: color-mix(in srgb, var(--color-base-content) 8%, transparent);
}

.LFM-context-item--disabled {
	opacity: 0.4;
	cursor: default;
}

.LFM-context-item-icon {
	font-size: 18px;
	width: 20px;
	text-align: center;
	flex-shrink: 0;
	opacity: 0.8;
}

.LFM-context-item-label {
	flex: 1;
}

.LFM-context-item-arrow {
	opacity: 0.4;
	font-size: 16px;
}
</style>
