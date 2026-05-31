<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-unused-vars */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import IconPause from '~icons/material-symbols/pause';
import IconPlay from '~icons/material-symbols/play-arrow';
import IconVolumeUp from '~icons/material-symbols/volume-up';
import { convertFileSrc } from '@/services/tauri-bridge';
import { NativeMediaPlayer, type NativeMediaState } from '@/services/native-media-player';

interface Props {
	path: string;
}

const props = defineProps<Props>();

const nativePlayer = ref<NativeMediaPlayer | null>(null);
const nativeState = ref<NativeMediaState>({
	isPaused: true,
	currentTime: 0,
	duration: 0,
	volume: 100,
	filename: null,
});
const nativeReady = ref(false);
const fallbackMode = ref(false);
const loadError = ref<string | null>(null);
const videoRef = ref<HTMLVideoElement | null>(null);

const videoUrl = computed(() => convertFileSrc(props.path));
const fileName = computed(() => props.path.split('/').pop() ?? '');

function log(...args: unknown[]) {
	console.debug('[VideoPreview]', ...args);
}

const progress = computed(() => {
	if (!nativeState.value.duration) return 0;
	return Math.min(100, Math.max(0, (nativeState.value.currentTime / nativeState.value.duration) * 100));
});

const statusLabel = computed(() => {
	if (fallbackMode.value) return 'Browser fallback';
	if (nativeReady.value) return 'Native MPV';
	return 'Starting media engine';
});

function formatTime(seconds: number): string {
	if (!Number.isFinite(seconds) || seconds <= 0) return '0:00';
	const minutes = Math.floor(seconds / 60);
	const remainder = Math.floor(seconds % 60);
	return `${minutes}:${remainder.toString().padStart(2, '0')}`;
}

async function loadNativeMedia(filePath: string): Promise<void> {
	log('loadNativeMedia', filePath);
	if (!nativePlayer.value) return;
	try {
		loadError.value = null;
		nativeState.value = {
			...nativeState.value,
			filename: filePath.split('/').pop() ?? null,
			isPaused: true,
		};
		await nativePlayer.value.load(filePath);
		log('Native media loaded for', filePath);
	} catch (error) {
		fallbackMode.value = true;
		const message = error instanceof Error ? error.message : String(error);
		log('Native media load failed', message, error);
		loadError.value = message;
	}
}

async function toggleNativePlayback(): Promise<void> {
	log('toggleNativePlayback', { currentPaused: nativeState.value.isPaused });
	if (!nativePlayer.value) return;
	const nextPaused = !nativeState.value.isPaused;
	nativeState.value = { ...nativeState.value, isPaused: nextPaused };
	await nativePlayer.value.setPaused(nextPaused).catch((error) => {
		const message = error instanceof Error ? error.message : String(error);
		log('setPaused failed', message, error);
		loadError.value = message;
	});
}

async function handleSeek(event: Event): Promise<void> {
	const target = event.target as HTMLInputElement;
	const nextProgress = Number(target.value);
	const nextTime = (nextProgress / 100) * nativeState.value.duration;
	log('handleSeek', nextProgress, nextTime);
	await nativePlayer.value?.seek(nextTime).catch((error) => {
		const message = error instanceof Error ? error.message : String(error);
		log('seek failed', message, error);
		loadError.value = message;
	});
}

async function handleVolume(event: Event): Promise<void> {
	const target = event.target as HTMLInputElement;
	const nextVolume = Number(target.value);
	log('handleVolume', nextVolume);
	await nativePlayer.value?.setVolume(nextVolume).catch((error) => {
		const message = error instanceof Error ? error.message : String(error);
		log('setVolume failed', message, error);
		loadError.value = message;
	});
}

function handleVideoError(event: Event): void {
	const elem = event.target as HTMLVideoElement;
	const error = elem?.error;
	log('HTML video error', event, error);
	if (!error) {
		loadError.value = 'Failed to load video preview.';
		return;
	}
	loadError.value = `Video load error: ${error.code} - ${error.message || 'Unknown error'}`;
}

function handleVideoLoadedMetadata(): void {
	if (videoRef.value) {
		log('HTML video loaded metadata', { duration: videoRef.value.duration });
		nativeState.value.duration = videoRef.value.duration || nativeState.value.duration;
	}
}

watch(
	() => props.path,
	() => {
		log('Video path changed', props.path);
		loadError.value = null;
	},
);

