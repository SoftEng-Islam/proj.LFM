<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { storeToRefs } from 'pinia';

import StatusBar from '@/features/explorer/components/StatusBar.vue';
import SidebarNavigation from '@/features/navigation/components/SidebarNavigation.vue';
import { useFileManagerStore } from '@/stores/file-manager';
import AppHeader from './components/AppHeader/AppHeader.vue';
import AppNavigationBar from './components/AppNavigationBar.vue';
import AiChatSidebar from './components/AiChatSidebar.vue';
import PreviewPane from '@/features/explorer/components/PreviewPane/PreviewPane.vue';
import ExpandedPreview from '@/components/ui/ExpandedPreview.vue';
import SettingsView from '@/features/settings/views/SettingsView.vue';
import IconSettings from '~icons/material-symbols/settings';

const store = useFileManagerStore();
const { settingsOpen } = storeToRefs(store);

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

<template lang="pug">
	div(id="LFM-shell" class="LFM-shell")
		<AppHeader />
		<AppNavigationBar />

		div(class="LFM-body")
			aside(class="flex flex-col h-full py-2 overflow-hidden" aria-label="Navigation pane")
				<SidebarNavigation />
				//- Settings button
				button(
					type="button"
					class="LFM-sbar-settings flex items-center justify-center gap-4 p-3"
					:class="{ 'LFM-sbar-settings--active': store.settingsOpen }"
					@click="store.openSettings"
				)
					span(class="text-lg") #[IconSettings()]
					span(class="text-lg text-nowrap overflow-hidden text-ellipsis") Settings

			main(id="main-content" class="LFM-content")
				<slot />

			div(class="LFM-right-sidebars")
				div(
					v-if="store.detailsOpen"
					class="LFM-right-panel"
					:style="{ width: `${store.detailsPanelWidth}px` }"
				)
					div(
						class="LFM-panel-resizer"
						role="separator"
						aria-orientation="vertical"
						aria-label="Resize file details panel. Double-click to reset width."
						title="Drag to resize · Double-click to reset"
						tabindex="0"
						@pointerdown="beginResize('details', $event)"
						@dblclick.prevent="onGutterDblclick('details')"
						@keydown.left.prevent="store.setDetailsPanelWidth(store.detailsPanelWidth + 16)"
						@keydown.right.prevent="store.setDetailsPanelWidth(store.detailsPanelWidth - 16)"
					)
					aside(class="LFM-sidebar-panel" aria-label="File Details")
						<PreviewPane />

				div(v-if="store.aiChatOpen" class="LFM-right-panel" :style="{ width: `${store.aiChatPanelWidth}px` }")
					div(
						class="LFM-panel-resizer"
						role="separator"
						aria-orientation="vertical"
						aria-label="Resize assistant panel. Double-click to reset width."
						title="Drag to resize · Double-click to reset"
						tabindex="0"
						@pointerdown="beginResize('ai', $event)"
						@dblclick.prevent="onGutterDblclick('ai')"
						@keydown.left.prevent="store.setAiChatPanelWidth(store.aiChatPanelWidth + 16)"
						@keydown.right.prevent="store.setAiChatPanelWidth(store.aiChatPanelWidth - 16)"
					)
					aside(class="LFM-sidebar-panel" aria-label="AI Chat")
						<AiChatSidebar />

		<StatusBar />
		<ExpandedPreview />
		<SettingsView v-if="store.settingsOpen" @close="store.closeSettings" />
</template>

<style scoped lang="scss">
@reference "tailwindcss";

.LFM-shell {
	display: flex;
	flex-direction: column;
	height: 100vh;
	overflow: hidden;
	background: var(--color-base-200);
	color: var(--color-base-content);
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
	border-right: 1px solid color-mix(in srgb, var(--color-base-content) 10%, transparent);
	background: var(--color-base-200);
}

.LFM-content {
	flex: 1;
	overflow-y: auto;
	overflow-x: hidden;
	display: flex;
	flex-direction: column;
	background: var(--color-base-100);
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
		background: color-mix(in srgb, var(--color-base-content) 10%, transparent);
		opacity: 0.85;
		pointer-events: none;
	}

	&:hover,
	&:focus-visible {
		background: color-mix(in srgb, var(--color-primary) 12%, transparent);
		border-left-color: color-mix(in srgb, var(--color-primary) 35%, transparent);
	}

	&:focus-visible {
		outline: none;
	}

	&:active {
		background: color-mix(in srgb, var(--color-primary) 22%, color-mix(in srgb, var(--color-base-content) 10%, transparent));
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
	border-left: 1px solid color-mix(in srgb, var(--color-base-content) 10%, transparent);
}

.LFM-sbar-settings {
	min-height: 40px;
	border-radius: 10px;
	cursor: pointer;
	text-decoration: none;
	color: var(--color-base-content);
	background: color-mix(in srgb, var(--color-base-content) 4%, transparent);
	border: 1px solid color-mix(in srgb, var(--color-base-content) 8%, transparent);
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
	transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
	position: relative;
	margin: auto 8px 8px 8px;
	font-size: 13px;
	font-weight: 500;
	width: calc(100% - 16px);

	&:hover {
		background: color-mix(in srgb, var(--color-base-content) 8%, transparent);
		border-color: color-mix(in srgb, var(--color-base-content) 15%, transparent);
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
	}

	&:active {
		transform: translateY(0);
		background: color-mix(in srgb, var(--color-base-content) 12%, transparent);
	}

	&--active {
		background: color-mix(in srgb, var(--color-primary) 12%, transparent);
		border-color: color-mix(in srgb, var(--color-primary) 30%, transparent);
		color: var(--color-primary);
		font-weight: 600;
		box-shadow: 0 4px 12px color-mix(in srgb, var(--color-primary) 15%, transparent);

		&::before {
			content: '';
			position: absolute;
			left: -8px;
			top: 6px;
			bottom: 6px;
			width: 4px;
			background: var(--color-primary);
			border-radius: 0 4px 4px 0;
			box-shadow: 0 0 10px var(--color-primary);
		}
	}
}
</style>
