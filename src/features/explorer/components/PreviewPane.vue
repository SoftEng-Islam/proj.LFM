<script setup lang="ts">
/**
 * PreviewPane Component — Section 8 Roadmap Implementation
 * 3 Modes: automatic, full, compact
 * 4 Sections: File Preview, General Info, Media Info, Permissions
 */
import { computed, ref } from 'vue';
import { useToast } from 'vue-toastification';
import { storeToRefs } from 'pinia';

import IconDescription from '~icons/material-symbols/description';
import IconPlayArrow from '~icons/material-symbols/play-arrow';
import IconOpenInNew from '~icons/material-symbols/open-in-new';
import IconFullscreen from '~icons/material-symbols/fullscreen';
import IconInfo from '~icons/material-symbols/info-outline';
import IconShield from '~icons/material-symbols/shield';
import IconMovie from '~icons/material-symbols/movie';
import IconChevronDown from '~icons/material-symbols/expand-more';
import IconChevronUp from '~icons/material-symbols/expand-less';
import IconPause from '~icons/material-symbols/pause';

import { useFileManagerStore } from '@/stores/file-manager';
import { convertFileSrc } from '@/services/tauri-bridge';

const store = useFileManagerStore();
const { selectedItem, selectedItemMediaInfo } = storeToRefs(store);
const toast = useToast();

type PreviewMode = 'automatic' | 'full' | 'compact';
type PreviewSection = 'preview' | 'general' | 'media' | 'permissions';

const modes: PreviewMode[] = ['automatic', 'full', 'compact'];
const previewMode = ref<PreviewMode>('automatic');

function cycleMode() {
	const idx = modes.indexOf(previewMode.value);
	previewMode.value = modes[(idx + 1) % modes.length];
}

const showSectionPreview = computed(() => !!selectedItem.value);
const showSectionGeneral = computed(() => previewMode.value !== 'automatic');
const showSectionMedia = computed(() => previewMode.value === 'full');
const showSectionPermissions = computed(() => true);

const expandedSections = ref<Record<PreviewSection, boolean>>({
	preview: true, general: false, media: false, permissions: false,
});

function toggleSection(section: PreviewSection) {
	expandedSections.value[section] = !expandedSections.value[section];
}

const isImage = computed(() => selectedItem.value?.category === 'image');
const isVideo = computed(() => selectedItem.value?.category === 'video');
const isAudio = computed(() => selectedItem.value?.category === 'audio');

const previewSrc = computed(() => {
	if (!selectedItem.value || !isImage.value) return '';
	return convertFileSrc(selectedItem.value.id);
});

const heroHeight = computed(() => previewMode.value === 'compact' ? '140px' : '280px');
const isPlaying = ref(false);

function togglePlay() { isPlaying.value = !isPlaying.value; }
function handleExpand() { if (selectedItem.value) store.setExpandedPreviewId(selectedItem.value.id); }

const formatSize = (bytes?: number) => {
	if (!bytes) return '-';
	const units = ['B', 'KB', 'MB', 'GB', 'TB'];
	let i = 0;
	while (bytes >= 1024 && i < units.length - 1) { bytes /= 1024; i++; }
	return bytes.toFixed(1) + ' ' + units[i];
};

const formatDate = (dateStr?: string) => {
	if (!dateStr) return '-';
	return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(dateStr));
};

const formatDuration = (seconds?: number | null) => {
	if (!seconds) return '-';
	const h = Math.floor(seconds / 3600);
	const m = Math.floor((seconds % 3600) / 60);
	const s = Math.floor(seconds % 60);
	return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':').replace(/^00:/, '');
};

function handleOpen() { if (selectedItem.value) store.openItem(selectedItem.value.id); }
</script>

