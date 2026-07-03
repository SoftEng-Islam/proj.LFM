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
	itemName?: string | undefined;
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
	//- Context menu container — fixed positioned via :style, animated via menu-pop keyframe
	div(
		ref="menuRef"
		role="menu"
		class="fixed z-9999 min-w-65 bg-(--color-base-100) backdrop-blur-md border border-[color-mix(in_srgb,var(--color-base-content)_12%,transparent)] rounded-xl shadow-[0_12px_32px_rgba(0,0,0,0.4)] p-1.5 text-(--color-base-content) text-[13px] select-none animate-[menu-pop_150ms_ease-out]"
		:style="{ left: `${x}px`, top: `${y}px` }"
	)
		//- Quick-action toolbar (Cut / Copy / Paste / Rename / Delete / Properties)
		div(class="flex items-center justify-around p-1")
			button(
				v-for="cmd in commandActions"
				:key="cmd.title"
				class="flex items-center justify-center w-9 h-9 rounded-lg bg-transparent border-none cursor-pointer text-(--color-base-content) transition-all duration-150 hover:bg-[color-mix(in_srgb,var(--color-base-content)_8%,transparent)] hover:text-(--color-primary) disabled:opacity-30 disabled:cursor-default disabled:pointer-events-none"
				:title="cmd.title"
				:disabled="cmd.disabled"
				@click="cmd.action"
			)
				component(:is="cmd.icon" class="text-[18px]")

		//- Divider between toolbar and menu list
		div(class="h-px bg-[color-mix(in_srgb,var(--color-base-content)_10%,transparent)] my-1.5 mx-1 opacity-60")

		//- Menu item list
		template(v-for="(item, i) in menuItems" :key="i")
			//- Divider row
			div(
				v-if="'divider' in item && item.divider"
				class="h-px bg-[color-mix(in_srgb,var(--color-base-content)_10%,transparent)] my-1.5 mx-1 opacity-60"
			)
			//- Action row
			button(
				v-else-if="'label' in item"
				role="menuitem"
				class="flex items-center gap-3 w-full py-2 px-3 rounded-md bg-transparent border-none cursor-pointer text-(--color-base-content) text-left transition-all duration-150 hover:bg-[color-mix(in_srgb,var(--color-base-content)_8%,transparent)] disabled:opacity-40 disabled:cursor-default disabled:pointer-events-none"
				:disabled="item.disabled"
				@click="item.action && item.action()"
			)
				component(:is="item.icon" class="text-[18px] w-5 text-center shrink-0 opacity-80")
				span(class="flex-1") {{ item.label }}
				span(v-if="'hasArrow' in item && item.hasArrow" class="opacity-40 text-[16px]") ›
</template>

<style>
/* Only the keyframe definition remains — everything else is expressed as Tailwind classes above */
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
</style>
