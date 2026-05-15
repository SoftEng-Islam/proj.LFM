<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'vue-toastification';

import WorkspaceOverview from '@/features/explorer/components/WorkspaceOverview.vue';
import AppLayout from '@/layouts/AppLayout.vue';
import RenameModal from '@/components/ui/RenameModal.vue';
import PropertiesModal from '@/components/ui/PropertiesModal.vue';
import { useFileManagerStore } from '@/stores/file-manager';
import type { FileEntry } from '@/types/file-manager';

const route = useRoute();
const router = useRouter();
const store = useFileManagerStore();
const toast = useToast();

const renameDialog = ref<{ visible: boolean; path: string; currentName: string }>({
	visible: false,
	path: '',
	currentName: '',
});

const propertiesDialog = ref<{ visible: boolean; item: FileEntry | null }>({
	visible: false,
	item: null,
});

function handleKeydown(e: KeyboardEvent) {
	if (e.key === 'F5') {
		e.preventDefault();
		store.openSection(store.currentPath);
	}
}

function openPropertiesDialog(item?: FileEntry) {
	const target = item || store.selectedItem;
	if (target) {
		propertiesDialog.value = { visible: true, item: target };
	}
}

onMounted(() => {
	window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
	window.removeEventListener('keydown', handleKeydown);
});

watch(
	() => route.fullPath,
	() => {
		if (route.path) {
			const activeTab = typeof route.query.tab === 'string' ? route.query.tab : store.activeTabId;
			if (activeTab) store.setActiveTab(activeTab);
			store.openSection(route.path);
		}
	},
	{ immediate: true }
);

watch(
	() => route.meta.title as string | undefined,
	(title) => {
		document.title = title ?? 'LFM Explorer';
	},
	{ immediate: true }
);
</script>

<template lang="pug">
AppLayout
	WorkspaceOverview(@open-properties="openPropertiesDialog")
	PropertiesModal(
		v-if="propertiesDialog.visible"
		v-model="propertiesDialog.visible"
		:item="propertiesDialog.item"
	)
</template>

<style lang="sass">
</style>
