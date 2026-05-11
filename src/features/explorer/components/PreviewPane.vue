<script setup lang="ts">
/**
 * PreviewPane component — Section 8 of the Roadmap.
 * Implements 4 sections:
 *  1. File Preview (Visuals + Toolbar)
 *  2. General Information (Metadata)
 *  3. Advanced Information (Media details via ffprobe)
 *  4. Permissions (Linux mode, owner, group)
 */
import { computed, ref, watch } from 'vue';
import { useToast } from 'vue-toastification';
import { storeToRefs } from 'pinia';

// Icons
import IconDescription from '~icons/material-symbols/description';
import IconPlayArrow from '~icons/material-symbols/play-arrow';
import IconOpenInNew from '~icons/material-symbols/open-in-new';
import IconTerminal from '~icons/material-symbols/terminal';
import IconContentCopy from '~icons/material-symbols/content-copy';
import IconEdit from '~icons/material-symbols/edit';
import IconPushPin from '~icons/material-symbols/push-pin';
import IconCheck from '~icons/material-symbols/check';
import IconClose from '~icons/material-symbols/close';
import IconInfo from '~icons/material-symbols/info-outline';
import IconHistory from '~icons/material-symbols/history';
import IconLabel from '~icons/material-symbols/label-outline';
import IconChevronRight from '~icons/material-symbols/chevron-right';
import IconSettings from '~icons/material-symbols/settings';
import IconShield from '~icons/material-symbols/shield';
import IconMovie from '~icons/material-symbols/movie';
import IconViewAgenda from '~icons/material-symbols/view-agenda';
import IconViewWeek from '~icons/material-symbols/view-week';
import IconViewDay from '~icons/material-symbols/view-day';
import IconDown from '~icons/material-symbols/arrow-drop-down';

import { useFileManagerStore } from '@/stores/file-manager';
import type { AccentTone, FileStatus } from '@/types/file-manager';
import AudioPlayer from '@/components/ui/AudioPlayer.vue';

// Accent theme mapping for file type colors
const accentThemeMap: Record<
	AccentTone,
	{
		chip: string;
		bar: string;
		surface: string;
		ring: string;
		glow: string;
		text: string;
	}
> = {
	sky: {
		chip: 'bg-sky-500/12 text-sky-700 dark:bg-sky-400/12 dark:text-sky-200',
		bar: 'bg-sky-500',
		surface: 'from-sky-500/15 via-sky-500/5 to-transparent',
		ring: 'ring-sky-500/30',
		glow: 'shadow-[0_0_40px_-10px_rgba(14,165,233,0.3)]',
		text: 'text-sky-600 dark:text-sky-400'
	},
	emerald: {
		chip: 'bg-emerald-500/12 text-emerald-700 dark:bg-emerald-400/12 dark:text-emerald-200',
		bar: 'bg-emerald-500',
		surface: 'from-emerald-500/15 via-emerald-500/5 to-transparent',
		ring: 'ring-emerald-500/30',
		glow: 'shadow-[0_0_40px_-10px_rgba(16,185,129,0.3)]',
		text: 'text-emerald-600 dark:text-emerald-400'
	},
	amber: {
		chip: 'bg-amber-500/12 text-amber-700 dark:bg-amber-400/12 dark:text-amber-200',
		bar: 'bg-amber-500',
		surface: 'from-amber-500/15 via-amber-500/5 to-transparent',
		ring: 'ring-amber-300/50',
		glow: 'shadow-[0_0_40px_-10px_rgba(245,158,11,0.3)]',
		text: 'text-amber-600 dark:text-amber-400'
	},
	violet: {
		chip: 'bg-violet-500/12 text-violet-700 dark:bg-violet-400/12 dark:text-violet-200',
		bar: 'bg-violet-500',
		surface: 'from-violet-500/15 via-violet-500/5 to-transparent',
		ring: 'ring-violet-500/30',
		glow: 'shadow-[0_0_40px_-10px_rgba(139,92,246,0.3)]',
		text: 'text-violet-600 dark:text-violet-400'
	},
	rose: {
		chip: 'bg-rose-500/12 text-rose-700 dark:bg-rose-400/12 dark:text-rose-200',
		bar: 'bg-rose-500',
		surface: 'from-rose-500/15 via-rose-500/5 to-transparent',
		ring: 'ring-rose-500/30',
		glow: 'shadow-[0_0_40px_-10_rgba(244,63,94,0.3)]',
		text: 'text-rose-600 dark:text-rose-400'
	},
	cyan: {
		chip: 'bg-cyan-500/12 text-cyan-700 dark:bg-cyan-400/12 dark:text-cyan-200',
		bar: 'bg-cyan-500',
		surface: 'from-cyan-500/15 via-cyan-500/5 to-transparent',
		ring: 'ring-cyan-500/30',
		glow: 'shadow-[0_0_40px_-10px_rgba(6,182,212,0.3)]',
		text: 'text-cyan-600 dark:text-cyan-400'
	},
	slate: {
		chip: 'bg-slate-500/12 text-slate-700 dark:bg-slate-400/12 dark:text-slate-200',
		bar: 'bg-slate-500',
		surface: 'from-slate-500/15 via-slate-500/5 to-transparent',
		ring: 'ring-slate-500/30',
		glow: 'shadow-[0_0_40px_-10px_rgba(100,116,139,0.3)]',
		text: 'text-slate-600 dark:text-slate-400'
	}
};

