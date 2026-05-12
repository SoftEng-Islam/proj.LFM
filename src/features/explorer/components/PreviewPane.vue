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
import IconFullscreen from '~icons/material-symbols/fullscreen';

import { useFileManagerStore } from '@/stores/file-manager';
import type { AccentTone, FileStatus } from '@/types/file-manager';
import { readTextFile } from '@/services/tauri-bridge';
import AudioPlayer from '@/components/ui/AudioPlayer.vue';
import CodePreview from '@/components/ui/CodePreview.vue';
import MarkdownPreview from '@/components/ui/MarkdownPreview.vue';
import PDFPreview from '@/components/ui/PDFPreview.vue';
import FontPreview from '@/components/ui/FontPreview.vue';
import OfficePreview from '@/components/ui/OfficePreview.vue';
import { getDirectoryCount, setFilePermissions } from '@/services/tauri-bridge';

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
const isFont = computed(() => selectedItem.value?.category === 'font');
const isOffice = computed(() => ['document', 'spreadsheet'].includes(selectedItem.value?.category || ''));
const isPreviewable = computed(() => !!selectedItem.value?.preview || isOffice.value);
const previewSrc = computed(() => selectedItem.value?.preview || '');
const imageError = ref(false);

// File content for text-based previews
const fileContent = ref('');
const isLoadingContent = ref(false);
const directoryItemCount = ref<number | null>(null);

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
	const currentIndex = modes.indexOf(previewMode.value || 'automatic');
	const nextIndex = (currentIndex + 1) % modes.length;
	const nextMode = modes[nextIndex];
	store.setPreviewMode(nextMode);
	if (selectedItem.value) {
		const category = selectedItem.value.category || 'default';
		store.setPreferredModeForCategory(category, nextMode);
	}
}

const isEditingName = ref(false);
const editedName = ref('');
const isEditingPermissions = ref(false);
const permissionMode = ref(0);
const initialPermissionMode = ref(0);
const expandedSections = ref<Record<string, boolean>>({
	info: true,
	dates: false,
	advanced: false,
	perms: false,
	tags: false
});

