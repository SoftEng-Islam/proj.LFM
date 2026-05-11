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
.LFM-audio-player
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
	.LFM-audio-controls
		//- Play/Pause Button
		button.LFM-audio-btn(@click="togglePlayPause" title="Play/Pause")
			component(:is="isPlaying ? IconPause : IconPlayArrow" class="LFM-audio-icon")

		//- Time and Progress
		.LFM-audio-progress
			span.LFM-audio-time {{ currentTimeDisplay }}
			input.LFM-audio-seek(
				v-if="isReady"
				type="range"
				min="0"
				max="100"
				:value="progressPercent"
				@input="handleSeek"
				title="Seek"
			)
			.LFM-audio-bar(v-else)
			span.LFM-audio-time {{ durationDisplay }}

		//- Volume Control
		.LFM-audio-volume
			button.LFM-audio-mute(@click="toggleMute" title="Mute/Unmute")
				component(:is="isMuted ? IconVolumeMute : IconVolumeUp" class="LFM-audio-icon")
			input.LFM-audio-volume-slider(
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
	.LFM-audio-title {{ props.title }}
</template>

<style lang="sass" scoped>
@reference "tailwindcss"

.LFM-audio-player
	display: flex
	flex-direction: column
	gap: 8px
	padding: 12px
	background: var(--LFM-panel)
	border-radius: 12px
	border: 1px solid var(--LFM-border)
	width: 100%

.LFM-audio-controls
	display: flex
	align-items: center
	gap: 12px
	width: 100%

.LFM-audio-btn
	width: 32px
	height: 32px
	border-radius: 8px
	background: var(--LFM-blue)
	color: white
	border: none
	cursor: pointer
	display: flex
	align-items: center
	justify-content: center
	flex-shrink: 0
	transition: all 200ms ease

	&:hover
		opacity: 0.9
		transform: scale(1.05)

	&:active
		transform: scale(0.95)

.LFM-audio-icon
	width: 16px
	height: 16px

.LFM-audio-progress
	display: flex
	align-items: center
	gap: 8px
	flex: 1
	min-width: 0

.LFM-audio-time
	font-size: 11px
	font-weight: 600
	color: var(--LFM-text-muted)
	white-space: nowrap
	width: 28px
	text-align: center

.LFM-audio-seek
	flex: 1
	height: 4px
	-webkit-appearance: none
	appearance: none
	background: linear-gradient(to right, var(--LFM-blue) 0%, var(--LFM-blue) calc(var(--value, 0) * 100%), var(--LFM-border) calc(var(--value, 0) * 100%), var(--LFM-border) 100%)
	border-radius: 2px
	cursor: pointer
	border: none
	outline: none

	&::-webkit-slider-thumb
		-webkit-appearance: none
		appearance: none
		width: 12px
		height: 12px
		border-radius: 50%
		background: var(--LFM-blue)
		cursor: pointer
		transition: all 200ms ease

		&:hover
			width: 14px
			height: 14px
			box-shadow: 0 0 8px rgba(59, 130, 246, 0.5)

	&::-moz-range-thumb
		width: 12px
		height: 12px
		border-radius: 50%
		background: var(--LFM-blue)
		cursor: pointer
		border: none
		transition: all 200ms ease

		&:hover
			width: 14px
			height: 14px
			box-shadow: 0 0 8px rgba(59, 130, 246, 0.5)

.LFM-audio-bar
	flex: 1
	height: 4px
	background: var(--LFM-border)
	border-radius: 2px

.LFM-audio-volume
	display: flex
	align-items: center
	gap: 6px
	flex-shrink: 0

.LFM-audio-mute
	width: 24px
	height: 24px
	border-radius: 6px
	background: transparent
	border: 1px solid var(--LFM-border)
	color: var(--LFM-text-muted)
	cursor: pointer
	display: flex
	align-items: center
	justify-content: center
	transition: all 200ms ease

	&:hover
		background: var(--LFM-hover)
		color: var(--LFM-text)

.LFM-audio-volume-slider
	width: 40px
	height: 3px
	-webkit-appearance: none
	appearance: none
	background: var(--LFM-border)
	border-radius: 2px
	cursor: pointer
	border: none
	outline: none

	&::-webkit-slider-thumb
		-webkit-appearance: none
		appearance: none
		width: 10px
		height: 10px
		border-radius: 50%
		background: var(--LFM-text-muted)
		cursor: pointer

	&::-moz-range-thumb
		width: 10px
		height: 10px
		border-radius: 50%
		background: var(--LFM-text-muted)
		cursor: pointer
		border: none

	&:disabled
		opacity: 0.5
		cursor: not-allowed

	&:not(:disabled):hover::-webkit-slider-thumb
		background: var(--LFM-text)

	&:not(:disabled):hover::-moz-range-thumb
		background: var(--LFM-text)

.LFM-audio-title
	font-size: 11px
	font-weight: 600
	color: var(--LFM-text-muted)
	text-align: center
	text-overflow: ellipsis
	overflow: hidden
	white-space: nowrap
</style>
