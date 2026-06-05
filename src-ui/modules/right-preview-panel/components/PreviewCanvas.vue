<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * PreviewCanvas — Section 1 of the Preview Pane.
 *
 * Renders an immersive media canvas appropriate for the selected item:
 *  - Image: full-resolution preview
 *  - Video: Premium Video Player using @videojs-player/vue
 *  - Audio: waveform icon with native audio controls
 *  - Directory / other: icon placeholder
 *
 * Emits `expand` when the fullscreen button is clicked.
 */
import { computed, ref, useTemplateRef } from 'vue';


import IconFullscreen from '~icons/material-symbols/fullscreen';
import IconFile from '~icons/material-symbols/description';
import IconFolder from '~icons/material-symbols/folder';
import IconImage from '~icons/material-symbols/image';
import IconVideo from '~icons/material-symbols/videocam';
import IconMusic from '~icons/material-symbols/music-note';
import IconPlay from '~icons/material-symbols/play-arrow';
import IconEdit from '~icons/material-symbols/edit';

import type { FileEntry } from '@/types/file-manager';
import { convertFileSrc } from '@/services/tauri-bridge';
import VideoPreview from '@/components/previews/VideoPreview.vue';
import AudioPlayer from '@/components/ui/AudioPlayer.vue';
import { AVCircle } from 'vue-audio-visual';

// ── Props / emits ───────────────────────────────────────────────────────────

const props = defineProps<{
	item: FileEntry;
}>();

const emit = defineEmits<{
	(e: 'expand'): void;
	(e: 'rename-start'): void;
}>();

// ── Computed category flags ─────────────────────────────────────────────────

const isImage = computed(() => props.item.category?.toLowerCase() === 'image');
const isVideo = computed(() => props.item.category?.toLowerCase() === 'video');
const isAudio = computed(() => props.item.category?.toLowerCase() === 'audio');
const isDirectory = computed(() => props.item.kind === 'folder');

const previewSrc = computed(() => {
	if (isImage.value || isVideo.value || isAudio.value) {
		return convertFileSrc(props.item.id);
	}
	return '';
});

const thumbnailSrc = computed(() => {
	if (!props.item.thumbnail) return '';
	return convertFileSrc(props.item.thumbnail);
});

// ── Playback state ──────────────────────────────────────────────────────────

const toast = { success: console.log, error: console.error, info: console.log, warning: console.warn };
const videoRef = useTemplateRef<HTMLVideoElement>('videoRef');
const audioRef = useTemplateRef<HTMLAudioElement>('audioRef');
const isPlaying = ref(false);
const isLoading = ref(true);

function togglePlay() {
	const media = videoRef.value || audioRef.value;
	if (!media) return;

	if (media.paused) {
		media.play().catch((err: Error) => {
			console.error('Playback failed:', err);
			toast.error('Codec error: cannot play this media format.');
		});
	} else {
		media.pause();
	}
	isPlaying.value = !media.paused;
}
</script>

<template lang="pug">
div(class="relative w-full min-h-[240px] rounded-2xl overflow-hidden bg-(--color-base-100)/20 backdrop-blur-md border border-white/10 shadow-inner flex items-center justify-center")
	button(v-if="!isDirectory" @click="$emit('expand')" class="absolute right-3 top-3 z-10 p-2 rounded-xl bg-(--color-base-100)/20 hover:bg-(--color-base-100)/40 text-white backdrop-blur-md transition-all active:scale-95")
		IconFullscreen

	//- Image preview
	div(v-if="isImage" class="w-full h-full flex items-center justify-center")
		img(:src="previewSrc" class="max-w-full max-h-[420px] object-contain drop-shadow-2xl")

	//- Video preview
	div(v-else-if="isVideo && previewSrc" class="w-full h-full flex items-center justify-center bg-transparent")
		VideoPreview(:path="item.id")

	//- Audio preview
	div(v-else-if="isAudio && previewSrc" class="w-full p-8 flex flex-col items-center gap-4 bg-(--color-base-100)/20")
		AVCircle(
			:src="previewSrc"
			:key="previewSrc"
			:canv-width="200"
			:canv-height="200"
			:outline-width="0"
			:progress-width="4"
			:bar-width="2"
			:line-space="1"
			line-color="rgba(255,255,255,0.72)"
			:bar-color="['rgba(14,165,233,0.85)', 'rgba(16,185,129,0.8)']"
		)
		AudioPlayer(:src="previewSrc" :title="item.name")

	//- Fallback placeholder for directories and other types
	div(v-else class="flex flex-col items-center gap-2 opacity-40")
		IconFile(v-if="!isDirectory" class="text-7xl")
		IconFolder(v-else class="text-7xl")
		span(v-if="isDirectory" class="font-bold tracking-widest text-xs uppercase") Directory
</template>

<style scoped>
@reference "tailwindcss";
</style>
