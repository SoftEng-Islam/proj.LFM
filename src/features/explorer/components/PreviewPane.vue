<script setup lang="ts">
/**
 * PreviewPane.vue
 * The main orchestrator for the LFM Explorer Preview system.
 * Dynamically switches between previewers based on file type.
 */
import { computed } from 'vue';
/**
 * Using absolute alias as per LFM Project Rule 3.6.
 */
import VideoPreview from '@/features/explorer/components/VideoPreview.vue';

interface Props {
	path: string;
	name: string;
	size?: string;
	mimeType?: string;
}

const props = defineProps<Props>();

/**
 * Determines if the selected file is a video.
 * Future integration: Should use a centralized FileAssociation utility.
 */
const isVideo = computed(() => {
	if (props.mimeType?.startsWith('video/')) return true;
	const videoExtensions = ['mp4', 'mkv', 'webm', 'avi', 'mov', 'flv'];
	const ext = props.path.split('.').pop()?.toLowerCase() || '';
	return videoExtensions.includes(ext);
});
</script>

<template lang="pug">
aside(class="LFM-preview-pane")
  //- Section 1 — File Preview (Roadmap Section 8.1)
  div(class="LFM-preview-media-header")
    template(v-if="isVideo")
      VideoPreview(:path="props.path")
    div(v-else class="LFM-preview-placeholder")
      div(class="LFM-preview-icon-wrapper")
        //- Default icon for non-video files
        span(class="text-5xl opacity-20") 📄
      p(class="text-xs opacity-40 mt-3") Preview not available

  //- Section 2 — General Information (Roadmap Section 8.2)
  div(class="LFM-preview-details p-4")
    h2(class="text-sm font-bold truncate mb-3" :title="props.name") {{ props.name }}

    div(class="LFM-info-list")
      div(class="LFM-info-item")
        span(class="LFM-info-label") Type
        span(class="LFM-info-value") {{ props.mimeType || 'Unknown File' }}
      div(class="LFM-info-item" v-if="props.size")
        span(class="LFM-info-label") Size
        span(class="LFM-info-value") {{ props.size }}
</template>

<style scoped>
@reference "tailwindcss";
.LFM-preview-pane {
  @apply h-full w-80 flex flex-col bg-base-100 border-l border-base-300 overflow-hidden shadow-inner;
}

.LFM-preview-media-header {
  @apply w-full aspect-video bg-neutral/5 relative overflow-hidden flex items-center justify-center border-b border-base-300;
}

.LFM-preview-placeholder {
  @apply flex flex-col items-center justify-center;
}

.LFM-info-list {
  @apply space-y-3 mt-2;
}

.LFM-info-item {
  @apply flex justify-between text-[11px] items-center border-b border-base-200 pb-1;
}

.LFM-info-label {
  @apply opacity-50 font-medium uppercase tracking-wider;
}

.LFM-info-value {
  @apply font-semibold text-base-content/80;
}
</style>
