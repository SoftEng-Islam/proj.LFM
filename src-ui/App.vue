<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { useFileManagerStore } from '@/stores/file-manager';
import { useConfigStore } from '@/stores/config';

import AppPreloader from '@/modules/preloader/AppPreloader.vue';
import StatusBar from '@/modules/StatusBar/StatusBar.vue';
import AppHeader from '@/modules/header/AppHeader.vue';
import AppBreadcrumb from '@/modules/Breadcrumb/default.vue';
import LeftSidebar from '@/modules/left-navigation/LeftSidebar.vue';
import ResizableModal from '@/components/ui/ResizableModal.vue';
import AiChatSidebar from '@/modules/chat/AiChatSidebar.vue';
import PreviewPane from '@/modules/right-preview-panel/PreviewPane.vue';
import ExpandedPreview from '@/components/previewers/ExpandedPreview.vue';
import SettingsView from '@/modules/settings/views/SettingsView.vue';

const store = useFileManagerStore();
const configStore = useConfigStore();

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


onMounted(async () => {
	await configStore.loadConfig();
	store.initializeHomeDir();
	store.fetchDrives();
});
</script>

<template lang="pug">
AppPreloader(:isReady="store.isInitialized")
div(id="LFM-shell" class="w-full flex flex-col h-screen overflow-hidden bg-base-200 text-base-content text-[12px]")
	<AppHeader />
	<AppBreadcrumb />

	div(class="flex flex-1 overflow-hidden min-w-0")
		ResizableModal(
			v-if="store.leftSidebarOpen"
			kind="NavigationSidebar"
			:width="store.leftSidebarWidth"
			direction="right"
			ariaLabel="Left Sidebar Navigation"
			resizerAriaLabel="Resize file Navigation panel. Double-click to reset width."
			@update:width="store.setLeftSidebarWidth($event)"
			@reset="store.resetLeftSidebarWidth()"
		)
			<LeftSidebar />
		//- Main Content
		main(id="main-content" class="flex-1 overflow-y-auto overflow-x-hidden flex flex-col bg-base-100 min-w-0")
			RouterView

		div(class="flex shrink-0 h-full min-h-0")
			//- File Details Preview Panel
			ResizableModal(
				v-if="store.detailsOpen"
				kind="details"
				:width="store.detailsPanelWidth"
				direction="left"
				ariaLabel="File Details"
				resizerAriaLabel="Resize file details panel. Double-click to reset width."
				@update:width="store.setDetailsPanelWidth($event)"
				@reset="store.resetDetailsPanelWidth()"
			)
				<PreviewPane />

			//- AI Chat Panel
			ResizableModal(
				v-if="store.aiChatOpen"
				kind="ai"
				:width="store.aiChatPanelWidth"
				direction="left"
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