const statusToneMap: Record<FileStatus, string> = {
	synced: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
	shared: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/20',
	draft: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20',
	favorite: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20',
	local: 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/20',
	recent: 'bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/20'
};

const categorySymbolMap: Record<string, string> = {
	folder: '📁', directory: '📁', document: '📄', spreadsheet: '📊', image: '🖼', video: '🎬', archive: '📦', code: '💻', pdf: '📕', audio: '🎵', default: '📄'
};

const store = useFileManagerStore();
const { selectedItem, selectedItemPermissions, selectedItemMediaInfo, previewMode, categoryPreferredMode } = storeToRefs(store);
const toast = useToast();

const isImage = computed(() => selectedItem.value?.category === 'image');
const isVideo = computed(() => selectedItem.value?.category === 'video');
const isAudio = computed(() => selectedItem.value?.category === 'audio');
const isCode = computed(() => selectedItem.value?.category === 'code');
const isMarkdown = computed(() => selectedItem.value?.category === 'markdown');
const isPDF = computed(() => selectedItem.value?.category === 'pdf');
const isPreviewable = computed(() => !!selectedItem.value?.preview);
const previewSrc = computed(() => selectedItem.value?.preview || '');
const imageError = ref(false);

// ── Preview Mode Logic ────────────────────────────────────────────────────────
const modes: Array<'automatic' | 'full' | 'compact' | 'sticky'> = ['automatic', 'full', 'compact', 'sticky'];

const currentMode = computed<'automatic' | 'full' | 'compact' | 'sticky'>(() => {
	if (previewMode.value === 'sticky' && selectedItem.value) {
		const category = selectedItem.value.category || 'default';
		return categoryPreferredMode.value[category] ?? 'automatic';
	}
	return previewMode.value;
});

const modeIcons: Record<'automatic' | 'full' | 'compact' | 'sticky', any> = {
	automatic: IconViewAgenda,
	full: IconViewWeek,
	compact: IconViewDay,
	sticky: IconPushPin,
};

const modeLabels: Record<'automatic' | 'full' | 'compact' | 'sticky', string> = {
	automatic: 'Automatic',
	full: 'Full',
	compact: 'Compact',
	sticky: 'Sticky',
};

// Section visibility based on mode
const showSectionTwo = computed(() => currentMode.value !== 'automatic');
const showSectionThree = computed(() => currentMode.value === 'full');
const showSectionFour = computed(() => true); // Always show permissions

function cyclePreviewMode() {
	const currentIndex = modes.indexOf(previewMode.value);
	const nextIndex = (currentIndex + 1) % modes.length;
	store.setPreviewMode(modes[nextIndex]);
	if (selectedItem.value) {
		const category = selectedItem.value.category || 'default';
		store.setPreferredModeForCategory(category, modes[nextIndex]);
	}
}

