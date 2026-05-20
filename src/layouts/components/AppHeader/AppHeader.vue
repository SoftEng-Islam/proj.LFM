<script setup lang="ts">
import AppHeaderButtons from './AppHeaderButtons.vue';
import AppHeaderTabStrip from './AppHeaderTabStrip.vue';
import ThemeControllerMini from '@/components/themeController/ThemeControllerMini.vue';

// The user will change this value from the settings or the configs file.
const showThemeController = false;
</script>

<template lang="pug">
header.LFM-app-header(data-tauri-drag-region)
	.LFM-header-left
		AppHeaderTabStrip
	.LFM-header-right
		ThemeControllerMini(v-if="showThemeController")
		AppHeaderButtons
</template>

<style lang="sass" scoped>
@reference "tailwindcss"

.LFM-app-header
	width: 100%
	display: flex
	align-items: center
	justify-content: space-between
	background: var(--color-base-300)
	border-bottom: 1px solid color-mix(in srgb, var(--color-base-content) 8%, transparent)
	height: 46px
	flex-shrink: 0
	-webkit-app-region: drag

.LFM-header-left
	flex: 1
	height: 100%
	display: flex
	align-items: stretch

.LFM-header-right
	display: flex
	align-items: center
	height: 100%
	padding-right: 0
</style>
