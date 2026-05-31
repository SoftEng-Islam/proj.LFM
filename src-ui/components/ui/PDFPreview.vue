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
div(class="flex flex-col h-full bg-base-100 rounded-xl border border-base-content/10 overflow-hidden")
	//- Header with title and page count
	div(class="flex items-center justify-between px-4 py-3 bg-base-100 border-b border-base-content/10 gap-3")
		div(class="text-xs font-semibold text-base-content/60 text-ellipsis overflow-hidden whitespace-nowrap flex-1") {{ props.title }}
		div(class="text-[11px] text-base-content/60 bg-base-content/5 px-1.5 py-0.5 rounded font-medium" v-if="pageCount > 0") {{ pageCount }} page{{ pageCount > 1 ? 's' : '' }}

	//- PDF content
	div(class="flex-1 flex items-center justify-center p-4 min-h-[200px]")
		div(class="flex flex-col items-center justify-center text-base-content/60 text-xs gap-2" v-if="isLoading")
			div(class="w-6 h-6 border-2 border-base-content/10 border-t-primary rounded-full animate-spin")
			span Loading PDF...

		div(class="text-red-500 text-xs italic text-center" v-else-if="error")
			span {{ error }}

		canvas(class="max-w-full max-h-full rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.1)] cursor-pointer transition-transform duration-200 hover:scale-[1.02]" v-else ref="canvasRef" :title="'Click to open ' + props.title")

	//- Footer with open hint
	div(class="px-4 py-2 bg-base-100 border-t border-base-content/10 text-center text-[11px] text-base-content/60 italic" v-if="!isLoading && !error")
		span Click to open full viewer
</template>