<template lang="pug">
aside.LFM-preview-pane
	.LFM-preview-empty(v-if="!selectedItem")
		IconDescription.LFM-empty-icon
		h3 No Selection
		p Select a file or directory to preview

	.LFM-preview-content(v-else)
		.LFM-mode-bar
			button.LFM-mode-btn(:class="{ 'is-active': previewMode === 'automatic' }" @click="previewMode = 'automatic'") Auto
			button.LFM-mode-btn(:class="{ 'is-active': previewMode === 'full' }" @click="previewMode = 'full'") Full
			button.LFM-mode-btn(:class="{ 'is-active': previewMode === 'compact' }" @click="previewMode = 'compact'") Compact
			button.LFM-mode-cycle(@click="cycleMode" title="Cycle Mode")
				IconChevronDown

		// Section 1: File Preview
		.LFM-section(v-if="showSectionPreview")
			.LFM-section-header(@click="toggleSection('preview')")
				IconDescription
				span File Preview
				component(:is="expandedSections.preview ? IconChevronUp : IconChevronDown")
			.LFM-section-content(v-show="expandedSections.preview")
				.LFM-preview-container(:style="{ height: heroHeight }")
					img.LFM-preview-image(v-if="isImage" :src="previewSrc" :alt="selectedItem.name")
					.LFM-media-preview(v-else-if="isVideo || isAudio")
						button.LFM-play-btn(@click="togglePlay")
							component(:is="isPlaying ? IconPause : IconPlayArrow")
						span.LFM-duration(v-if="selectedItemMediaInfo?.duration") {{ formatDuration(selectedItemMediaInfo.duration) }}
					.LFM-no-preview(v-else)
						IconDescription
						span No preview available
				.LFM-preview-toolbar
					button.LFM-toolbar-btn(@click="handleOpen" title="Open") IconOpenInNew
					button.LFM-toolbar-btn(@click="handleExpand" title="Expand") IconFullscreen

		// Section 2: General Information
		.LFM-section(v-if="showSectionGeneral")
			.LFM-section-header(@click="toggleSection('general')")
				IconInfo
				span General Information
				component(:is="expandedSections.general ? IconChevronUp : IconChevronDown")
			.LFM-section-content(v-show="expandedSections.general")
				.LFM-info-grid
					.LFM-info-row
						span Type
						span {{ selectedItem.category || '-' }}
					.LFM-info-row
						span Size
						span {{ formatSize(selectedItem.size) }}
					.LFM-info-row(v-if="selectedItem.category === 'image' || selectedItem.category === 'video'")
						span Dimensions
						span {{ selectedItemMediaInfo?.width }}x{{ selectedItemMediaInfo?.height }}
					.LFM-info-row(v-if="selectedItem.category === 'directory'")
						span Items
						span {{ selectedItem.children?.length || 0 }}
					.LFM-info-row
						span Created
						span {{ formatDate(selectedItem.created_at) }}
					.LFM-info-row
						span Modified
						span {{ formatDate(selectedItem.modified_at) }}

		// Section 3: Media Information
		.LFM-section(v-if="showSectionMedia && (isVideo || isAudio)")
			.LFM-section-header(@click="toggleSection('media')")
				IconMovie
				span Media Information
				component(:is="expandedSections.media ? IconChevronUp : IconChevronDown")
			.LFM-section-content(v-show="expandedSections.media")
				.LFM-info-grid(v-if="selectedItemMediaInfo")
					.LFM-info-row(v-if="selectedItemMediaInfo.videoCodec")
						span Video Codec
						span {{ selectedItemMediaInfo.videoCodec }}
					.LFM-info-row(v-if="selectedItemMediaInfo.audioCodec")
						span Audio Codec
						span {{ selectedItemMediaInfo.audioCodec }}
					.LFM-info-row(v-if="selectedItemMediaInfo.duration")
						span Duration
						span {{ formatDuration(selectedItemMediaInfo.duration) }}
				.LFM-no-media(v-else) No media info available

		// Section 4: Permissions
		.LFM-section
			.LFM-section-header(@click="toggleSection('permissions')")
				IconShield
				span Permissions
				component(:is="expandedSections.permissions ? IconChevronUp : IconChevronDown")
			.LFM-section-content(v-show="expandedSections.permissions")
				.LFM-perm-code Mode: {{ selectedItem.permissions_mode?.toString(8) || '755' }}
