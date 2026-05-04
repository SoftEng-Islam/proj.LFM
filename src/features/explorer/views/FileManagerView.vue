<script setup lang="ts">
import { watch } from 'vue';
import { useRoute } from 'vue-router';

import WorkspaceOverview from '@/features/explorer/components/WorkspaceOverview.vue';
import AppLayout from '@/layouts/AppLayout.vue';
import { useFileManagerStore } from '@/stores/file-manager';
import type { SectionId } from '@/types/file-manager';

const route = useRoute();
const store = useFileManagerStore();

watch(
	() => route.meta.sectionId as SectionId | undefined,
	(sectionId) => {
		if (sectionId) {
			store.openSection(sectionId);
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

<template>
	<AppLayout>
		<WorkspaceOverview />
	</AppLayout>
</template>
