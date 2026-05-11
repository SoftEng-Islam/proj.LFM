<script setup lang="ts">
/**
 * PDFPreview Component — PDF viewer for preview pane using PDF.js
 * Features:
 *  - Render first page of PDF
 *  - Zoom controls (optional)
 *  - Page count display
 *  - Click to open full viewer
 */
import { onMounted, ref } from 'vue';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface Props {
	src: string;
	title?: string;
}

const props = withDefaults(defineProps<Props>(), {
	title: 'PDF Document'
});

const canvasRef = ref<HTMLCanvasElement>();
const isLoading = ref(true);
const error = ref<string | null>(null);
const pageCount = ref(0);

// Methods
async function loadPDF() {
	try {
		isLoading.value = true;
		error.value = null;

		// Load PDF document
		const loadingTask = pdfjsLib.getDocument(props.src);
		const pdf = await loadingTask.promise;

		pageCount.value = pdf.numPages;

		// Get first page
		const page = await pdf.getPage(1);

		// Set up canvas
		const canvas = canvasRef.value;
		if (!canvas) return;

		const context = canvas.getContext('2d');
		if (!context) return;

		// Calculate scale to fit canvas (max width 400px, max height 300px)
		const viewport = page.getViewport({ scale: 1 });
		const scale = Math.min(400 / viewport.width, 300 / viewport.height);
		const scaledViewport = page.getViewport({ scale });

		canvas.height = scaledViewport.height;
		canvas.width = scaledViewport.width;

		// Render page
		const renderContext = {
			canvasContext: context,
			viewport: scaledViewport,
		};

		await page.render(renderContext).promise;

	} catch (err) {
		console.error('Failed to load PDF:', err);
		error.value = 'Failed to load PDF';
	} finally {
		isLoading.value = false;
	}
}

onMounted(() => {
	loadPDF();
});
</script>

<template lang="pug">
.LFM-pdf-preview
	//- Header with title and page count
	.LFM-pdf-header
		.LFM-pdf-title {{ props.title }}
		.LFM-pdf-info(v-if="pageCount > 0") {{ pageCount }} page{{ pageCount > 1 ? 's' : '' }}

	//- PDF content
	.LFM-pdf-content
		.LFM-pdf-loading(v-if="isLoading")
			.LFM-pdf-spinner
			span Loading PDF...

		.LFM-pdf-error(v-else-if="error")
			span {{ error }}

		canvas.LFM-pdf-canvas(v-else ref="canvasRef" :title="'Click to open ' + props.title")

	//- Footer with open hint
	.LFM-pdf-footer(v-if="!isLoading && !error")
		span Click to open full viewer
</template>

<style lang="sass" scoped>
@reference "tailwindcss"

.LFM-pdf-preview
	display: flex
	flex-direction: column
	height: 100%
	background: var(--LFM-panel)
	border-radius: 12px
	border: 1px solid var(--LFM-border)
	overflow: hidden

.LFM-pdf-header
	display: flex
	align-items: center
	justify-content: space-between
	padding: 12px 16px
	background: var(--LFM-panel)
	border-bottom: 1px solid var(--LFM-border)
	gap: 12px

.LFM-pdf-title
	font-size: 12px
	font-weight: 600
	color: var(--LFM-text-muted)
	text-overflow: ellipsis
	overflow: hidden
	white-space: nowrap
	flex: 1

.LFM-pdf-info
	font-size: 11px
	color: var(--LFM-text-muted)
	background: var(--LFM-hover)
	padding: 2px 6px
	border-radius: 4px
	font-weight: 500

.LFM-pdf-content
	flex: 1
	display: flex
	align-items: center
	justify-content: center
	padding: 16px
	min-height: 200px

.LFM-pdf-loading
	display: flex
	flex-direction: column
	align-items: center
	justify-content: center
	color: var(--LFM-text-muted)
	font-size: 12px
	gap: 8px

.LFM-pdf-spinner
	width: 24px
	height: 24px
	border: 2px solid var(--LFM-border)
	border-top: 2px solid var(--LFM-blue)
	border-radius: 50%
	animation: spin 1s linear infinite

@keyframes spin
	0%
		transform: rotate(0deg)
	100%
		transform: rotate(360deg)

.LFM-pdf-error
	color: #ef4444
	font-size: 12px
	font-style: italic
	text-align: center

.LFM-pdf-canvas
	max-width: 100%
	max-height: 100%
	border-radius: 8px
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1)
	cursor: pointer
	transition: transform 200ms ease

	&:hover
		transform: scale(1.02)

.LFM-pdf-footer
	padding: 8px 16px
	background: var(--LFM-panel)
	border-top: 1px solid var(--LFM-border)
	text-align: center

	span
		font-size: 11px
		color: var(--LFM-text-muted)
		font-style: italic
</style>
