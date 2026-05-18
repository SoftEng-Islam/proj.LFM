<script setup lang="ts">
/**
 * PreviewCanvas — Section 1 of the Preview Pane.
 *
 * Renders an immersive media canvas appropriate for the selected item:
 *  - Image: full-resolution preview
 *  - Video: native video element with poster thumbnail and play overlay
 *  - Audio: waveform icon with native audio controls
 *  - Directory / other: icon placeholder
 *
 * Emits `expand` when the fullscreen button is clicked.
 */
import { computed, ref, useTemplateRef } from 'vue';
import { useToast } from 'vue-toastification';

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

const toast = useToast();
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
	div(v-else-if="isVideo && previewSrc" class="group/media relative w-full h-full flex items-center justify-center bg-transparent")
		img(v-if="thumbnailSrc" :src="thumbnailSrc" class="absolute inset-0 w-full h-full object-cover opacity-20 blur-md pointer-events-none")
		video(
			ref="videoRef"
			:key="previewSrc"
			:src="previewSrc"
			:poster="thumbnailSrc"
			playsinline
			class="w-full max-h-[420px]"
			preload="metadata"
			@play="isPlaying = true"
			@pause="isPlaying = false"
			@loadedmetadata="isLoading = false"
		)
		button(v-show="!isPlaying" @click="togglePlay" class="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover/media:opacity-100 transition-opacity")
			div(class="p-4 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white")
				IconPlay(class="text-4xl")

	//- Audio preview
	div(v-else-if="isAudio && previewSrc" class="w-full p-8 flex flex-col items-center gap-4 bg-(--color-base-100)/20")
		.LFM-audio-visualizer(class="w-16 h-16 rounded-full bg-(--color-primary)/20 flex items-center justify-center border border-(--color-primary)/30")
			IconMusic(class="text-3xl text-(--color-primary)")
		audio(
			ref="audioRef"
			:key="previewSrc"
			:src="previewSrc"
			controls
			class="w-full max-w-xs"
			preload="metadata"
			@play="isPlaying = true"
			@pause="isPlaying = false"
		)

	//- Fallback placeholder for directories and other types
	div(v-else class="flex flex-col items-center gap-2 opacity-40")
		IconFile(v-if="!isDirectory" class="text-7xl")
		IconFolder(v-else class="text-7xl")
		span(v-if="isDirectory" class="font-bold tracking-widest text-xs uppercase") Directory
</template>

<style lang="sass" scoped>
@reference "tailwindcss"
</style>
