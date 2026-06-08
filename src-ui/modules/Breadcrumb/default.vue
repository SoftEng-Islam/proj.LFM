<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useFileManagerStore } from '@/stores/file-manager';
import { on as busOn } from '@/renderer/events/bus';
import IconBack from '~icons/material-symbols/arrow-back';
import IconForward from '~icons/material-symbols/arrow-forward';
import IconUp from '~icons/material-symbols/arrow-upward';
import IconRefresh from '~icons/material-symbols/refresh';
import IconChat from '~icons/material-symbols/chat';
import AppBreadcrumb from './AppBreadcrumb.vue';
import SearchBox from './SearchBox.vue';

const store = useFileManagerStore();
const router = useRouter();
const route = useRoute();
const searchRef = ref<HTMLInputElement>();

// Nav history simulation
const canGoBack = computed(() => true);
const canGoForward = computed(() => false);

function goBack() { router.go(-1); }
function goForward() { router.go(1); }
function isAppRoute(path: string) {
	return ['/drives', '/@drives', '/locations', '/@locations', '/settings', '/@settings'].includes(path);
}
function goUp() {
	if (isAppRoute(route.path)) {
		router.push('/');
		return;
	}

	const segs = store.breadcrumbs;
	if (segs.length > 1) {
		const up = segs[segs.length - 2]?.path;
		if (up) router.push(up);
	}
}
function refresh() { store.refresh(); }
let disposeFocusShortcut: (() => void) | null = null;

onMounted(() => {
	disposeFocusShortcut = busOn('shortcut:focus-search', () => {
		searchRef.value?.focus();
		searchRef.value?.select();
	});
});

onUnmounted(() => {
	disposeFocusShortcut?.();
	disposeFocusShortcut = null;
});
</script>

<template lang="pug">
div(class="flex items-center gap-1 h-12 px-2 bg-base-300 border-b border-base-content/10 shrink-0" aria-label="Navigation")
	div(class="flex items-center gap-1")
		button(class="flex items-center justify-center w-8 h-8 rounded-md bg-transparent border-none cursor-pointer text-base-content transition-all duration-150 shrink-0 text-[20px] hover:not(:disabled):bg-base-content/5 active:not(:disabled):bg-base-content/10 disabled:opacity-30 disabled:cursor-default" :disabled="!canGoBack" title="Back" @click="goBack")
			IconBack
		button(class="flex items-center justify-center w-8 h-8 rounded-md bg-transparent border-none cursor-pointer text-base-content transition-all duration-150 shrink-0 text-[20px] hover:not(:disabled):bg-base-content/5 active:not(:disabled):bg-base-content/10 disabled:opacity-30 disabled:cursor-default" :disabled="!canGoForward" title="Forward" @click="goForward")
			IconForward
		button(class="flex items-center justify-center w-8 h-8 rounded-md bg-transparent border-none cursor-pointer text-base-content transition-all duration-150 shrink-0 text-[20px] hover:not(:disabled):bg-base-content/5 active:not(:disabled):bg-base-content/10 disabled:opacity-30 disabled:cursor-default" title="Up one level" @click="goUp")
			IconUp
		button(class="flex items-center justify-center w-8 h-8 rounded-md bg-transparent border-none cursor-pointer text-base-content transition-all duration-150 shrink-0 text-[20px] hover:not(:disabled):bg-base-content/5 active:not(:disabled):bg-base-content/10 disabled:opacity-30 disabled:cursor-default" title="Refresh" @click="refresh")
			IconRefresh

	AppBreadcrumb

	div(class="flex items-center gap-1 shrink-0")
		//- Search Box
		SearchBox

		//- Toggle Ai Chat
		button(class="flex items-center justify-center w-8 h-8 rounded-md bg-transparent border-none cursor-pointer text-base-content transition-all duration-150 shrink-0 text-[20px] hover:not(:disabled):bg-base-content/5 active:not(:disabled):bg-base-content/10 disabled:opacity-30 disabled:cursor-default" :class="{ 'text-primary bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)]': store.aiChatOpen }" title="AI Chat" @click="store.toggleAiChat")
			IconChat
</template>
