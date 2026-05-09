<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useToast } from 'vue-toastification';

import BaseButton from '@/components/ui/BaseButton.vue';
import { convertFileSrc, getVideoThumbnail } from '@/services/tauri-bridge';
import { useFileManagerStore } from '@/stores/file-manager';
import type { FileEntry } from '@/types/file-manager';
import type { AccentTone, FileStatus } from '@/types/file-manager';

const accentThemeMap: Record<
    AccentTone,
    {
        chip: string;
        bar: string;
        surface: string;
        ring: string;
        glow: string;
    }
> = {
    sky: {
        chip: 'bg-sky-500/12 text-sky-700 dark:bg-sky-400/12 dark:text-sky-200',
        bar: 'bg-sky-500',
        surface: 'from-sky-500/12 via-sky-500/3 to-transparent',
        ring: 'ring-sky-300/50',
        glow: 'shadow-[0_18px_34px_rgba(14,165,233,0.18)]',
    },
    emerald: {
        chip: 'bg-emerald-500/12 text-emerald-700 dark:bg-emerald-400/12 dark:text-emerald-200',
        bar: 'bg-emerald-500',
        surface: 'from-emerald-500/12 via-emerald-500/3 to-transparent',
        ring: 'ring-emerald-300/50',
        glow: 'shadow-[0_18px_34px_rgba(16,185,129,0.18)]',
    },
    amber: {
        chip: 'bg-amber-500/12 text-amber-700 dark:bg-amber-400/12 dark:text-amber-200',
        bar: 'bg-amber-500',
        surface: 'from-amber-500/12 via-amber-500/3 to-transparent',
        ring: 'ring-amber-300/50',
        glow: 'shadow-[0_18px_34px_rgba(245,158,11,0.18)]',
    },
    violet: {
        chip: 'bg-violet-500/12 text-violet-700 dark:bg-violet-400/12 dark:text-violet-200',
        bar: 'bg-violet-500',
        surface: 'from-violet-500/12 via-violet-500/3 to-transparent',
        ring: 'ring-violet-300/50',
        glow: 'shadow-[0_18px_34px_rgba(139,92,246,0.18)]',
    },
    rose: {
        chip: 'bg-rose-500/12 text-rose-700 dark:bg-rose-400/12 dark:text-rose-200',
        bar: 'bg-rose-500',
        surface: 'from-rose-500/12 via-rose-500/3 to-transparent',
        ring: 'ring-rose-300/50',
        glow: 'shadow-[0_18px_34px_rgba(244,63,94,0.18)]',
    },
    cyan: {
        chip: 'bg-cyan-500/12 text-cyan-700 dark:bg-cyan-400/12 dark:text-cyan-200',
        bar: 'bg-cyan-500',
        surface: 'from-cyan-500/12 via-cyan-500/3 to-transparent',
        ring: 'ring-cyan-300/50',
        glow: 'shadow-[0_18px_34px_rgba(6,182,212,0.18)]',
    },
    slate: {
        chip: 'bg-slate-500/12 text-slate-700 dark:bg-slate-400/12 dark:text-slate-200',
        bar: 'bg-slate-500',
        surface: 'from-slate-500/12 via-slate-500/3 to-transparent',
        ring: 'ring-slate-300/50',
        glow: 'shadow-[0_18px_34px_rgba(100,116,139,0.18)]',
    },
};

const statusToneMap: Record<FileStatus, string> = {
    synced: 'bg-emerald-500/12 text-emerald-700 dark:bg-emerald-400/12 dark:text-emerald-200',
    shared: 'bg-cyan-500/12 text-cyan-700 dark:bg-cyan-400/12 dark:text-cyan-200',
    draft: 'bg-amber-500/12 text-amber-700 dark:bg-amber-400/12 dark:text-amber-200',
    favorite: 'bg-rose-500/12 text-rose-700 dark:bg-rose-400/12 dark:text-rose-200',
    local: 'bg-slate-500/12 text-slate-700 dark:bg-slate-400/12 dark:text-slate-200',
    recent: 'bg-violet-500/12 text-violet-700 dark:bg-violet-400/12 dark:text-violet-200',
};

