<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useFileManagerStore } from '@/stores/file-manager';
import { on as busOn } from '@/renderer/events/bus';
import IconBack from '~icons/material-symbols/arrow-back';
import IconForward from '~icons/material-symbols/arrow-forward';
import IconUp from '~icons/material-symbols/arrow-upward';
import IconRefresh from '~icons/material-symbols/refresh';
import IconSearch from '~icons/material-symbols/search';
import IconMoreVert from '~icons/material-symbols/more-vert';
import IconChat from '~icons/material-symbols/chat';
import AppBreadcrumb from './AppBreadcrumb.vue';

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
div(class="LFM-nav-bar" aria-label="Navigation")
	div(class="flex items-center gap-1")
		button(class="LFM-nav-btn" :disabled="!canGoBack" title="Back" @click="goBack")
			IconBack
		button(class="LFM-nav-btn" :disabled="!canGoForward" title="Forward" @click="goForward")
			IconForward
		button(class="LFM-nav-btn" title="Up one level" @click="goUp")
			IconUp
		button(class="LFM-nav-btn" title="Refresh" @click="refresh")
			IconRefresh

	AppBreadcrumb

	div(class="LFM-nav-right")
		button(class="LFM-nav-btn" title="Expand address bar")
			IconMoreVert
		div(class="LFM-search-box hidden md:flex items-center relative")
			IconSearch(class="ml-2 opacity-50")
			input(ref="searchRef" v-model="store.searchQuery" type="text" placeholder="Search files..." class="bg-transparent border-none outline-none px-2 py-1 w-32 focus:w-64 transition-all duration-300" @keydown.enter="searchRef?.blur()")
			span(class="text-xs text-muted mr-2 hidden lg:inline") Ctrl+F
		button(class="LFM-nav-btn" :class="{ 'LFM-nav-btn--active': store.aiChatOpen }" title="AI Chat" @click="store.toggleAiChat")
			IconChat
</template>

<style lang="sass" scoped>
@reference "tailwindcss"

.LFM-nav-bar
  display: flex
  align-items: center
  gap: 4px
  height: 48px
  padding: 0 8px
  background: var(--color-base-300)
  border-bottom: 1px solid color-mix(in srgb, var(--color-base-content) 10%, transparent)
  flex-shrink: 0

.LFM-nav-btn
  display: flex
  align-items: center
  justify-content: center
  width: 32px
  height: 32px
  border-radius: 6px
  background: transparent
  border: none
  cursor: pointer
  color: var(--color-base-content)
  transition: all 150ms ease
  flex-shrink: 0
  font-size: 20px

  &:hover:not(:disabled)
    background: color-mix(in srgb, var(--color-base-content) 6%, transparent)

  &:active:not(:disabled)
    background: color-mix(in srgb, var(--color-base-content) 10%, transparent)

  &:disabled
    opacity: 0.3
    cursor: default

  &--active
    color: var(--color-primary)
    background: color-mix(in srgb, var(--color-primary) 12%, transparent)

.LFM-search-box
  background: var(--color-base-100)
  border: 1px solid color-mix(in srgb, var(--color-base-content) 10%, transparent)
  border-radius: 6px
  height: 32px
  margin: 0 4px

.LFM-nav-right
  display: flex
  align-items: center
  gap: 4px
  flex-shrink: 0
</style>
