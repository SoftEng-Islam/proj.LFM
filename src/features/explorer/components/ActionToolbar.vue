<script setup lang="ts">
import { computed, ref } from 'vue';
import { useToast } from 'vue-toastification';

import { useFileManagerStore } from '@/stores/file-manager';

const store = useFileManagerStore();
const toast = useToast();

const sortLabel = computed(() => {
	switch (store.sortMode) {
		case 'name': return 'Name';
		case 'size': return 'Size';
		case 'kind': return 'Type';
		case 'modified':
		default: return 'Modified';
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

// Ribbon command buttons
const ribbonLeft = [
	{ id: 'new', label: 'New', icon: '＋', hasDropdown: true, action: createFolder },
	{ id: 'cut', label: '', icon: '✂', title: 'Cut', action: () => {} },
	{ id: 'copy', label: '', icon: '⧉', title: 'Copy', action: () => {} },
	{ id: 'paste', label: '', icon: '📋', title: 'Paste', action: () => {} },
	{ id: 'rename', icon: '✏', title: 'Rename', action: () => {} },
	{ id: 'share', icon: '↗', title: 'Share', action: () => toast.info('Share stub.') },
	{ id: 'delete', icon: '🗑', title: 'Delete', action: () => {} },
	{ id: 'more', icon: '…', title: 'More options', action: () => {} },
];
</script>

<template>
	<div class="win-toolbar">
		<!-- Row 1: Command ribbon -->
		<div class="win-ribbon" role="toolbar" aria-label="Command bar">
			<!-- Left command group -->
			<div class="win-ribbon-group">
				<!-- New (with label + dropdown) -->
				<button class="win-ribbon-btn win-ribbon-btn--new" title="New" @click="createFolder">
					<span class="win-ribbon-btn-icon">＋</span>
					<span class="win-ribbon-btn-label">New</span>
					<span class="win-ribbon-btn-arrow">▾</span>
				</button>

				<div class="win-ribbon-sep" />

				<!-- Icon-only commands -->
				<button class="win-ribbon-btn" title="Cut"><span>✂</span></button>
				<button class="win-ribbon-btn" title="Copy to clipboard"><span>⧉</span></button>
				<button class="win-ribbon-btn" title="Paste"><span>📋</span></button>
				<button class="win-ribbon-btn" title="Copy path"><span>🔗</span></button>
				<button class="win-ribbon-btn" title="Rename" @click="() => {}"><span>✏</span></button>
				<button class="win-ribbon-btn" title="Share"><span>↗</span></button>
				<button class="win-ribbon-btn" title="Delete"><span>🗑</span></button>
				<button class="win-ribbon-btn" title="More options"><span>…</span></button>
			</div>

			<!-- Right side controls -->
			<div class="win-ribbon-right">
				<!-- Filter icon -->
				<button class="win-ribbon-btn" title="Filter">
					<svg width="14" height="14" viewBox="0 0 14 14" fill="none">
						<path d="M1 2h12l-5 6v4l-2-1V8L1 2z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round" fill="none"/>
					</svg>
				</button>

				<!-- Gallery/Group sort dropdown -->
				<button class="win-ribbon-btn win-ribbon-btn--dropdown" title="Sort by" @click="cycleSort">
					<svg width="14" height="14" viewBox="0 0 14 14" fill="none">
						<path d="M2 4h10M2 7h7M2 10h4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
						<path d="M11 8l2 2-2 2" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
					</svg>
					<span class="win-ribbon-btn-label">{{ sortLabel }}</span>
					<span class="win-ribbon-btn-arrow">▾</span>
				</button>

				<div class="win-ribbon-sep" />

				<!-- View mode buttons -->
				<button
					class="win-ribbon-btn"
					:class="{ 'win-ribbon-btn--active': store.viewMode !== 'list' }"
					title="Icon view"
					@click="setView('grid')"
				>
					<svg width="14" height="14" viewBox="0 0 14 14" fill="none">
						<rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.2"/>
						<rect x="8" y="1" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.2"/>
						<rect x="1" y="8" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.2"/>
						<rect x="8" y="8" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.2"/>
					</svg>
				</button>
				<button
					class="win-ribbon-btn"
					:class="{ 'win-ribbon-btn--active': store.viewMode === 'list' }"
					title="Details view"
					@click="setView('list')"
				>
					<svg width="14" height="14" viewBox="0 0 14 14" fill="none">
						<rect x="1" y="2" width="3" height="3" rx="0.5" stroke="currentColor" stroke-width="1.2"/>
						<path d="M6 3.5h7" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
						<rect x="1" y="7.5" width="3" height="3" rx="0.5" stroke="currentColor" stroke-width="1.2"/>
						<path d="M6 9h7" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
					</svg>
				</button>

				<div class="win-ribbon-sep" />

				<!-- Preview pane toggle -->
				<button
					class="win-ribbon-btn"
					:class="{ 'win-ribbon-btn--active': store.previewOpen }"
					title="Preview pane"
					@click="togglePreview"
				>
					<svg width="14" height="14" viewBox="0 0 14 14" fill="none">
						<rect x="1" y="1" width="8" height="12" rx="1" stroke="currentColor" stroke-width="1.2"/>
						<rect x="11" y="1" width="2" height="12" rx="0.5" stroke="currentColor" stroke-width="1.2"/>
					</svg>
				</button>
			</div>
		</div>
	</div>
</template>

<style scoped>
.win-toolbar {
	border-bottom: 1px solid var(--win-border);
	background: var(--win-toolbar);
	flex-shrink: 0;
}

.win-ribbon {
	display: flex;
	align-items: center;
	justify-content: space-between;
	height: 40px;
	padding: 0 8px;
	gap: 4px;
}

.win-ribbon-group {
	display: flex;
	align-items: center;
	gap: 1px;
}

.win-ribbon-right {
	display: flex;
	align-items: center;
	gap: 1px;
}

.win-ribbon-sep {
	width: 1px;
	height: 20px;
	background: var(--win-border);
	margin: 0 4px;
}

.win-ribbon-btn {
	display: inline-flex;
	align-items: center;
	gap: 4px;
	height: 30px;
	padding: 0 8px;
	border-radius: 4px;
	background: transparent;
	border: none;
	cursor: pointer;
	color: var(--win-text);
	font-size: 12px;
	transition: background 100ms;
	white-space: nowrap;
}
.win-ribbon-btn:hover {
	background: var(--win-hover);
}
.win-ribbon-btn:active {
	background: var(--win-active);
}
.win-ribbon-btn--active {
	background: var(--win-selected);
}
.win-ribbon-btn--new {
	font-weight: 600;
	border: 1px solid var(--win-border);
	background: var(--win-panel);
}
.win-ribbon-btn--new:hover {
	background: var(--win-hover);
}
.win-ribbon-btn--dropdown {
	border: 1px solid var(--win-border);
}

.win-ribbon-btn-icon {
	font-size: 14px;
}

.win-ribbon-btn-label {
	font-size: 12px;
}

.win-ribbon-btn-arrow {
	font-size: 8px;
	opacity: 0.6;
}
</style>
