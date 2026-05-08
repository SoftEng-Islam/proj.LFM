<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';

import StatusBar from '@/features/explorer/components/StatusBar.vue';
import SidebarNavigation from '@/features/navigation/components/SidebarNavigation.vue';
import { useFileManagerStore } from '@/stores/file-manager';

const store = useFileManagerStore();
const router = useRouter();

function closeTab(tabId: string) {
	if (store.windowTabs.length <= 1) return;
	const idx = store.windowTabs.findIndex((t) => t.id === tabId);
	if (idx === -1) return;
	const isActive = store.currentPath === store.windowTabs[idx]?.sectionId;
	if (!isActive) return;
	const next = store.windowTabs[idx === 0 ? 1 : idx - 1];
	if (next) router.push(next.path);
}

// Nav history simulation
const canGoBack = computed(() => false);
const canGoForward = computed(() => false);

function goBack() { router.go(-1); }
function goForward() { router.go(1); }
function goUp() {
	const segs = store.breadcrumbs;
	if (segs.length > 1) {
		const up = segs[segs.length - 2]?.path;
		if (up) router.push(up);
	}
}
function refresh() { location.reload(); }
</script>

<template>
	<div class="win-shell" id="win-shell">


		<!-- ─── Tab Strip + Nav Bar ───────────────────────────────────── -->
		<div class="win-tab-row" data-tauri-drag-region>
			<!-- Tab strip -->
			<div class="win-tab-strip" role="tablist">
				<RouterLink v-for="tab in store.windowTabs" :key="tab.id" :to="tab.path" class="win-tab" :class="{ 'win-tab--active': store.currentPath === tab.sectionId }" role="tab" :aria-selected="store.currentPath === tab.sectionId">
					<svg width="14" height="14" viewBox="0 0 16 16" fill="none" class="win-tab-icon">
						<rect x="1" y="4" width="14" height="10" rx="2" fill="#FFC83D" />
						<path d="M1 6C1 4.9 1.9 4 3 4h4l2 2H1V6z" fill="#E3A416" />
					</svg>
					<span class="win-tab-label">{{ tab.label }}</span>
					<button class="win-tab-close" title="Close tab" @click.prevent="closeTab(tab.id)">×</button>
				</RouterLink>
				<button class="win-new-tab" title="New tab" @click="router.push('/')">+</button>
			</div>

			<!-- Drag region spacer -->
			<div class="win-tab-drag" data-tauri-drag-region />
		</div>

		<!-- ─── Navigation Bar ────────────────────────────────────────── -->
		<div class="win-nav-bar" aria-label="Navigation">
			<!-- Nav arrows -->
			<button class="win-nav-btn" :disabled="!canGoBack" title="Back" @click="goBack">
				<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
					<path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
				</svg>
			</button>
			<button class="win-nav-btn" :disabled="!canGoForward" title="Forward" @click="goForward">
				<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
					<path d="M6 3L11 8L6 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
				</svg>
			</button>
			<button class="win-nav-btn" title="Up one level" @click="goUp">
				<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
					<path d="M8 12V4M4 8L8 4L12 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
				</svg>
			</button>
			<button class="win-nav-btn" title="Refresh" @click="refresh">
				<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
					<path d="M13.5 8A5.5 5.5 0 1 1 8 2.5V1M8 1L11 4M8 1L5 4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" />
				</svg>
			</button>

			<!-- Home icon + breadcrumb -->
			<div class="win-breadcrumb-bar" role="navigation" aria-label="Breadcrumb">
				<RouterLink to="/" class="win-breadcrumb-home" title="Home">
					<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
						<path d="M1.5 7.5L8 2L14.5 7.5V14H10.5V10H5.5V14H1.5V7.5Z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" fill="none" />
					</svg>
				</RouterLink>
				<span class="win-breadcrumb-sep">›</span>

				<template v-for="(crumb, i) in store.breadcrumbs" :key="crumb.label">
					<RouterLink v-if="i < store.breadcrumbs.length - 1 && crumb.path" :to="crumb.path" class="win-breadcrumb-crumb win-breadcrumb-crumb--link">{{ crumb.label }}</RouterLink>
					<span v-else class="win-breadcrumb-crumb win-breadcrumb-crumb--current">{{ crumb.label }}</span>
					<span v-if="i < store.breadcrumbs.length - 1" class="win-breadcrumb-sep">›</span>
				</template>
			</div>

			<!-- Right side icons: expand, search, details -->
			<div class="win-nav-right">
				<button class="win-nav-btn" title="Expand address bar">
					<svg width="14" height="14" viewBox="0 0 14 14" fill="none">
						<path d="M2 5H12M2 9H12" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" />
					</svg>
				</button>
				<button class="win-nav-btn" title="Search">
					<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
						<circle cx="6.5" cy="6.5" r="4" stroke="currentColor" stroke-width="1.4" />
						<path d="M10 10L14 14" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" />
					</svg>
				</button>
				<button class="win-nav-btn" title="Details pane">
					<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
						<rect x="2" y="2" width="7" height="12" rx="1" stroke="currentColor" stroke-width="1.3" />
						<rect x="11" y="2" width="3" height="12" rx="1" stroke="currentColor" stroke-width="1.3" />
					</svg>
				</button>
			</div>
		</div>

		<!-- ─── Body: Sidebar + Content ──────────────────────────────── -->
		<div class="win-body">
			<aside class="win-sidebar" aria-label="Navigation pane">
				<SidebarNavigation />
			</aside>

			<main class="win-content" id="main-content">
				<slot />
			</main>
		</div>

		<!-- ─── Status Bar ────────────────────────────────────────────── -->
		<StatusBar />
	</div>
