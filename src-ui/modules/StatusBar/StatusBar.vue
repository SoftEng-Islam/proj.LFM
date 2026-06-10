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
// const configStore = useConfigStore();
const { isWorkspaceOpen, activeTab, openWorkspace, toggleWorkspace, closeWorkspace } = useStatusBarStore();
const currentPath = computed(() => store.currentPath);

console.log(`isWorkspaceOpen: ${isWorkspaceOpen}`);
console.log(`activeTab: ${activeTab}`);

const itemCount = computed(() => store.currentEntries.length);
const selectedCount = computed(() => (store.selectedItem ? 1 : 0));
const selectedLabel = computed(() => (selectedCount.value > 0 ? `${selectedCount.value} item selected` : ''));

const tabs = [
  { id: 'terminal', label: 'Terminal', icon: IconTerminal },
  { id: 'log', label: 'Logs', icon: IconArticle },
  { id: 'git', label: 'Git', icon: IconGitBranch },
  { id: 'tasks', label: 'Tasks', icon: IconPendingActions },
] as const;

watch(
  () => store.statusBarHeight,
  (statusBarHeight) => {
    if (statusBarHeight <= store.MIN_STATUS_BAR_HEIGHT) {
      closeWorkspace();
    } else {
      openWorkspace(activeTab);
    }
  },
);

// function onWindowResize() {
//   store.reconcileRightPanelWidths();
// }

// onMounted(() => {
//   store.reconcileRightPanelWidths();
//   window.addEventListener('resize', onWindowResize);
// });

// onUnmounted(() => {
//   window.removeEventListener('resize', onWindowResize);
// });

// onMounted(async () => {
//   await configStore.loadConfig();
//   store.initializeHomeDir();
//   store.fetchDrives();
// });
</script>

<template lang="pug">
div(class="relative")
  ResizableModal(
    v-if="store.statusBarOpen"
    kind="StatusBar"
    :height="store.statusBarHeight"
    direction="top"
    ariaLabel="Status Bar"
    resizerAriaLabel="Resize Status Bar. Double-click to reset height."
    @update:height="store.setStatusBarHeight($event)"
    @reset="store.resetStatusBarHeight()"
  )
    //- Status Bar Head
    div(class="h-12 flex flex-row items-center justify-between bg-(--color-base-200) border-b border-(--color-base-300)")
      //- Left Side
      div(class="flex items-center")
        button(
          v-for="tab in tabs"
          :key="tab.id"
          type="button"
          class="inline-flex items-center gap-2 px-4 py-3 text-xs transition border-b-2 whitespace-nowrap text-(--color-base-content) hover:text-(--color-primary) hover:bg-(--color-base-100) cursor-pointer"
          :class="activeTab === tab.id && isWorkspaceOpen ? 'border-(--color-primary) bg-(--color-primary)/30' : 'border-transparent'"
          @click="toggleWorkspace(tab.id)"
        )
          component(:is="tab.icon" class="w-4 h-4")
          span {{ tab.label }}

      //- Right Side
      div(class="flex flex-row items-center pr-4")
        div(class="flex items-center gap-3 px-3 py-1 text-xs text-(--color-base-content)")
          span {{ itemCount }} items
          template(v-if="selectedLabel")
            span(class="text-(--color-primary)") •
            span(class="text-(--color-base-content)") {{ selectedLabel }}
        //- Close Button (Minimize)
        button(v-if="isWorkspaceOpen.valueOf()" class="inline-flex h-8 w-8 items-center justify-center text-(--color-primary) bg-(--color-primary)/20 rounded-md transition ml-2 cursor-pointer" type="button" @click="closeWorkspace()" aria-label="Close status Workspace")
          IconClose(class="w-4 h-4")

    //- Workspace (The Content)
    div(v-if="isWorkspaceOpen" class="overflow-hidden bg-(--color-base-300) border-t border-(--color-base-100) shadow-2xl")
      div(class="h-64 overflow-hidden bg-(--color-base-300)")
        div(class="h-full overflow-auto p-4 text-(--color-base-content)")
          TerminalTab(v-if="activeTab === 'terminal'" :cwd="currentPath")
          LogTab(v-else-if="activeTab === 'log'")
          GitTab(v-else-if="activeTab === 'git'" :cwd="currentPath")
          TasksTab(v-else-if="activeTab === 'tasks'")
</template>
