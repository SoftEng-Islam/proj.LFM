<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { NativeMediaPlayer, type NativeMediaState } from '@/services/native-media-player';

interface Props {
	path: string;
}

const props = defineProps<Props>();
const loadError = ref<string | null>(null);
const statusMessage = ref('Initializing native preview...');
const isReady = ref(false);
const isLoading = ref(true);
const playerState = ref<NativeMediaState>({
	isPaused: true,
	currentTime: 0,
	duration: 0,
	volume: 100,
	filename: null,
});

let player: NativeMediaPlayer | null = null;

function log(...args: unknown[]) {
	console.debug('[VideoPreview]', ...args);
}

function updatePlayerState(state: NativeMediaState) {
	playerState.value = state;
	isReady.value = true;
	isLoading.value = false;
	if (state.filename) {
		statusMessage.value = `Playing ${state.filename}`;
	} else {
		statusMessage.value = 'Native preview ready';
	}
}

function handlePlayerError(message: string) {
	loadError.value = message;
	statusMessage.value = 'Native preview unavailable';
	isLoading.value = false;
	log('NativeMediaPlayer error:', message);
}

function formatTime(seconds: number): string {
	if (!Number.isFinite(seconds) || seconds <= 0) {
		return '0:00';
	}
	const mins = Math.floor(seconds / 60);
	const secs = Math.floor(seconds % 60);
	return `${mins}:${secs.toString().padStart(2, '0')}`;
}

async function loadFile(path: string, autoplay = false): Promise<void> {
	if (!player) {
		player = new NativeMediaPlayer(updatePlayerState, handlePlayerError);
		try {
			await player.initialize();
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			handlePlayerError(`Failed to initialize native MPV preview: ${message}`);
			return;
		}
	}

	loadError.value = null;
	isLoading.value = true;
	statusMessage.value = 'Loading native preview...';

	try {
		await player.load(path, autoplay);
		if (!loadError.value) {
			statusMessage.value = 'Native preview loaded';
		}
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		handlePlayerError(`Failed to load media file: ${message}`);
	}
}

async function togglePause(): Promise<void> {
	if (!player) return;
	try {
		await player.setPaused(!playerState.value.isPaused);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		handlePlayerError(`Failed to toggle pause: ${message}`);
	}
}

async function reloadPreview(): Promise<void> {
	await loadFile(props.path, !playerState.value.isPaused);
}

onMounted(async () => {
	log('VideoPreview mounted', props.path);
	await loadFile(props.path, true);
});

watch(
	() => props.path,
	async (nextPath) => {
		await loadFile(nextPath, true);
	}
);

onBeforeUnmount(async () => {
	if (player) {
		try {
			await player.dispose();
		} catch (error) {
			log('Error during native player dispose:', error);
		}
	}
});
</script>

<template lang="pug">
div(class="LFM-native-video-preview w-full h-full min-h-[260px] rounded-2xl overflow-hidden bg-slate-950/80 border border-slate-800/80 shadow-inner flex items-center justify-center p-6")
	div(class="flex flex-col items-center justify-center gap-4 text-center text-slate-100")
		span(class="text-xs uppercase tracking-[0.35em] text-slate-400") Native MPV Preview
		p(class="text-sm font-semibold text-white") {{ statusMessage }}
		p(class="text-xs text-slate-500 max-w-[36rem]") Uses the Rust/libmpv backend for native media playback instead of browser fallback.
		div(class="space-y-1 text-slate-300")
			p(v-if="playerState.filename") File: {{ playerState.filename }}
			p(v-if="playerState.duration > 0") Position: {{ formatTime(playerState.currentTime) }} / {{ formatTime(playerState.duration) }}
		div(class="flex flex-wrap justify-center gap-2")
			button(type="button" class="btn btn-sm btn-primary" @click="togglePause" :disabled="!isReady || isLoading") {{ playerState.isPaused ? 'Play' : 'Pause' }}
			button(type="button" class="btn btn-sm btn-ghost" @click="reloadPreview" :disabled="isLoading") Reload
		p(class="text-[11px] text-slate-500 max-w-[34rem]") Note: On Linux, libmpv may spawn a native preview window for video playback.
		p(v-if="loadError" class="LFM-video-error text-rose-200 bg-rose-500/10 border border-rose-400/20 rounded-lg px-3 py-2 text-xs") {{ loadError }}
</template>

<style scoped>
@reference "tailwindcss";

.LFM-native-video-preview {
	@apply w-full h-full min-h-[260px] rounded-2xl overflow-hidden bg-slate-950/80 border border-slate-800/90 shadow-inner;
}

.LFM-video-error {
	@apply relative z-10 m-0;
}
</style>