</template>

<style scoped lang="sass">
.LFM-preview-pane
	width: 320px
	min-width: 320px
	background: oklch(var(--b2))
	border-left: 1px solid oklch(var(--b3))
	display: flex
	flex-direction: column
	overflow-y: auto

.LFM-preview-empty
	display: flex
	flex-direction: column
	align-items: center
	justify-content: center
	height: 100%
	color: oklch(var(--bc) / 0.5)
	gap: 0.75rem
	.LFM-empty-icon
		font-size: 3rem
		opacity: 0.5

.LFM-preview-content
	display: flex
	flex-direction: column
	gap: 0.5rem
	padding: 0.5rem

.LFM-mode-bar
	display: flex
	gap: 0.25rem
	padding: 0.25rem
	background: oklch(var(--b1))
	border-radius: 0.5rem

.LFM-mode-btn
	flex: 1
	padding: 0.375rem 0.5rem
	border: none
	background: transparent
	color: oklch(var(--bc) / 0.7)
	font-size: 0.75rem
	border-radius: 0.375rem
	cursor: pointer
	&:hover
		background: oklch(var(--b3))
	&.is-active
		background: oklch(var(--p) / 0.2)
		color: oklch(var(--p))

.LFM-mode-cycle
	padding: 0.375rem
	border: none
	background: transparent
	color: oklch(var(--bc) / 0.7)
	border-radius: 0.375rem
	cursor: pointer

.LFM-section
	background: oklch(var(--b1))
	border-radius: 0.5rem
	overflow: hidden

.LFM-section-header
	display: flex
	align-items: center
	gap: 0.5rem
	padding: 0.75rem
	cursor: pointer
	font-weight: 500
	font-size: 0.875rem
	color: oklch(var(--bc))
	border-bottom: 1px solid oklch(var(--b3))
	svg
		font-size: 1.125rem
	span
		flex: 1

.LFM-section-content
	padding: 0.75rem

.LFM-preview-container
	background: oklch(var(--b2))
	border-radius: 0.375rem
	display: flex
	align-items: center
	justify-content: center
	position: relative
	overflow: hidden

.LFM-preview-image
	max-width: 100%
	max-height: 100%
	object-fit: contain

.LFM-media-preview
	display: flex
	flex-direction: column
	align-items: center
	gap: 0.5rem

.LFM-play-btn
	width: 3rem
	height: 3rem
	border-radius: 50%
	border: none
	background: oklch(var(--p))
	color: oklch(var(--pc))
	display: flex
	align-items: center
	justify-content: center
	cursor: pointer
	font-size: 1.5rem

.LFM-duration
	font-size: 0.75rem
	color: oklch(var(--bc) / 0.7)

.LFM-no-preview
	display: flex
	flex-direction: column
	align-items: center
	gap: 0.5rem
	color: oklch(var(--bc) / 0.5)
	svg
		font-size: 2rem

.LFM-preview-toolbar
	display: flex
	justify-content: center
	gap: 0.5rem
	margin-top: 0.5rem

.LFM-toolbar-btn
	width: 2rem
	height: 2rem
	border: none
	background: oklch(var(--b2))
	color: oklch(var(--bc) / 0.7)
	border-radius: 0.375rem
	cursor: pointer
	&:hover
		background: oklch(var(--b3))

.LFM-info-grid
	display: flex
	flex-direction: column
	gap: 0.5rem

.LFM-info-row
	display: flex
	justify-content: space-between
	font-size: 0.8125rem
	padding: 0.25rem 0
	border-bottom: 1px solid oklch(var(--b3) / 0.5)
	span:first-child
		color: oklch(var(--bc) / 0.7)
	span:last-child
		font-weight: 500

.LFM-perm-code
	font-family: monospace
	font-size: 0.875rem
</style>