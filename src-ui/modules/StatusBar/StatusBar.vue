<script setup lang="ts">
import { computed, onMounted, onUnmounted, watch } from 'vue';
import { useFileManagerStore } from '@/stores/file-manager';
import { useConfigStore } from '@/stores/config';
import { useStatusBarStore, type StatusTab } from "@/stores/useStatusBar.ts";
import StatusBarLeft from "./components/StatusBarLeft.vue";
import StatusBarRight from "./components/StatusBarRight.vue";
import StatusBarPanel from "./components/StatusBarPanel.vue";
import ResizableModal from "@/components/ui/ResizableModal.vue";

const store = useFileManagerStore();
const configStore = useConfigStore();
const { panelOpen, activeTab, openPanel, togglePanel, closePanel } = useStatusBarStore();
const currentPath = computed(() => store.currentPath);

function handleToggleTab(tab: StatusTab) {
  togglePanel(tab);
}

function handleChangeTab(tab: StatusTab) {
  openPanel(tab);
}

function onWindowResize() {
  store.reconcileRightPanelWidths();
}

onMounted(() => {
  store.reconcileRightPanelWidths();
  window.addEventListener('resize', onWindowResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', onWindowResize);
});


onMounted(async () => {
  await configStore.loadConfig();
  store.initializeHomeDir();
  store.fetchDrives();
});


//! FIXME
// Automatic Close/open to the StatusBarPanel based on statusBarHeight
watch(
  () => store.statusBarHeight,
  (statusBarHeight) => {
    if (statusBarHeight <= store.MIN_STATUS_BAR_HEIGHT) {
      statusBarHeight = 0;
      // closePanel();
      useStatusBarStore().panelOpen = false;
      store.statusBarOpen = false;
    } else {
      openPanel("terminal");
      // panelOpen.value = true;
    }
  },
);


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
    StatusBarRight(:activeTab="activeTab" @toggleTab="handleToggleTab" class="shrink-0")
</template>
