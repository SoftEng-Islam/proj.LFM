<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * ExpandedPreview Component — Floating mini-window for detailed file interaction
 */
import { computed, onMounted, ref, watch } from 'vue';
import { useFileManagerStore } from '@/stores/file-manager';
import { storeToRefs } from 'pinia';

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
const toast = { success: console.log, error: console.error, info: console.log, warning: console.warn };

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
	Transition(
		enter-active-class="transition-opacity duration-300 ease-in-out"
		leave-active-class="transition-opacity duration-300 ease-in-out"
		enter-from-class="opacity-0"
		leave-to-class="opacity-0"
	)
		div(class="fixed inset-0 bg-black/40 backdrop-blur-md z-[9999] flex items-center justify-center p-10" v-if="item && !isMinimized" @click.self="close")
			div(
				class="w-full max-w-[1000px] h-full max-h-[800px] bg-base-100 rounded-2xl border border-base-content/10 flex flex-col shadow-[0_30px_60px_-12px_rgba(0,0,0,0.5),0_18px_36px_-18px_rgba(0,0,0,0.5)] overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.2,1,0.3,1)]"
				:class="{ '!max-w-none !max-h-none !rounded-none !p-0': isFullscreen }"
				v-motion
				:initial="{ opacity: 0, scale: 0.9, y: 20 }"
				:enter="{ opacity: 1, scale: 1, y: 0 }"
				:leave="{ opacity: 0, scale: 0.9, y: 20 }"
			)
				//- Header
				header(class="flex items-center justify-between px-4 py-3 bg-base-100 border-b border-base-content/10 shrink-0")
					div(class="flex items-center gap-2.5")
						span(class="text-[18px]") {{ item.category === 'folder' ? '📁' : '📄' }}
						h2(class="m-0 text-[14px] font-bold text-base-content") {{ item.name }}

					div(class="flex items-center gap-1.5")
						//- Type-specific tools
						template(v-if="isCode || isMarkdown")
							button(class="w-8 h-8 rounded-lg flex items-center justify-center text-base-content/60 transition-all duration-200 cursor-pointer bg-transparent border-none hover:bg-base-content/5 hover:text-base-content [&.is-active]:bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] [&.is-active]:text-primary" @click="toggleEdit" :class="{ 'is-active': isEditing }" :title="isEditing ? 'View Mode' : 'Edit Mode'")
								component(:is="isEditing ? IconVisibility : IconEdit")
							button(class="w-8 h-8 rounded-lg flex items-center justify-center text-base-content/60 transition-all duration-200 cursor-pointer bg-transparent border-none hover:bg-base-content/5 hover:text-base-content" v-if="isEditing" @click="handleSave" title="Save Changes")
								IconSave(class="text-emerald-500")

						template(v-if="isImage")
							button(class="w-8 h-8 rounded-lg flex items-center justify-center text-base-content/60 transition-all duration-200 cursor-pointer bg-transparent border-none hover:bg-base-content/5 hover:text-base-content [&.is-active]:bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] [&.is-active]:text-primary" @click="toggleDrawing" :class="{ 'is-active': isDrawing }" title="Draw on image")
								IconBrush
							button(class="w-8 h-8 rounded-lg flex items-center justify-center text-base-content/60 transition-all duration-200 cursor-pointer bg-transparent border-none hover:bg-base-content/5 hover:text-base-content [&.is-active]:bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] [&.is-active]:text-primary" @click="toggleCropping" :class="{ 'is-active': isCropping }" title="Crop Image")
								IconCrop

						div(class="w-[1px] h-5 bg-base-content/10 mx-1")

						button(class="w-8 h-8 rounded-lg flex items-center justify-center text-base-content/60 transition-all duration-200 cursor-pointer bg-transparent border-none hover:bg-base-content/5 hover:text-base-content" @click="toggleFullscreen" :title="isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'")
							component(:is="isFullscreen ? IconFullscreenExit : IconFullscreen")
						button(class="w-8 h-8 rounded-lg flex items-center justify-center text-base-content/60 transition-all duration-200 cursor-pointer bg-transparent border-none hover:bg-base-content/5 hover:text-base-content" @click="isMinimized = true" title="Minimize")
							IconMinimize
						button(class="w-8 h-8 rounded-lg flex items-center justify-center text-base-content/60 transition-all duration-200 cursor-pointer bg-transparent border-none hover:!bg-red-500 hover:!text-white" @click="close" title="Close")
							IconClose

				//- Body
				div(class="flex-1 overflow-hidden bg-[#050505] relative")
					div(class="w-full h-full flex items-center justify-center")
						//- View Mode
						template(v-if="!isEditing")
							div(class="relative max-w-full max-h-full flex items-center justify-center" v-if="isImage")
								div(class="relative inline-block max-w-full max-h-full overflow-hidden"
									@mousedown="startCrop"
									@mousemove="updateCrop"
									@mouseup="stopCrop"
									@mouseleave="stopCrop"
								)
									img(class="max-w-full max-h-full block select-none LFM-expanded-image" :src="resolvedPreviewSrc" alt="Full Preview" draggable="false")

									canvas(
										class="absolute top-0 left-0 w-full h-full cursor-crosshair z-[5]"
										v-if="isDrawing"
										ref="canvasRef"
										width="800"
										height="600"
										@mousedown="startDrawing"
										@mousemove="draw"
										@mouseup="stopDrawing"
										@mouseleave="stopDrawing"
									)

									div(class="absolute inset-0 pointer-events-none z-10" v-if="isCropping && cropRect.width > 0")
										div(
											class="absolute border-2 border-dashed border-primary bg-transparent shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] pointer-events-auto"
											:style="{ left: cropRect.x + 'px', top: cropRect.y + 'px', width: cropRect.width + 'px', height: cropRect.height + 'px' }"
										)
											button(class="absolute -bottom-8 -right-[2px] bg-primary text-white border-none rounded px-3 py-1 text-xs font-semibold cursor-pointer shadow-[0_4px_12px_rgba(0,0,0,0.3)] transition-all duration-200 hover:bg-sky-500 hover:-translate-y-0.5" @click.stop="applyCrop") Apply Crop
							video(class="w-full h-full outline-none" v-else-if="isVideo" :src="resolvedPreviewSrc" controls autoplay)
							CodePreview(v-else-if="isCode" :src="resolvedPreviewSrc" :title="item.name")
							MarkdownPreview(v-else-if="isMarkdown" :src="resolvedPreviewSrc" :title="item.name")
							PDFPreview(v-else-if="isPDF" :src="resolvedPreviewSrc" :filename="item.name")
							OfficePreview(v-else-if="isOffice" :src="resolvedPreviewSrc" :filename="item.name")
							div(class="text-base-content/60 text-[14px]" v-else)
								span No expanded preview available for this file type.

						//- Edit Mode
						template(v-else)
							div(class="w-full h-full flex flex-col bg-base-200")
								div(class="px-4 py-2 bg-base-100 border-b border-base-content/10 flex justify-between items-center")
									span(class="text-xs opacity-50") Editing {{ item.name }}
									div(class="flex gap-2" v-if="isMarkdown")
										button(class="btn btn-xs" @click="showPreview = !showPreview") {{ showPreview ? 'Hide Preview' : 'Show Preview' }}

								div(class="flex-1 flex overflow-hidden [&.is-split_.LFM-editor-textarea]:border-r [&.is-split_.LFM-editor-textarea]:border-base-content/10 [&.is-split_.LFM-editor-textarea]:w-1/2" :class="{ 'is-split': isMarkdown && showPreview }")
									textarea(class="LFM-editor-textarea flex-1 bg-transparent text-base-content p-5 font-mono text-[13px] leading-[1.6] outline-none border-none resize-none" v-model="editContent" spellcheck="false")
									div(class="flex-1 bg-base-100 overflow-auto" v-if="isMarkdown && showPreview")
										MarkdownPreview(:markdown="editContent" :filename="item.name")

				//- Footer
				footer(class="px-4 py-2 bg-base-100 border-t border-base-content/10 flex justify-between items-center text-[11px] text-base-content/60")
					div(class="flex items-center")
						span {{ item.typeLabel }}
						span(class="mx-2") •
						span {{ item.id }}
					div
						span(v-if="isEditing") Editing...
						span(v-else) Viewing

	Transition(
		enter-active-class="transition-all duration-300 ease-[cubic-bezier(0.2,1,0.3,1)]"
		leave-active-class="transition-all duration-300 ease-[cubic-bezier(0.2,1,0.3,1)]"
		enter-from-class="opacity-0 translate-y-10 scale-90"
		leave-to-class="opacity-0 translate-y-10 scale-90"
	)
		div(class="fixed bottom-6 right-6 z-[9999] bg-base-100 border border-base-content/10 rounded-3xl py-2 px-3 pl-4 flex items-center gap-4 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.4),0_4px_10px_-2px_rgba(0,0,0,0.3)] cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_-5px_rgba(0,0,0,0.5),0_6px_14px_-2px_rgba(0,0,0,0.4)] hover:border-primary" v-if="item && isMinimized" @click="isMinimized = false")
			div(class="flex items-center gap-2")
				span(class="text-[18px]") {{ item.category === 'folder' ? '📁' : '📄' }}
				span(class="text-[13px] font-semibold text-base-content max-w-[200px] whitespace-nowrap overflow-hidden text-ellipsis") Viewing: {{ item.name }}
			button(class="w-8 h-8 rounded-lg flex items-center justify-center text-base-content/60 transition-all duration-200 cursor-pointer bg-transparent border-none hover:!bg-red-500 hover:!text-white" @click.stop="close" title="Close")
				IconClose
</template>
