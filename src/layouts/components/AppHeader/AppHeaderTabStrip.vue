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
.LFM-tab-row(data-tauri-drag-region)
	.LFM-tab-strip(role="tablist")
		transition-group(name="tab-list")
			RouterLink.LFM-tab(
				v-for="tab in store.windowTabs"
				:key="tab.id"
				:to="{ path: resolveAppRoutePath(tab.path), query: { tab: tab.id } }"
				@click="store.setActiveTab(tab.id)"
				:class="{ 'LFM-tab--active': activeTabId === tab.id }"
				role="tab"
				:aria-selected="activeTabId === tab.id"
			)
				.LFM-tab-content
					IconFolder.LFM-tab-icon(:class="tab.accent ? `text-${tab.accent}-500` : 'text-amber-500'")
					span.LFM-tab-label {{ tab.label }}
					button.LFM-tab-close(
						v-if="store.windowTabs.length > 1"
						title="Close tab"
						@click.prevent="handleCloseTab(tab.id)"
					)
						IconClose

		button.LFM-new-tab(title="New tab" @click="handleNewTab")
			IconAdd

	.LFM-tab-drag(data-tauri-drag-region)
</template>

<style lang="sass" scoped>
@reference "tailwindcss"

.LFM-tab-row
	display: flex
	align-items: stretch
	height: 36px
	background: var(--LFM-title-bar)
	border-bottom: 1px solid var(--LFM-border)
	flex-shrink: 0
	user-select: none

.LFM-tab-strip
	display: flex
	align-items: stretch
	height: 100%
	padding-left: 8px

.LFM-tab
	display: flex
	align-items: center
	min-width: 140px
	max-width: 220px
	height: 32px
	margin-top: 4px
	padding: 0 8px
	cursor: pointer
	color: var(--LFM-text)
	text-decoration: none
	border-radius: 8px 8px 0 0
	transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1)
	position: relative
	font-size: 12px

	&:hover
		background: var(--LFM-hover)

	&--active
		background: var(--LFM-panel)
		z-index: 2
		color: hsl(var(--p))

		&::after
			content: ''
			position: absolute
			bottom: -1px
			left: 0
			right: 0
			height: 3px
			background: hsl(var(--p))
			box-shadow: 0 -2px 12px hsl(var(--p) / 0.5)

.LFM-tab-content
	display: flex
	align-items: center
	gap: 8px
	width: 100%

.LFM-tab-icon
	font-size: 16px
	flex-shrink: 0

.LFM-tab-label
	flex: 1
	overflow: hidden
	text-overflow: ellipsis
	white-space: nowrap
	font-weight: 500

.LFM-tab-close
	display: flex
	align-items: center
	justify-content: center
	width: 20px
	height: 20px
	border-radius: 4px
	background: transparent
	border: none
	cursor: pointer
	color: var(--LFM-text)
	font-size: 14px
	opacity: 0
	transition: all 150ms ease

	&:hover
		background: rgba(255, 255, 255, 0.1)
		color: #f87171

.LFM-tab:hover .LFM-tab-close
	opacity: 0.6

.LFM-tab-close:hover
	opacity: 1 !important

.LFM-new-tab
	display: flex
	align-items: center
	justify-content: center
	width: 28px
	height: 28px
	margin: 4px 6px 0
	border-radius: 6px
	background: transparent
	border: none
	cursor: pointer
	color: var(--LFM-text)
	font-size: 18px
	transition: all 150ms ease

	&:hover
		background: var(--LFM-hover)

.LFM-tab-drag
	flex: 1
	-webkit-app-region: drag

// Animations
.tab-list-enter-active, .tab-list-leave-active
	transition: all 300ms ease

.tab-list-enter-from, .tab-list-leave-to
	opacity: 0
	transform: translateY(-10px) scale(0.9)
</style>
