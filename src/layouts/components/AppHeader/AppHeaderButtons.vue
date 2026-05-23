<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { minimizeWindow, toggleMaximize, closeWindow } from '@/services/tauri-bridge';
import { useConfigStore } from '@/stores/config';
import IconMinimize from '~icons/material-symbols/minimize';
import IconMaximize from '~icons/material-symbols/maximize';
import IconClose from '~icons/material-symbols/close';

const configStore = useConfigStore();
const { config } = storeToRefs(configStore);
</script>

<template lang="pug">
div(class="flex items-center h-full ml-auto" v-if="config.appearance.window_controls")
	button(class="flex items-center justify-center w-[46px] h-full bg-transparent border-none cursor-pointer text-base-content transition-all duration-150 text-[16px] hover:bg-base-content/5" title="Minimize" @click="minimizeWindow")
		IconMinimize
	button(class="flex items-center justify-center w-[46px] h-full bg-transparent border-none cursor-pointer text-base-content transition-all duration-150 text-[16px] hover:bg-base-content/5" title="Maximize" @click="toggleMaximize")
		IconMaximize
	button(class="flex items-center justify-center w-[46px] h-full bg-transparent border-none cursor-pointer text-base-content transition-all duration-150 text-[16px] hover:bg-[#e81123] hover:text-white" title="Close" @click="closeWindow")
		IconClose
</template>
