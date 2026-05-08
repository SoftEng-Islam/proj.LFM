<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue';

defineProps<{
	x: number;
	y: number;
	itemName?: string;
}>();

const emit = defineEmits<{
	close: [];
	open: [];
	openNewTab: [];
	copyPath: [];
	delete: [];
	rename: [];
}>();

const menuRef = ref<HTMLElement>();

function close() {
	emit('close');
}

function onKeydown(e: KeyboardEvent) {
	if (e.key === 'Escape') close();
}

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

const commandActions = [
	{ icon: '✂', title: 'Cut', action: () => close() },
	{ icon: '⧉', title: 'Copy', action: () => close() },
	{ icon: '📋', title: 'Paste', action: () => close() },
	{ icon: '✏', title: 'Rename', action: () => { emit('rename'); close(); } },
	{ icon: '🗑', title: 'Delete', action: () => { emit('delete'); close(); } },
	{ icon: '🔧', title: 'Properties', action: () => close() },
];

const menuItems = [
	{ icon: '📂', label: 'Open', action: () => { emit('open'); close(); } },
	{ icon: '🗂', label: 'Open in New Tab', action: () => { emit('openNewTab'); close(); } },
	{ icon: '🪟', label: 'Open in New Window', action: () => close() },
	{ icon: '▣', label: 'Open in New Pane', action: () => close() },
	{ divider: true },
	{ icon: '🔗', label: 'Copy Item Path', action: () => { emit('copyPath'); close(); } },
	{ icon: '📁', label: 'Create Folder from Selection', action: () => close() },
	{ icon: '↩', label: 'Create Shortcut', action: () => close() },
	{ icon: '📌', label: 'Pin to Sidebar', action: () => close() },
	{ divider: true },
	{ icon: '📦', label: 'Compress', hasArrow: true, action: () => close() },
	{ icon: '📤', label: 'Send To', hasArrow: true, action: () => close() },
	{ divider: true },
	{ icon: '$', label: 'Open in Terminal', action: () => close() },
	{ icon: '🏷', label: 'Edit Tags', hasArrow: true, action: () => close() },
	{ divider: true },
	{ icon: '…', label: 'Show more options', hasArrow: true, action: () => close() },
];
</script>

<template>
	<Teleport to="body">
		<div
			ref="menuRef"
			class="LFM-context-menu"
			:style="{ left: `${x}px`, top: `${y}px` }"
			role="menu"
		>
			<!-- Mini command toolbar at top -->
			<div class="LFM-context-toolbar">
				<button
					v-for="cmd in commandActions"
					:key="cmd.title"
					class="LFM-context-cmd"
					:title="cmd.title"
					@click="cmd.action"
				>
					<span class="LFM-context-cmd-icon">{{ cmd.icon }}</span>
				</button>
			</div>

			<div class="LFM-context-divider" />

			<!-- Menu items -->
			<template v-for="(item, i) in menuItems" :key="i">
				<div v-if="'divider' in item && item.divider" class="LFM-context-divider" />
				<button
					v-else-if="'label' in item"
					class="LFM-context-item"
					role="menuitem"
					@click="item.action && item.action()"
				>
					<span class="LFM-context-item-icon">{{ item.icon }}</span>
					<span class="LFM-context-item-label">{{ item.label }}</span>
					<span v-if="'hasArrow' in item && item.hasArrow" class="LFM-context-item-arrow">›</span>
				</button>
			</template>
		</div>
	</Teleport>
</template>

<style scoped>
.LFM-context-menu {
	position: fixed;
	z-index: 9999;
	min-width: 240px;
	background: var(--win-context-bg);
	border: 1px solid var(--win-context-border);
	border-radius: 8px;
	box-shadow: 0 8px 24px rgba(0, 0, 0, 0.36);
	padding: 4px;
	color: var(--win-context-text);
	font-size: 12px;
	user-select: none;
}

.LFM-context-toolbar {
	display: flex;
	align-items: center;
	gap: 2px;
	padding: 4px 6px;
}

.LFM-context-cmd {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 32px;
	height: 32px;
	border-radius: 4px;
	background: transparent;
	border: none;
	cursor: pointer;
	color: var(--win-context-text);
	font-size: 14px;
	transition: background 100ms;
}
.LFM-context-cmd:hover {
	background: var(--win-context-hover);
}

.LFM-context-cmd-icon {
	font-size: 13px;
}

.LFM-context-divider {
	height: 1px;
	background: var(--win-context-divider);
	margin: 3px 4px;
}

.LFM-context-item {
	display: flex;
	align-items: center;
	gap: 10px;
	width: 100%;
	padding: 6px 10px;
	border-radius: 4px;
	background: transparent;
	border: none;
	cursor: pointer;
	color: var(--win-context-text);
	text-align: left;
	transition: background 100ms;
}
.LFM-context-item:hover {
	background: var(--win-context-hover);
}

.LFM-context-item-icon {
	font-size: 14px;
	width: 18px;
	text-align: center;
	flex-shrink: 0;
	opacity: 0.85;
}

.LFM-context-item-label {
	flex: 1;
}

.LFM-context-item-arrow {
	opacity: 0.6;
	font-size: 14px;
}
</style>
