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
.LFM-markdown-preview
	//- Header
	.LFM-markdown-header
		.LFM-markdown-title {{ props.filename || props.title || 'Markdown File' }}

	//- Content
	.LFM-markdown-content
		.LFM-markdown-loading(v-if="isLoading")
			.LFM-markdown-spinner
			span Loading markdown...

		.LFM-markdown-rendered(v-else v-html="renderedHtml")
</template>

<style lang="sass" scoped>
@reference "tailwindcss"

// Import highlight.js themes for code blocks
// Highlight.js themes are imported in the script block


.LFM-markdown-preview
	display: flex
	flex-direction: column
	height: 100%
	background: var(--LFM-panel)
	border-radius: 12px
	border: 1px solid var(--LFM-border)
	overflow: hidden

.LFM-markdown-header
	padding: 12px 16px
	background: var(--LFM-panel)
	border-bottom: 1px solid var(--LFM-border)

.LFM-markdown-title
	font-size: 12px
	font-weight: 600
	color: var(--LFM-text-muted)

.LFM-markdown-content
	flex: 1
	overflow: auto
	padding: 16px

.LFM-markdown-loading
	display: flex
	flex-direction: column
	align-items: center
	justify-content: center
	height: 100%
	color: var(--LFM-text-muted)
	font-size: 12px
	gap: 8px

.LFM-markdown-spinner
	width: 20px
	height: 20px
	border: 2px solid var(--LFM-border)
	border-top: 2px solid var(--LFM-blue)
	border-radius: 50%
	animation: spin 1s linear infinite

@keyframes spin
	0%
		transform: rotate(0deg)
	100%
		transform: rotate(360deg)

.LFM-markdown-rendered
	font-size: 13px
	line-height: 1.6
	color: var(--LFM-text)

	// Typography
	:deep(h1)
		font-size: 24px
		font-weight: 700
		margin: 24px 0 16px 0
		color: var(--LFM-text)
		border-bottom: 1px solid var(--LFM-border)
		padding-bottom: 8px

	:deep(h2)
		font-size: 20px
		font-weight: 600
		margin: 20px 0 12px 0
		color: var(--LFM-text)

	:deep(h3)
		font-size: 18px
		font-weight: 600
		margin: 16px 0 8px 0
		color: var(--LFM-text)

	:deep(h4)
		font-size: 16px
		font-weight: 600
		margin: 14px 0 6px 0
		color: var(--LFM-text)

	:deep(p)
		margin: 12px 0
		color: var(--LFM-text)

	:deep(ul), :deep(ol)
		margin: 12px 0
		padding-left: 24px

	:deep(li)
		margin: 4px 0
		color: var(--LFM-text)

	:deep(blockquote)
		border-left: 4px solid var(--LFM-blue)
		padding-left: 16px
		margin: 16px 0
		color: var(--LFM-text-muted)
		font-style: italic

	:deep(code)
		background: var(--LFM-hover)
		padding: 2px 4px
		border-radius: 4px
		font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace
		font-size: 12px
		color: var(--LFM-text)

	:deep(pre)
		background: var(--LFM-panel)
		border: 1px solid var(--LFM-border)
		border-radius: 8px
		padding: 12px
		margin: 12px 0
		overflow-x: auto

		:deep(code)
			background: transparent
			padding: 0
			border-radius: 0
			font-size: 12px

	:deep(strong)
		font-weight: 600
		color: var(--LFM-text)

	:deep(em)
		font-style: italic
		color: var(--LFM-text)

	:deep(a)
		color: var(--LFM-blue)
		text-decoration: none

		&:hover
			text-decoration: underline

	:deep(hr)
		border: none
		border-top: 1px solid var(--LFM-border)
		margin: 20px 0

	:deep(table)
		width: 100%
		border-collapse: collapse
		margin: 16px 0
		border: 1px solid var(--LFM-border)
		border-radius: 8px
		overflow: hidden

	:deep(th), :deep(td)
		padding: 8px 12px
		text-align: left
		border-bottom: 1px solid var(--LFM-border)

	:deep(th)
		background: var(--LFM-hover)
		font-weight: 600
		color: var(--LFM-text)

	:deep(td)
		color: var(--LFM-text)

	:deep(img)
		max-width: 100%
		height: auto
		border-radius: 8px
		margin: 8px 0

	// Error styling
	:deep(.error)
		color: #ef4444
		font-style: italic
</style>
