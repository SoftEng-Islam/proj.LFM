<script setup lang="ts">
import { onMounted } from 'vue';
import { useFileManagerStore } from '@/stores/file-manager';

import AppPreloader from '@/components/ui/AppPreloader.vue';

const store = useFileManagerStore();

onMounted(() => {
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
