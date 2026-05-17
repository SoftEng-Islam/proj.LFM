<script setup lang="ts">
/**
 * Premium Preview Pane — Glassmorphic & Contextual
 * Dynamic layout modes: Automatic, Full, Compact
 * Immersive media canvas with skeleton loaders
 */
import { computed, ref, watch } from 'vue';
import { useToast } from 'vue-toastification';
import { storeToRefs } from 'pinia';

// import ExpandedPreview from '@/components/ui/ExpandedPreview.vue';

import IconOpenInNew from '~icons/material-symbols/open-in-new';
import IconFullscreen from '~icons/material-symbols/fullscreen';
import IconClose from '~icons/material-symbols/close';
import IconMinimize from '~icons/material-symbols/minimize';
import IconCopy from '~icons/material-symbols/content-copy';
import IconEdit from '~icons/material-symbols/edit';
import IconFolder from '~icons/material-symbols/folder';
import IconImage from '~icons/material-symbols/image';
import IconVideo from '~icons/material-symbols/videocam';
import IconMusic from '~icons/material-symbols/music-note';
import IconCode from '~icons/material-symbols/code';
import IconFile from '~icons/material-symbols/description';
import IconPlay from '~icons/material-symbols/play-arrow';
import IconPause from '~icons/material-symbols/pause';
import IconChevronDown from '~icons/material-symbols/expand-more';
import IconChevronUp from '~icons/material-symbols/expand-less';
import IconShare from '~icons/material-symbols/share';
import IconDuplicate from '~icons/material-symbols/content-copy';

import { useFileManagerStore } from '@/stores/file-manager';
import { convertFileSrc } from '@/services/tauri-bridge';

const store = useFileManagerStore();
const { selectedItem, selectedItemMediaInfo, selectedItemPermissions } = storeToRefs(store);
const toast = useToast();

const isImage = computed(() => selectedItem.value?.category === 'image');
const isVideo = computed(() => selectedItem.value?.category === 'video');
const isAudio = computed(() => selectedItem.value?.category === 'audio');
const isDirectory = computed(() => selectedItem.value?.kind === 'folder');
const isText = computed(() => ['text', 'code', 'markdown'].includes(selectedItem.value?.category || ''));
const isPdf = computed(() => selectedItem.value?.category === 'pdf');

const previewSrc = computed(() => {
	if (!selectedItem.value) return '';
	if (isImage.value || isVideo.value || isAudio.value) {
		return convertFileSrc(selectedItem.value.id);
	}
	return '';
});

const isPlaying = ref(false);
const isExpanded = ref(false);
const isTelemetryExpanded = ref(false);
const isLoading = ref(false);

function togglePlay() { isPlaying.value = !isPlaying.value; }
function handleExpand() { isExpanded.value = !isExpanded.value; }
function toggleTelemetry() { isTelemetryExpanded.value = !isTelemetryExpanded.value; }

const formatSize = (bytes?: number) => {
	if (!bytes) return '-';
	const units = ['B', 'KB', 'MB', 'GB', 'TB'];
	let i = 0;
	while (bytes >= 1024 && i < units.length - 1) { bytes /= 1024; i++; }
	return bytes.toFixed(1) + ' ' + units[i];
};

const formatDate = (dateStr?: string) => {
	if (!dateStr) return '-';
	return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(dateStr));
};

const formatDuration = (seconds?: number | null) => {
	if (!seconds) return '-';
	const h = Math.floor(seconds / 3600);
	const m = Math.floor((seconds % 3600) / 60);
	const s = Math.floor(seconds % 60);
	return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':').replace(/^00:/, '');
};

const formatBitrate = (bitrate?: number | null) => {
	if (!bitrate) return '-';
	if (bitrate >= 1000000) return (bitrate / 1000000).toFixed(2) + ' Mbps';
	if (bitrate >= 1000) return (bitrate / 1000).toFixed(2) + ' kbps';
	return bitrate + ' bps';
};

function handleOpen() { if (selectedItem.value) store.openItem(selectedItem.value.id); }

function handleCopyName() {
	if (selectedItem.value) {
		navigator.clipboard.writeText(selectedItem.value.name);
		toast.success('Name copied to clipboard');
	}
}

