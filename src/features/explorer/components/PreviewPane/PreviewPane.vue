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

const media = true;
const video = false;
const audio = false;
// const media = true;

</script>

<template lang="pug">
//- LFM-preview-pane
div(class="LFM-preview-pane w-full h-full p-4 flex flex-col bg-(--color-base-300)")
	div(v-if="!selectedItem" class="LFM-preview-empty")
		IconFile.LFM-empty-icon
		h3 No Selection
		p Select a file or directory to preview

	div(v-else class="w-full h-full flex flex-col gap-y-4")
		//- Preview Media/files section
		div(class="relative w-full h-auto min-h-50 rounded-lg bg-(--color-base-100)")
			//- expand buttons in the top right corner for files like files only like [Videos, Images, icons, text/scripts] not Directories.
			button(v-show="!isDirectory" @click="" class="absolute right-5 top-4 cursor-pointer hover:opacity-50")
				IconFullscreen.text-lg
			//- If its an Image/photo or video
			div(v-if="media")
				div(v-if="isImage")
					img(:src="previewSrc")
				div(v-if="isVideo")
				div(v-if="isAudio")
			//- Show the Selected files if its just and Icons or a Folder
			div(v-if="file")
			//- If they multiple Files/Directories
			div(v-if="multiple")
				//- Show an beautiful SVG that describe it.
		//- The Name of the file/Directory not multiple selected Items
		//- Double click to edit the name with reset,save,close without save buttons
		div(v-if="!multiple" class="w-full h-auto flex flex-col items-center bg-(--color-base-100)")
			//- The Name
			input(type="text", placeholder="The Name of the file", :value="selectedItem.name" class="w-full p-2 px-4 font-bold text-white")
			//- Edit Buttons
			ul(class="w-full h-12 flex items-center justify-end px-4 gap-x-4 bg-(--color-base-200)")
				button(type="button" class="px-2 py-1 font-bold text-shadow-2xs bg-green-500 rounded-full") Save
				button(type="button" class="px-2 py-1 font-bold text-shadow-2xs bg-yellow-500 rounded-full") Reset
				button(type="button" class="px-2 py-1 font-bold text-shadow-2xs bg-red-500 rounded-full") Close
</template>

<style scoped lang="sass">
@reference 'tailwindcss'
.LFM-preview-empty
	display: flex
	flex-direction: column
	align-items: center
	justify-content: center
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
</style>