const isEditingName = ref(false);
const editedName = ref('');
const expandedSections = ref<Record<string, boolean>>({
	info: true,
	dates: false,
	advanced: false,
	perms: false,
	tags: false
});

watch(selectedItem, () => {
	imageError.value = false;
	isEditingName.value = false;
});

const formatDate = (dateStr?: string) => {
	if (!dateStr) return '-';
	return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(dateStr));
};

const formatSize = (bytes: number) => {
	if (!bytes) return '0 B';
	const units = ['B', 'KB', 'MB', 'GB', 'TB'];
	let i = 0;
	while (bytes >= 1024 && i < units.length - 1) { bytes /= 1024; i++; }
	return `${bytes.toFixed(1)} ${units[i]}`;
};

const formatDuration = (seconds?: number | null) => {
	if (!seconds) return '-';
	const h = Math.floor(seconds / 3600);
	const m = Math.floor((seconds % 3600) / 60);
	const s = Math.floor(seconds % 60);
	return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':').replace(/^00:/, '');
};

const decodeMode = (mode: number) => {
	const owner = (mode >> 6) & 7;
	const group = (mode >> 3) & 7;
	const other = mode & 7;
	const rwx = (p: number) => `${p & 4 ? 'r' : '-'}${p & 2 ? 'w' : '-'}${p & 1 ? 'x' : '-'}`;
	return {
		octal: (mode & 0o777).toString(8).padStart(3, '0'),
		owner: rwx(owner),
		group: rwx(group),
		other: rwx(other)
	};
};

const toggleSection = (id: string) => { expandedSections.value[id] = !expandedSections.value[id]; };

// Action handlers
function handleOpen() { if (selectedItem.value) store.openItem(selectedItem.value.id); }
function copyPath() { if (selectedItem.value) { navigator.clipboard.writeText(selectedItem.value.id); toast.success('Path copied'); } }
function openInTerminal() { if (selectedItem.value) { store.openInTerminal(selectedItem.value.id); toast.success('Terminal opened'); } }
function pinSelection() { if (selectedItem.value) { store.togglePinnedForSelection(); toast.success(store.isPinned(selectedItem.value.id) ? 'Pinned' : 'Unpinned'); } }
function startEditingName() { if (selectedItem.value) { editedName.value = selectedItem.value.name; isEditingName.value = true; } }
function saveName() { if (selectedItem.value && editedName.value.trim()) { store.renameItem(selectedItem.value.id, editedName.value.trim()); isEditingName.value = false; } }
</script>

