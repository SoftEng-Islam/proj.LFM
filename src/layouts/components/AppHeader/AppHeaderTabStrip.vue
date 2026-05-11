<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useFileManagerStore } from '@/stores/file-manager';
import IconAdd from '~icons/material-symbols/add';
import IconFolder from '~icons/material-symbols/folder';

const store = useFileManagerStore();
const router = useRouter();

function handleCloseTab(tabId: string) {
    const idx = store.windowTabs.findIndex((t: any) => t.id === tabId);
    if (idx === -1) return;
    
    const isActive = store.currentPath === store.windowTabs[idx]?.sectionId;
    store.closeTab(tabId);
    
    if (isActive) {
        const next = store.windowTabs[Math.max(0, idx - 1)];
        if (next) router.push(next.path);
    }
}

function handleNewTab() {
    const id = store.addTab();
    const tab = store.windowTabs.find((t: any) => t.id === id);
    if (tab) router.push(tab.path);
}
</script>

<template>
    <div class="LFM-tab-row" data-tauri-drag-region>
        <div class="LFM-tab-strip pl-2" role="tablist">
            <RouterLink
                v-for="tab in store.windowTabs"
                :key="tab.id"
                :to="tab.path"
                class="LFM-tab"
                :class="{ 'LFM-tab--active': store.currentPath === tab.sectionId }"
                role="tab"
                :aria-selected="store.currentPath === tab.sectionId"
            >
                <IconFolder class="LFM-tab-icon text-amber-500" />
                <span class="LFM-tab-label">{{ tab.label }}</span>
                <button 
                    v-if="store.windowTabs.length > 1"
                    class="LFM-tab-close" 
                    title="Close tab" 
                    @click.prevent="handleCloseTab(tab.id)"
                >×</button>
            </RouterLink>
            
            <button
                class="LFM-new-tab"
                title="New tab"
                @click="handleNewTab"
            >
                <IconAdd />
            </button>
        </div>

        <div class="LFM-tab-drag" data-tauri-drag-region />
    </div>
</template>

<style scoped lang="scss">
@reference "tailwindcss";
.LFM-tab-row {
    display: flex;
    align-items: stretch;
    height: 36px;
    background: var(--LFM-title-bar);
    border-bottom: 1px solid var(--LFM-border);
    flex-shrink: 0;
    user-select: none;
}

.LFM-tab-strip {
    display: flex;
    align-items: stretch;
    height: 100%;
    flex-shrink: 0;
}

.LFM-tab {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 0 12px;
    min-width: 120px;
    max-width: 200px;
    height: 100%;
    cursor: pointer;
    color: var(--LFM-text);
    border-right: 1px solid var(--LFM-border);
    transition: all 150ms ease;
    font-size: 12px;
    text-decoration: none;
    flex-shrink: 0;
    @apply rounded-t-lg;

    &:hover {
        background: var(--LFM-hover);
    }

    &--active {
        background: var(--LFM-panel);
        border-bottom: none;
        position: relative;
        
        &::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 2px;
            background: var(--LFM-blue);
        }
    }
}

.LFM-tab-icon {
    font-size: 16px;
}

.LFM-tab-label {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.LFM-tab-close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    border-radius: 4px;
    background: transparent;
    border: none;
    cursor: pointer;
    color: var(--LFM-text);
    font-size: 14px;
    opacity: 0.5;
    transition: all 150ms ease;

    &:hover {
        background: #c42b1c;
        color: white;
        opacity: 1;
    }
}

.LFM-new-tab {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    margin: auto 6px;
    border-radius: 6px;
    background: transparent;
    border: none;
    cursor: pointer;
    color: var(--LFM-text);
    font-size: 18px;
    transition: all 150ms ease;

    &:hover {
        background: var(--LFM-hover);
        @apply shadow-sm;
    }
}

.LFM-tab-drag {
    flex: 1;
    -webkit-app-region: drag;
    app-region: drag;
}
</style>
