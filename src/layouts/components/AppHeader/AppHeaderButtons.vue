<script setup lang="ts">
import { minimizeWindow, toggleMaximize, closeWindow } from '@/services/tauri-bridge';
import IconMinimize from '~icons/material-symbols/minimize';
import IconMaximize from '~icons/material-symbols/maximize';
import IconClose from '~icons/material-symbols/close';

// This can be synced with a store or config later
const appButtons = true;
</script>

<template lang="pug">
.LFM-header-buttons(v-if="appButtons")
	button.LFM-header-btn.LFM-header-btn--minimize(title="Minimize" @click="minimizeWindow")
		IconMinimize
	button.LFM-header-btn.LFM-header-btn--maximize(title="Maximize" @click="toggleMaximize")
		IconMaximize
	button.LFM-header-btn.LFM-header-btn--close(title="Close" @click="closeWindow")
		IconClose
</template>

<style lang="sass" scoped>
@reference "tailwindcss"

.LFM-header-buttons
	display: flex
	align-items: center
	height: 100%
	margin-left: auto

.LFM-header-btn
	display: flex
	align-items: center
	justify-content: center
	width: 46px
	height: 36px
	background: transparent
	border: none
	cursor: pointer
	color: var(--LFM-text)
	transition: all 150ms ease
	font-size: 18px

	&:hover
		background: var(--LFM-hover)

	&--close:hover
		background: #e81123
		color: white
</style>
