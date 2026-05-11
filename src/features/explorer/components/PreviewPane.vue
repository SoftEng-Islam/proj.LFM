<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useToast } from 'vue-toastification';

// Material Symbols Icons
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

import { useFileManagerStore } from '@/stores/file-manager';
import type { AccentTone, FileStatus } from '@/types/file-manager';

// Accent theme mapping for file type colors - Now more layered and premium
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
		glow: 'shadow-[0_0_40px_-10px_rgba(244,63,94,0.3)]',
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
	folder: '📁', document: '📄', spreadsheet: '📊', image: '🖼', video: '🎬', archive: '📦', code: '💻', pdf: '📕', audio: '🎵', default: '📄'
};

const codeExtensionIcons: Record<string, string> = {
	js: 'JS', ts: 'TS', py: 'PY', rs: 'RS', go: 'GO', java: 'JAVA', cpp: 'CPP', c: 'C', css: 'CSS', html: 'HTML', json: '{}', xml: '<>', yaml: 'YML', md: 'MD', sh: 'SH'
};

const store = useFileManagerStore();
const toast = useToast();

const selectedItem = computed(() => store.selectedItem);
const isImage = computed(() => selectedItem.value?.category === 'image');
const isVideo = computed(() => selectedItem.value?.category === 'video');
const isCode = computed(() => selectedItem.value?.category === 'code');
const isPreviewable = computed(() => !!selectedItem.value?.preview);
const previewSrc = computed(() => selectedItem.value?.preview || '');
const imageError = ref(false);

const isEditingName = ref(false);
const editedName = ref('');
const expandedSections = ref<Record<string, boolean>>({ info: true, dates: false, tags: false });

watch(selectedItem, () => {
	imageError.value = false;
	isEditingName.value = false;
});