watch(selectedItem, async () => {
	imageError.value = false;
	isEditingName.value = false;
	isEditingPermissions.value = false;
	fileContent.value = '';
	isLoadingContent.value = false;
	directoryItemCount.value = null;

	if (selectedItem.value) {
		if (isCode.value || isMarkdown.value) {
			try {
				isLoadingContent.value = true;
				fileContent.value = await readTextFile(selectedItem.value.id);
			} catch (err) {
				console.error('Failed to load file content:', err);
				fileContent.value = 'Failed to load file content';
			} finally {
				isLoadingContent.value = false;
			}
		}
		
		if (selectedItem.value.category === 'folder') {
			try {
				directoryItemCount.value = await getDirectoryCount(selectedItem.value.id);
			} catch (err) {
				console.warn('Failed to get directory count:', err);
			}
		}

		if (selectedItemPermissions.value) {
			permissionMode.value = selectedItemPermissions.value.mode;
			initialPermissionMode.value = selectedItemPermissions.value.mode;
		}
	}
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
	const rwx = (p: number) => ({
		read: !!(p & 4),
		write: !!(p & 2),
		exec: !!(p & 1),
		label: `${p & 4 ? 'r' : '-'}${p & 2 ? 'w' : '-'}${p & 1 ? 'x' : '-'}`
	});
	return {
		octal: (mode & 0o777).toString(8).padStart(3, '0'),
		owner: rwx(owner),
		group: rwx(group),
		other: rwx(other)
	};
};

function togglePermission(bit: number) {
	permissionMode.value ^= bit;
}

async function savePermissions() {
	if (!selectedItem.value) return;
	try {
		const success = await setFilePermissions(selectedItem.value.id, permissionMode.value);
		if (success) {
			toast.success('Permissions updated');
			isEditingPermissions.value = false;
			initialPermissionMode.value = permissionMode.value;
			// Refresh metadata
			store.updateSelectedItemMetadata();
		}
	} catch (err) {
		toast.error('Failed to update permissions');
	}
}

function resetPermissions() {
	permissionMode.value = initialPermissionMode.value;
	isEditingPermissions.value = false;
}

function handleOctalInput(e: Event) {
	const val = (e.target as HTMLInputElement).value;
	if (/^[0-7]{3}$/.test(val)) {
		permissionMode.value = parseInt(val, 8);
	}
}

const getLanguageFromFilename = (filename: string): string => {
	const ext = filename.split('.').pop()?.toLowerCase() || '';
	const langMap: Record<string, string> = {
		js: 'javascript',
		ts: 'typescript',
		vue: 'html',
		html: 'html',
		css: 'css',
		sass: 'scss',
		scss: 'scss',
		json: 'json',
		md: 'markdown',
		py: 'python',
		rs: 'rust',
		go: 'go',
		c: 'c',
		cpp: 'cpp',
		cxx: 'cpp',
		h: 'c',
		hpp: 'cpp',
		java: 'java',
		php: 'php',
		rb: 'ruby',
		sh: 'bash',
		yaml: 'yaml',
		yml: 'yaml',
		xml: 'xml',
		sql: 'sql',
	};
	return langMap[ext] || 'plaintext';
};

const toggleSection = (id: string) => { expandedSections.value[id] = !expandedSections.value[id]; };

// Action handlers
function handleOpen() { if (selectedItem.value) store.openItem(selectedItem.value.id); }
function copyPath() { if (selectedItem.value) { navigator.clipboard.writeText(selectedItem.value.id); toast.success('Path copied'); } }
function openInTerminal() { if (selectedItem.value) { store.openInTerminal(selectedItem.value.id); toast.success('Terminal opened'); } }
function pinSelection() { if (selectedItem.value) { store.togglePinnedForSelection(); toast.success(store.isPinned(selectedItem.value.id) ? 'Pinned' : 'Unpinned'); } }
function startEditingName() { if (selectedItem.value) { editedName.value = selectedItem.value.name; isEditingName.value = true; } }
function saveName() { if (selectedItem.value && editedName.value.trim()) { store.renameItem(selectedItem.value.id, editedName.value.trim()); isEditingName.value = false; } }
function handleExpand() { if (selectedItem.value) store.setExpandedPreviewId(selectedItem.value.id); }
</script>

<template lang="pug">
aside.LFM-preview-pane
	transition(name="fade" mode="out-in")
		//- --- Empty State: Immersive Glow ---
		.LFM-empty-state(v-if="!selectedItem" key="empty")
			.LFM-empty-visual
				.LFM-empty-glow-orbit
				.LFM-empty-glow
				IconDescription.LFM-empty-icon
			h3 Selection Required
			p Choose a file or directory to explore its rich metadata and visual preview.

		//- --- Active Preview: Premium Shell ---
		.LFM-active-container(v-else key="content")
			//- Glass Floating Mode Switcher
			.LFM-header-glass
				.LFM-mode-chip(:class="{ 'is-active': currentMode === 'sticky' }")
					component(
						:is="modeIcons[currentMode]"
						class="LFM-mode-icon"
					)
					span.LFM-mode-label {{ modeLabels[currentMode] }}
				button.LFM-mode-cycle-btn(@click="cyclePreviewMode" v-tooltip="'Cycle View Mode'")
					IconDown

			//- Immersive Hero Area
			.LFM-hero-wrap
				.LFM-hero-surface(:class="accentThemeMap[selectedItem.accent]?.glow" :style="{ height: currentMode === 'compact' ? '140px' : '260px' }")
					.LFM-hero-mesh(:class="accentThemeMap[selectedItem.accent]?.surface")
					
					//- Floating Actions
					.LFM-floating-tools
						button.LFM-action-circle(@click="handleExpand" v-tooltip="'Expand Preview'")
							IconFullscreen
					
					//- Content Frame
					.LFM-frame-outer
						transition(name="scale-fade" mode="out-in")
							.LFM-media-stage(v-if="isPreviewable && !imageError" :key="previewSrc")
								img.LFM-stage-image(v-if="isImage" :src="previewSrc" alt="Preview" @error="imageError = true")
								.LFM-video-stage(v-else-if="isVideo")
									img.LFM-stage-image(:src="previewSrc" alt="Thumbnail")
									button.LFM-play-btn(@click="handleOpen")
										IconPlayArrow(size="40")
								AudioPlayer(v-else-if="isAudio" :src="previewSrc" :title="selectedItem.name")
								CodePreview(v-else-if="isCode && !isLoadingContent" :code="fileContent" :language="getLanguageFromFilename(selectedItem.name)" :filename="selectedItem.name")
								MarkdownPreview(v-else-if="isMarkdown && !isLoadingContent" :markdown="fileContent" :filename="selectedItem.name")
								PDFPreview(v-else-if="isPDF" :src="previewSrc" :filename="selectedItem.name")
								FontPreview(v-else-if="isFont" :src="previewSrc" :filename="selectedItem.name" :fileSize="selectedItem.sortSize")
								OfficePreview(v-else-if="isOffice" :src="previewSrc" :filename="selectedItem.name")

							.LFM-loading-stage(v-else-if="isLoadingContent")
								.LFM-pulse-spinner
								span Syncing data...

							.LFM-fallback-stage(v-else :key="'fallback-' + selectedItem.id")
								.LFM-fallback-orb(:class="accentThemeMap[selectedItem.accent]?.ring")
									span.LFM-orb-symbol {{ categorySymbolMap[selectedItem.category] || '📄' }}

					//- Hero Bottom Toolbar
					.LFM-hero-actions
						button.LFM-btn-primary(@click="handleOpen")
							IconOpenInNew
							span Open File
						.LFM-btn-group
							button.LFM-btn-icon(@click="openInTerminal" v-tooltip="'Terminal'")
								IconTerminal
							button.LFM-btn-icon(@click="copyPath" v-tooltip="'Copy Path'")
								IconContentCopy
							button.LFM-btn-icon(@click="pinSelection" :class="{ 'is-active': store.isPinned(selectedItem.id) }" v-tooltip="'Pin Item'")
								IconPushPin

			//- Identity Ribbon
			.LFM-identity-ribbon
				.LFM-id-main
					.LFM-id-badge(:class="accentThemeMap[selectedItem.accent]?.text") {{ selectedItem.typeLabel }}
					.LFM-name-container(v-if="!isEditingName")
						h2.LFM-main-title(:title="selectedItem.name") {{ selectedItem.name }}
						button.LFM-tiny-edit(@click="startEditingName")
							IconEdit
					.LFM-name-editor(v-else)
						input.LFM-ribbon-input(v-model="editedName" autoFocus @keyup.enter="saveName" @keyup.esc="isEditingName = false")
						button.LFM-save-pill(@click="saveName")
							IconCheck
				.LFM-status-dot(:class="statusToneMap[selectedItem.status]" v-tooltip="selectedItem.status")

			//- Smart Properties Accordion
			.LFM-properties-stack
				//- General Info
				.LFM-card(v-if="showSectionTwo" :class="{ 'is-expanded': expandedSections.info }")
					button.LFM-card-header(@click="toggleSection('info')")
						.LFM-card-icon-box: IconInfo
						span General Information
						IconChevronRight.LFM-card-arrow
					.LFM-card-content
						.LFM-row
							span.LFM-label Size
							span.LFM-value.font-mono {{ formatSize(selectedItem.sortSize) }}
						.LFM-row(v-if="selectedItemMediaInfo?.width")
							span.LFM-label Dimensions
							span.LFM-value {{ selectedItemMediaInfo.width }} × {{ selectedItemMediaInfo.height }}
						.LFM-row(v-if="selectedItemMediaInfo?.duration")
							span.LFM-label Duration
							span.LFM-value {{ formatDuration(selectedItemMediaInfo.duration) }}
						.LFM-row(v-if="directoryItemCount !== null")
							span.LFM-label Contains
							span.LFM-value {{ directoryItemCount }} items
						.LFM-row
							span.LFM-label Location
							button.LFM-value-link(@click="copyPath" v-tooltip="selectedItem.id") {{ selectedItem.id }}

				//- History & Timeline
				.LFM-card(v-if="showSectionTwo" :class="{ 'is-expanded': expandedSections.dates }")
					button.LFM-card-header(@click="toggleSection('dates')")
						.LFM-card-icon-box: IconHistory
						span History & Timeline
						IconChevronRight.LFM-card-arrow
					.LFM-card-content
						.LFM-row
							span.LFM-label Last Modified
							span.LFM-value {{ formatDate(selectedItem.modifiedAt) }}
						.LFM-row
							span.LFM-label Created
							span.LFM-value {{ formatDate(selectedItem.createdAt) }}
						.LFM-row
							span.LFM-label Last Accessed
							span.LFM-value {{ formatDate(selectedItem.accessedAt) }}

				//- Advanced Media
				.LFM-card(v-if="(isVideo || isAudio) && showSectionThree" :class="{ 'is-expanded': expandedSections.advanced }")
					button.LFM-card-header(@click="toggleSection('advanced')")
						.LFM-card-icon-box: IconMovie
						span Media Forensics
						IconChevronRight.LFM-card-arrow
					.LFM-card-content
						.LFM-row(v-if="selectedItemMediaInfo?.container")
							span.LFM-label Format / Container
							span.LFM-value.uppercase {{ selectedItemMediaInfo.container }}
						.LFM-row(v-if="selectedItemMediaInfo?.video_codec")
							span.LFM-label Video Codec
							span.LFM-value.text-sky-500 {{ selectedItemMediaInfo.video_codec }}
						.LFM-row(v-if="selectedItemMediaInfo?.video_bitrate")
							span.LFM-label Video Bit Rate
							span.LFM-value {{ Math.round(selectedItemMediaInfo.video_bitrate / 1000) }} kbps
						.LFM-row(v-if="selectedItemMediaInfo?.frame_rate")
							span.LFM-label Frame Rate
							span.LFM-value {{ selectedItemMediaInfo.frame_rate.toFixed(2) }} fps
						.LFM-row(v-if="selectedItemMediaInfo?.audio_codec")
							span.LFM-label Audio Codec
							span.LFM-value.text-emerald-500 {{ selectedItemMediaInfo.audio_codec }}
						.LFM-row(v-if="selectedItemMediaInfo?.audio_bitrate")
							span.LFM-label Audio Bit Rate
							span.LFM-value {{ Math.round(selectedItemMediaInfo.audio_bitrate / 1000) }} kbps
						.LFM-row(v-if="selectedItemMediaInfo?.sample_rate")
							span.LFM-label Sample Rate
							span.LFM-value {{ selectedItemMediaInfo.sample_rate }} Hz
						.LFM-row(v-if="selectedItemMediaInfo?.channels")
							span.LFM-label Audio Channels
							span.LFM-value {{ selectedItemMediaInfo.channels === 2 ? 'Stereo' : selectedItemMediaInfo.channels === 1 ? 'Mono' : selectedItemMediaInfo.channels }}

				//- Security & Permissions
				.LFM-card(:class="{ 'is-expanded': expandedSections.perms }")
					button.LFM-card-header(@click="toggleSection('perms')")
						.LFM-card-icon-box: IconShield
						span Security & Permissions
						IconChevronRight.LFM-card-arrow
					.LFM-card-content
						.LFM-permissions-panel(v-if="selectedItemPermissions")
							.LFM-perm-summary
								span Unix Access Code
								.LFM-octal-wrap
									input.LFM-octal-field(
										:value="decodeMode(permissionMode).octal"
										@input="handleOctalInput"
										maxlength="3"
									)
									button.LFM-edit-toggle-btn(@click="isEditingPermissions = !isEditingPermissions")
										IconEdit(:class="{ 'is-active': isEditingPermissions }")

							//- Interactive Perm Grid
							transition(name="fade")
								.LFM-perm-editor(v-if="isEditingPermissions")
									.LFM-perm-row(v-for="g in ['owner', 'group', 'other']" :key="g")
										span.LFM-perm-label {{ g }}
										.LFM-toggle-bar
											button.LFM-toggle-btn(
												v-for="p in [{ b: 4, l: 'R' }, { b: 2, l: 'W' }, { b: 1, l: 'X' }]"
												:key="p.l"
												:class="{ 'is-active': decodeMode(permissionMode)[g].label.includes(p.l.toLowerCase()) }"
												@click="togglePermission(p.b << (g === 'owner' ? 6 : g === 'group' ? 3 : 0))"
											) {{ p.l }}
									
									.LFM-perm-commit
										button.LFM-btn-ghost(@click="resetPermissions") Reset
										button.LFM-btn-glass(@click="savePermissions") Apply Changes

								.LFM-perm-viewer(v-else)
									.LFM-row
										span.LFM-label Owner
										.LFM-value-box
											span {{ selectedItemPermissions.owner }}
											span.LFM-mode-tag {{ decodeMode(permissionMode).owner.label }}
									.LFM-row
										span.LFM-label Group
										.LFM-value-box
											span {{ selectedItemPermissions.group }}
											span.LFM-mode-tag {{ decodeMode(permissionMode).group.label }}
									.LFM-row
										span.LFM-label Public
										span.LFM-mode-tag {{ decodeMode(permissionMode).other.label }}

				//- Tags
				.LFM-card(v-if="selectedItem.tags?.length" :class="{ 'is-expanded': expandedSections.tags }")
					button.LFM-card-header(@click="toggleSection('tags')")
						.LFM-card-icon-box: IconLabel
						span Metadata Tags
						IconChevronRight.LFM-card-arrow
					.LFM-card-content
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
	padding: 20px
	gap: 24px
	position: relative

// --- Empty State Redesign ---
.LFM-empty-state
	display: flex
	flex-direction: column
	align-items: center
	justify-content: center
	height: 100%
	text-align: center
	padding: 40px
	animation: fadeIn 600ms $lfm-ease

	.LFM-empty-visual
		position: relative
		width: 120px
		height: 120px
		margin-bottom: 32px
		display: flex
		align-items: center
		justify-content: center

	.LFM-empty-glow
		position: absolute
		width: 100%
		height: 100%
		background: var(--LFM-blue)
		filter: blur(40px)
		opacity: 0.15
		border-radius: 50%

	.LFM-empty-glow-orbit
		position: absolute
		width: 140%
		height: 140%
		border: 1px dashed var(--LFM-blue)
		border-radius: 50%
		opacity: 0.1
		animation: rotate 20s linear infinite

	.LFM-empty-icon
		font-size: 56px
		color: var(--LFM-blue)
		opacity: 0.6
		filter: drop-shadow(0 0 10px rgba(0, 103, 192, 0.2))

	h3
		font-size: 18px
		font-weight: 700
		color: var(--LFM-text)
		margin-bottom: 8px

	p
		font-size: 13px
		color: var(--LFM-text-muted)
		max-width: 220px
		line-height: 1.5

// --- Floating Mode Switcher ---
.LFM-header-glass
	position: sticky
	top: -20px
	z-index: 100
	margin: -20px -20px 0
	padding: 12px 20px
	display: flex
	align-items: center
	justify-content: space-between
	background: rgba(var(--LFM-panel), 0.7)
	backdrop-filter: blur(20px)
	border-bottom: 1px solid var(--LFM-border)

.LFM-mode-chip
	display: flex
	align-items: center
	gap: 8px
	padding: 6px 12px
	border-radius: 20px
	background: var(--LFM-hover)
	color: var(--LFM-text-muted)
	font-size: 11px
	font-weight: 700
	text-transform: uppercase
	letter-spacing: 0.05em
	transition: all 300ms $lfm-ease

	&.is-active
		background: var(--LFM-blue-subtle)
		color: var(--LFM-blue)
		box-shadow: 0 4px 12px rgba(var(--LFM-blue), 0.1)

.LFM-mode-icon
	width: 16px
	height: 16px

.LFM-mode-cycle-btn
	width: 28px
	height: 28px
	border-radius: 50%
	background: transparent
	border: 1px solid var(--LFM-border)
	color: var(--LFM-text-muted)
	cursor: pointer
	display: flex
	align-items: center
	justify-content: center
	transition: all 300ms $lfm-ease

	&:hover
		background: var(--LFM-blue)
		color: white
		border-color: var(--LFM-blue)
		transform: rotate(180deg)

// --- Immersive Hero ---
.LFM-hero-wrap
	margin: 0 -20px
	padding: 0 20px

.LFM-hero-surface
	position: relative
	width: 100%
	border-radius: 16px
	background: #080808
	overflow: hidden
	display: flex
	align-items: center
	justify-content: center
	transition: height 400ms $lfm-ease
	box-shadow: 0 20px 40px -10px rgba(0,0,0,0.3)

.LFM-hero-mesh
	position: absolute
	inset: 0
	opacity: 0.4
	background: radial-gradient(circle at 50% 50%, rgba(255,255,255,0.05) 0%, transparent 70%)

.LFM-floating-tools
	position: absolute
	top: 16px
	right: 16px
	z-index: 10
	display: flex
	gap: 8px

.LFM-action-circle
	width: 36px
	height: 36px
	border-radius: 50%
	background: rgba(255,255,255,0.1)
	backdrop-filter: blur(12px)
	border: 1px solid rgba(255,255,255,0.1)
	color: white
	display: flex
	align-items: center
	justify-content: center
	cursor: pointer
	transition: all 300ms $lfm-ease

	&:hover
		background: var(--LFM-blue)
		transform: scale(1.1)

.LFM-frame-outer
	width: 100%
	height: 100%
	padding: 20px
	display: flex
	align-items: center
	justify-content: center

.LFM-media-stage
	width: 100%
	height: 100%
	display: flex
	align-items: center
	justify-content: center

.LFM-stage-image
	max-width: 100%
	max-height: 100%
	object-fit: contain
	border-radius: 8px
	filter: drop-shadow(0 10px 20px rgba(0,0,0,0.4))

.LFM-video-stage
	position: relative
	width: 100%
	height: 100%
	display: flex
	align-items: center
	justify-content: center

.LFM-play-btn
	position: absolute
	width: 72px
	height: 72px
	border-radius: 50%
	background: var(--LFM-blue)
	color: white
	display: flex
	align-items: center
	justify-content: center
	cursor: pointer
	border: 4px solid rgba(255,255,255,0.2)
	transition: all 400ms $lfm-ease
	box-shadow: 0 10px 30px rgba(0, 103, 192, 0.4)

	&:hover
		transform: scale(1.1)
		background: #0077dd
		box-shadow: 0 15px 40px rgba(0, 103, 192, 0.6)

.LFM-fallback-orb
	width: 100px
	height: 100px
	border-radius: 40px
	background: rgba(255,255,255,0.02)
	border: 2px solid rgba(255,255,255,0.05)
	backdrop-filter: blur(10px)
	display: flex
	align-items: center
	justify-content: center
	animation: float 4s ease-in-out infinite

.LFM-orb-symbol
	font-size: 48px
	filter: drop-shadow(0 0 15px rgba(255,255,255,0.2))

// --- Hero Bottom Actions ---
.LFM-hero-actions
	position: absolute
	bottom: 16px
	left: 16px
	right: 16px
	display: flex
	gap: 12px
	z-index: 5

.LFM-btn-primary
	flex: 1
	height: 36px
	border-radius: 12px
	background: var(--LFM-blue)
	color: white
	font-weight: 700
	font-size: 13px
	display: flex
	align-items: center
	justify-content: center
	gap: 10px
	cursor: pointer
	border: none
	box-shadow: 0 4px 15px rgba(0, 103, 192, 0.3)
	transition: all 300ms $lfm-ease

	&:hover
		transform: translateY(-2px)
		box-shadow: 0 8px 25px rgba(0, 103, 192, 0.5)

.LFM-btn-group
	display: flex
	gap: 6px
	background: rgba(255,255,255,0.1)
	backdrop-filter: blur(12px)
	padding: 4px
	border-radius: 12px
	border: 1px solid rgba(255,255,255,0.1)

.LFM-btn-icon
	width: 28px
	height: 28px
	border-radius: 8px
	display: flex
	align-items: center
	justify-content: center
	color: white
	cursor: pointer
	transition: all 200ms ease

	&:hover
		background: rgba(255,255,255,0.1)
		color: var(--LFM-blue)

	&.is-active
		background: var(--LFM-blue)
		color: white

// --- Identity Ribbon ---
.LFM-identity-ribbon
	display: flex
	justify-content: space-between
	align-items: center
	padding: 4px 4px

.LFM-id-main
	display: flex
	flex-direction: column
	gap: 4px

.LFM-id-badge
	font-size: 9px
	font-weight: 900
	text-transform: uppercase
	letter-spacing: 0.15em
	opacity: 0.8

.LFM-name-container
	display: flex
	align-items: center
	gap: 10px

.LFM-main-title
	font-size: 20px
	font-weight: 800
	color: var(--LFM-text)
	max-width: 200px
	overflow: hidden
	text-overflow: ellipsis
	white-space: nowrap
	letter-spacing: -0.02em

.LFM-tiny-edit
	width: 24px
	height: 24px
	border-radius: 6px
	display: flex
	align-items: center
	justify-content: center
	color: var(--LFM-text-muted)
	cursor: pointer
	transition: all 200ms ease
	&:hover
		background: var(--LFM-hover)
		color: var(--LFM-blue)

.LFM-status-dot
	width: 12px
	height: 12px
	border-radius: 50%
	border: 3px solid var(--LFM-preview-pane-bg)
	box-shadow: 0 0 0 1px currentColor

// --- Premium Cards ---
.LFM-properties-stack
	display: flex
	flex-direction: column
	gap: 12px

.LFM-card
	border-radius: 16px
	background: var(--LFM-panel)
	border: 1px solid var(--LFM-border)
	overflow: hidden
	transition: all 300ms $lfm-ease

	&:hover
		border-color: var(--LFM-blue-subtle)
		box-shadow: 0 8px 20px rgba(0,0,0,0.05)

.LFM-card-header
	width: 100%
	display: flex
	align-items: center
	gap: 12px
	padding: 16px
	background: transparent
	border: none
	cursor: pointer
	font-size: 14px
	font-weight: 700
	color: var(--LFM-text)

.LFM-card-icon-box
	width: 32px
	height: 32px
	border-radius: 10px
	background: var(--LFM-hover)
	display: flex
	align-items: center
	justify-content: center
	color: var(--LFM-blue)
	font-size: 18px

.LFM-card-arrow
	margin-left: auto
	transition: transform 400ms $lfm-ease
	opacity: 0.3

.is-expanded
	background: var(--LFM-panel)
	border-color: var(--LFM-blue-subtle)
	.LFM-card-arrow
		transform: rotate(90deg)
	.LFM-card-content
		display: block

.LFM-card-content
	display: none
	padding: 0 16px 16px
	animation: slideIn 400ms $lfm-ease

.LFM-row
	display: flex
	justify-content: space-between
	align-items: center
	padding: 10px 0
	border-bottom: 1px solid var(--LFM-border)
	&:last-child
		border-bottom: none

.LFM-label
	font-size: 12px
	font-weight: 500
	color: var(--LFM-text-muted)

.LFM-value
	font-size: 12px
	font-weight: 700
	color: var(--LFM-text)

.LFM-value-link
	font-size: 11px
	font-weight: 600
	color: var(--LFM-blue)
	background: var(--LFM-blue-subtle)
	padding: 2px 8px
	border-radius: 6px
	max-width: 160px
	overflow: hidden
	text-overflow: ellipsis
	white-space: nowrap
	cursor: pointer
	&:hover
		text-decoration: underline

// --- Permissions Redesign ---
.LFM-perm-summary
	display: flex
	justify-content: space-between
	align-items: center
	padding: 12px 0
	font-weight: 700
	font-size: 13px

.LFM-octal-wrap
	display: flex
	align-items: center
	gap: 8px
	background: var(--LFM-hover)
	padding: 4px 8px
	border-radius: 10px

.LFM-octal-field
	width: 40px
	background: transparent
	border: none
	color: var(--LFM-blue)
	font-family: monospace
	font-weight: 800
	text-align: center
	outline: none

.LFM-perm-editor
	padding: 16px 0 0
	display: flex
	flex-direction: column
	gap: 16px

.LFM-perm-row
	display: flex
	justify-content: space-between
	align-items: center

.LFM-perm-label
	font-size: 12px
	font-weight: 700
	text-transform: capitalize

.LFM-toggle-bar
	display: flex
	gap: 4px
	background: var(--LFM-hover)
	padding: 3px
	border-radius: 10px

.LFM-toggle-btn
	width: 32px
	height: 28px
	border-radius: 8px
	font-size: 11px
	font-weight: 900
	display: flex
	align-items: center
	justify-content: center
	cursor: pointer
	transition: all 200ms ease

	&.is-active
		background: white
		color: var(--LFM-blue)
		box-shadow: 0 2px 8px rgba(0,0,0,0.1)

.LFM-perm-commit
	display: flex
	gap: 10px

.LFM-btn-glass
	flex: 2
	height: 36px
	border-radius: 12px
	background: var(--LFM-blue)
	color: white
	font-weight: 700
	border: none
	cursor: pointer
	&:hover
		filter: brightness(1.1)

.LFM-btn-ghost
	flex: 1
	height: 36px
	border-radius: 12px
	background: var(--LFM-hover)
	color: var(--LFM-text-muted)
	font-weight: 700
	border: none
	cursor: pointer

.LFM-mode-tag
	font-family: monospace
	font-size: 10px
	background: var(--LFM-hover)
	padding: 2px 6px
	border-radius: 4px
	margin-left: 8px

// --- Animations ---
@keyframes float
	0%, 100%
		transform: translateY(0)
	50%
		transform: translateY(-10px)

@keyframes rotate
	from
		transform: rotate(0deg)
	to
		transform: rotate(360deg)

@keyframes fadeIn
	from
		opacity: 0
		transform: translateY(10px)
	to
		opacity: 1
		transform: translateY(0)

@keyframes slideIn
	from
		opacity: 0
		transform: translateY(-10px)
	to
		opacity: 1
		transform: translateY(0)

.fade-enter-active, .fade-leave-active
	transition: opacity 300ms ease
.fade-enter-from, .fade-leave-to
	opacity: 0

.scale-fade-enter-active, .scale-fade-leave-active
	transition: all 500ms $lfm-ease
.scale-fade-enter-from
	opacity: 0
	transform: scale(0.9) translateY(20px)
.scale-fade-leave-to
	opacity: 0
	transform: scale(1.05)
</style>
