<script setup lang="ts">
import { computed } from "vue";
import { useFileManagerStore } from "@/stores/file-manager";
import { useStatusBar, type StatusTab } from "./useStatusBar.ts";
import StatusBarLeft from "./components/StatusBarLeft.vue";
import StatusBarRight from "./components/StatusBarRight.vue";
import StatusBarPanel from "./components/StatusBarPanel.vue";

const store = useFileManagerStore();
const { panelOpen, activeTab, activePanelTab, panelHeight, selectTab, togglePanel, closePanel, setPanelHeight } = useStatusBar();
const currentPath = computed(() => store.currentPath);

function handleToggleTab(tab: StatusTab) {
    togglePanel(tab);
}

function handleChangeTab(tab: StatusTab) {
    selectTab(tab);
}
</script>

<template lang="pug">
div(class="relative h-full w-full")

  StatusBarPanel(
    v-if="panelOpen"
    :activeTab="activeTab"
    :cwd="currentPath"
    :height="panelHeight"
    @changeTab="handleChangeTab"
    @update:height="setPanelHeight"
    @close="closePanel"
  )
  footer(class="LFM-status-bar" role="status" aria-label="Status bar")
    StatusBarLeft(class="flex-1")
    StatusBarRight(:activeTab="activePanelTab" @toggleTab="handleToggleTab" class="flex-shrink-0")
</template>

<style scoped>
@reference "tailwindcss";

.LFM-status-bar {
    @apply flex h-full min-h-6 shrink-0 select-none items-center justify-between gap-2 overflow-hidden bg-slate-800 px-2 text-xs text-slate-300;
    border-top: 1px solid rgb(30 41 59 / 0.55);
    box-shadow: inset 0 1px 0 rgb(148 163 184 / 0.06);
}

</style>
