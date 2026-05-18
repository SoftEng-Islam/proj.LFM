<script setup lang="ts">
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
section.LFM-preview-section
	h4.LFM-section-title General Information
	.LFM-info-card
		.LFM-info-row
			label Type
			span {{ isDirectory ? 'Directory' : item.category || 'File' }}
		.LFM-info-row
			label Size
			span {{ FileInfoService.formatSize(item.size) }}
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

<style lang="sass" scoped>
@reference "tailwindcss"

.LFM-preview-section
	display: flex
	flex-direction: column

.LFM-section-title
	font-size: 0.7rem
	font-weight: 800
	text-transform: uppercase
	letter-spacing: 0.1em
	color: var(--color-base-content)
	opacity: 0.4
	margin-bottom: 1rem

.LFM-info-card
	display: flex
	flex-direction: column
	gap: 0.75rem
	padding: 1.25rem
	border-radius: 1.25rem
	background: color-mix(in srgb, var(--color-base-100) 40%, transparent)
	border: 1px solid color-mix(in srgb, var(--color-base-content) 5%, transparent)
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03)

.LFM-info-row
	display: flex
	justify-content: space-between
	align-items: center
	font-size: 0.875rem
	label
		opacity: 0.5
		font-weight: 500
	span, strong
		font-weight: 600
		color: var(--color-base-content)
</style>
