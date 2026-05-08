<script setup lang="ts">
import { computed } from 'vue';
import { useFileManagerStore } from '@/stores/file-manager';

const store = useFileManagerStore();

const itemCount = computed(() => store.currentEntries.length);
const selectedCount = computed(() => (store.selectedItem ? 1 : 0));
const selectedLabel = computed(() => (selectedCount.value > 0 ? `${selectedCount.value} item selected` : ''));
</script>

<template>
    <footer class="LFM-status-bar" role="status" aria-label="Status bar">
        <span class="LFM-status-count">{{ itemCount }} items</span>
        <template v-if="selectedLabel">
            <span class="LFM-status-sep">|</span>
            <span class="LFM-status-selected">{{ selectedLabel }}</span>
        </template>
    </footer>
</template>

<style scoped>
.LFM-status-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    height: 24px;
    padding: 0 12px;
    background: var(--LFM-status-bg);
    border-top: 1px solid var(--LFM-border);
    font-size: 11px;
    color: var(--LFM-text);
    flex-shrink: 0;
    user-select: none;
}

.LFM-status-sep {
    opacity: 0.35;
}

.LFM-status-selected {
    color: var(--LFM-text);
}
</style>
