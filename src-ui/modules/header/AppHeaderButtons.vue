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
div(class="flex items-center h-full gap-x-2 [&>button]:border-none [&>button]:cursor-pointer [&>button]:flex [&>button]:items-center [&>button]:justify-center [&>button]:w-8 [&>button]:h-8 [&>button]:rounded-lg [&>button]:text-base-content [&>button]:text-[16px] [&>button]:transition-all [&>button]:duration-150" v-if="config.appearance.window_controls")
	button(class="bg-(--color-warning)/20 hover:bg-(--color-warning)" title="Minimize" @click="minimizeWindow" v-if="config.appearance.show_minimize")
		IconMinimize
	button(class="bg-(--color-success)/20 hover:bg-(--color-success)" title="Maximize" @click="toggleMaximize" v-if="config.appearance.show_maximize")
		IconMaximize
	button(class="bg-(--color-error)/20 hover:bg-(--color-error)" title="Close" @click="closeWindow()" v-if="config.appearance.show_close")
		IconClose
</template>
