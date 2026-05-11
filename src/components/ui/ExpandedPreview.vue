<script setup lang="ts">
/**
 * ExpandedPreview Component — Floating mini-window for detailed file interaction
 * Implements Section 1 expansion from Roadmap.
 */
import { computed, onMounted, ref, watch } from 'vue';
import { useFileManagerStore } from '@/stores/file-manager';
import { storeToRefs } from 'pinia';
import { useToast } from 'vue-toastification';
import { readTextFile } from '@/services/tauri-bridge';

// Icons
import IconClose from '~icons/material-symbols/close';
import IconFullscreen from '~icons/material-symbols/fullscreen';
import IconFullscreenExit from '~icons/material-symbols/fullscreen-exit';
import IconSave from '~icons/material-symbols/save';
import IconEdit from '~icons/material-symbols/edit';
import IconVisibility from '~icons/material-symbols/visibility';
import IconCrop from '~icons/material-symbols/crop';
import IconBrush from '~icons/material-symbols/brush';

import CodePreview from './CodePreview.vue';
import MarkdownPreview from './MarkdownPreview.vue';
import PDFPreview from './PDFPreview.vue';

const store = useFileManagerStore();
const { expandedPreviewId, currentEntries } = storeToRefs(store);
const toast = useToast();

const item = computed(() => {
	if (!expandedPreviewId.value) return null;
	return currentEntries.value.find(e => e.id === expandedPreviewId.value) || null;
});

const isImage = computed(() => item.value?.category === 'image');
const isVideo = computed(() => item.value?.category === 'video');
const isCode = computed(() => item.value?.category === 'code');
const isMarkdown = computed(() => item.value?.category === 'markdown');
const isPDF = computed(() => item.value?.category === 'pdf');

const isFullscreen = ref(false);
const isEditing = ref(false);
const isDrawing = ref(false);
const editContent = ref('');
const isLoading = ref(false);
const showPreview = ref(true); // For markdown toggle

const canvasRef = ref<HTMLCanvasElement>();
let ctx: CanvasRenderingContext2D | null = null;
let drawing = false;

function startDrawing(e: MouseEvent) {
	if (!isDrawing.value || !ctx) return;
	drawing = true;
	ctx.beginPath();
	ctx.moveTo(e.offsetX, e.offsetY);
}

function draw(e: MouseEvent) {
	if (!drawing || !ctx) return;
	ctx.lineTo(e.offsetX, e.offsetY);
	ctx.stroke();
}

function stopDrawing() {
	drawing = false;
}

function toggleDrawing() {
	isDrawing.value = !isDrawing.value;
	if (isDrawing.value) {
		setTimeout(() => {
			const canvas = canvasRef.value;
			if (canvas) {
				ctx = canvas.getContext('2d');
				if (ctx) {
					ctx.strokeStyle = '#d96b26'; // LFM Orange
					ctx.lineWidth = 3;
					ctx.lineCap = 'round';
				}
			}
		}, 100);
	}
}

async function loadContent() {
	if (!item.value) return;
	if (isCode.value || isMarkdown.value) {
		try {
			isLoading.value = true;
			editContent.value = await readTextFile(item.value.id);
		} catch (err) {
			console.error('Failed to load content for expansion:', err);
			toast.error('Failed to load file content');
		} finally {
			isLoading.value = false;
		}
	}
}

async function handleSave() {
	if (!item.value) return;
	const success = await store.saveFileContent(item.value.id, editContent.value);
	if (success) {
		toast.success('File saved successfully');
		isEditing.value = false;
	} else {
		toast.error('Failed to save file');
	}
}

function close() {
	store.setExpandedPreviewId(null);
	isEditing.value = false;
	isFullscreen.value = false;
}

function toggleFullscreen() {
	isFullscreen.value = !isFullscreen.value;
}

function toggleEdit() {
	if (!isEditing.value) {
		loadContent();
	}
	isEditing.value = !isEditing.value;
}

watch(expandedPreviewId, (newId) => {
	if (newId) {
		loadContent();
	}
});