function handleShare() {
	if (selectedItem.value) {
		navigator.clipboard.writeText(selectedItem.value.id);
		toast.success('Path copied to clipboard');
	}
}

function handleDuplicate() {
	toast.success('Duplicate feature coming soon');
}

// Permissions state
const permMode = ref('755');
const ownerRead = ref(true);
const ownerWrite = ref(true);
const ownerExecute = ref(true);
const groupRead = ref(true);
const groupWrite = ref(false);
const groupExecute = ref(true);
const otherRead = ref(true);
const otherWrite = ref(false);
const otherExecute = ref(true);

function updatePermMode() {
	let mode = 0;
	if (ownerRead.value) mode += 4 << 6;
	if (ownerWrite.value) mode += 2 << 6;
	if (ownerExecute.value) mode += 1 << 6;
	if (groupRead.value) mode += 4 << 3;
	if (groupWrite.value) mode += 2 << 3;
	if (groupExecute.value) mode += 1 << 3;
	if (otherRead.value) mode += 4;
	if (otherWrite.value) mode += 2;
	if (otherExecute.value) mode += 1;
	permMode.value = mode.toString(8).padStart(3, '0');
}

function handlePermModeChange(e: Event) {
	const value = (e.target as HTMLInputElement).value;
	permMode.value = value;
	const mode = parseInt(value, 8);
	ownerRead.value = !!(mode & (4 << 6));
	ownerWrite.value = !!(mode & (2 << 6));
	ownerExecute.value = !!(mode & (1 << 6));
	groupRead.value = !!(mode & (4 << 3));
	groupWrite.value = !!(mode & (2 << 3));
	groupExecute.value = !!(mode & (1 << 3));
	otherRead.value = !!(mode & 4);
	otherWrite.value = !!(mode & 2);
	otherExecute.value = !!(mode & 1);
}

function handleResetPermissions() {
	permMode.value = '755';
	ownerRead.value = true;
	ownerWrite.value = true;
	ownerExecute.value = true;
	groupRead.value = true;
	groupWrite.value = false;
	groupExecute.value = true;
	otherRead.value = true;
	otherWrite.value = false;
	otherExecute.value = true;
}

function handleApplyPermissions() {
	toast.success('Permissions applied');
}

// Initialize permissions from store
watch(() => selectedItemPermissions.value, (perms) => {
	if (perms) {
		const mode = perms.mode;
		permMode.value = mode.toString(8).padStart(3, '0');
		ownerRead.value = !!(mode & (4 << 6));
		ownerWrite.value = !!(mode & (2 << 6));
		ownerExecute.value = !!(mode & (1 << 6));
		groupRead.value = !!(mode & (4 << 3));
		groupWrite.value = !!(mode & (2 << 3));
		groupExecute.value = !!(mode & (1 << 3));
		otherRead.value = !!(mode & 4);
		otherWrite.value = !!(mode & 2);
		otherExecute.value = !!(mode & 1);
	}
}, { immediate: true });

const isEditingName = ref(false);
const editedName = ref('');

function startRenaming() {
	if (!selectedItem.value) return;
	editedName.value = selectedItem.value.name;
	isEditingName.value = true;
}

function cancelRenaming() {
	isEditingName.value = false;
}

function handleRename() {
	// Implementation for renaming would call the store/tauri bridge
	toast.success('File renamed (placeholder)');
	isEditingName.value = false;
}

function resetRename() {
	if (selectedItem.value) editedName.value = selectedItem.value.name;
}
</script>

