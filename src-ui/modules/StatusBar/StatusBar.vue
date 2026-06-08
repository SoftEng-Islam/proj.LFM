<script setup lang="ts">
import { computed } from 'vue';
import { useFileManagerStore } from '@/stores/file-manager';
import { useStatusBar, type StatusTab } from './useStatusBar';
import StatusBarLeft from './components/StatusBarLeft.vue';
import StatusBarRight from './components/StatusBarRight.vue';
import StatusBarPanel from './components/StatusBarPanel.vue';

const store = useFileManagerStore();
const { panelOpen, activeTab, openPanel, togglePanel, closePanel } = useStatusBar();
const currentPath = computed(() => store.currentPath);

function handleToggleTab(tab: StatusTab) {
  togglePanel(tab);
}

function handleChangeTab(tab: StatusTab) {
  openPanel(tab);
}
</script>

<template lang="pug">
div(class="relative h-full w-full")

  StatusBarPanel(v-if="panelOpen" :activeTab="activeTab" :cwd="currentPath" @changeTab="handleChangeTab" @close="closePanel")
  footer(class="LFM-status-bar flex items-center justify-between px-3 py-2 text-sm" role="status" aria-label="Status bar")
    StatusBarLeft(class="flex-1")
    StatusBarRight(:activeTab="activeTab" @toggleTab="handleToggleTab" class="flex-shrink-0")
</template>

<style scoped>
@reference "tailwindcss";

.LFM-status-bar {
  @apply flex shrink-0 items-center justify-between h-full bg-slate-800 select-none text-xs text-slate-300;
  border-top: 1px solid rgb(30 41 59 / 0.5);
  gap: 0;
}

.LFM-status-panel {
  min-height: 280px;
}
</style>
