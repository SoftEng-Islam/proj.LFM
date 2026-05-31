<script setup lang="ts">
/**
 * MarkdownPreview Component — Rendered markdown viewer for preview pane
 * Features:
 *  - Parse and render markdown with marked.js
 *  - Syntax highlighting for code blocks
 *  - HTML sanitization with DOMPurify
 *  - Scrollable content
 */
import { computed, onMounted, ref } from 'vue';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';

interface Props {
	src?: string;
	markdown?: string;
	title?: string;
	filename?: string;
}

const props = withDefaults(defineProps<Props>(), {
	title: '',
	filename: '',
	markdown: '',
	src: ''
});

const renderedHtml = ref('');
const isLoading = ref(true);

// Configure marked with syntax highlighting
marked.setOptions({
	highlight: (code, lang) => {
		if (lang && hljs.getLanguage(lang)) {
			return hljs.highlight(code, { language: lang }).value;
		}
		return hljs.highlightAuto(code).value;
	},
	breaks: true,
	gfm: true
});

// Methods
async function loadMarkdown() {
	if (props.markdown) {
		renderMarkdown(props.markdown);
		isLoading.value = false;
		return;
	}

	if (!props.src) {
		renderedHtml.value = '';
		isLoading.value = false;
		return;
	}

	try {
		isLoading.value = true;
		const response = await fetch(props.src);
		const markdown = await response.text();
		renderMarkdown(markdown);
	} catch (error) {
		console.error('Failed to load markdown:', error);
		renderedHtml.value = '<p class="error">Error loading markdown file</p>';
	} finally {
		isLoading.value = false;
	}
}

async function renderMarkdown(markdown: string) {
	// Parse markdown to HTML
	const html = await marked.parse(markdown);

	// Sanitize HTML
	const sanitized = DOMPurify.sanitize(html, {
		ALLOWED_TAGS: [
			'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
			'p', 'br', 'hr',
			'ul', 'ol', 'li',
			'blockquote', 'pre', 'code',
			'strong', 'em', 'del',
			'a', 'img',
			'table', 'thead', 'tbody', 'tr', 'th', 'td'
		],
		ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class']
	});

	renderedHtml.value = sanitized;
}

onMounted(() => {
	loadMarkdown();
});
</script>

<template lang="pug">
div(class="flex flex-col h-full bg-base-100 rounded-xl border border-base-content/10 overflow-hidden")
	//- Header
	div(class="px-4 py-3 bg-base-100 border-b border-base-content/10")
		div(class="text-xs font-semibold text-base-content/60") {{ props.filename || props.title || 'Markdown File' }}

	//- Content
	div(class="flex-1 overflow-auto p-4")
		div(class="flex flex-col items-center justify-center h-full text-base-content/60 text-xs gap-2" v-if="isLoading")
			div(class="w-5 h-5 border-2 border-base-content/10 border-t-primary rounded-full animate-spin")
			span Loading markdown...

		div(class="text-[13px] leading-[1.6] text-base-content [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mt-6 [&_h1]:mb-4 [&_h1]:border-b [&_h1]:border-base-content/10 [&_h1]:pb-2 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-5 [&_h2]:mb-3 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2 [&_h4]:text-base [&_h4]:font-semibold [&_h4]:mt-3.5 [&_h4]:mb-1.5 [&_p]:my-3 [&_ul]:my-3 [&_ul]:pl-6 [&_ol]:my-3 [&_ol]:pl-6 [&_li]:my-1 [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:my-4 [&_blockquote]:text-base-content/60 [&_blockquote]:italic [&_code]:bg-base-content/5 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:font-mono [&_code]:text-xs [&_code]:text-base-content [&_pre]:bg-base-100 [&_pre]:border [&_pre]:border-base-content/10 [&_pre]:rounded-lg [&_pre]:p-3 [&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:rounded-none [&_pre_code]:text-xs [&_strong]:font-semibold [&_em]:italic [&_a]:text-primary [&_a]:no-underline hover:[&_a]:underline [&_hr]:border-none [&_hr]:border-t [&_hr]:border-base-content/10 [&_hr]:my-5 [&_table]:w-full [&_table]:border-collapse [&_table]:my-4 [&_table]:border [&_table]:border-base-content/10 [&_table]:rounded-lg [&_table]:overflow-hidden [&_th]:p-2 [&_th]:px-3 [&_th]:text-left [&_th]:border-b [&_th]:border-base-content/10 [&_td]:p-2 [&_td]:px-3 [&_td]:text-left [&_td]:border-b [&_td]:border-base-content/10 [&_th]:bg-base-content/5 [&_th]:font-semibold [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg [&_img]:my-2 [&_.error]:text-red-500 [&_.error]:italic" v-else v-html="renderedHtml")
</template>