<template lang="pug">
div(class="LFM-preview-pane w-full h-full p-5 flex flex-col gap-y-8 overflow-y-auto bg-(--color-base-200)/80 backdrop-blur-xl border-l border-white/5")
	div(v-if="!selectedItem" class="LFM-preview-empty")
		IconFile.LFM-empty-icon
		h3 No Selection
		p Select a file or directory to preview

	div(v-else class="flex flex-col gap-y-8")
		//- Section 1: File Preview & Immersive Canvas
		section.LFM-preview-section
			div(class="relative w-full min-h-[240px] rounded-2xl overflow-hidden bg-black/20 backdrop-blur-md border border-white/10 shadow-inner flex items-center justify-center")
				button(v-if="!isDirectory" @click="handleExpand" class="absolute right-3 top-3 z-10 p-2 rounded-xl bg-(--color-base-100)/20 hover:bg-(--color-base-100)/40 text-white backdrop-blur-md transition-all active:scale-95")
					IconFullscreen

				div(v-if="isImage" class="w-full h-full flex items-center justify-center")
					img(:src="previewSrc" class="max-w-full max-h-[420px] object-contain drop-shadow-2xl")
				div(v-else-if="isVideo && previewSrc" class="w-full h-full flex items-center justify-center")
					video(:key="previewSrc" controls playsinline webkit-playsinline class="w-full max-h-[420px] bg-black/40" preload="metadata")
						source(:src="previewSrc")
				div(v-else-if="isAudio && previewSrc" class="w-full p-8 flex flex-col items-center gap-4")
					.LFM-audio-visualizer(class="w-16 h-16 rounded-full bg-(--color-primary)/20 flex items-center justify-center border border-(--color-primary)/30")
						IconMusic(class="text-3xl text-(--color-primary)")
					audio(:key="previewSrc" controls class="w-full max-w-xs" preload="metadata")
						source(:src="previewSrc")
				div(v-else class="flex flex-col items-center gap-2 opacity-40")
					IconFile(v-if="!isDirectory" class="text-7xl")
					IconFolder(v-else class="text-7xl")
					span(v-if="isDirectory" class="font-bold tracking-widest text-xs uppercase") Directory

			//- Name Editing Section
			div(class="mt-5 p-5 rounded-2xl bg-(--color-base-100)/40 backdrop-blur-md shadow-lg border border-white/10")
				div(v-if="!isEditingName" @dblclick="startRenaming" class="group flex items-center justify-between cursor-pointer")
					h2(class="text-base font-bold truncate pr-4 text-(--color-base-content)") {{ selectedItem.name }}
					button(@click="startRenaming" class="opacity-0 group-hover:opacity-100 p-2 transition-opacity hover:text-(--color-primary)")
						IconEdit
				div(v-else class="flex flex-col gap-4")
					input(type="text" v-model="editedName" class="input input-bordered bg-(--color-base-100)/60 w-full font-bold focus:ring-2 focus:ring-(--color-primary)/50" @keyup.enter="handleRename" @keyup.esc="cancelRenaming")
					div(class="flex justify-end gap-2")
						button(class="btn btn-sm rounded-lg btn-success text-white px-4" @click="handleRename") Save
						button(class="btn btn-sm rounded-lg btn-ghost bg-white/5" @click="resetRename") Reset
						button(class="btn btn-sm rounded-lg btn-error text-white px-4" @click="cancelRenaming") Close

		//- Section 2: General Information
		section.LFM-preview-section
			h4.LFM-section-title General Information
			.LFM-info-card
				.LFM-info-row
					label Type
					span {{ isDirectory ? 'Directory' : selectedItem.category || 'File' }}
				.LFM-info-row
					label Size
					span {{ formatSize(selectedItem.size) }}
				.LFM-info-row(v-if="selectedItem.modifiedAt")
					label Modified
					span {{ formatDate(selectedItem.modifiedAt) }}
				.LFM-info-row(v-if="isDirectory && selectedItem.childCount")
					label Items
					span {{ selectedItem.childCount }}

		//- Section 3: Advanced Media Information
		section.LFM-preview-section(v-if="(isVideo || isAudio) && selectedItemMediaInfo")
			h4.LFM-section-title Media Information
			.LFM-info-card
				.LFM-info-row(v-if="selectedItemMediaInfo.format")
					label Format
					span {{ selectedItemMediaInfo.format }}
				.LFM-info-row(v-if="selectedItemMediaInfo.duration")
					label Duration
					span {{ formatDuration(selectedItemMediaInfo.duration) }}
				.LFM-info-row(v-if="selectedItemMediaInfo.bitrate")
					label Bitrate
					span {{ formatBitrate(selectedItemMediaInfo.bitrate) }}

		//- Section 4: Permissions
		section.LFM-preview-section
			div(class="flex items-center justify-between mb-4")
				h4.LFM-section-title Permissions
				div(class="flex items-center gap-2")
					span(class="text-[10px] font-bold opacity-40 uppercase") Octal
					input(type="text" v-model="permMode" @input="handlePermModeChange" class="input input-xs input-bordered w-14 text-center font-mono bg-white/5 border-white/10")

			.LFM-permissions-grid(class="p-4 rounded-2xl bg-(--color-base-100)/30 border border-white/5 shadow-sm")
				.LFM-perm-header Group
				.LFM-perm-header(class="text-center") R
				.LFM-perm-header(class="text-center") W
				.LFM-perm-header(class="text-center") X

				//- Owner
				span Owner
				input(type="checkbox" v-model="ownerRead" @change="updatePermMode" class="checkbox checkbox-sm checkbox-primary")
				input(type="checkbox" v-model="ownerWrite" @change="updatePermMode" class="checkbox checkbox-sm checkbox-primary")
				input(type="checkbox" v-model="ownerExecute" @change="updatePermMode" class="checkbox checkbox-sm checkbox-primary")

				//- Group
				span Group
				input(type="checkbox" v-model="groupRead" @change="updatePermMode" class="checkbox checkbox-sm")
				input(type="checkbox" v-model="groupWrite" @change="updatePermMode" class="checkbox checkbox-sm")
				input(type="checkbox" v-model="groupExecute" @change="updatePermMode" class="checkbox checkbox-sm")

				//- Other
				span Other
				input(type="checkbox" v-model="otherRead" @change="updatePermMode" class="checkbox checkbox-sm")
				input(type="checkbox" v-model="otherWrite" @change="updatePermMode" class="checkbox checkbox-sm")
				input(type="checkbox" v-model="otherExecute" @change="updatePermMode" class="checkbox checkbox-sm")

			div(class="flex justify-end gap-2 mt-4")
				button(@click="handleResetPermissions" class="btn btn-xs btn-ghost hover:bg-white/5 rounded-lg") Reset
				button(@click="handleApplyPermissions" class="btn btn-xs btn-primary rounded-lg px-4") Apply
