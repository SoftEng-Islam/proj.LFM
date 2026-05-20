<script setup lang="ts">
/**
 * OfficePreview Component — Preview for Word and Excel documents
 * Uses mammoth.js for .docx and a custom parser for .xlsx
 */
import { onMounted, ref } from 'vue';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';

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
			const workbook = XLSX.read(arrayBuffer, { type: 'array' });
			const firstSheetName = workbook.SheetNames[0];
			const worksheet = workbook.Sheets[firstSheetName];
			renderedHtml.value = XLSX.utils.sheet_to_html(worksheet);
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
.LFM-office-preview
	.LFM-office-header
		span.LFM-office-title {{ filename }}
	
	.LFM-office-content(:class="{ 'is-excel': isExcel }")
		.LFM-office-loading(v-if="isLoading")
			.LFM-office-spinner
			span Loading document...
		
		.LFM-office-error(v-else-if="error")
			span {{ error }}
		
		.LFM-office-rendered(v-else v-html="renderedHtml")
</template>

<style lang="sass" scoped>
@reference "tailwindcss"

.LFM-office-preview
	display: flex
	flex-direction: column
	height: 100%
	background: white
	color: #333
	border-radius: 12px
	border: 1px solid color-mix(in srgb, var(--color-base-content) 10%, transparent)
	overflow: hidden

.LFM-office-header
	padding: 10px 16px
	background: #f8f9fa
	border-bottom: 1px solid #dee2e6
	display: flex
	align-items: center

.LFM-office-title
	font-size: 12px
	font-weight: 600
	color: #495057

.LFM-office-content
	flex: 1
	overflow: auto
	padding: 40px
	line-height: 1.6
	
	&.is-excel
		padding: 0
		:deep(table)
			width: 100%
			border-collapse: collapse
			font-size: 12px
			th, td
				border: 1px solid #dee2e6
				padding: 8px
				text-align: left
			th
				background: #f1f3f5

.LFM-office-loading, .LFM-office-error
	display: flex
	flex-direction: column
	align-items: center
	justify-content: center
	height: 100%
	color: #868e96
	gap: 12px

.LFM-office-spinner
	width: 24px
	height: 24px
	border: 2px solid #dee2e6
	border-top: 2px solid #228be6
	border-radius: 50%
	animation: spin 1s linear infinite

@keyframes spin
	0%
		transform: rotate(0deg)
	100%
		transform: rotate(360deg)

.LFM-office-rendered
	max-width: 800px
	margin: 0 auto
	
	:deep(h1)
		font-size: 24px
		margin-bottom: 20px
	:deep(p)
		margin-bottom: 16px
</style>
