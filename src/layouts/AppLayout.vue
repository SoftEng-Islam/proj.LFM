<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';

import StatusBar from '@/features/explorer/components/StatusBar.vue';
import { useFileManagerStore } from '@/stores/file-manager';
import AppHeader from './components/AppHeader/AppHeader.vue';
import AppNavigationBar from './components/AppNavigationBar.vue';
import LeftSidebar from './components/LeftSidebar.vue';
import ResizableRightPanel from './components/ResizableRightPanel.vue';
import AiChatSidebar from './components/AiChatSidebar.vue';
import PreviewPane from '@/features/explorer/components/PreviewPane/PreviewPane.vue';
import ExpandedPreview from '@/components/ui/ExpandedPreview.vue';
import SettingsView from '@/features/settings/views/SettingsView.vue';

const store = useFileManagerStore();

function onWindowResize() {
	store.reconcileRightPanelWidths();
}

onMounted(() => {
	store.reconcileRightPanelWidths();
	window.addEventListener('resize', onWindowResize);
});

onUnmounted(() => {
	window.removeEventListener('resize', onWindowResize);
});
</script>

<template lang="pug">
	div(id="LFM-shell" class="LFM-shell")
		<AppHeader />
		<AppNavigationBar />

		div(class="LFM-body")
			<LeftSidebar />

			main(id="main-content" class="LFM-content")
				<slot />

			div(class="LFM-right-sidebars")
				//- File Details Preview Panel
				ResizableRightPanel(
					v-if="store.detailsOpen"
					kind="details"
					:width="store.detailsPanelWidth"
					ariaLabel="File Details"
					resizerAriaLabel="Resize file details panel. Double-click to reset width."
					@update:width="store.setDetailsPanelWidth($event)"
					@reset="store.resetDetailsPanelWidth()"
				)
					<PreviewPane />

				//- AI Chat Panel
				ResizableRightPanel(
					v-if="store.aiChatOpen"
					kind="ai"
					:width="store.aiChatPanelWidth"
					ariaLabel="AI Chat"
					resizerAriaLabel="Resize assistant panel. Double-click to reset width."
					@update:width="store.setAiChatPanelWidth($event)"
					@reset="store.resetAiChatPanelWidth()"
				)
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
</style>
