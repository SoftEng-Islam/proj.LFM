<script setup lang="ts">
import { computed, onMounted, onUnmounted, watch } from 'vue';
import { useFileManagerStore } from '@/stores/file-manager';
import { useConfigStore } from '@/stores/config';
import { useStatusBarStore, type StatusTab } from "@/stores/useStatusBar.ts";
import ResizableModal from "@/components/ui/ResizableModal.vue";

// Icons
import IconClose from '~icons/material-symbols/close';
import IconTerminal from '~icons/material-symbols/terminal';
import IconArticle from '~icons/material-symbols/article';
import IconGitBranch from '~icons/material-symbols/alt-route';
import IconPendingActions from '~icons/material-symbols/pending-actions';

// Tabs
import TerminalTab from './components/TerminalTab.vue';
import LogTab from './components/LogTab.vue';
import GitTab from './components/GitTab.vue';
import TasksTab from './components/TasksTab.vue';

// Constants
const store = useFileManagerStore();
const configStore = useConfigStore();
const { panelOpen, activeTab, openPanel, togglePanel, closePanel } = useStatusBarStore();
const currentPath = computed(() => store.currentPath);


const itemCount = computed(() => store.currentEntries.length);
const selectedCount = computed(() => (store.selectedItem ? 1 : 0));
const selectedLabel = computed(() => (selectedCount.value > 0 ? `${selectedCount.value} item selected` : ''));

const tabs = [
  { id: 'terminal', label: 'Terminal', icon: IconTerminal },
  { id: 'log', label: 'Logs', icon: IconArticle },
  { id: 'git', label: 'Git', icon: IconGitBranch },
  { id: 'tasks', label: 'Tasks', icon: IconPendingActions },
] as const;

function handleTabChange(tab: 'terminal' | 'log' | 'git' | 'tasks') {
  // emit('changeTab', tab);
}

function handleToggleTab(tab: StatusTab) {
  togglePanel(tab);
}

function handleChangeTab(tab: StatusTab) {
  togglePanel(tab);
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
      useStatusBarStore().closePanel();
    }
    // else if (statusBarHeight > store.MIN_STATUS_BAR_HEIGHT && !useStatusBarStore().panelOpen) {
    //   useStatusBarStore().openPanel('terminal');
    // }
  },
);
</script>

<template lang="pug">
div(class="relative")
  ResizableModal(
    v-if="store.statusBarOpen && useStatusBarStore().panelOpen"
    kind="StatusBar"
    :height="store.statusBarHeight"
    direction="top"
    ariaLabel="Status Bar"
    resizerAriaLabel="Resize Status Bar. Double-click to reset height."
    @update:height="store.setStatusBarHeight($event)"
    @reset="store.resetStatusBarHeight()"
  )
    //- Status Bar Head
    div(class="flex items-center justify-between bg-slate-800 border-b border-slate-700")
      //- Left Side
      div(class="flex items-center")
        button(
          v-for="tab in tabs"
          :key="tab.id"
          type="button"
          class="inline-flex items-center gap-2 px-4 py-3 text-xs font-medium transition border-b-2 whitespace-nowrap text-slate-400 hover:text-slate-200"
          :class="activeTab === tab.id ? 'border-blue-500 text-slate-100 bg-slate-700/30' : 'border-transparent'"
          @click="handleTabChange(tab.id)"
        )
          component(:is="tab.icon" class="w-4 h-4")
          span {{ tab.label }}

      //- Right Side
      div(class="Right-Side")
        div(class="flex items-center gap-3 px-3 py-1 text-xs text-slate-400")
          span {{ itemCount }} items
          template(v-if="selectedLabel")
            span(class="text-slate-500") •
            span(class="text-slate-300") {{ selectedLabel }}
        //- Close Button (Minimize)
        button(class="inline-flex h-8 w-8 items-center justify-center text-slate-400 hover:text-slate-100 transition mr-2" type="button" @click="emit('close')" aria-label="Close status panel")
          IconClose(class="w-4 h-4")

    //- Workspace (The Content)
    div(class="LFM-status-panel overflow-hidden bg-(--color-base-300) border-t border-(--color-base-100) shadow-2xl")
      div(class="h-64 overflow-hidden bg-slate-900")
        div(class="h-full overflow-auto p-4 text-slate-300")
          TerminalTab(v-if="activeTab === 'terminal'" :cwd="currentPath")
          LogTab(v-else-if="activeTab === 'log'")
          GitTab(v-else-if="activeTab === 'git'" :cwd="currentPath")
          TasksTab(v-else-if="activeTab === 'tasks'")
    //- StatusBarPanel(:activeTab="activeTab" :cwd="currentPath" @changeTab="handleChangeTab" @close="closePanel")
    //- StatusBarRight(:activeTab="activeTab" @toggleTab="handleToggleTab" class="shrink-0")
</template>
