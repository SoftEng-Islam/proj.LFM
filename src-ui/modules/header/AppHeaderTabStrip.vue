<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useFileManagerStore } from '@/stores/file-manager';
import { useConfigStore } from '@/stores/config';
import { storeToRefs } from 'pinia';
import IconAdd from '~icons/material-symbols/add';
import FolderIcon from '@/components/VueIcons/Folder/FolderIcon.vue';
import IconClose from '~icons/material-symbols/close';
import IconArrowBack from '~icons/material-symbols/arrow-back';
import IconArrowForward from '~icons/material-symbols/arrow-forward';

const store = useFileManagerStore();
const configStore = useConfigStore();
const router = useRouter();
const route = useRoute();
const { config } = storeToRefs(configStore);

const draggedTabId = ref<string | null>(null);

const activeTabId = computed(() => {
	const tabId = route.query.tab;
	if (typeof tabId === 'string' && tabId) return tabId;
	return store.activeTabId;
});

function resolveAppRoutePath(path: string) {
	if (path === '/drives') return '/@drives';
	if (path === '/@drives') return '/@drives';
	if (path === '/locations') return '/@locations';
	if (path === '/@locations') return '/@locations';
	if (path === '/settings') return '/@settings';
	if (path === '/@settings') return '/@settings';
	return path;
}

// Default path from config
const defaultTabPath = computed(() => config.value.behavior.default_path || '@drives');

function handleCloseTab(tabId: string) {
	const idx = store.windowTabs.findIndex((t: any) => t.id === tabId);
	if (idx === -1) return;

	const activeId = typeof route.query.tab === 'string' ? route.query.tab : '';
	const isActive = activeId ? activeId === tabId : route.path === store.windowTabs[idx]?.path;
	store.closeTab(tabId);

	if (isActive) {
		const next = store.windowTabs[Math.max(0, idx - 1)];
		if (next) router.push({ path: resolveAppRoutePath(next.path), query: { tab: next.id } });
	}
}

function handleNewTab() {
	// Always open a new tab that points to the Storage Overview alias '@drives'
	const id = store.addTab('@drives');
	const tab = store.windowTabs.find((t: any) => t.id === id);
	if (tab) {
		const navPath = tab.path && tab.path.startsWith('@') ? (tab.path === '@drives' ? '/@drives' : tab.path) : resolveAppRoutePath(tab.path);
		router.push({ path: navPath, query: { tab: id } });
	}
}

function handleDragStart(tabId: string, event: DragEvent) {
	draggedTabId.value = tabId;
	if (event.dataTransfer) {
		event.dataTransfer.effectAllowed = 'move';
		event.dataTransfer.setData('text/plain', tabId);
	}
}

function handleDragOver(event: DragEvent) {
	event.preventDefault();
	if (event.dataTransfer) {
		event.dataTransfer.dropEffect = 'move';
	}
}

function handleDrop(targetTabId: string, event: DragEvent) {
	event.preventDefault();
	if (!draggedTabId.value || draggedTabId.value === targetTabId) return;

	const fromIndex = store.windowTabs.findIndex((t: any) => t.id === draggedTabId.value);
	const toIndex = store.windowTabs.findIndex((t: any) => t.id === targetTabId);

	if (fromIndex !== -1 && toIndex !== -1) {
		store.reorderTabs(fromIndex, toIndex);
	}

	draggedTabId.value = null;
}

function handleDragEnd() {
	draggedTabId.value = null;
}
</script>

<template lang="pug">
div(class="flex items-center h-full bg-base-300 shrink-0 select-none" data-tauri-drag-region)
	div(class="flex items-center h-full gap-2" role="tablist")
		transition-group(name="tab-list")
			RouterLink(
				v-for="tab in store.windowTabs"
				:key="tab.id"
				:to="{ path: resolveAppRoutePath(tab.path), query: { tab: tab.id } }"
				@click="store.setActiveTab(tab.id)"
				:class="['group relative flex items-center min-w-35 max-w-55 h-9.5 px-3 cursor-pointer text-xs no-underline rounded-lg transition-all duration-150', activeTabId === tab.id ? 'bg-(--color-primary)/20 z-10 text-primary font-semibold' : 'bg-base-content/15 hover:bg-base-content/30', draggedTabId === tab.id ? 'opacity-50' : '']"
				role="tab"
				:aria-selected="activeTabId === tab.id"
				draggable="true"
				@dragstart="handleDragStart(tab.id, $event)"
				@dragover="handleDragOver($event)"
				@drop="handleDrop(tab.id, $event)"
				@dragend="handleDragEnd"
			)
				div(class="flex items-center justify-center gap-x-2 w-full overflow-hidden")
					FolderIcon(:color="'var(--color-primary)'" :size="18" class="pb-1")
					span(class="flex-1 overflow-hidden text-ellipsis whitespace-nowrap font-normal") {{ tab.label }}
					button(
						v-if="store.windowTabs.length > 1"
						class="flex items-center justify-center w-5 h-5 rounded-md bg-base-100 border-none cursor-pointer text-base-content text-[12px] hover:text-error"
						title="Close tab"
						@click.prevent="handleCloseTab(tab.id)"
					)
						IconClose

		button(class="flex items-center justify-center w-7 h-7 ml-1.5 rounded-md border-none cursor-pointer text-lg bg-base-content/10 hover:bg-(--color-primary)/50" title="New tab" @click="handleNewTab")
			IconAdd

	div(class="flex-1 [-webkit-app-region:drag]" data-tauri-drag-region)
</template>

<style scoped lang="scss">
@reference "tailwindcss";

.tab-list-move,
.tab-list-enter-active,
.tab-list-leave-active {
	transition: all 0.2s ease;
}

.tab-list-enter-from,
.tab-list-leave-to {
	opacity: 0;
	transform: translateX(-20px);
}

.tab-list-leave-active {
	position: absolute;
}
</style>
