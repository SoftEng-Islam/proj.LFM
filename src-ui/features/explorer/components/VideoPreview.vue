<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { convertFileSrc, invoke } from '@tauri-apps/api/core';

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

const mimeType = computed(() => LFMVideoMimeResolver.getMimeType(props.path));
</script>

<template lang="pug">
div(class="LFM-video-preview")
	video(v-if="mediaPort !== null" class="LFM-video-player" controls preload="metadata")
		source(:src="videoUrl" :type="mimeType")
	div(v-else class="text-white opacity-50") Loading media engine...
</template>

<style scoped>
@reference "tailwindcss";
.LFM-video-preview {
  @apply w-full h-full bg-black/20 rounded-lg overflow-hidden flex items-center justify-center;
}

.LFM-video-player {
  @apply w-full h-full object-contain rounded-lg shadow-lg;
}
</style>
