<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * ExpandedPreview Component — Floating mini-window for detailed file interaction
 */
import { computed, onMounted, ref, watch } from 'vue';
import { useFileManagerStore } from '@/stores/file-manager';
import { storeToRefs } from 'pinia';
import { useToast } from 'vue-toastification';
import { readTextFile, convertFileSrc } from '@/services/tauri-bridge';

// Icons
import IconClose from '~icons/material-symbols/close';
import IconFullscreen from '~icons/material-symbols/fullscreen';
import IconFullscreenExit from '~icons/material-symbols/fullscreen-exit';
import IconMinimize from '~icons/material-symbols/minimize';
import IconSave from '~icons/material-symbols/save';
import IconEdit from '~icons/material-symbols/edit';
import IconVisibility from '~icons/material-symbols/visibility';
import IconCrop from '~icons/material-symbols/crop';
import IconBrush from '~icons/material-symbols/brush';

import CodePreview from './CodePreview.vue';
import MarkdownPreview from './MarkdownPreview.vue';
import PDFPreview from './PDFPreview.vue';
import OfficePreview from './OfficePreview.vue';

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
const isOffice = computed(() => ['document', 'spreadsheet'].includes(item.value?.category || ''));

const resolvedPreviewSrc = computed(() => {
	if (!item.value) return '';
	if (isImage.value || isVideo.value || isPDF.value || isOffice.value) {
		return convertFileSrc(item.value.id);
	}
	return item.value.preview;
});

const isFullscreen = ref(false);
const isMinimized = ref(false);
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

// Crop Logic
const isCropping = ref(false);
const cropStart = ref({ x: 0, y: 0 });
const cropEnd = ref({ x: 0, y: 0 });
let cropping = false;

const cropRect = computed(() => {
	const x = Math.min(cropStart.value.x, cropEnd.value.x);
	const y = Math.min(cropStart.value.y, cropEnd.value.y);
	const width = Math.abs(cropEnd.value.x - cropStart.value.x);
	const height = Math.abs(cropEnd.value.y - cropStart.value.y);
	return { x, y, width, height };
});

function toggleCropping() {
	isCropping.value = !isCropping.value;
	if (isCropping.value) {
		isDrawing.value = false;
		cropStart.value = { x: 0, y: 0 };
		cropEnd.value = { x: 0, y: 0 };
	}
}

function startCrop(e: MouseEvent) {
	if (!isCropping.value) return;
	cropping = true;
	cropStart.value = { x: e.offsetX, y: e.offsetY };
	cropEnd.value = { x: e.offsetX, y: e.offsetY };
}

function updateCrop(e: MouseEvent) {
	if (!cropping) return;
	cropEnd.value = { x: e.offsetX, y: e.offsetY };
}

function stopCrop() {
	cropping = false;
}

function applyCrop() {
	if (cropRect.value.width === 0 || cropRect.value.height === 0) return;

	const img = document.querySelector('.LFM-expanded-image') as HTMLImageElement;
	if (!img) return;

	const scaleX = img.naturalWidth / img.width;
	const scaleY = img.naturalHeight / img.height;

	const canvas = document.createElement('canvas');
	canvas.width = cropRect.value.width * scaleX;
	canvas.height = cropRect.value.height * scaleY;

	const context = canvas.getContext('2d');
	if (!context) return;

	context.drawImage(
		img,
		cropRect.value.x * scaleX,
		cropRect.value.y * scaleY,
		cropRect.value.width * scaleX,
		cropRect.value.height * scaleY,
		0,
		0,
		canvas.width,
		canvas.height
	);

	const link = document.createElement('a');
	link.download = `cropped_${item.value?.name || 'image.png'}`;
	link.href = canvas.toDataURL('image/png');
	link.click();

	toast.success('Cropped image saved to downloads');
	isCropping.value = false;
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
	isCropping.value = false;
	isDrawing.value = false;
	isFullscreen.value = false;
	isMinimized.value = false;
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
		.LFM-expanded-overlay(v-if="item && !isMinimized" @click.self="close")
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
							button.LFM-action-btn(@click="toggleCropping" :class="{ 'is-active': isCropping }" title="Crop Image")
								IconCrop

						.LFM-divider-v

						button.LFM-action-btn(@click="toggleFullscreen" :title="isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'")
							component(:is="isFullscreen ? IconFullscreenExit : IconFullscreen")
						button.LFM-action-btn(@click="isMinimized = true" title="Minimize")
							IconMinimize
						button.LFM-action-btn.LFM-action-btn--close(@click="close" title="Close")
							IconClose

				//- Body
				.LFM-expanded-body
					.LFM-expanded-content-wrapper
						//- View Mode
						template(v-if="!isEditing")
							.LFM-expanded-image-container(v-if="isImage")
								.LFM-image-wrapper(
									@mousedown="startCrop"
									@mousemove="updateCrop"
									@mouseup="stopCrop"
									@mouseleave="stopCrop"
								)
									img.LFM-expanded-image(:src="resolvedPreviewSrc" alt="Full Preview" draggable="false")

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

									.LFM-crop-overlay(v-if="isCropping && cropRect.width > 0")
										.LFM-crop-box(
											:style="{ left: cropRect.x + 'px', top: cropRect.y + 'px', width: cropRect.width + 'px', height: cropRect.height + 'px' }"
										)
											button.LFM-apply-crop-btn(@click.stop="applyCrop") Apply Crop
							video.LFM-expanded-video(v-else-if="isVideo" :src="resolvedPreviewSrc" controls autoplay)
							CodePreview(v-else-if="isCode" :src="resolvedPreviewSrc" :title="item.name")
							MarkdownPreview(v-else-if="isMarkdown" :src="resolvedPreviewSrc" :title="item.name")
							PDFPreview(v-else-if="isPDF" :src="resolvedPreviewSrc" :filename="item.name")
							OfficePreview(v-else-if="isOffice" :src="resolvedPreviewSrc" :filename="item.name")
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

	Transition(name="pill-slide")
		.LFM-minimized-pill(v-if="item && isMinimized" @click="isMinimized = false")
			.LFM-pill-content
				span.LFM-expanded-symbol {{ item.category === 'folder' ? '📁' : '📄' }}
				span.LFM-pill-title Viewing: {{ item.name }}
			button.LFM-action-btn.LFM-action-btn--close(@click.stop="close" title="Close")
				IconClose
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
	background: var(--color-base-100)
	border-radius: 16px
	border: 1px solid color-mix(in srgb, var(--color-base-content) 10%, transparent)
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
	background: var(--color-base-100)
	border-bottom: 1px solid color-mix(in srgb, var(--color-base-content) 10%, transparent)
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
	color: var(--color-base-content)

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
	color: color-mix(in srgb, var(--color-base-content) 60%, transparent)
	transition: all 200ms ease
	cursor: pointer
	background: transparent
	border: none

	&:hover
		background: color-mix(in srgb, var(--color-base-content) 6%, transparent)
		color: var(--color-base-content)

	&.is-active
		background: color-mix(in srgb, var(--color-primary) 12%, transparent)
		color: var(--color-primary)

	&--close:hover
		background: #ef4444
		color: white

.LFM-divider-v
	width: 1px
	height: 20px
	background: color-mix(in srgb, var(--color-base-content) 10%, transparent)
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

.LFM-image-wrapper
	position: relative
	display: inline-block
	max-width: 100%
	max-height: 100%
	overflow: hidden

.LFM-expanded-image
	max-width: 100%
	max-height: 100%
	display: block
	user-select: none

.LFM-crop-overlay
	position: absolute
	inset: 0
	pointer-events: none
	z-index: 10

.LFM-crop-box
	position: absolute
	border: 2px dashed var(--color-primary)
	background: transparent
	box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5)
	pointer-events: auto

