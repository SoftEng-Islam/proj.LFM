<script setup lang="ts">
import { watch, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';

import WorkspaceOverview from '@/features/explorer/components/WorkspaceOverview.vue';
import AppLayout from '@/layouts/AppLayout.vue';
import { useFileManagerStore } from '@/stores/file-manager';
import type { SectionId } from '@/types/file-manager';

const route = useRoute();
const store = useFileManagerStore();

function handleKeydown(e: KeyboardEvent) {
	if (e.key === 'F5') {
		e.preventDefault();
		store.openSection(store.currentPath);
	}
}

onMounted(() => {
	window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
	window.removeEventListener('keydown', handleKeydown);
});

watch(
	() => route.path,
	(path) => {
		if (path) {
			store.openSection(path);
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
	WorkspaceOverview
</template>

<style lang="sass">
</style>