</template>

<style scoped lang="scss">
@referance "tailwindcss";

.win-shell {
	display: flex;
	flex-direction: column;
	height: 100vh;
	overflow: hidden;
	background: var(--win-bg);
	color: var(--win-text);
	font-size: 12px;
}

/* ── Tab Row ──────────────────────────────────────── */
.win-tab-row {
	display: flex;
	align-items: stretch;
	height: 36px;
	background: var(--win-title-bar);
	border-bottom: 1px solid var(--win-border);
	flex-shrink: 0;
	user-select: none;
}

.win-tab-strip {
	display: flex;
	align-items: stretch;
	height: 100%;
	flex-shrink: 0;
	overflow: hidden;
}

.win-tab {
	display: flex;
	align-items: center;
	gap: 5px;
	padding: 0 10px;
	min-width: 120px;
	max-width: 200px;
	height: 100%;
	cursor: pointer;
	color: var(--win-text);
	border-right: 1px solid var(--win-border);
	transition: background 100ms;
	font-size: 12px;
	text-decoration: none;
	flex-shrink: 0;
}

.win-tab:hover {
	background: var(--win-hover);
}

.win-tab-drag {
	flex: 1;
	-webkit-app-region: drag;
	app-region: drag;
}

.win-tab--active {
	background: var(--win-panel);
	border-bottom: none;
	position: relative;
}

.win-tab--active::after {
	content: '';
	position: absolute;
	bottom: 0;
	left: 0;
	right: 0;
	height: 2px;
	background: var(--win-blue);
}

.win-tab-icon {
	flex-shrink: 0;
}

.win-tab-label {
	flex: 1;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.win-tab-close {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 18px;
	height: 18px;
	border-radius: 4px;
	background: transparent;
	border: none;
	cursor: pointer;
	color: var(--win-text);
	font-size: 13px;
	flex-shrink: 0;
	opacity: 0.7;
	transition: background 100ms, opacity 100ms;
}

.win-tab-close:hover {
	background: rgba(196, 43, 28, 0.9);
	color: white;
	opacity: 1;
}

.win-new-tab {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 32px;
	height: 100%;
	background: transparent;
	border: none;
	cursor: pointer;
	color: var(--win-text);
	font-size: 16px;
	opacity: 0.6;
	transition: background 100ms, opacity 100ms;
}

.win-new-tab:hover {
	background: var(--win-hover);
	opacity: 1;
}

.win-title-drag {
	-webkit-app-region: drag;
}

.win-window-controls {
	display: flex;
	align-items: stretch;
	height: 100%;
	flex-shrink: 0;
}

.win-wctrl {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 46px;
	height: 100%;
	background: transparent;
	border: none;
	cursor: pointer;
	color: var(--win-text);
	transition: background 100ms;
}

.win-wctrl:hover {
	background: var(--win-hover);
}

.win-wctrl--close:hover {
	background: #c42b1c;
	color: white;
}

/* ── Navigation Bar ───────────────────────────────── */
.win-nav-bar {
	display: flex;
	align-items: center;
	gap: 2px;
	height: 40px;
	padding: 0 6px;
	background: var(--win-toolbar);
	border-bottom: 1px solid var(--win-border);
	flex-shrink: 0;
}

.win-nav-btn {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 32px;
	height: 28px;
	border-radius: 4px;
	background: transparent;
	border: none;
	cursor: pointer;
	color: var(--win-text);
	transition: background 100ms;
	flex-shrink: 0;
}

.win-nav-btn:hover {
	background: var(--win-hover);
}

.win-nav-btn:active {
	background: var(--win-active);
}

.win-nav-btn:disabled {
	opacity: 0.35;
	cursor: default;
}

.win-nav-btn:disabled:hover {
	background: transparent;
}

.win-breadcrumb-bar {
	display: flex;
	align-items: center;
	flex: 1;
	height: 28px;
	padding: 0 8px;
	background: var(--win-panel);
	border: 1px solid var(--win-border);
	border-radius: 4px;
	margin: 0 4px;
	overflow: hidden;
	@apply rounded-full;
}

.win-breadcrumb-home {
	display: flex;
	align-items: center;
	color: var(--win-blue);
	flex-shrink: 0;
	padding: 0 2px;
	border-radius: 2px;
	transition: background 100ms;
}

.win-breadcrumb-home:hover {
	background: var(--win-hover);
}

.win-breadcrumb-sep {
	color: var(--win-text);
	opacity: 0.4;
	margin: 0 3px;
	font-size: 13px;
}

.win-breadcrumb-crumb {
	font-size: 12px;
	white-space: nowrap;
}

.win-breadcrumb-crumb--link {
	color: var(--win-text);
	text-decoration: none;
	padding: 2px 4px;
	border-radius: 2px;
	transition: background 100ms;
}

.win-breadcrumb-crumb--link:hover {
	background: var(--win-hover);
}

.win-breadcrumb-crumb--current {
	color: var(--win-text);
	font-weight: 500;
}

.win-nav-right {
	display: flex;
	align-items: center;
	gap: 2px;
	flex-shrink: 0;
}

/* ── Body ─────────────────────────────────────────── */
.win-body {
	display: flex;
	flex: 1;
	overflow: hidden;
}

.win-sidebar {
	width: 220px;
	flex-shrink: 0;
	overflow-y: auto;
	border-right: 1px solid var(--win-border);
	background: var(--win-sidebar);
}

.win-content {
	flex: 1;
	overflow: hidden;
	display: flex;
	flex-direction: column;
	background: var(--win-panel);
}
</style>
