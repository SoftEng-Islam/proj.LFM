<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * VideoPreview.vue
 * Optimized video player component for the LFM Preview Pane.
 * Uses @videojs-player/vue for high-performance video rendering.
 */
import { computed, ref, onMounted } from 'vue';
import { VideoPlayer } from '@videojs-player/vue';
import { convertFileSrc, invoke } from '@tauri-apps/api/core';

// Base Video.js CSS required for the player to render correctly
import '@/styles/vendor/video-js.css';

interface Props {
	path: string;
}

const props = defineProps<Props>();

const mediaPort = ref<number | null>(null);

onMounted(async () => {
	try {
		mediaPort.value = await invoke<number>('get_media_server_port');
	} catch (e) {
		console.error('Failed to get media server port', e);
	}
});

/**
 * Converts the native Linux file path to the robust local HTTP streaming URL.
 */
const videoUrl = computed(() => {
	if (mediaPort.value) {
		// Use encodeURIComponent so the entire absolute path becomes one URL segment for /media/*path
		const encodedPath = encodeURIComponent(props.path);
		const finalUrl = `http://127.0.0.1:${mediaPort.value}/media/${encodedPath}`;
		console.log('[MediaServer] Generated video URL:', finalUrl);
		return finalUrl;
	}
	// Fallback to standard convertFileSrc
	console.warn('[MediaServer] Port not ready, falling back to convertFileSrc');
	return convertFileSrc(props.path);
});

/**
 * Mime-type resolver for Video.js media playback.
 * Implemented as a Class to satisfy LFM OOP Rule 19.
 */
class LFMVideoMimeResolver {
	private static readonly mimeMap: Record<string, string> = {
		mp4: 'video/mp4',
		webm: 'video/webm',
		ogg: 'video/ogg',
		ogv: 'video/ogg',
		mkv: 'video/mp4', // Fallback container format to trigger standard browser decoder
		mov: 'video/quicktime',
		avi: 'video/x-msvideo',
		flv: 'video/x-flv',
		m4v: 'video/x-m4v',
		ts: 'video/mp2t',
		m3u8: 'application/x-mpegURL'
	};

	public static getMimeType(filePath: string): string {
		const ext = filePath.split('.').pop()?.toLowerCase() || '';
		return this.mimeMap[ext] || 'video/mp4';
	}
}

/**
 * Custom player source object structure.
 * Implemented as a Class to satisfy LFM OOP Rule 19.
 */
class LFMPlayerSource {
	public readonly src: string;
	public readonly type: string;

	constructor(src: string, type: string) {
		this.src = src;
		this.type = type;
	}
}

const playerSource = computed(() => {
	const mimeType = LFMVideoMimeResolver.getMimeType(props.path);
	return new LFMPlayerSource(videoUrl.value, mimeType);
});

/**
 * Player configuration following LFM design principles.
 * Implemented as a Class to satisfy OOP Rule 19.
 */
class LFMVideoPlayerConfig {
	public readonly autoplay: boolean = false;
	public readonly controls: boolean = true;
	public readonly responsive: boolean = true;
	public readonly fluid: boolean = true;
	public readonly playbackRates: number[] = [0.5, 1, 1.25, 1.5, 2];
	public readonly controlBar = {
		skipButtons: {
			forward: 10,
			backward: 10
		}
	};
}

const playerOptions = new LFMVideoPlayerConfig();
</script>

<template lang="pug">
div(class="LFM-video-preview")
	VideoPlayer(v-if="mediaPort !== null" class="LFM-video-player vjs-big-play-centered" :sources="[playerSource]" :options="playerOptions")
	div(v-else class="text-white opacity-50") Loading media engine...
</template>

<style lang="sass" scoped>
@reference "tailwindcss"

.LFM-video-preview
  @apply w-full h-full bg-black/20 rounded-lg overflow-hidden flex items-center justify-center

.LFM-video-player
  @apply w-full h-full

  :deep(.video-js)
    @apply bg-transparent font-sans

    .vjs-big-play-button
      @apply bg-(--color-primary) border-none rounded-full w-16 h-16 leading-[4rem] shadow-lg transition-all duration-200
      &:hover
        @apply scale-110 brightness-110

    .vjs-control-bar
      @apply bg-(--color-base-300)/90 backdrop-blur-md border-t border-white/5

    .vjs-play-progress, .vjs-volume-level
      @apply bg-(--color-primary)
</style>
