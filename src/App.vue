<script setup lang="ts">
import { onMounted } from 'vue';
import { useFileManagerStore } from '@/stores/file-manager';

const store = useFileManagerStore();

onMounted(() => {
	store.fetchDrives();
});
</script>

<template lang="pug">
RouterView(v-slot="{ Component }")
	component(:is="Component")
</template>

<style lang="sass">
</style>