onMounted(async () => {
	log('VideoPreview mounted', props.path);
	nativePlayer.value = new NativeMediaPlayer(
		(nextState) => {
			log('Native state updated', nextState);
			nativeState.value = nextState;
		},
		(message) => {
			log('Native error handler', message);
			loadError.value = message;
		}
	);

	try {
		await nativePlayer.value.initialize();
		nativeReady.value = true;
		log('Native player ready');
		await loadNativeMedia(props.path);
	} catch (error) {
		fallbackMode.value = true;
		const message = error instanceof Error ? error.message : String(error);
		log('Native player initialization failed', message, error);
		loadError.value = message;
	}
});

watch(
	() => props.path,
	async (nextPath) => {
		nativeState.value = {
			isPaused: true,
			currentTime: 0,
			duration: 0,
			volume: nativeState.value.volume,
			filename: null,
		};
		if (nativeReady.value && !fallbackMode.value) {
			await loadNativeMedia(nextPath);
		}
	}
);

onBeforeUnmount(async () => {
	await nativePlayer.value?.dispose();
	nativePlayer.value = null;
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
		mkv: 'video/mp4',
		mov: 'video/quicktime',
		avi: 'video/x-msvideo',
		flv: 'video/x-flv',
		m4v: 'video/x-m4v',
		ts: 'video/mp2t',
		m3u8: 'application/x-mpegURL',
	};

	public static getMimeType(filePath: string): string {
		const ext = filePath.split('.').pop()?.toLowerCase() || '';
		return this.mimeMap[ext] || 'video/mp4';
	}
}

const mimeType = computed(() => LFMVideoMimeResolver.getMimeType(props.path));
</script>

<template lang="pug">
div(class="LFM-video-preview")
	div(v-if="nativeReady && !fallbackMode" class="LFM-video-native")
		div(class="LFM-video-native-surface")
			div(class="LFM-video-engine-badge") {{ statusLabel }}
			div(class="LFM-video-file-name") {{ nativeState.filename || fileName }}
		div(class="LFM-video-controls")
			button(class="LFM-video-control-button" type="button" @click="toggleNativePlayback" title="Play/Pause")
				component(:is="nativeState.isPaused ? IconPlay : IconPause")
			span(class="LFM-video-time") {{ formatTime(nativeState.currentTime) }}
			input(class="LFM-video-slider" type="range" min="0" max="100" :value="progress" @input="handleSeek" title="Seek")
			span(class="LFM-video-time") {{ formatTime(nativeState.duration) }}
			IconVolumeUp(class="LFM-video-volume-icon")
			input(class="LFM-video-volume" type="range" min="0" max="100" :value="nativeState.volume" @input="handleVolume" title="Volume")
		p(v-if="loadError" class="LFM-video-error") {{ loadError }}
	video(v-else ref="videoRef" class="LFM-video-player" controls preload="metadata" :src="videoUrl" :key="videoUrl" @error="handleVideoError" @loadedmetadata="handleVideoLoadedMetadata")
	p(v-if="loadError" class="LFM-video-error") {{ loadError }}
</template>

<style scoped>
@reference "tailwindcss";
.LFM-video-preview {
	@apply w-full h-full min-h-[260px] bg-black/20 rounded-lg overflow-hidden flex items-center justify-center;
}

.LFM-video-player {
	@apply w-full h-full object-contain rounded-lg shadow-lg;
}

.LFM-video-native {
	@apply relative w-full h-full min-h-[260px] flex flex-col justify-end overflow-hidden rounded-lg bg-transparent;
}

.LFM-video-native-surface {
	@apply absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/10 text-white;
}

.LFM-video-engine-badge {
	@apply rounded-md border border-white/15 bg-black/25 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white/70 backdrop-blur-md;
}

.LFM-video-file-name {
	@apply max-w-[80%] truncate text-sm font-semibold text-white/80;
}

.LFM-video-controls {
	@apply relative z-10 flex items-center gap-3 border-t border-white/10 bg-black/55 px-3 py-2 text-white backdrop-blur-md;
}

.LFM-video-control-button {
	@apply grid size-8 place-items-center rounded-lg border border-white/10 bg-white/10 text-white transition hover:bg-white/20 active:scale-95;
}

.LFM-video-time {
	@apply w-10 text-center text-[11px] font-semibold tabular-nums text-white/70;
}

.LFM-video-slider {
	@apply h-1 flex-1 cursor-pointer appearance-none rounded bg-white/20 accent-white;
}

.LFM-video-volume-icon {
	@apply size-4 text-white/70;
}

.LFM-video-volume {
	@apply h-1 w-16 cursor-pointer appearance-none rounded bg-white/20 accent-white;
}

.LFM-video-error {
	@apply relative z-10 m-0 border-t border-amber-400/20 bg-amber-500/15 px-3 py-2 text-xs text-amber-100;
}
</style>
