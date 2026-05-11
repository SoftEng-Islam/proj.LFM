<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import StatusBar from '@/features/explorer/components/StatusBar.vue';
import SidebarNavigation from '@/features/navigation/components/SidebarNavigation.vue';
import { useFileManagerStore } from '@/stores/file-manager';
import AppHeader from './components/AppHeader/AppHeader.vue';
import AppNavigationBar from './components/AppNavigationBar.vue';
import AiChatSidebar from './components/AiChatSidebar.vue';
import PreviewPane from '@/features/explorer/components/PreviewPane.vue';

const store = useFileManagerStore();

type ResizeKind = 'details' | 'ai';

let resizeActive: { kind: ResizeKind; startX: number; startW: number } | null = null;

function onCapturedPointerMove(e: PointerEvent) {
	if (!resizeActive) return;
	// Handle is the panels' *left* edge: move pointer left → wider (into main), right → narrower.
	const dx = resizeActive.startX - e.clientX;
	if (resizeActive.kind === 'details') {
		store.setDetailsPanelWidth(resizeActive.startW + dx);
	} else {
		store.setAiChatPanelWidth(resizeActive.startW + dx);
	}
}

function onCapturedPointerUp(e: PointerEvent) {
	const el = e.currentTarget as HTMLElement | null;
	if (el?.hasPointerCapture?.(e.pointerId)) {
		el.releasePointerCapture(e.pointerId);
	}
	el?.removeEventListener('pointermove', onCapturedPointerMove);
	el?.removeEventListener('pointerup', onCapturedPointerUp);
	el?.removeEventListener('pointercancel', onCapturedPointerUp);
	resizeActive = null;
	document.body.style.removeProperty('cursor');
	document.body.style.removeProperty('user-select');
}

function beginResize(kind: ResizeKind, e: PointerEvent) {
	if (!e.isPrimary || e.button !== 0) return;
	const el = e.currentTarget as HTMLElement;
	resizeActive = {
		kind,
		startX: e.clientX,
		startW: kind === 'details' ? store.detailsPanelWidth : store.aiChatPanelWidth
	};
	el.setPointerCapture(e.pointerId);
	el.addEventListener('pointermove', onCapturedPointerMove);
	el.addEventListener('pointerup', onCapturedPointerUp);
	el.addEventListener('pointercancel', onCapturedPointerUp);
	document.body.style.cursor = 'col-resize';
	document.body.style.userSelect = 'none';
	e.preventDefault();
}

function onGutterDblclick(kind: ResizeKind) {
	if (kind === 'details') {
		store.resetDetailsPanelWidth();
	} else {
		store.resetAiChatPanelWidth();
	}
}

function onWindowResize() {
	store.reconcileRightPanelWidths();
}

onMounted(() => {
	store.reconcileRightPanelWidths();
	window.addEventListener('resize', onWindowResize);
});

onUnmounted(() => {
	window.removeEventListener('resize', onWindowResize);
	resizeActive = null;
	document.body.style.removeProperty('cursor');
	document.body.style.removeProperty('user-select');
});
</script>

<template>
	<div id="LFM-shell" class="LFM-shell">
		<AppHeader />
		<AppNavigationBar />

		<div class="LFM-body">
			<aside class="LFM-sidebar" aria-label="Navigation pane">
				<SidebarNavigation />
			</aside>

			<main id="main-content" class="LFM-content">
				<slot />
			</main>

			<div class="LFM-right-sidebars">
				<div v-if="store.detailsOpen" class="LFM-right-panel" :style="{ width: `${store.detailsPanelWidth}px` }">
					<div class="LFM-panel-resizer" role="separator" aria-orientation="vertical" aria-label="Resize file details panel. Double-click to reset width." title="Drag to resize · Double-click to reset" tabindex="0" @pointerdown="beginResize('details', $event)" @dblclick.prevent="onGutterDblclick('details')" @keydown.left.prevent="store.setDetailsPanelWidth(store.detailsPanelWidth + 16)" @keydown.right.prevent="store.setDetailsPanelWidth(store.detailsPanelWidth - 16)" />
					<aside class="LFM-sidebar-panel" aria-label="File Details">
						<PreviewPane />
					</aside>
				</div>

				<div v-if="store.aiChatOpen" class="LFM-right-panel" :style="{ width: `${store.aiChatPanelWidth}px` }">
					<div class="LFM-panel-resizer" role="separator" aria-orientation="vertical" aria-label="Resize assistant panel. Double-click to reset width." title="Drag to resize · Double-click to reset" tabindex="0" @pointerdown="beginResize('ai', $event)" @dblclick.prevent="onGutterDblclick('ai')" @keydown.left.prevent="store.setAiChatPanelWidth(store.aiChatPanelWidth + 16)" @keydown.right.prevent="store.setAiChatPanelWidth(store.aiChatPanelWidth - 16)" />
					<aside class="LFM-sidebar-panel" aria-label="AI Chat">
						<AiChatSidebar />
					</aside>
				</div>
			</div>
		</div>

		<StatusBar />
	</div>
</template>

<style scoped lang="scss">
@reference "tailwindcss";

.LFM-shell {
	display: flex;
	flex-direction: column;
	height: 100vh;
	overflow: hidden;
	background: var(--LFM-bg);
	color: var(--LFM-text);
	font-size: 12px;
}

.LFM-body {
	display: flex;
	flex: 1;
	overflow: hidden;
	min-width: 0;
}

.LFM-sidebar {
	width: 240px;
	flex-shrink: 0;
	overflow-y: auto;
	border-right: 1px solid var(--LFM-border);
	background: var(--LFM-sidebar);
}

.LFM-content {
	flex: 1;
	overflow: hidden;
	display: flex;
	flex-direction: column;
	background: var(--LFM-panel);
	min-width: 0;
}

.LFM-right-sidebars {
	display: flex;
	flex-shrink: 0;
	height: 100%;
	min-height: 0;
}

.LFM-right-panel {
	display: flex;
	flex-direction: row;
	flex-shrink: 0;
	height: 100%;
	min-height: 0;
	min-width: 260px;
	max-width: 720px;
}

.LFM-panel-resizer {
	flex: 0 0 8px;
	width: 8px;
	min-width: 8px;
	cursor: col-resize;
	touch-action: none;
	background: transparent;
	position: relative;
	z-index: 2;
	margin-left: -1px;
	border-left: 1px solid transparent;
	transition: background 120ms ease, border-color 120ms ease;

	&::after {
		content: '';
		position: absolute;
		left: 50%;
		top: 0;
		bottom: 0;
		width: 1px;
		transform: translateX(-50%);
		background: var(--LFM-border);
		opacity: 0.85;
		pointer-events: none;
	}

	&:hover,
	&:focus-visible {
		background: var(--LFM-blue-subtle);
		border-left-color: color-mix(in srgb, var(--LFM-blue) 35%, transparent);
	}

	&:focus-visible {
		outline: none;
	}

	&:active {
		background: color-mix(in srgb, var(--LFM-blue) 22%, var(--LFM-active));
	}
}

.LFM-sidebar-panel {
	flex: 1;
	min-width: 0;
	height: 100%;
	overflow: hidden;
	display: flex;
	flex-direction: column;
	background: transparent;
	border-left: 1px solid var(--LFM-border);
}
</style>