</template>

<style scoped lang="sass">
@reference 'tailwindcss'
.LFM-preview-empty
	display: flex
	flex-direction: column
	align-items: center
	justify-content: center
	flex: 1
	height: 100%
	color: hsl(var(--bc) / 0.4)
	gap: 1.5rem
	padding: 3rem 1.5rem
	text-align: center
	.LFM-empty-icon
		font-size: 5rem
		opacity: 0.2
		filter: blur(1px)
	h3
		font-size: 1.25rem
		font-weight: 600
		margin: 0
		color: hsl(var(--bc) / 0.8)
		text-shadow: 0 2px 8px hsl(var(--n) / 0.3)
	p
		font-size: 0.875rem
		margin: 0
		color: hsl(var(--bc) / 0.5)
		line-height: 1.5

.LFM-preview-section
	display: flex
	flex-direction: column

.LFM-section-title
	font-size: 0.7rem
	font-weight: 800
	text-transform: uppercase
	letter-spacing: 0.1em
	color: var(--color-base-content)
	opacity: 0.4
	margin-bottom: 1rem

.LFM-info-card
	display: flex
	flex-direction: column
	gap: 0.75rem
	padding: 1.25rem
	border-radius: 1.25rem
	background: color-mix(in srgb, var(--color-base-100) 40%, transparent)
	border: 1px solid color-mix(in srgb, var(--color-base-content) 5%, transparent)
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03)

.LFM-info-row
	display: flex
	justify-content: space-between
	align-items: center
	font-size: 0.875rem
	label
		opacity: 0.5
		font-weight: 500
	span, strong
		font-weight: 600
		color: var(--color-base-content)

.LFM-permissions-grid
	display: grid
	grid-template-columns: 2fr 1fr 1fr 1fr
	align-items: center
	row-gap: 1rem
	column-gap: 0.5rem
	font-size: 0.875rem
	span
		font-weight: 600
		opacity: 0.8
	input[type="checkbox"]
		justify-self: center

.LFM-perm-header
	font-size: 0.65rem
	font-weight: 900
	opacity: 0.3
	text-transform: uppercase
</style>
