<script setup lang="ts">
import AppHeaderButtons from './AppHeaderButtons.vue';
import AppHeaderTabStrip from './AppHeaderTabStrip.vue';
</script>

<template lang="pug">
header(class="w-full flex items-center justify-between bg-base-300 border-b border-base-content/5 h-11.5 shrink-0 [-webkit-app-region:drag]" data-tauri-drag-region)
	div(class="flex-1 h-full flex items-stretch")
		AppHeaderTabStrip
	div(class="flex items-center h-full pr-0")
		AppHeaderButtons
</template>
