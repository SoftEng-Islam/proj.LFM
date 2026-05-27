<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * GeneralInfoSection — Section 2 of the Preview Pane.
 *
 * Shows the basic metadata for a selected item:
 * type, size, dimensions (images), duration (media), timestamps, and item count
 * for directories.
 */
import { computed } from 'vue';

import { FileInfoService } from '@/services/FileInfoService';
import type { FileEntry } from '@/types/file-manager';
import type { MediaInfo } from '@/types/file-manager';

const props = defineProps<{
	item: FileEntry;
	mediaInfo?: MediaInfo | null;
}>();

const isVideo = computed(() => props.item.category?.toLowerCase() === 'video');
const isAudio = computed(() => props.item.category?.toLowerCase() === 'audio');
const isDirectory = computed(() => props.item.kind === 'folder');
</script>

<template lang="pug">
fieldset(class="LFM-preview-section fieldset bg-base-200 border-base-300 rounded-box")
	legend(class="LFM-section-title fieldset-legend") General Information
	.LFM-info-row
		label Type
		span {{ isDirectory ? 'Directory' : item.category || 'File' }}
	.LFM-info-row
		label Size
		span {{ FileInfoService.formatSize(item.sortSize) }}
	.LFM-info-row(v-if="mediaInfo?.width && mediaInfo?.height")
		label Dimensions
		span {{ mediaInfo.width }} × {{ mediaInfo.height }}
	.LFM-info-row(v-if="(isVideo || isAudio) && mediaInfo?.duration")
		label Duration
		span {{ FileInfoService.formatDuration(mediaInfo.duration) }}
	.LFM-info-row(v-if="item.createdAt")
		label Created
		span {{ FileInfoService.formatDate(item.createdAt) }}
	.LFM-info-row(v-if="item.modifiedAt")
		label Updated
		span {{ FileInfoService.formatDate(item.modifiedAt) }}
	.LFM-info-row(v-if="isDirectory && item.childCount")
		label Items
		span {{ item.childCount }}
</template>

<style scoped>
@reference "tailwindcss";

.LFM-preview-section {
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
	padding: 1.25rem;
	border-radius: 1.25rem;
	background: color-mix(in srgb, var(--color-base-100) 40%, transparent);
	border: 1px solid color-mix(in srgb, var(--color-base-content) 5%, transparent);
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

.LFM-info-row span,
.LFM-info-row strong {
	font-weight: 600;
	color: var(--color-base-content);
}
</style>
