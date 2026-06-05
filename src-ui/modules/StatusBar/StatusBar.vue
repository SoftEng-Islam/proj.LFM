<script setup lang="ts">
import { computed } from 'vue';
import { useFileManagerStore } from '@/stores/file-manager';

const store = useFileManagerStore();

const itemCount = computed(() => store.currentEntries.length);
const selectedCount = computed(() => (store.selectedItem ? 1 : 0));
const selectedLabel = computed(() => (selectedCount.value > 0 ? `${selectedCount.value} item selected` : ''));
</script>

<template lang="pug">
footer(class="LFM-status-bar" role="status" aria-label="Status bar" class="")
  div(class="head w-full flex items-center h-4 gap-2")
    span(class="LFM-status-count") {{ itemCount }} items
    template(v-if="selectedLabel")
      span(class="LFM-status-sep") |
      span(class="LFM-status-selected") {{ selectedLabel }}
</template>

<style scoped>
@reference "tailwindcss";

.LFM-status-bar {
  @apply flex shrink-0 items-center gap-2 h-full px-3 py-0 bg-(--color-base-300) select-none text-sm text-(--color-base-content);
  border-top: 1px solid color-mix(in srgb, var(--color-base-content) 10%, transparent);
}

.LFM-status-sep {
  opacity: 0.35;
}

.LFM-status-selected {
  color: var(--color-base-content);
}
</style>
