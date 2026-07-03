<script setup lang="ts">
/**
 * AudioPlayer Component — Simple audio playback control for preview pane
 * Features:
 *  - Play/Pause button
 *  - Seek bar with time display
 *  - Volume control
 *  - Duration display
 */
import { computed, ref, watch } from 'vue';
import IconPlayArrow from '~icons/material-symbols/play-arrow';
import IconPause from '~icons/material-symbols/pause';
import IconVolumeUp from '~icons/material-symbols/volume-up';
import IconVolumeMute from '~icons/material-symbols/volume-mute';

interface Props {
	src: string;
	title?: string;
}

const props = withDefaults(defineProps<Props>(), {
	title: 'Audio File'
});

const audioRef = ref<HTMLAudioElement>();
const isPlaying = ref(false);
const currentTime = ref(0);
const duration = ref(0);
const volume = ref(0.7);
const isMuted = ref(false);

// Computed: is audio ready to play
const isReady = computed(() => duration.value > 0);

// Computed: formatted time display
const formatTime = (seconds: number) => {
	if (!seconds || !isFinite(seconds)) return '0:00';
	const mins = Math.floor(seconds / 60);
	const secs = Math.floor(seconds % 60);
	return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const currentTimeDisplay = computed(() => formatTime(currentTime.value));
const durationDisplay = computed(() => formatTime(duration.value));

// Computed: progress percentage
const progressPercent = computed(() => {
	if (!duration.value) return 0;
	return (currentTime.value / duration.value) * 100;
});

// Methods
function togglePlayPause() {
	if (!audioRef.value) return;
	if (isPlaying.value) {
		audioRef.value.pause();
		isPlaying.value = false;
	} else {
		audioRef.value.play();
		isPlaying.value = true;
	}
}

function toggleMute() {
	isMuted.value = !isMuted.value;
	if (!audioRef.value) return;
	audioRef.value.muted = isMuted.value;
}

function handleTimeUpdate() {
	if (audioRef.value) {
		currentTime.value = audioRef.value.currentTime;
	}
}

function handleLoadedMetadata() {
	if (audioRef.value) {
		duration.value = audioRef.value.duration;
	}
}

function handleEnded() {
	isPlaying.value = false;
	currentTime.value = 0;
}

function handleSeek(e: Event) {
	const target = e.target as HTMLInputElement;
	const newTime = (parseFloat(target.value) / 100) * duration.value;
	if (audioRef.value) {
		audioRef.value.currentTime = newTime;
	}
}

function handleVolumeChange(e: Event) {
	const target = e.target as HTMLInputElement;
	volume.value = parseFloat(target.value);
	if (audioRef.value) {
		audioRef.value.volume = volume.value;
	}
}

watch(() => props.src, () => {
	isPlaying.value = false;
	currentTime.value = 0;
	if (audioRef.value) {
		audioRef.value.load();
	}
});
</script>

<template lang="pug">
div(class="flex flex-col gap-2 p-3 bg-base-100 rounded-xl border border-base-content/10 w-full")
	audio(
		ref="audioRef"
		:src="props.src"
		@timeupdate="handleTimeUpdate"
		@loadedmetadata="handleLoadedMetadata"
		@ended="handleEnded"
		@play="isPlaying = true"
		@pause="isPlaying = false"
		preload="metadata"
	)

	//- Player Controls
	div(class="flex items-center gap-3 w-full")
		//- Play/Pause Button
		button(class="w-8 h-8 rounded-lg bg-primary text-white border-none cursor-pointer flex items-center justify-center shrink-0 transition-all duration-200 hover:opacity-90 hover:scale-105 active:scale-95" @click="togglePlayPause" title="Play/Pause")
			component(:is="isPlaying ? IconPause : IconPlayArrow" class="w-4 h-4")

		//- Time and Progress
		div(class="flex items-center gap-2 flex-1 min-w-0")
			span(class="text-[11px] font-semibold text-base-content/60 whitespace-nowrap w-7 text-center") {{ currentTimeDisplay }}
			input(
				v-if="isReady"
				class="flex-1 h-1 appearance-none rounded-xs cursor-pointer border-none outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:duration-200 hover:[&::-webkit-slider-thumb]:w-3.5 hover:[&::-webkit-slider-thumb]:h-3.5 hover:[&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(59,130,246,0.5)] [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:transition-all [&::-moz-range-thumb]:duration-200 hover:[&::-moz-range-thumb]:w-3.5 hover:[&::-moz-range-thumb]:h-3.5 hover:[&::-moz-range-thumb]:shadow-[0_0_8px_rgba(59,130,246,0.5)]"
				:style="`background: linear-gradient(to right, var(--color-primary) 0%, var(--color-primary) ${progressPercent}%, color-mix(in srgb, var(--color-base-content) 10%, transparent) ${progressPercent}%, color-mix(in srgb, var(--color-base-content) 10%, transparent) 100%)`"
				type="range"
				min="0"
				max="100"
				:value="progressPercent"
				@input="handleSeek"
				title="Seek"
			)
			div(class="flex-1 h-1 bg-base-content/10 rounded-xs" v-else)
			span(class="text-[11px] font-semibold text-base-content/60 whitespace-nowrap w-7 text-center") {{ durationDisplay }}

		//- Volume Control
		div(class="flex items-center gap-1.5 shrink-0")
			button(class="w-6 h-6 rounded-md bg-transparent border border-base-content/10 text-base-content/60 cursor-pointer flex items-center justify-center transition-all duration-200 hover:bg-base-content/5 hover:text-base-content" @click="toggleMute" title="Mute/Unmute")
				component(:is="isMuted ? IconVolumeMute : IconVolumeUp" class="w-4 h-4")
			input(
				class="w-10 h-0.75 appearance-none bg-base-content/10 rounded-xs cursor-pointer border-none outline-none disabled:opacity-50 disabled:cursor-not-allowed [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-base-content/60 [&::-webkit-slider-thumb]:cursor-pointer [&:not(:disabled):hover::-webkit-slider-thumb]:bg-base-content [&::-moz-range-thumb]:w-2.5 [&::-moz-range-thumb]:h-2.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-base-content/60 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-none [&:not(:disabled):hover::-moz-range-thumb]:bg-base-content"
				type="range"
				min="0"
				max="1"
				step="0.05"
				:value="volume"
				@input="handleVolumeChange"
				title="Volume"
				:disabled="isMuted"
			)

	//- Title
	div(class="text-[11px] font-semibold text-base-content/60 text-center text-ellipsis overflow-hidden whitespace-nowrap") {{ props.title }}
</template>
