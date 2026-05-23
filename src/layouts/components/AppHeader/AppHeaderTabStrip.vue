<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useFileManagerStore } from '@/stores/file-manager';
import { useConfigStore } from '@/stores/config';
import { storeToRefs } from 'pinia';
import IconAdd from '~icons/material-symbols/add';
import IconFolder from '~icons/material-symbols/folder';
import IconClose from '~icons/material-symbols/close';
import IconArrowBack from '~icons/material-symbols/arrow-back';
import IconArrowForward from '~icons/material-symbols/arrow-forward';

const store = useFileManagerStore();
const configStore = useConfigStore();
const router = useRouter();
const route = useRoute();
const { config } = storeToRefs(configStore);

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
</script>

<template lang="pug">
div(class="flex items-stretch h-[46px] bg-base-300 shrink-0 select-none" data-tauri-drag-region)
	div(class="flex items-stretch h-full pl-2" role="tablist")
		transition-group(name="tab-list")
			RouterLink(
				v-for="tab in store.windowTabs"
				:key="tab.id"
				:to="{ path: resolveAppRoutePath(tab.path), query: { tab: tab.id } }"
				@click="store.setActiveTab(tab.id)"
				:class="['group flex items-center min-w-[140px] max-w-[220px] h-[38px] mt-2 px-3 cursor-pointer text-base-content no-underline rounded-t-lg transition-all duration-150 relative text-xs border-x border-t border-transparent border-b-0', activeTabId === tab.id ? 'bg-base-100 z-10 text-primary font-semibold border-x-base-content/10 border-t-base-content/10 [box-shadow:0_-4px_12px_rgba(0,0,0,0.04)] before:content-[\\'\\'] before:absolute before:top-0 before:left-0 before:right-0 before:h-[3px] before:bg-primary before:rounded-t-lg before:[box-shadow:0_2px_8px_rgba(var(--color-primary),0.4)]' : 'hover:bg-base-content/5']"
				role="tab"
				:aria-selected="activeTabId === tab.id"
			)
				div(class="flex items-center gap-2 w-full")
					IconFolder(class="text-[16px] shrink-0" :class="tab.accent ? `text-${tab.accent}-500` : 'text-amber-500'")
					span(class="flex-1 overflow-hidden overflow-ellipsis whitespace-nowrap font-medium") {{ tab.label }}
					button(
						v-if="store.windowTabs.length > 1"
						class="flex items-center justify-center w-[18px] h-[18px] rounded bg-transparent border-none cursor-pointer text-base-content text-[12px] opacity-0 group-hover:opacity-60 transition-all duration-150 hover:bg-base-content/15 hover:!opacity-100 hover:text-error"
						title="Close tab"
						@click.prevent="handleCloseTab(tab.id)"
					)
						IconClose

		button(class="flex items-center justify-center w-7 h-7 mt-3 mx-1.5 rounded-md bg-transparent border-none cursor-pointer text-base-content text-[18px] transition-all duration-150 hover:bg-base-content/10" title="New tab" @click="handleNewTab")
			IconAdd

	div(class="flex-1 [-webkit-app-region:drag]" data-tauri-drag-region)
</template>