const categorySymbolMap: Record<string, string> = {
    folder: 'F',
    document: 'D',
    spreadsheet: 'X',
    image: 'P',
    video: 'V',
    archive: 'Z',
    code: '</>',
    pdf: 'PDF',
    audio: 'A',
};

const store = useFileManagerStore();
const toast = useToast();

const selectedItem = computed(() => store.selectedItem);

const isImage = computed(() => selectedItem.value?.category === 'image');
const isVideo = computed(() => selectedItem.value?.category === 'video');
const isPreviewable = computed(() => !!selectedItem.value?.preview);

const previewSrc = computed(() => selectedItem.value?.preview || '');
const imageError = ref(false);

watch(selectedItem, () => {
    imageError.value = false;
});

const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: 'numeric', minute: '2-digit'
    }).format(new Date(dateStr));
};

function handleOpen() {
    if (selectedItem.value) store.openItem(selectedItem.value.id);
}

function copyPath() {
    if (selectedItem.value) {
        navigator.clipboard.writeText(selectedItem.value.id);
        toast.success('Path copied');
    }
}

function pinSelection() {
    if (selectedItem.value) {
        store.togglePinnedForSelection();
        toast.success('Pinned status updated');
    }
}

console.log('PreviewPane setup, selectedItem:', selectedItem.value?.name);

watch(selectedItem, (newVal) => {
    console.log('PreviewPane: selectedItem changed to', newVal?.name);
});
</script>

<template>
<aside class="LFM-preview-pane">
    <div v-if="!selectedItem" class="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center">
        <div class="w-16 h-16 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-4 text-slate-300">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                <polyline points="13 2 13 9 20 9" />
            </svg>
        </div>
        <h3 class="text-sm font-semibold text-slate-600 dark:text-slate-300">No item selected</h3>
        <p class="text-xs mt-2 leading-relaxed">Select a file or folder to view its properties and preview.</p>
    </div>

    <div v-else class="flex flex-col h-full">
        <!-- Debug Header -->
        <div style="background: #ff000022; padding: 4px; border: 1px solid red; font-size: 10px; margin-bottom: 10px; color: #ff0000;">
            DEBUG: {{ selectedItem.name }} ({{ selectedItem.category }})
        </div>
        
        <!-- Hero Preview Area -->
        <div class="LFM-preview-hero">
            <div v-if="isPreviewable && !imageError" class="LFM-preview-visual">
                <img v-if="isImage" :src="previewSrc" class="LFM-preview-img" @error="imageError = true" />
                <div v-else-if="isVideo" class="relative w-full h-full">
                    <img :src="previewSrc" class="LFM-preview-img opacity-50" @error="imageError = true" />
                    <div class="absolute inset-0 flex items-center justify-center">
                        <button class="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center hover:bg-white/30 transition-all" @click="handleOpen">
                            <span class="text-white text-2xl ml-1">▶</span>
                        </button>
                    </div>
                </div>
            </div>
            <div v-else class="LFM-preview-icon-fallback">
                <div
                    class="h-24 w-24 rounded-3xl flex items-center justify-center text-3xl font-bold shadow-xl"
                    :class="accentThemeMap[selectedItem.accent].chip"
                >
                    {{ categorySymbolMap[selectedItem.category] || '?' }}
                </div>
            </div>
        </div>

        <!-- Header Info -->
        <div class="LFM-preview-header">
            <div>
                <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">{{ selectedItem.typeLabel }}</p>
                <h2 class="mt-1 text-lg font-bold text-slate-900 dark:text-white truncate" :title="selectedItem.name">{{ selectedItem.name }}</h2>
            </div>
            
            <span class="LFM-status-badge" :class="statusToneMap[selectedItem.status]">
                {{ selectedItem.status }}
            </span>
        </div>

        <!-- Main Actions -->
        <div class="LFM-preview-actions">
            <BaseButton variant="primary" size="sm" class="flex-1" @click="handleOpen">Open</BaseButton>
            <BaseButton variant="secondary" size="sm" @click="pinSelection">
                {{ store.isPinned(selectedItem.id) ? 'Unpin' : 'Pin' }}
            </BaseButton>
        </div>

        <!-- Metadata Sections -->
        <div class="LFM-preview-details">
            <div class="LFM-details-group">
                <h3>Details</h3>
                <div class="LFM-details-list">
                    <div class="LFM-detail-row">
                        <span>Name</span>
                        <span class="truncate text-right" :title="selectedItem.name">{{ selectedItem.name }}</span>
                    </div>
                    <div class="LFM-detail-row">
                        <span>Path</span>
                        <button class="LFM-path-btn" @click="copyPath">
                            <span class="truncate">{{ selectedItem.id }}</span>
                            <span class="ml-1 text-[10px] opacity-50">📋</span>
                        </button>
                    </div>
                    <div class="LFM-detail-row">
                        <span>Created</span>
                        <span>{{ selectedItem.createdAt ? formatDate(selectedItem.createdAt) : '-' }}</span>
                    </div>
                    <div class="LFM-detail-row">
                        <span>Accessed</span>
                        <span>{{ selectedItem.accessedAt ? formatDate(selectedItem.accessedAt) : '-' }}</span>
                    </div>
                    <div class="LFM-detail-row">
                        <span>Size</span>
                        <span>{{ selectedItem.sizeLabel }}</span>
                    </div>
                    <div class="LFM-detail-row">
                        <span>Modified</span>
                        <span>{{ formatDate(selectedItem.modifiedAt) }}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Tags (if any) -->
        <div v-if="selectedItem.tags?.length" class="LFM-preview-tags">
            <h3>Tags</h3>
            <div class="flex flex-wrap gap-1 mt-2">
                <span v-for="tag in selectedItem.tags" :key="tag" class="LFM-tag">{{ tag }}</span>
            </div>
        </div>
    </div>
