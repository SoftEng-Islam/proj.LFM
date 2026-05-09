<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, computed } from 'vue';
import { useFileManagerStore } from '@/stores/file-manager';
import { useToast } from 'vue-toastification';

// Icons
import IconOpen from '~icons/material-symbols/open-in-new';
import IconTab from '~icons/material-symbols/tab';
import IconWindow from '~icons/material-symbols/window';
import IconPane from '~icons/material-symbols/splitscreen';
import IconLink from '~icons/material-symbols/link';
import IconFolder from '~icons/material-symbols/folder-zip';
import IconShortcut from '~icons/material-symbols/open-in-new';
import IconPushPin from '~icons/material-symbols/push-pin';
import IconArchive from '~icons/material-symbols/archive';
import IconSend from '~icons/material-symbols/send';
import IconTerminal from '~icons/material-symbols/terminal';
import IconLabel from '~icons/material-symbols/label';
import IconMore from '~icons/material-symbols/more-horiz';

import IconCut from '~icons/material-symbols/content-cut';
import IconCopy from '~icons/material-symbols/content-copy';
import IconPaste from '~icons/material-symbols/content-paste';
import IconEdit from '~icons/material-symbols/edit';
import IconDelete from '~icons/material-symbols/delete';
import IconSettings from '~icons/material-symbols/settings';

const props = defineProps<{
    x: number;
    y: number;
    itemName?: string;
    filePath?: string;
}>();

const emit = defineEmits<{
    close: [];
    rename: [];
}>();

const store = useFileManagerStore();
const toast = useToast();
const menuRef = ref<HTMLElement>();

function close() { emit('close'); }
function onKeydown(e: KeyboardEvent) { if (e.key === 'Escape') close(); }
function onClickOutside(e: MouseEvent) {
    if (menuRef.value && !menuRef.value.contains(e.target as Node)) close();
}

onMounted(() => {
    document.addEventListener('mousedown', onClickOutside, true);
    document.addEventListener('keydown', onKeydown);
});
onBeforeUnmount(() => {
    document.removeEventListener('mousedown', onClickOutside, true);
    document.removeEventListener('keydown', onKeydown);
});

// Actions
async function handleOpen() {
    if (props.filePath) {
        await store.openItem(props.filePath);
    }
    close();
}

function handleOpenNewTab() {
    if (props.filePath) {
        store.addTab(props.filePath);
    }
    close();
}

async function handleCopyPath() {
    if (props.filePath) {
        try {
            await navigator.clipboard.writeText(props.filePath);
            toast.success('Path copied to clipboard');
        } catch (e) {
            toast.error('Failed to copy path');
        }
    }
    close();
}

function handleDelete() {
    store.deleteSelection();
    close();
}

function handleOpenTerminal() {
    if (props.filePath) {
        // If it's a file, we might want the parent dir. 
        // For now, just pass the path.
        store.openInTerminal(props.filePath);
    }
    close();
}

const commandActions = computed(() => [
    { icon: IconCut, title: 'Cut', action: () => { toast.info('Cut not implemented yet'); close(); } },
    { icon: IconCopy, title: 'Copy', action: () => { toast.info('Copy not implemented yet'); close(); } },
    { icon: IconPaste, title: 'Paste', action: () => { toast.info('Paste not implemented yet'); close(); } },
    { icon: IconEdit, title: 'Rename', action: () => { emit('rename'); close(); } },
    { icon: IconDelete, title: 'Delete', action: handleDelete },
    { icon: IconSettings, title: 'Properties', action: () => { toast.info('Properties not implemented yet'); close(); } },
]);

const menuItems = computed(() => [
    { icon: IconOpen, label: 'Open', action: handleOpen },
    { icon: IconTab, label: 'Open in New Tab', action: handleOpenNewTab },
    { icon: IconWindow, label: 'Open in New Window', action: () => close() },
    { icon: IconPane, label: 'Open in New Pane', action: () => close() },
    { divider: true },
    { icon: IconLink, label: 'Copy Item Path', action: handleCopyPath },
    { icon: IconFolder, label: 'Create Folder from Selection', action: () => close() },
    { icon: IconShortcut, label: 'Create Shortcut', action: () => close() },
    { icon: IconPushPin, label: 'Pin to Sidebar', action: () => { store.togglePinnedForSelection(); close(); } },
    { divider: true },
    { icon: IconArchive, label: 'Compress', hasArrow: true, action: () => close() },
    { icon: IconSend, label: 'Send To', hasArrow: true, action: () => close() },
    { divider: true },
    { icon: IconTerminal, label: 'Open in Terminal', action: handleOpenTerminal },
    { icon: IconLabel, label: 'Edit Tags', hasArrow: true, action: () => close() },
    { divider: true },
    { icon: IconMore, label: 'Show more options', hasArrow: true, action: () => close() },
]);
</script>

<template>
    <Teleport to="body">
        <div ref="menuRef" class="LFM-context-menu" :style="{ left: `${x}px`, top: `${y}px` }" role="menu">
            <div class="LFM-context-toolbar">
                <button v-for="cmd in commandActions" :key="cmd.title" class="LFM-context-cmd" :title="cmd.title" @click="cmd.action">
                    <component :is="cmd.icon" class="LFM-context-cmd-icon" />
                </button>
            </div>

            <div class="LFM-context-divider" />

            <template v-for="(item, i) in menuItems" :key="i">
                <div v-if="'divider' in item && item.divider" class="LFM-context-divider" />
                <button v-else-if="'label' in item" class="LFM-context-item" role="menuitem" @click="item.action && item.action()">
                    <component :is="item.icon" class="LFM-context-item-icon" />
                    <span class="LFM-context-item-label">{{ item.label }}</span>
                    <span v-if="'hasArrow' in item && item.hasArrow" class="LFM-context-item-arrow">›</span>
                </button>
            </template>
        </div>
    </Teleport>
</template>

<style scoped lang="scss">
@reference "tailwindcss";
.LFM-context-menu {
    position: fixed;
    z-index: 9999;
    min-width: 260px;
    background: var(--LFM-context-bg);
    backdrop-filter: blur(12px);
    border: 1px solid var(--LFM-context-border);
    border-radius: 12px;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4);
    padding: 6px;
    color: var(--LFM-context-text);
    font-size: 13px;
    user-select: none;
    animation: menu-pop 150ms ease-out;
}

@keyframes menu-pop {
    from { opacity: 0; transform: scale(0.95) translateY(-10px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
}

.LFM-context-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-around;
    padding: 4px;
}

.LFM-context-cmd {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 8px;
    background: transparent;
    border: none;
    cursor: pointer;
    color: var(--LFM-context-text);
    transition: all 150ms ease;

    &:hover {
        background: var(--LFM-context-hover);
        color: var(--LFM-blue);
    }
}

.LFM-context-cmd-icon {
    font-size: 18px;
}

.LFM-context-divider {
    height: 1px;
    background: var(--LFM-context-divider);
    margin: 6px 4px;
    opacity: 0.6;
}

.LFM-context-item {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 8px 12px;
    border-radius: 6px;
    background: transparent;
    border: none;
    cursor: pointer;
    color: var(--LFM-context-text);
    text-align: left;
    transition: all 150ms ease;

    &:hover {
        background: var(--LFM-context-hover);
    }
}

.LFM-context-item-icon {
    font-size: 18px;
    width: 20px;
    text-align: center;
    flex-shrink: 0;
    opacity: 0.8;
}

.LFM-context-item-label {
    flex: 1;
}

.LFM-context-item-arrow {
    opacity: 0.4;
    font-size: 16px;
}
</style>