<template lang="pug">
aside.LFM-preview-pane
	transition(name="fade" mode="out-in")
		//- --- Empty State ---
		.LFM-empty-state(v-if="!selectedItem" key="empty")
			.LFM-empty-visual
				.LFM-empty-glow
				IconDescription.LFM-empty-icon
			h3 Select an item
			p Choose a file or directory to view its properties and preview.

		//- --- Active Preview Content ---
		.LFM-preview-content(v-else key="content")
			//- Preview Mode Indicator
			.LFM-mode-indicator
				.LFM-mode-badge(:class="{ 'is-active': currentMode === 'sticky' }")
					component(
						:is="modeIcons[currentMode]"
						class="LFM-mode-icon"
					)
					span.LFM-mode-label {{ modeLabels[currentMode] }}
				button.LFM-mode-cycle(@click="cyclePreviewMode" title="Cycle preview mode (Automatic → Full → Compact → Sticky)")
					IconDown

			//- Section 1: File Preview Area
			.LFM-hero-container
				.LFM-hero(:class="accentThemeMap[selectedItem.accent]?.glow" :style="{ height: currentMode === 'compact' ? '128px' : '220px' }")
					.LFM-hero-bg(:class="accentThemeMap[selectedItem.accent]?.surface")

					.LFM-preview-frame
						transition(name="scale-fade" mode="out-in")
							.LFM-media-wrapper(v-if="isPreviewable && !imageError" :key="previewSrc")
								img.LFM-preview-image(v-if="isImage" :src="previewSrc" alt="Preview" @error="imageError = true")
								.LFM-video-container(v-else-if="isVideo")
									img.LFM-preview-image(:src="previewSrc" alt="Thumbnail")
									button.LFM-play-overlay(@click="handleOpen")
										IconPlayArrow(size="32")
								AudioPlayer(v-else-if="isAudio" :src="previewSrc" :title="selectedItem.name")

							.LFM-fallback-wrapper(v-else :key="'fallback-' + selectedItem.id")
								.LFM-fallback-blob(:class="accentThemeMap[selectedItem.accent]?.ring")
									span.LFM-fallback-symbol {{ categorySymbolMap[selectedItem.category] || '📄' }}

					//- Section 1 Toolbar (Open actions)
					.LFM-hero-toolbar
						button.LFM-toolbar-pill.LFM-toolbar-pill--primary(@click="handleOpen")
							IconOpenInNew
							span Open
						button.LFM-toolbar-pill(@click="openInTerminal" title="Open in Terminal")
							IconTerminal.text-emerald-500
						button.LFM-toolbar-pill(@click="copyPath" title="Copy Path")
							IconContentCopy.text-sky-500
						button.LFM-toolbar-pill(@click="pinSelection" :class="{ 'is-active': store.isPinned(selectedItem.id) }" title="Pin")
							IconPushPin.text-fuchsia-500

				//- Section 1 Identity (Title with copy/edit)
				.LFM-identity
					.LFM-id-titles
						.LFM-type-label(:class="accentThemeMap[selectedItem.accent]?.text") {{ selectedItem.typeLabel }}
						.LFM-name-row(v-if="!isEditingName")
							h2.LFM-filename(:title="selectedItem.name") {{ selectedItem.name }}
							button.LFM-edit-icon(@click="startEditingName")
								IconEdit
						.LFM-name-editor(v-else)
							input.LFM-edit-input(v-model="editedName" autoFocus @keyup.enter="saveName" @keyup.esc="isEditingName = false")
							button.LFM-save-btn(@click="saveName")
								IconCheck
					.LFM-status-chip(:class="statusToneMap[selectedItem.status]") {{ selectedItem.status }}

			//- Smart Properties Accordion (Sections 2, 3, 4)
			.LFM-accordion
				//- Section 2: General Information
				.LFM-accordion-item(v-if="showSectionTwo" :class="{ 'is-expanded': expandedSections.info }")
					button.LFM-accordion-header(@click="toggleSection('info')")
						IconInfo
						span General Information
						IconChevronRight.LFM-accordion-arrow
					.LFM-accordion-body
						.LFM-prop-row
							span.LFM-prop-label Size
							span.LFM-prop-value {{ formatSize(selectedItem.sortSize) }}
						.LFM-prop-row
							span.LFM-prop-label Type
							span.LFM-prop-value {{ selectedItem.typeLabel }}
						.LFM-prop-row(v-if="selectedItemMediaInfo?.width")
							span.LFM-prop-label Dimensions
							span.LFM-prop-value {{ selectedItemMediaInfo.width }} × {{ selectedItemMediaInfo.height }}
						.LFM-prop-row(v-if="selectedItemMediaInfo?.duration")
							span.LFM-prop-label Duration
							span.LFM-prop-value {{ formatDuration(selectedItemMediaInfo.duration) }}
						.LFM-prop-row
							span.LFM-prop-label Path
							button.LFM-prop-copy(@click="copyPath") {{ selectedItem.id }}

				//- Section 2: Dates (History)
				.LFM-accordion-item(v-if="showSectionTwo" :class="{ 'is-expanded': expandedSections.dates }")
					button.LFM-accordion-header(@click="toggleSection('dates')")
						IconHistory
						span History & Dates
						IconChevronRight.LFM-accordion-arrow
					.LFM-accordion-body
						.LFM-prop-row
							span.LFM-prop-label Modified
							span.LFM-prop-value {{ formatDate(selectedItem.modifiedAt) }}
						.LFM-prop-row
							span.LFM-prop-label Created
							span.LFM-prop-value {{ formatDate(selectedItem.createdAt) }}
						.LFM-prop-row
							span.LFM-prop-label Accessed
							span.LFM-prop-value {{ formatDate(selectedItem.accessedAt) }}

				//- Section 3: Advanced Media Information
				.LFM-accordion-item(v-if="(isVideo || isAudio) && showSectionThree" :class="{ 'is-expanded': expandedSections.advanced }")
					button.LFM-accordion-header(@click="toggleSection('advanced')")
						IconMovie
						span Media Analysis
						IconChevronRight.LFM-accordion-arrow
					.LFM-accordion-body
						.LFM-prop-row(v-if="selectedItemMediaInfo?.video_codec")
							span.LFM-prop-label Video Codec
							span.LFM-prop-value {{ selectedItemMediaInfo.video_codec }}
						.LFM-prop-row(v-if="selectedItemMediaInfo?.audio_codec")
							span.LFM-prop-label Audio Codec
							span.LFM-prop-value {{ selectedItemMediaInfo.audio_codec }}
						.LFM-prop-row(v-if="selectedItemMediaInfo?.bitrate")
							span.LFM-prop-label Bit Rate
							span.LFM-prop-value {{ Math.round(selectedItemMediaInfo.bitrate / 1000) }} kbps
						.LFM-prop-row(v-if="selectedItemMediaInfo?.frame_rate")
							span.LFM-prop-label Frame Rate
							span.LFM-prop-value {{ selectedItemMediaInfo.frame_rate.toFixed(2) }} fps
						.LFM-prop-row(v-if="selectedItemMediaInfo?.sample_rate")
							span.LFM-prop-label Sample Rate
							span.LFM-prop-value {{ selectedItemMediaInfo.sample_rate }} Hz

				//- Section 4: Permissions
				.LFM-accordion-item(:class="{ 'is-expanded': expandedSections.perms }")
					button.LFM-accordion-header(@click="toggleSection('perms')")
						IconShield
						span Security & Permissions
						IconChevronRight.LFM-accordion-arrow
					.LFM-accordion-body
						.LFM-perm-grid(v-if="selectedItemPermissions")
							.LFM-perm-header
								span Mode
								span.font-mono.text-blue-500 {{ decodeMode(selectedItemPermissions.mode).octal }}

							.LFM-prop-row
								span.LFM-prop-label Owner
								span.LFM-prop-value {{ selectedItemPermissions.owner }}
								span.font-mono.text-xs.ml-2.opacity-60 {{ decodeMode(selectedItemPermissions.mode).owner }}
							.LFM-prop-row
								span.LFM-prop-label Group
								span.LFM-prop-value {{ selectedItemPermissions.group }}
								span.font-mono.text-xs.ml-2.opacity-60 {{ decodeMode(selectedItemPermissions.mode).group }}
							.LFM-prop-row
								span.LFM-prop-label Others
								span.LFM-prop-value —
								span.font-mono.text-xs.ml-2.opacity-60 {{ decodeMode(selectedItemPermissions.mode).other }}

						.LFM-prop-row
							span.LFM-prop-label Writeable
							span.LFM-prop-value {{ selectedItem.readonly ? 'No' : 'Yes' }}

				//- Tags Section
				.LFM-accordion-item(v-if="selectedItem.tags?.length" :class="{ 'is-expanded': expandedSections.tags }")
					button.LFM-accordion-header(@click="toggleSection('tags')")
						IconLabel
						span Tags
						IconChevronRight.LFM-accordion-arrow
					.LFM-accordion-body
						.LFM-tag-wrap
							span.LFM-tag-chip(v-for="tag in selectedItem.tags" :key="tag") {{ tag }}
