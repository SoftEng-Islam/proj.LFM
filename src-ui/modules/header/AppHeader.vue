<script setup lang="ts">
import AppHeaderButtons from './AppHeaderButtons.vue';
import AppHeaderTabStrip from './AppHeaderTabStrip.vue';
</script>

<template lang="pug">
header(class="relative w-full flex p-2 items-center justify-between bg-base-300 border-b border-base-content/10 h-14 [-webkit-app-region:drag]" data-tauri-drag-region)
	div(class="flex h-full items-center overflow-hidden")
		AppHeaderTabStrip
	div(class="flex h-full items-center overflow-hidden")
		AppHeaderButtons
</template>