const formatDate = (dateStr: string) => {
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

const getCodeIcon = (filename: string) => {
	const ext = filename.split('.').pop()?.toLowerCase() || '';
	return codeExtensionIcons[ext] || ext.toUpperCase();
};

const toggleSection = (id: string) => { expandedSections.value[id] = !expandedSections.value[id]; };

// Action handlers
function handleOpen() { if (selectedItem.value) store.openItem(selectedItem.value.id); }
function copyPath() { if (selectedItem.value) { navigator.clipboard.writeText(selectedItem.value.id); toast.success('Path copied'); } }
function copyName() { if (selectedItem.value) { navigator.clipboard.writeText(selectedItem.value.name); toast.success('Name copied'); } }
function openInTerminal() { if (selectedItem.value) { store.openInTerminal(selectedItem.value.id); toast.success('Terminal opened'); } }
function pinSelection() { if (selectedItem.value) { store.togglePinnedForSelection(); toast.success(store.isPinned(selectedItem.value.id) ? 'Pinned' : 'Unpinned'); } }
function startEditingName() { if (selectedItem.value) { editedName.value = selectedItem.value.name; isEditingName.value = true; } }
function saveName() { if (selectedItem.value && editedName.value.trim()) { toast.success('Renamed'); isEditingName.value = false; } }
</script>

<template lang="pug">
aside.LFM-preview-pane
	//- --- Empty State ---
	transition(name="fade" mode="out-in")
		.LFM-empty-state(v-if="!selectedItem" key="empty")
			.LFM-empty-visual
				.LFM-empty-glow
				IconDescription.LFM-empty-icon
			h3 Select an item
			p Choose a file or folder to view its properties and preview.

		//- --- Active Preview Content ---
		.LFM-preview-content(v-else key="content")
			//- Hero Area with Dynamic Background - Now Full Width
			.LFM-hero(:class="accentThemeMap[selectedItem.accent]?.glow")
				.LFM-hero-bg(:class="accentThemeMap[selectedItem.accent]?.surface")
				
				//- Media Preview - Full Width & Height
				.LFM-preview-frame
					transition(name="scale-fade" mode="out-in")
						.LFM-media-wrapper(v-if="isPreviewable && !imageError" :key="previewSrc")
							img.LFM-preview-image(v-if="isImage" :src="previewSrc" alt="Preview" @error="imageError = true")
							.LFM-video-container(v-else-if="isVideo")
								img.LFM-preview-image(:src="previewSrc" alt="Thumbnail")
								button.LFM-play-overlay(@click="handleOpen")
									IconPlayArrow(:size="32")
						
						.LFM-fallback-wrapper(v-else :key="'fallback-' + selectedItem.id")
							.LFM-fallback-blob(:class="accentThemeMap[selectedItem.accent]?.ring")
								span.LFM-fallback-symbol {{ categorySymbolMap[selectedItem.category] || '📄' }}
								span.LFM-fallback-ext(v-if="isCode") {{ getCodeIcon(selectedItem.name) }}

				//- Integrated Action Bar
				.LFM-hero-actions
					button.LFM-action-pill.LFM-action-pill--primary(@click="handleOpen")
						IconOpenInNew
						span Open
					button.LFM-action-pill(@click="openInTerminal" title="Open in Terminal")
						IconTerminal.text-emerald-500
					button.LFM-action-pill(@click="copyPath" title="Copy Path")
						IconContentCopy.text-sky-500
					button.LFM-action-pill(@click="pinSelection" :class="{ 'is-active': store.isPinned(selectedItem.id) }" title="Pin")
						IconPushPin.text-fuchsia-500

			//- Identity Card
			.LFM-id-card
				.LFM-id-header
					.LFM-id-titles
						.LFM-type-badge(:class="accentThemeMap[selectedItem.accent]?.text") {{ selectedItem.typeLabel }}
						.LFM-name-row(v-if="!isEditingName")
							h2.LFM-filename(:title="selectedItem.name") {{ selectedItem.name }}
							button.LFM-edit-trigger(@click="startEditingName")
								IconEdit
						.LFM-name-editor(v-else)
							input.LFM-edit-input(v-model="editedName" autoFocus @keyup.enter="saveName" @keyup.esc="isEditingName = false")
							button.LFM-edit-btn.LFM-edit-btn--save(@click="saveName")
								IconCheck
							button.LFM-edit-btn(@click="isEditingName = false")
								IconClose
					.LFM-status-pill(:class="statusToneMap[selectedItem.status]") {{ selectedItem.status }}

			//- Smart Properties Accordion
			.LFM-accordion
				//- Section: Information
				.LFM-accordion-item(:class="{ 'is-expanded': expandedSections.info }")
					button.LFM-accordion-header(@click="toggleSection('info')")
						IconInfo
						span Basic Information
						IconChevronRight.LFM-accordion-arrow
					.LFM-accordion-body
						.LFM-prop-row
							span.LFM-prop-label Size
							span.LFM-prop-value.font-mono {{ formatSize(selectedItem.sortSize) }}
						.LFM-prop-row
							span.LFM-prop-label Type
							span.LFM-prop-value {{ selectedItem.typeLabel }}
						.LFM-prop-row
							span.LFM-prop-label Path
							button.LFM-prop-link(@click="copyPath") {{ selectedItem.id }}

				//- Section: History
				.LFM-accordion-item(:class="{ 'is-expanded': expandedSections.dates }")
					button.LFM-accordion-header(@click="toggleSection('dates')")
						IconHistory
						span History & Dates
						IconChevronRight.LFM-accordion-arrow
					.LFM-accordion-body
						.LFM-prop-row
							span.LFM-prop-label Modified
							span.LFM-prop-value.font-mono {{ formatDate(selectedItem.modifiedAt) }}
						.LFM-prop-row
							span.LFM-prop-label Created
							span.LFM-prop-value.font-mono {{ formatDate(selectedItem.createdAt || '') }}

				//- Section: Tags
				.LFM-accordion-item(v-if="selectedItem.tags?.length" :class="{ 'is-expanded': expandedSections.tags }")
					button.LFM-accordion-header(@click="toggleSection('tags')")
						IconLabel
						span Tags & Classification
						IconChevronRight.LFM-accordion-arrow
					.LFM-accordion-body
						.LFM-tag-cloud
							span.LFM-tag-pill(v-for="tag in selectedItem.tags" :key="tag") {{ tag }}
</template>

<style lang="sass" scoped>
@reference "tailwindcss"

$lfm-ease: cubic-bezier(0.2, 1, 0.3, 1)

.LFM-preview-pane
	display: flex
	flex-direction: column
	height: 100%
	background: var(--LFM-preview-pane-bg)
	overflow-y: auto
	overflow-x: hidden
	padding: 16px
	gap: 20px
	scrollbar-gutter: stable

// --- Empty State ---
.LFM-empty-state
	display: flex
	flex-direction: column
	align-items: center
	justify-content: center
	height: 100%
	text-align: center
	padding: 40px 20px
	color: var(--LFM-text-muted)

	.LFM-empty-visual
		position: relative
		width: 100px
		height: 100px
		margin-bottom: 24px
		display: flex
		align-items: center
		justify-content: center

	.LFM-empty-glow
		position: absolute
		width: 80px
		height: 80px
		background: var(--LFM-blue)
		filter: blur(40px)
		opacity: 0.15

	.LFM-empty-icon
		font-size: 48px
		opacity: 0.5
		z-index: 1

	h3
		font-size: 15px
		font-weight: 600
		color: var(--LFM-text)
		margin: 0 0 8px

	p
		font-size: 13px
		max-width: 200px
		line-height: 1.5

// --- Hero Area ---
.LFM-hero
	position: relative
	border-radius: 12px
	aspect-ratio: 16 / 10
	overflow: hidden
	background: #0a0a0a
	display: flex
	align-items: center
	justify-content: center
	transition: all 400ms $lfm-ease
	margin: -16px -16px 0
	width: calc(100% + 32px)
	border-radius: 0 0 12px 12px

.LFM-hero-bg
	position: absolute
	inset: 0
	background-image: radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.4) 100%)
	opacity: 0.6
	z-index: 0

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
	object-fit: cover
	transition: transform 0.5s $lfm-ease

	&:hover
		transform: scale(1.05)

