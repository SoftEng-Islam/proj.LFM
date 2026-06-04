<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { minimizeWindow, toggleMaximize, closeWindow } from '@/services/tauri-bridge';
import { useConfigStore } from '@/stores/config';

import IconMinimize from '~icons/material-symbols/remove';
import IconMaximize from '~icons/material-symbols/add';
import IconClose from '~icons/material-symbols/close';

const configStore = useConfigStore();
const { config } = storeToRefs(configStore);
console.log(closeWindow);
</script>

<template lang="pug">
div(class="flex items-center h-full ml-auto gap-x-2 pr-2 [&>button]:border-none [&>button]:cursor-pointer [&>button]:flex [&>button]:items-center [&>button]:justify-center [&>button]:w-8 [&>button]:h-8 [&>button]:rounded-lg [&>button]:text-base-content [&>button]:text-[16px]" v-if="config.appearance.window_controls")
	button(class="bg-(--color-warning)/20 hover:bg-(--color-warning) text-base-content transition-all duration-150 text-[16px]" title="Minimize" @click="minimizeWindow")
		IconMinimize
	button(class="bg-(--color-success)/20 hover:bg-(--color-success) text-base-content transition-all duration-150 text-[16px]" title="Maximize" @click="toggleMaximize")
		IconMaximize
	button(class="bg-(--color-error)/20 hover:bg-(--color-error) transition-all duration-150 " title="Close" @click="closeWindow()")
		IconClose
</template>
