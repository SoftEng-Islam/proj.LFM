<script setup lang="ts">
import { computed } from "vue";
import { useFileManagerStore } from "@/stores/file-manager";
import { useStatusBar, type StatusTab } from "./useStatusBar";
import StatusBarLeft from "./components/StatusBarLeft.vue";
import StatusBarRight from "./components/StatusBarRight.vue";
import StatusBarPanel from "./components/StatusBarPanel.vue";

const store = useFileManagerStore();
const { panelOpen, activeTab, activePanelTab, selectTab, togglePanel, closePanel } = useStatusBar();
const currentPath = computed(() => store.currentPath);

function handleToggleTab(tab: StatusTab) {
  togglePanel(tab);
}

function handleChangeTab(tab: StatusTab) {
  selectTab(tab);
}
</script>

<template lang="pug">
div(class="relative")
  ResizableModal(
    v-if="store.statusBarOpen && panelOpen"
    kind="StatusBar"
    :height="store.statusBarHeight"
    direction="top"
    ariaLabel="Status Bar"
    resizerAriaLabel="Resize Status Bar. Double-click to reset height."
    @update:height="store.setStatusBarHeight($event)"
    @reset="store.resetStatusBarHeight()"
  )
    StatusBarPanel(:activeTab="activeTab" :cwd="currentPath" @changeTab="handleChangeTab" @close="closePanel")
  footer(class="LFM-status-bar h-10 flex items-center justify-between px-3 py-2 text-sm" role="status" aria-label="Status bar")
    StatusBarLeft(class="flex-1")
    StatusBarRight(:activeTab="activePanelTab" @toggleTab="handleToggleTab" class="flex-shrink-0")
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
