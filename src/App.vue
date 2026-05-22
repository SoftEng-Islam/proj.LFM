<script setup lang="ts">
import { onMounted } from 'vue';
import { useFileManagerStore } from '@/stores/file-manager';
import { useConfigStore } from '@/stores/config';

import AppPreloader from '@/components/ui/AppPreloader.vue';

const store = useFileManagerStore();
const configStore = useConfigStore();

onMounted(async () => {
	await configStore.loadConfig();
	store.initializeHomeDir();
	store.fetchDrives();
});
</script>

<template lang="pug">
AppPreloader(:isReady="store.isInitialized")
RouterView(v-slot="{ Component }")
	component(:is="Component")
</template>

<style lang="sass">
</style>
