<script setup lang="ts">
import { computed, ref } from 'vue';

import ActionToolbar from '@/features/explorer/components/ActionToolbar.vue';
import ContextMenu from '@/features/explorer/components/ContextMenu.vue';
import FolderIcon from '@/components/ui/FolderIcon.vue';
import { useFileManagerStore } from '@/stores/file-manager';

const store = useFileManagerStore();
const selectedId = computed(() => store.selectedItem?.id ?? '');

// Context menu state
const contextMenu = ref<{ visible: boolean; x: number; y: number; itemId: string }>({
	visible: false,
	x: 0,
	y: 0,
	itemId: '',
});

function openContextMenu(e: MouseEvent, itemId: string) {
	e.preventDefault();
	contextMenu.value = { visible: true, x: e.clientX, y: e.clientY, itemId };
}

function closeContextMenu() {
	contextMenu.value.visible = false;
}

// Determine icon type for non-folder entries
function isFolder(entry: { category: string }) {
	return entry.category === 'folder';
}

// File type icon color map
const fileIconColors: Record<string, string> = {
	document: '#2b7cd3',
	image: '#e07000',
	audio: '#107c10',
	video: '#5c2d91',
	archive: '#ca5010',
	code: '#0078d4',
	data: '#217346',
	default: '#5c5c5c',
};

function fileIconColor(category: string): string {
	return fileIconColors[category] ?? fileIconColors['default'] ?? '#5c5c5c';
}

// File category → emoji glyph (fallback icon)
const fileGlyphs: Record<string, string> = {
	document: '📄',
	image: '🖼',
	audio: '🎵',
	video: '🎬',
	archive: '📦',
	code: '📝',
	data: '📊',
	default: '📄',
};
function fileGlyph(category: string): string {
	return fileGlyphs[category] ?? fileGlyphs['default'] ?? '📄';
}
</script>

<template>
	<div class="win-workspace">
		<ActionToolbar />

		<!-- Content area -->
		<div class="win-workspace-content">
			<!-- Grid view (large icons) -->
			<div v-if="store.viewMode !== 'list'" class="win-grid">
				<button
					v-for="(entry, index) in store.currentEntries"
					:key="entry.id"
					type="button"
					class="win-grid-item"
					:class="{ 'win-grid-item--selected': selectedId === entry.id }"
					@click="store.selectItem(entry.id)"
					@contextmenu="(e) => openContextMenu(e, entry.id)"
					:aria-selected="selectedId === entry.id"
					:title="entry.name"
				>
					<!-- Folder or file icon -->
					<div class="win-grid-item-icon">
						<FolderIcon v-if="isFolder(entry)" :size="64" />
						<div
							v-else
							class="win-file-icon"
							:style="{ background: fileIconColor(entry.category) }"
						>
							<span class="win-file-icon-glyph">{{ fileGlyph(entry.category) }}</span>
						</div>
					</div>
					<span class="win-grid-item-name">{{ entry.name }}</span>
				</button>
			</div>

			<!-- List / Details view -->
			<div v-else class="win-list">
				<!-- Column headers -->
				<div class="win-list-header">
					<span class="win-list-col win-list-col--name">Name</span>
					<span class="win-list-col">Date modified</span>
					<span class="win-list-col">Type</span>
					<span class="win-list-col win-list-col--right">Size</span>
				</div>

				<button
					v-for="entry in store.currentEntries"
					:key="entry.id"
					type="button"
					class="win-list-row"
					:class="{ 'win-list-row--selected': selectedId === entry.id }"
					@click="store.selectItem(entry.id)"
					@contextmenu="(e) => openContextMenu(e, entry.id)"
				>
					<div class="win-list-col win-list-col--name">
						<FolderIcon v-if="isFolder(entry)" :size="16" />
						<div
							v-else
							class="win-list-file-icon"
							:style="{ background: fileIconColor(entry.category) }"
						>
							<span style="font-size:9px;">{{ fileGlyph(entry.category) }}</span>
						</div>
						<span class="win-list-item-name">{{ entry.name }}</span>
					</div>
					<span class="win-list-col">
						{{ new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(entry.modifiedAt)) }}
					</span>
					<span class="win-list-col">{{ entry.typeLabel }}</span>
					<span class="win-list-col win-list-col--right">{{ entry.sizeLabel }}</span>
				</button>
			</div>
		</div>

		<!-- Context menu -->
		<ContextMenu
			v-if="contextMenu.visible"
			:x="contextMenu.x"
			:y="contextMenu.y"
			:item-name="contextMenu.itemId"
			@close="closeContextMenu"
		/>
	</div>