.LFM-video-container
	position: relative
	width: 100%
	height: 100%
	display: flex
	align-items: center
	justify-content: center

.LFM-play-overlay
	position: absolute
	width: 64px
	height: 64px
	border-radius: 50%
	background: rgba(255, 255, 255, 0.1)
	backdrop-filter: blur(12px)
	border: 1px solid rgba(255, 255, 255, 0.2)
	color: white
	display: flex
	align-items: center
	justify-content: center
	cursor: pointer
	transition: all 200ms ease
	z-index: 2

	&:hover
		transform: scale(1.1)
		background: rgba(255, 255, 255, 0.2)

.LFM-fallback-blob
	width: 100px
	height: 100px
	border-radius: 28px
	background: rgba(255,255,255,0.03)
	backdrop-filter: blur(8px)
	border-width: 1px
	display: flex
	flex-direction: column
	align-items: center
	justify-content: center
	gap: 8px
	transition: all 300ms ease

.LFM-fallback-symbol
	font-size: 40px

.LFM-fallback-ext
	font-size: 10px
	font-weight: 800
	letter-spacing: 0.1em
	text-transform: uppercase
	opacity: 0.6

.LFM-hero-actions
	position: absolute
	bottom: 12px
	left: 12px
	right: 12px
	display: flex
	gap: 6px
	z-index: 3

.LFM-action-pill
	display: flex
	align-items: center
	gap: 8px
	height: 36px
	padding: 0 12px
	border-radius: 12px
	background: rgba(0,0,0,0.3)
	backdrop-filter: blur(16px)
	border: 1px solid rgba(255,255,255,0.1)
	color: white
	font-size: 13px
	font-weight: 600
	cursor: pointer
	transition: all 200ms ease

	&:hover
		background: rgba(0,0,0,0.5)
		transform: translateY(-2px)

	&--primary
		flex: 1
		background: var(--LFM-blue)
		border: none
		justify-content: center

	&.is-active
		background: var(--LFM-blue)
		color: white
		border-color: rgba(255,255,255,0.2)

