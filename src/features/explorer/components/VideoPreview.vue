<script setup lang="ts">
/**
 * VideoPreview.vue
 * Optimized video player component for the LFM Preview Pane.
 * Uses @videojs-player/vue for high-performance video rendering.
 */
import { computed } from 'vue';
import { VideoPlayer } from '@videojs-player/vue';
import { convertFileSrc } from '@tauri-apps/api/core';

// Base Video.js CSS required for the player to render correctly
import 'video.js/dist/video-js.css';

interface Props {
	path: string;
}

const props = defineProps<Props>();

/**
 * Converts the native Linux file path to a URL that Tauri's webview can load.
 */
const videoUrl = computed(() => convertFileSrc(props.path));

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
  VideoPlayer(
    class="LFM-video-player vjs-big-play-centered"
    :src="videoUrl"
    :options="playerOptions"
  )
</template>

<style lang="sass" scoped>
@reference "tailwindcss"

.LFM-video-preview
  @apply w-full h-full bg-neutral/20 rounded-lg overflow-hidden flex items-center justify-center

.LFM-video-player
  @apply w-full h-full

  :deep(.video-js)
    @apply bg-transparent font-sans

    .vjs-big-play-button
      @apply bg-primary border-none rounded-full w-16 h-16 leading-[4rem] shadow-lg transition-all duration-200
      &:hover
        @apply scale-110 bg-primary-focus

    .vjs-control-bar
      @apply bg-base-300/90 backdrop-blur-md border-t border-white/5

    .vjs-play-progress, .vjs-volume-level
      @apply bg-primary
</style>