</template>

<style scoped>
.win-workspace {
	display: flex;
	flex-direction: column;
	height: 100%;
	background: var(--win-panel);
}

.win-workspace-content {
	flex: 1;
	overflow-y: auto;
	overflow-x: hidden;
	padding: 8px;
}

/* ── Grid (large icons) ──────────────────────────── */
.win-grid {
	display: flex;
	flex-wrap: wrap;
	gap: 4px;
	align-content: flex-start;
}

.win-grid-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	width: 100px;
	padding: 8px 4px 6px;
	border-radius: 4px;
	border: 2px solid transparent;
	background: transparent;
	cursor: pointer;
	color: var(--win-text);
	transition: background 100ms, border-color 100ms;
	text-align: center;
	outline: none;
}
.win-grid-item:hover {
	background: var(--win-item-hover);
}
.win-grid-item--selected {
	background: var(--win-selected);
	border-color: var(--win-item-selected-border);
}

.win-grid-item-icon {
	display: flex;
	align-items: center;
	justify-content: center;
	height: 64px;
	width: 64px;
}

.win-file-icon {
	width: 52px;
	height: 64px;
	border-radius: 3px;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	position: relative;
}
.win-file-icon::before {
	content: '';
	position: absolute;
	top: 0;
	right: 0;
	width: 0;
	height: 0;
	border-style: solid;
	border-width: 0 12px 12px 0;
	border-color: transparent rgba(255,255,255,0.3) transparent transparent;
}

.win-file-icon-glyph {
	font-size: 20px;
	filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));
}

.win-grid-item-name {
	margin-top: 6px;
	font-size: 11px;
	line-height: 1.3;
	max-width: 92px;
	overflow: hidden;
	text-overflow: ellipsis;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	word-break: break-word;
}

/* ── List (details) ──────────────────────────────── */
.win-list {
	width: 100%;
}

.win-list-header {
	display: grid;
	grid-template-columns: minmax(0, 2fr) 1.2fr 1fr 0.7fr;
	gap: 4px;
	padding: 4px 8px;
	border-bottom: 1px solid var(--win-border);
	font-size: 11px;
	font-weight: 600;
	color: var(--win-text);
	cursor: pointer;
	user-select: none;
}

.win-list-row {
	display: grid;
	grid-template-columns: minmax(0, 2fr) 1.2fr 1fr 0.7fr;
	gap: 4px;
	padding: 3px 8px;
	border-bottom: 1px solid var(--win-border);
	background: transparent;
	border-left: none;
	border-right: none;
	border-top: none;
	cursor: pointer;
	color: var(--win-text);
	font-size: 12px;
	text-align: left;
	width: 100%;
	transition: background 80ms;
}
.win-list-row:hover {
	background: var(--win-hover);
}
.win-list-row--selected {
	background: var(--win-selected);
}

.win-list-col {
	display: flex;
	align-items: center;
	gap: 6px;
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
}
.win-list-col--name {
	gap: 6px;
}
.win-list-col--right {
	justify-content: flex-end;
}

.win-list-file-icon {
	width: 16px;
	height: 16px;
	border-radius: 2px;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}

.win-list-item-name {
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
</style>