// --- ID Card ---
.LFM-id-card
	padding: 0 8px

.LFM-id-titles
	display: flex
	flex-direction: column
	gap: 4px

.LFM-type-badge
	font-size: 11px
	font-weight: 700
	text-transform: uppercase
	letter-spacing: 0.08em

.LFM-name-row
	display: flex
	align-items: center
	gap: 12px

.LFM-filename
	font-size: 18px
	font-weight: 700
	margin: 0
	word-break: break-all
	line-height: 1.2

.LFM-edit-trigger
	opacity: 0
	background: transparent
	border: none
	color: var(--LFM-text-muted)
	cursor: pointer
	transition: opacity 200ms ease

.LFM-id-card:hover .LFM-edit-trigger
	opacity: 1

.LFM-status-pill
	margin-top: 10px
	display: inline-flex
	align-self: flex-start
	padding: 4px 12px
	border-radius: 20px
	font-size: 11px
	font-weight: 600
	text-transform: capitalize
	border: 1px solid transparent

// --- Accordion ---
.LFM-accordion
	display: flex
	flex-direction: column
	gap: 1px
	background: var(--LFM-border)
	border-radius: 16px
	overflow: hidden
	border: 1px solid var(--LFM-border)

.LFM-accordion-item
	background: var(--LFM-panel)

.LFM-accordion-header
	width: 100%
	display: flex
	align-items: center
	gap: 12px
	padding: 14px 16px
	border: none
	background: transparent
	cursor: pointer
	font-size: 13px
	font-weight: 600
	color: var(--LFM-text)
	transition: background 200ms ease

	&:hover
		background: var(--LFM-hover)

	.LFM-accordion-arrow
		margin-left: auto
		font-size: 18px
		transition: transform 300ms $lfm-ease
		opacity: 0.4

.LFM-accordion-item.is-expanded
	.LFM-accordion-arrow
		transform: rotate(90deg)
	
	.LFM-accordion-body
		display: block

.LFM-accordion-body
	display: none
	padding: 0 16px 16px
	animation: slideDown 300ms $lfm-ease

.LFM-prop-row
	display: flex
	justify-content: space-between
	align-items: flex-start
	padding: 8px 0
	border-bottom: 1px solid var(--LFM-border)
	gap: 20px

	&:last-child
		border-bottom: none

.LFM-prop-label
	font-size: 12px
	color: var(--LFM-text-muted)
	white-space: nowrap

.LFM-prop-value
	font-size: 12px
	font-weight: 600
	text-align: right
	word-break: break-all

.LFM-prop-link
	background: transparent
	border: none
	padding: 0
	font-size: 12px
	font-family: ui-monospace, monospace
	color: var(--LFM-blue)
	text-align: right
	word-break: break-all
	cursor: pointer
	&:hover
		text-decoration: underline

.LFM-tag-cloud
	display: flex
	flex-wrap: wrap
	gap: 6px
	padding-top: 8px

.LFM-tag-pill
	padding: 4px 10px
	background: var(--LFM-blue-subtle)
	color: var(--LFM-blue)
	border-radius: 6px
	font-size: 11px
	font-weight: 600

// --- Animations ---
@keyframes slideDown
	from
		opacity: 0
		transform: translateY(-10px)
	to
		opacity: 1
		transform: translateY(0)

.scale-fade-enter-active, .scale-fade-leave-active
	transition: all 400ms $lfm-ease

.scale-fade-enter-from
	opacity: 0
	transform: scale(0.9)
.scale-fade-leave-to
	opacity: 0
	transform: scale(1.05)

.fade-enter-active, .fade-leave-active
	transition: opacity 300ms ease

.fade-enter-from, .fade-leave-to
	opacity: 0
</style>