</aside>
</template>

<style scoped lang="scss">
@reference "tailwindcss";

.LFM-preview-pane {
	display: flex;
	flex-direction: column;
	height: 100%;
	padding: 20px;
	overflow-y: auto;
}

.LFM-preview-hero {
	width: 100%;
	aspect-ratio: 16/10;
	background: var(--LFM-active);
	border-radius: 20px;
	overflow: hidden;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-bottom: 20px;
}

.LFM-preview-visual {
	width: 100%;
	height: 100%;
}

.LFM-preview-img {
	width: 100%;
	height: 100%;
	object-fit: cover;
}

.LFM-preview-icon-fallback {
	display: flex;
	align-items: center;
	justify-content: center;
}

.LFM-preview-header {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 12px;
	margin-bottom: 20px;
}

.LFM-status-badge {
	padding: 2px 8px;
	border-radius: 99px;
	font-size: 10px;
	font-weight: 600;
	text-transform: capitalize;
}

.LFM-preview-actions {
	display: flex;
	gap: 8px;
	margin-bottom: 24px;
}

.LFM-preview-details {
	display: flex;
	flex-direction: column;
	gap: 20px;
}

.LFM-details-group {
	h3 {
		font-size: 11px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--LFM-text-muted);
		margin-bottom: 12px;
	}
}

.LFM-details-list {
	background: var(--LFM-active);
	border-radius: 16px;
	padding: 12px;
	display: flex;
	flex-direction: column;
	gap: 10px;
}

.LFM-detail-row {
	display: flex;
	justify-content: space-between;
	align-items: center;
	font-size: 12px;
	gap: 12px;

	span:first-child {
		color: var(--LFM-text-muted);
		flex-shrink: 0;
	}

	span:last-child {
		font-weight: 500;
	}
}

.LFM-path-btn {
	display: flex;
	align-items: center;
	justify-content: flex-end;
	background: transparent;
	border: none;
	padding: 0;
	cursor: pointer;
	color: inherit;
	font-size: 11px;
	max-width: 160px;
	text-align: right;

	&:hover {
		color: var(--LFM-blue);
	}
}

.LFM-tag {
	padding: 2px 8px;
	background: var(--LFM-active);
	border-radius: 6px;
	font-size: 11px;
	color: var(--LFM-text-muted);
}
</style>