</template>

<style lang="sass" scoped>
@reference "tailwindcss"

$lfm-ease: cubic-bezier(0.2, 1, 0.3, 1)

// --- Mode Indicator ---
.LFM-mode-indicator
	display: flex
	align-items: center
	justify-content: space-between
	padding: 8px 12px
	margin: -16px -16px 0
	width: calc(100% + 32px)
	background: var(--LFM-panel)
	border-bottom: 1px solid var(--LFM-border)
	gap: 8px

.LFM-mode-badge
	display: flex
	align-items: center
	gap: 6px
	padding: 4px 8px
	border-radius: 8px
	background: var(--LFM-hover)
	color: var(--LFM-text-muted)
	font-size: 11px
	font-weight: 600
	text-transform: uppercase
	letter-spacing: 0.05em
	transition: all 200ms ease

	&.is-active
		background: var(--LFM-blue-subtle)
		color: var(--LFM-blue)

.LFM-mode-icon
	width: 14px
	height: 14px
	opacity: 0.7

.LFM-mode-label
	white-space: nowrap

.LFM-mode-cycle
	width: 20px
	height: 20px
	border-radius: 6px
	background: transparent
	border: 1px solid var(--LFM-border)
	color: var(--LFM-text-muted)
	cursor: pointer
	display: flex
	align-items: center
	justify-content: center
	transition: all 200ms ease
	font-size: 12px

	&:hover
		background: var(--LFM-hover)
		color: var(--LFM-text)
		transform: rotate(180deg)