onMounted(() => {
	if (expandedPreviewId.value) {
		loadContent();
	}
});
</script>

<template lang="pug">
Teleport(to="body")
	Transition(name="modal-fade")
		.LFM-expanded-overlay(v-if="item" @click.self="close")
			.LFM-expanded-window(
				:class="{ 'is-fullscreen': isFullscreen }"
				v-motion
				:initial="{ opacity: 0, scale: 0.9, y: 20 }"
				:enter="{ opacity: 1, scale: 1, y: 0 }"
				:leave="{ opacity: 0, scale: 0.9, y: 20 }"
			)
				//- Header
				header.LFM-expanded-header
					.LFM-expanded-title-group
						span.LFM-expanded-symbol {{ item.category === 'folder' ? '📁' : '📄' }}
						h2.LFM-expanded-title {{ item.name }}
					
					.LFM-expanded-actions
						//- Type-specific tools
						template(v-if="isCode || isMarkdown")
							button.LFM-action-btn(@click="toggleEdit" :class="{ 'is-active': isEditing }" :title="isEditing ? 'View Mode' : 'Edit Mode'")
								component(:is="isEditing ? IconVisibility : IconEdit")
							button.LFM-action-btn(v-if="isEditing" @click="handleSave" title="Save Changes")
								IconSave.text-emerald-500
						
						template(v-if="isImage")
							button.LFM-action-btn(@click="toggleDrawing" :class="{ 'is-active': isDrawing }" title="Draw on image")
								IconBrush
							button.LFM-action-btn(title="Crop (Not implemented)")
								IconCrop

						.LFM-divider-v
						
						button.LFM-action-btn(@click="toggleFullscreen" :title="isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'")
							component(:is="isFullscreen ? IconFullscreenExit : IconFullscreen")
						button.LFM-action-btn.LFM-action-btn--close(@click="close" title="Close")
							IconClose

				//- Body
				.LFM-expanded-body
					.LFM-expanded-content-wrapper
						//- View Mode
						template(v-if="!isEditing")
							.LFM-expanded-image-container(v-if="isImage")
								img.LFM-expanded-image(:src="item.preview" alt="Full Preview")
								canvas.LFM-drawing-canvas(
									v-if="isDrawing"
									ref="canvasRef"
									width="800"
									height="600"
									@mousedown="startDrawing"
									@mousemove="draw"
									@mouseup="stopDrawing"
									@mouseleave="stopDrawing"
								)
							video.LFM-expanded-video(v-else-if="isVideo" :src="item.preview" controls autoplay)
							CodePreview(v-else-if="isCode" :src="item.preview" :title="item.name")
							MarkdownPreview(v-else-if="isMarkdown" :src="item.preview" :title="item.name")
							PDFPreview(v-else-if="isPDF" :src="item.preview" :filename="item.name")
							.LFM-expanded-fallback(v-else)
								span No expanded preview available for this file type.
						
						//- Edit Mode
						template(v-else)
							.LFM-editor-container
								.LFM-editor-header
									span.text-xs.opacity-50 Editing {{ item.name }}
									.flex.gap-2(v-if="isMarkdown")
										button.btn.btn-xs(@click="showPreview = !showPreview") {{ showPreview ? 'Hide Preview' : 'Show Preview' }}
								
								.LFM-editor-layout(:class="{ 'is-split': isMarkdown && showPreview }")
									textarea.LFM-editor-textarea(v-model="editContent" spellcheck="false")
									.LFM-editor-preview(v-if="isMarkdown && showPreview")
										MarkdownPreview(:markdown="editContent" :filename="item.name")

				//- Footer
				footer.LFM-expanded-footer
					.LFM-expanded-status
						span {{ item.typeLabel }}
						span.mx-2 •
						span {{ item.id }}
					.LFM-expanded-info
						span(v-if="isEditing") Editing...
						span(v-else) Viewing
</template>

<style lang="sass" scoped>
@reference "tailwindcss"