.LFM-apply-crop-btn
	position: absolute
	bottom: -32px
	right: -2px
	background: var(--color-primary)
	color: white
	border: none
	border-radius: 4px
	padding: 4px 12px
	font-size: 12px
	font-weight: 600
	cursor: pointer
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3)
	transition: all 200ms ease
	&:hover
		background: #0ea5e9
		transform: translateY(-2px)

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
	color: color-mix(in srgb, var(--color-base-content) 60%, transparent)
	font-size: 14px

.LFM-editor-container
	width: 100%
	height: 100%
	display: flex
	flex-direction: column
	background: var(--color-base-200)

.LFM-editor-header
	padding: 8px 16px
	background: var(--color-base-100)
	border-bottom: 1px solid color-mix(in srgb, var(--color-base-content) 10%, transparent)
	display: flex
	justify-content: space-between
	align-items: center

.LFM-editor-layout
	flex: 1
	display: flex
	overflow: hidden

	&.is-split
		.LFM-editor-textarea
			border-right: 1px solid color-mix(in srgb, var(--color-base-content) 10%, transparent)
			width: 50%

.LFM-editor-textarea
	flex: 1
	background: transparent
	color: var(--color-base-content)
	padding: 20px
	font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace
	font-size: 13px
	line-height: 1.6
	outline: none
	border: none
	resize: none

.LFM-editor-preview
	flex: 1
	background: var(--color-base-100)
	overflow: auto

.LFM-expanded-footer
	padding: 8px 16px
	background: var(--color-base-100)
	border-top: 1px solid color-mix(in srgb, var(--color-base-content) 10%, transparent)
	display: flex
	justify-content: space-between
	align-items: center
	font-size: 11px
	color: color-mix(in srgb, var(--color-base-content) 60%, transparent)

.modal-fade-enter-active, .modal-fade-leave-active
	transition: opacity 300ms ease

.modal-fade-enter-from, .modal-fade-leave-to
	opacity: 0

.LFM-minimized-pill
	position: fixed
	bottom: 24px
	right: 24px
	z-index: 9999
	background: var(--color-base-100)
	border: 1px solid color-mix(in srgb, var(--color-base-content) 10%, transparent)
	border-radius: 24px
	padding: 8px 12px 8px 16px
	display: flex
	align-items: center
	gap: 16px
	box-shadow: 0 10px 25px -5px rgba(0,0,0,0.4), 0 4px 10px -2px rgba(0,0,0,0.3)
	cursor: pointer
	transition: all 200ms ease

	&:hover
		transform: translateY(-2px)
		box-shadow: 0 14px 30px -5px rgba(0,0,0,0.5), 0 6px 14px -2px rgba(0,0,0,0.4)
		border-color: var(--color-primary)

.LFM-pill-content
	display: flex
	align-items: center
	gap: 8px

.LFM-pill-title
	font-size: 13px
	font-weight: 600
	color: var(--color-base-content)
	max-width: 200px
	white-space: nowrap
	overflow: hidden
	text-overflow: ellipsis

.pill-slide-enter-active, .pill-slide-leave-active
	transition: all 300ms cubic-bezier(0.2, 1, 0.3, 1)

.pill-slide-enter-from, .pill-slide-leave-to
	opacity: 0
	transform: translateY(40px) scale(0.9)
</style>