.LFM-preview-pane
	display: flex
	flex-direction: column
	height: 100%
	background: var(--LFM-preview-pane-bg)
	overflow-y: auto
	padding: 16px
	gap: 20px

// --- Empty State ---
.LFM-empty-state
	display: flex
	flex-direction: column
	align-items: center
	justify-content: center
	height: 100%
	text-align: center
	color: var(--LFM-text-muted)

	.LFM-empty-visual
		position: relative
		width: 80px
		height: 80px
		margin-bottom: 20px
		display: flex
		align-items: center
		justify-content: center

	.LFM-empty-glow
		position: absolute
		width: 100%
		height: 100%
		background: var(--LFM-blue)
		filter: blur(40px)
		opacity: 0.1

	.LFM-empty-icon
		font-size: 40px
		opacity: 0.4

	h3
		font-size: 14px
		font-weight: 600
		color: var(--LFM-text)
		margin-bottom: 4px

	p
		font-size: 12px
		max-width: 180px

// --- Identity & Hero ---
.LFM-hero-container
	display: flex
	flex-direction: column
	gap: 16px
	margin: -16px -16px 0
	width: calc(100% + 32px)
	background: var(--LFM-panel)
	padding-bottom: 20px
	border-bottom: 1px solid var(--LFM-border)

.LFM-hero
	position: relative
	height: 220px
	background: #050505
	display: flex
	align-items: center
	justify-content: center
	overflow: hidden

.LFM-hero-bg
	position: absolute
	inset: 0
	opacity: 0.5

.LFM-preview-frame
	position: relative
	z-index: 1
	width: 100%
	height: 100%
	display: flex
	align-items: center
	justify-content: center

.LFM-preview-image
	width: 100%
	height: 100%
	object-fit: contain

.LFM-video-container
	position: relative
	width: 100%
	height: 100%
	display: flex
	align-items: center
	justify-content: center

.LFM-play-overlay
	position: absolute
	width: 56px
	height: 56px
	border-radius: 50%
	background: rgba(255,255,255,0.1)
	backdrop-filter: blur(10px)
	border: 1px solid rgba(255,255,255,0.2)
	color: white
	display: flex
	align-items: center
	justify-content: center
	cursor: pointer
	transition: all 200ms ease

	&:hover
		transform: scale(1.1)
		background: rgba(255,255,255,0.2)

.LFM-fallback-blob
	width: 80px
	height: 80px
	border-radius: 24px
	background: rgba(255,255,255,0.03)
	backdrop-filter: blur(5px)
	border: 1px solid rgba(255,255,255,0.1)
	display: flex
	align-items: center
	justify-content: center
	font-size: 32px

.LFM-hero-toolbar
	position: absolute
	bottom: 12px
	left: 12px
	right: 12px
	display: flex
	gap: 8px
	z-index: 5

