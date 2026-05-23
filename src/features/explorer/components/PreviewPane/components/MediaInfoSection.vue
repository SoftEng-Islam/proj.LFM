<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * MediaInfoSection — Section 3 of the Preview Pane.
 *
 * Shown only for video and audio items. Displays advanced codec, bitrate,
 * frame-rate, sample-rate and channel information obtained from ffprobe via
 * the Tauri `get_media_info` command.
 *
 * Shows a loading spinner while the backend is still probing the file.
 * Shows a "not available" notice when the backend returned no data fields.
 */
import { computed } from 'vue';

import { FileInfoService } from '@/services/FileInfoService';
import type { MediaInfo } from '@/types/file-manager';

const props = defineProps<{
	isVideo: boolean;
	isAudio: boolean;
	/** null  → still loading / not yet fetched   */
	mediaInfo: MediaInfo | null;
}>();

/**
 * True once mediaInfo has been fetched (not null).
 * The object may still be empty (all-None fields) for formats ffprobe cannot
 * decode — in that case we show a "not available" notice instead of a spinner.
 */
const isFetched = computed(() => props.mediaInfo !== null);

/** True when the fetched mediaInfo has at least one populated field. */
const hasData = computed(() => {
	if (!props.mediaInfo) return false;
	const m = props.mediaInfo;
	return !!(
		m.container ||
		m.video_codec ||
		m.audio_codec ||
		m.duration ||
		m.bitrate ||
		m.video_bitrate ||
		m.audio_bitrate ||
		m.frame_rate ||
		m.sample_rate ||
		m.channels
	);
});
</script>

<template lang="pug">
section.LFM-preview-section(class="animate__animated animate__fadeIn")
	h4.LFM-section-title Advanced Information (Media)

	//- Loaded and has data
	.LFM-info-card(v-if="isFetched && hasData && mediaInfo")
		//- Container / Format
		.LFM-info-row(v-if="mediaInfo.container")
			label Container
			span {{ mediaInfo.container }}

		//- Video streams
		template(v-if="isVideo")
			.LFM-info-row(v-if="mediaInfo.video_codec")
				label Video codec
				span {{ mediaInfo.video_codec }}
			.LFM-info-row(v-if="mediaInfo.video_bitrate || mediaInfo.bitrate")
				label Video bit rate
				span {{ FileInfoService.formatBitrate(mediaInfo.video_bitrate || mediaInfo.bitrate) }}
			.LFM-info-row(v-if="mediaInfo.frame_rate")
				label Frame rate
				span {{ mediaInfo.frame_rate.toFixed(2) }} fps

		//- Audio streams (shared between video and pure-audio files)
		.LFM-info-row(v-if="mediaInfo.audio_codec")
			label Audio codec
			span {{ mediaInfo.audio_codec }}
		.LFM-info-row(v-if="mediaInfo.audio_bitrate || (isAudio && mediaInfo.bitrate)")
			label Audio bit rate
			span {{ FileInfoService.formatBitrate(mediaInfo.audio_bitrate || (isAudio ? mediaInfo.bitrate : null)) }}
		.LFM-info-row(v-if="mediaInfo.sample_rate")
			label Sample rate
			span {{ FileInfoService.formatSampleRate(mediaInfo.sample_rate) }}
		.LFM-info-row(v-if="mediaInfo.channels")
			label Channels
			span {{ mediaInfo.channels }}

	//- Still loading (mediaInfo is null)
	div(v-else-if="!isFetched" class="LFM-media-state")
		span(class="loading loading-spinner loading-xs text-(--color-primary)")
		span(class="LFM-media-state-label") Probing Media Metadata...

	//- Fetched but empty (unsupported format / ffprobe unavailable)
	div(v-else class="LFM-media-state")
		span(class="LFM-media-state-label") Media metadata not available
</template>

<style scoped>
@reference "tailwindcss";
.LFM-preview-section {
  display: flex;
  flex-direction: column;
}

.LFM-section-title {
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-base-content);
  opacity: 0.4;
  margin-bottom: 1rem;
}

.LFM-info-card {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1.25rem;
  border-radius: 1.25rem;
  background: color-mix(in srgb, var(--color-base-100) 40%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-base-content) 5%, transparent);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
}

.LFM-info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
}
.LFM-info-row label {
  opacity: 0.5;
  font-weight: 500;
}
.LFM-info-row span, .LFM-info-row strong {
  font-weight: 600;
  color: var(--color-base-content);
}

.LFM-media-state {
  padding: 1.5rem;
  border-radius: 1.25rem;
  background: color-mix(in srgb, var(--color-base-100) 20%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-base-content) 5%, transparent);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  opacity: 0.4;
}

.LFM-media-state-label {
  font-size: 0.625rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-weight: 700;
  font-style: italic;
}
</style>
