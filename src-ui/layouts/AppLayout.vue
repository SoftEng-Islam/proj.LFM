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
	div(id="LFM-shell" class="flex flex-col h-screen overflow-hidden bg-base-200 text-base-content text-[12px]")
		<AppHeader />
		<AppNavigationBar />

		div(class="flex flex-1 overflow-hidden min-w-0")
			<LeftSidebar />

			main(id="main-content" class="flex-1 overflow-y-auto overflow-x-hidden flex flex-col bg-base-100 min-w-0")
				<slot />

			div(class="flex shrink-0 h-full min-h-0")
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
