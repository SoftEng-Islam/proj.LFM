<script setup lang="ts">
/**
 * Section 3 — Advanced Information (Media)
 * Displays technical metadata for video and audio files.
 */
interface MediaMetadata {
	codec?: string;
	bitrate?: string;
	frameRate?: string;
	sampleRate?: string;
	channels?: number;
}

defineProps<{
	metadata: MediaMetadata;
	isAudio?: boolean;
}>()
</script>

<template lang="pug">
div(class="LFM-preview-section-media")
  h3(class="text-sm font-bold mb-2 opacity-70 uppercase tracking-wider") Advanced Information
  div(class="grid grid-cols-2 gap-2 text-xs")
    //- Video Specific
    template(v-if="!isAudio")
      div(class="LFM-metadata-label") Video Codec
      div(class="LFM-metadata-value") {{ metadata.codec || '—' }}
      div(class="LFM-metadata-label") Video Bitrate
      div(class="LFM-metadata-value") {{ metadata.bitrate || '—' }}
      div(class="LFM-metadata-label") Frame Rate
      div(class="LFM-metadata-value") {{ metadata.frameRate || '—' }}

    //- Shared or Audio Specific
    div(class="LFM-metadata-label") Audio Codec
    div(class="LFM-metadata-value") {{ metadata.codec || '—' }}
    div(class="LFM-metadata-label") Audio Bitrate
    div(class="LFM-metadata-value") {{ metadata.bitrate || '—' }}
    div(class="LFM-metadata-label") Sample Rate
    div(class="LFM-metadata-value") {{ metadata.sampleRate || '—' }}
    div(class="LFM-metadata-label") Channels
    div(class="LFM-metadata-value") {{ metadata.channels || '—' }}
</template>

<style lang="sass" scoped>
@reference "tailwindcss"
.LFM-metadata-label
  @apply opacity-60
</style>