.LFM-toolbar-pill
	display: flex
	align-items: center
	gap: 6px
	height: 32px
	padding: 0 10px
	border-radius: 10px
	background: rgba(0,0,0,0.4)
	backdrop-filter: blur(10px)
	border: 1px solid rgba(255,255,255,0.1)
	color: white
	font-size: 12px
	font-weight: 600
	cursor: pointer
	transition: all 200ms ease

	&:hover
		background: rgba(0,0,0,0.6)
		transform: translateY(-1px)

	&--primary
		flex: 1
		background: var(--LFM-blue)
		border: none
		justify-content: center

.LFM-identity
	padding: 0 16px
	display: flex
	justify-content: space-between
	align-items: flex-start

.LFM-id-titles
	display: flex
	flex-direction: column
	gap: 2px

.LFM-type-label
	font-size: 10px
	font-weight: 800
	text-transform: uppercase
	letter-spacing: 0.1em

.LFM-name-row
	display: flex
	align-items: center
	gap: 8px

.LFM-filename
	font-size: 16px
	font-weight: 700
	color: var(--LFM-text)
	max-width: 180px
	overflow: hidden
	text-overflow: ellipsis
	white-space: nowrap

.LFM-edit-icon
	opacity: 0
	cursor: pointer
	color: var(--LFM-text-muted)
	transition: opacity 200ms ease

.LFM-identity:hover .LFM-edit-icon
	opacity: 1

.LFM-status-chip
	padding: 2px 8px
	border-radius: 12px
	font-size: 10px
	font-weight: 700
	text-transform: uppercase

// --- Accordion ---
.LFM-accordion
	display: flex
	flex-direction: column
	gap: 8px

.LFM-accordion-item
	border-radius: 12px
	background: var(--LFM-panel)
	border: 1px solid var(--LFM-border)
	overflow: hidden

.LFM-accordion-header
	width: 100%
	display: flex
	align-items: center
	gap: 12px
	padding: 12px
	background: transparent
	border: none
	cursor: pointer
	font-size: 13px
	font-weight: 600
	color: var(--LFM-text)
	transition: background 200ms ease

	&:hover
		background: var(--LFM-hover)

.LFM-accordion-arrow
	margin-left: auto
	transition: transform 300ms $lfm-ease
	opacity: 0.5

.is-expanded
	.LFM-accordion-arrow
		transform: rotate(90deg)
	.LFM-accordion-body
		display: block

.LFM-accordion-body
	display: none
	padding: 0 12px 12px
	animation: slideDown 200ms ease-out

.LFM-prop-row
	display: flex
	justify-content: space-between
	align-items: center
	padding: 6px 0
	border-bottom: 1px solid var(--LFM-border)

	&:last-child
		border-bottom: none

.LFM-prop-label
	font-size: 11px
	color: var(--LFM-text-muted)

.LFM-prop-value
	font-size: 11px
	font-weight: 600
	color: var(--LFM-text)

.LFM-prop-copy
	font-family: monospace
	font-size: 10px
	color: var(--LFM-blue)
	background: transparent
	border: none
	cursor: pointer
	max-width: 140px
	overflow: hidden
	text-overflow: ellipsis
	white-space: nowrap

// --- Permissions ---
.LFM-perm-header
	display: flex
	justify-content: space-between
	align-items: center
	padding: 8px 0
	margin-bottom: 4px
	font-size: 12px
	font-weight: 700

// --- Tags ---
.LFM-tag-wrap
	display: flex
	flex-wrap: wrap
	gap: 6px
	padding-top: 4px

.LFM-tag-chip
	padding: 2px 8px
	border-radius: 6px
	background: var(--LFM-blue-subtle)
	color: var(--LFM-blue)
	font-size: 10px
	font-weight: 600

@keyframes slideDown
	from
		opacity: 0
		transform: translateY(-4px)
	to
		opacity: 1
		transform: translateY(0)

.fade-enter-active, .fade-leave-active
	transition: opacity 200ms ease
.fade-enter-from, .fade-leave-to
	opacity: 0

.scale-fade-enter-active, .scale-fade-leave-active
	transition: all 300ms $lfm-ease
.scale-fade-enter-from
	opacity: 0
	transform: scale(0.95)
.scale-fade-leave-to
	opacity: 0
	transform: scale(1.02)
</style>
