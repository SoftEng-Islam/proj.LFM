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

<template>
  <div class="relative h-full w-full">
    <StatusBarPanel v-if="panelOpen" :activeTab="activeTab" :cwd="currentPath" @changeTab="handleChangeTab" @close="closePanel" />

    <footer class="LFM-status-bar flex items-center justify-between px-3 py-2 text-sm" role="status" aria-label="Status bar">
      <StatusBarLeft />
      <StatusBarRight :activeTab="activeTab" @toggleTab="handleToggleTab" />
    </footer>
  </div>
</template>

<style scoped>
@reference "tailwindcss";

.LFM-status-bar {
  @apply flex shrink-0 items-center justify-between gap-2 h-full bg-(--color-base-300) select-none text-sm text-(--color-base-content);
  border-top: 1px solid color-mix(in srgb, var(--color-base-content) 10%, transparent);
}

.LFM-status-panel {
  min-height: 280px;
}
</style>