.LFM-expanded-overlay
	position: fixed
	inset: 0
	background: rgba(0, 0, 0, 0.4)
	backdrop-filter: blur(8px)
	z-index: 9999
	display: flex
	align-items: center
	justify-content: center
	padding: 40px

.LFM-expanded-window
	width: 100%
	max-width: 1000px
	height: 100%
	max-height: 800px
	background: var(--LFM-panel)
	border-radius: 16px
	border: 1px solid var(--LFM-border)
	display: flex
	flex-direction: column
	box-shadow: 0 30px 60px -12px rgba(0,0,0,0.5), 0 18px 36px -18px rgba(0,0,0,0.5)
	overflow: hidden
	transition: all 300ms cubic-bezier(0.2, 1, 0.3, 1)

	&.is-fullscreen
		max-width: none
		max-height: none
		border-radius: 0
		padding: 0

.LFM-expanded-header
	display: flex
	align-items: center
	justify-content: space-between
	padding: 12px 16px
	background: var(--LFM-panel)
	border-bottom: 1px solid var(--LFM-border)
	flex-shrink: 0

.LFM-expanded-title-group
	display: flex
	align-items: center
	gap: 10px

.LFM-expanded-symbol
	font-size: 18px

.LFM-expanded-title
	font-size: 14px
	font-weight: 700
	color: var(--LFM-text)

.LFM-expanded-actions
	display: flex
	align-items: center
	gap: 6px

.LFM-action-btn
	width: 32px
	height: 32px
	border-radius: 8px
	display: flex
	align-items: center
	justify-content: center
	color: var(--LFM-text-muted)
	transition: all 200ms ease
	cursor: pointer
	background: transparent
	border: none

	&:hover
		background: var(--LFM-hover)
		color: var(--LFM-text)

	&.is-active
		background: var(--LFM-blue-subtle)
		color: var(--LFM-blue)

	&--close:hover
		background: #ef4444
		color: white

.LFM-divider-v
	width: 1px
	height: 20px
	background: var(--LFM-border)
	margin: 0 4px

.LFM-expanded-body
	flex: 1
	overflow: hidden
	background: #050505
	position: relative

.LFM-expanded-content-wrapper
	width: 100%
	height: 100%
	display: flex
	align-items: center
	justify-content: center

.LFM-expanded-image-container
	position: relative
	max-width: 100%
	max-height: 100%
	display: flex
	align-items: center
	justify-content: center

.LFM-expanded-image
	max-width: 100%
	max-height: 100%
	object-fit: contain

.LFM-drawing-canvas
	position: absolute
	top: 0
	left: 0
	width: 100%
	height: 100%
	cursor: crosshair
	z-index: 5

.LFM-expanded-video
	width: 100%
	height: 100%
	outline: none

.LFM-expanded-fallback
	color: var(--LFM-text-muted)
	font-size: 14px

.LFM-editor-container
	width: 100%
	height: 100%
	display: flex
	flex-direction: column
	background: var(--LFM-bg)

.LFM-editor-header
	padding: 8px 16px
	background: var(--LFM-panel)
	border-bottom: 1px solid var(--LFM-border)
	display: flex
	justify-content: space-between
	align-items: center

.LFM-editor-layout
	flex: 1
	display: flex
	overflow: hidden

	&.is-split
		.LFM-editor-textarea
			border-right: 1px solid var(--LFM-border)
			width: 50%

.LFM-editor-textarea
	flex: 1
	background: transparent
	color: var(--LFM-text)
	padding: 20px
	font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace
	font-size: 13px
	line-height: 1.6
	outline: none
	border: none
	resize: none

.LFM-editor-preview
	flex: 1
	background: var(--LFM-panel)
	overflow: auto

.LFM-expanded-footer
	padding: 8px 16px
	background: var(--LFM-panel)
	border-top: 1px solid var(--LFM-border)
	display: flex
	justify-content: space-between
	align-items: center
	font-size: 11px
	color: var(--LFM-text-muted)

.modal-fade-enter-active, .modal-fade-leave-active
	transition: opacity 300ms ease

.modal-fade-enter-from, .modal-fade-leave-to
	opacity: 0
</style>
