<script setup lang="ts">
/**
 * OfficePreview Component — Preview for Word and Excel documents
 * Uses mammoth.js for .docx and a custom parser for .xlsx
 */
import { onMounted, ref } from 'vue';
import mammoth from 'mammoth';


interface Props {
	src: string;
	filename: string;
}

const props = defineProps<Props>();
const renderedHtml = ref('');
const isLoading = ref(true);
const error = ref<string | null>(null);
const isExcel = ref(false);

async function loadDocument() {
	const ext = props.filename.split('.').pop()?.toLowerCase();
	
	try {
		isLoading.value = true;
		error.value = null;
		
		const response = await fetch(props.src);
		const arrayBuffer = await response.arrayBuffer();
		
		if (ext === 'docx') {
			isExcel.value = false;
			const result = await mammoth.convertToHtml({ arrayBuffer });
			renderedHtml.value = result.value;
		} else if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') {
			isExcel.value = true;
			error.value = 'Excel preview is currently disabled (xlsx package removed)';
		} else {
			error.value = 'Unsupported office format';
		}
	} catch (err) {
		console.error('Failed to load office document:', err);
		error.value = 'Failed to load document preview';
	} finally {
		isLoading.value = false;
	}
}

onMounted(() => {
	loadDocument();
});
</script>

<template lang="pug">
div(class="flex flex-col h-full bg-white text-[#333] rounded-xl border border-base-content/10 overflow-hidden")
	div(class="px-4 py-2.5 bg-[#f8f9fa] border-b border-[#dee2e6] flex items-center")
		span(class="text-xs font-semibold text-[#495057]") {{ filename }}
	
	div(:class="['flex-1 overflow-auto leading-relaxed', isExcel ? 'p-0 [&_table]:w-full [&_table]:border-collapse [&_table]:text-xs [&_th]:border [&_th]:border-[#dee2e6] [&_th]:p-2 [&_th]:text-left [&_th]:bg-[#f1f3f5] [&_td]:border [&_td]:border-[#dee2e6] [&_td]:p-2 [&_td]:text-left' : 'p-10']")
		div(v-if="isLoading" class="flex flex-col items-center justify-center h-full text-[#868e96] gap-3")
			div(class="w-6 h-6 border-2 border-[#dee2e6] border-t-[#228be6] rounded-full animate-spin")
			span Loading document...
		
		div(v-else-if="error" class="flex flex-col items-center justify-center h-full text-[#868e96] gap-3")
			span {{ error }}
		
		div(v-else v-html="renderedHtml" class="max-w-[800px] mx-auto [&_h1]:text-2xl [&_h1]:mb-5 [&_p]:mb-4")
</template>
