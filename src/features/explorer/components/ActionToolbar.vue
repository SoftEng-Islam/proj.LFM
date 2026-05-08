<script setup lang="ts">
import { computed } from 'vue';
import { useToast } from 'vue-toastification';

import { useFileManagerStore } from '@/stores/file-manager';

const store = useFileManagerStore();
const toast = useToast();

const sortLabel = computed(() => {
    switch (store.sortMode) {
        case 'name':
            return 'Name';
        case 'size':
            return 'Size';
        case 'kind':
            return 'Type';
        case 'modified':
        default:
            return 'Modified';
    }
});

function createFolder() {
    const folder = store.createFolder();
    toast.success(`${folder.name} created.`);
}

function cycleSort() {
    store.cycleSortMode();
}

function setView(mode: 'grid' | 'list') {
    store.setViewMode(mode);
}

function togglePreview() {
    store.togglePreviewPane();
}
</script>

<template>
    <div class="LFM-toolbar">
        <!-- Row 1: Command ribbon -->
        <div class="LFM-ribbon" role="toolbar" aria-label="Command bar">
            <!-- Left command group -->
            <div class="LFM-ribbon-group">
                <!-- New (with label + dropdown) -->
                <button class="LFM-ribbon-btn LFM-ribbon-btn--new" title="New" @click="createFolder">
                    <span class="LFM-ribbon-btn-icon">＋</span>
                    <span class="LFM-ribbon-btn-label">New</span>
                    <span class="LFM-ribbon-btn-arrow">▾</span>
                </button>

                <div class="LFM-ribbon-sep" />

                <!-- Icon-only commands -->
                <button class="LFM-ribbon-btn" title="Cut"><span>✂</span></button>
                <button class="LFM-ribbon-btn" title="Copy to clipboard"><span>⧉</span></button>
                <button class="LFM-ribbon-btn" title="Paste"><span>📋</span></button>
                <button class="LFM-ribbon-btn" title="Create shortcut / Send to"><span>↩</span></button>
                <button class="LFM-ribbon-btn" title="Rename" @click="() => {}"><span>✏</span></button>
                <button class="LFM-ribbon-btn" title="Properties"><span>🔧</span></button>
                <button class="LFM-ribbon-btn" title="Delete"><span>🗑</span></button>
                <button class="LFM-ribbon-btn" title="More options"><span>…</span></button>
            </div>

            <!-- Right side controls -->
            <div class="LFM-ribbon-right">
                <!-- Filter icon -->
                <button class="LFM-ribbon-btn" title="Filter">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M1 2h12l-5 6v4l-2-1V8L1 2z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round" fill="none" />
                    </svg>
                </button>

                <!-- Gallery/Group sort dropdown -->
                <button class="LFM-ribbon-btn LFM-ribbon-btn--dropdown" title="Sort by" @click="cycleSort">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M2 4h10M2 7h7M2 10h4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" />
                        <path d="M11 8l2 2-2 2" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                    <span class="LFM-ribbon-btn-label">{{ sortLabel }}</span>
                    <span class="LFM-ribbon-btn-arrow">▾</span>
                </button>

                <div class="LFM-ribbon-sep" />

                <!-- View mode buttons -->
                <button
                    class="LFM-ribbon-btn"
                    :class="{ 'LFM-ribbon-btn--active': store.viewMode !== 'list' }"
                    title="Icon view"
                    @click="setView('grid')"
                >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.2" />
                        <rect x="8" y="1" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.2" />
                        <rect x="1" y="8" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.2" />
                        <rect x="8" y="8" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.2" />
                    </svg>
                </button>
                <button
                    class="LFM-ribbon-btn"
                    :class="{ 'LFM-ribbon-btn--active': store.viewMode === 'list' }"
                    title="Details view"
                    @click="setView('list')"
                >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <rect x="1" y="2" width="3" height="3" rx="0.5" stroke="currentColor" stroke-width="1.2" />
                        <path d="M6 3.5h7" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" />
                        <rect x="1" y="7.5" width="3" height="3" rx="0.5" stroke="currentColor" stroke-width="1.2" />
                        <path d="M6 9h7" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" />
                    </svg>
                </button>

                <div class="LFM-ribbon-sep" />

                <!-- Preview pane toggle -->
                <button class="LFM-ribbon-btn" :class="{ 'LFM-ribbon-btn--active': store.previewOpen }" title="Preview pane" @click="togglePreview">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <rect x="1" y="1" width="8" height="12" rx="1" stroke="currentColor" stroke-width="1.2" />
                        <rect x="11" y="1" width="2" height="12" rx="0.5" stroke="currentColor" stroke-width="1.2" />
                    </svg>
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.LFM-toolbar {
    border-bottom: 1px solid var(--LFM-border);
    background: var(--LFM-toolbar);
    flex-shrink: 0;
}

.LFM-ribbon {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 40px;
    padding: 0 8px;
    gap: 4px;
}

.LFM-ribbon-group {
    display: flex;
    align-items: center;
    gap: 1px;
}

.LFM-ribbon-right {
    display: flex;
    align-items: center;
    gap: 1px;
}

.LFM-ribbon-sep {
    width: 1px;
    height: 20px;
    background: var(--LFM-border);
    margin: 0 4px;
}

.LFM-ribbon-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    height: 30px;
    padding: 0 8px;
    border-radius: 4px;
    background: transparent;
    border: none;
    cursor: pointer;
    color: var(--LFM-text);
    font-size: 12px;
    transition: background 100ms;
    white-space: nowrap;
}
.LFM-ribbon-btn:hover {
    background: var(--LFM-hover);
}
.LFM-ribbon-btn:active {
    background: var(--LFM-active);
}
.LFM-ribbon-btn--active {
    background: var(--LFM-selected);
}
.LFM-ribbon-btn--new {
    font-weight: 600;
    border: 1px solid var(--LFM-border);
    background: var(--LFM-panel);
}
.LFM-ribbon-btn--new:hover {
    background: var(--LFM-hover);
}
.LFM-ribbon-btn--dropdown {
    border: 1px solid var(--LFM-border);
}

.LFM-ribbon-btn-icon {
    font-size: 14px;
}

.LFM-ribbon-btn-label {
    font-size: 12px;
}

.LFM-ribbon-btn-arrow {
    font-size: 8px;
    opacity: 0.6;
}
</style>
