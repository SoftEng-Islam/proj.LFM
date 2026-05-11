<script setup lang="ts">
/**
 * CodePreview Component — Syntax-highlighted code viewer for preview pane
 * Features:
 *  - Syntax highlighting with highlight.js
 *  - Line numbers
 *  - Copy button
 *  - Language auto-detection
 *  - Max 200 lines with truncation
 */
import { computed, onMounted, ref } from 'vue';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';
import IconContentCopy from '~icons/material-symbols/content-copy';
import IconCheck from '~icons/material-symbols/check';

interface Props {
	src?: string;
	code?: string;
	title?: string;
	filename?: string;
	language?: string;
}

const props = withDefaults(defineProps<Props>(), {
	title: '',
	filename: '',
	language: '',
	code: '',
	src: ''
});

const codeRef = ref<HTMLElement>();
const highlightedCode = ref('');
const isCopied = ref(false);
const isLoading = ref(true);

// Computed: detect language from file extension or content
const detectedLanguage = computed(() => {
	if (props.language) return props.language;

	// Detect from file extension
	const name = props.filename || props.title || '';
	const ext = name.split('.').pop()?.toLowerCase();
	const extMap: Record<string, string> = {
		js: 'javascript',
		ts: 'typescript',
		vue: 'vue',
		py: 'python',
		rs: 'rust',
		cpp: 'cpp',
		c: 'c',
		h: 'c',
		cxx: 'cpp',
		hxx: 'cpp',
		json: 'json',
		yaml: 'yaml',
		yml: 'yaml',
		md: 'markdown',
		html: 'html',
		css: 'css',
		sass: 'sass',
		scss: 'scss',
		sh: 'bash',
		bash: 'bash',
		zsh: 'bash',
		fish: 'fish',
		sql: 'sql',
		xml: 'xml',
		svg: 'xml',
		toml: 'toml',
		ini: 'ini',
		cfg: 'ini',
		conf: 'ini',
		dockerfile: 'dockerfile',
		go: 'go',
		php: 'php',
		rb: 'ruby',
		java: 'java',
		kt: 'kotlin',
		swift: 'swift',
		dart: 'dart',
		lua: 'lua',
		r: 'r',
		matlab: 'matlab',
		tex: 'latex',
		bib: 'bibtex'
	};

	return extMap[ext || ''] || 'plaintext';
});

// Computed: formatted code with line numbers
const formattedCode = computed(() => {
	const lines = highlightedCode.value.split('\n');
	const maxLines = 200;

	// Truncate if too many lines
	const displayLines = lines.length > maxLines ? lines.slice(0, maxLines) : lines;

	// Add line numbers
	return displayLines.map((line, index) => {
		const lineNum = (index + 1).toString().padStart(3, ' ');
		return `<span class="line-number">${lineNum}</span><span class="line-content">${line}</span>`;
	}).join('\n');
});

// Computed: show truncation indicator
const isTruncated = computed(() => {
	return highlightedCode.value.split('\n').length > 200;
});

// Methods
async function loadCode() {
	if (props.code) {
		highlightCode(props.code);
		isLoading.value = false;
		return;
	}

	if (!props.src) {
		highlightedCode.value = '';
		isLoading.value = false;
		return;
	}

	try {
		isLoading.value = true;
		const response = await fetch(props.src);
		const code = await response.text();
		highlightCode(code);
	} catch (error) {
		console.error('Failed to load code:', error);
		highlightedCode.value = 'Error loading code file';
	} finally {
		isLoading.value = false;
	}
}

function highlightCode(code: string) {
	const language = detectedLanguage.value;
	const highlighted = language !== 'plaintext'
		? hljs.highlight(code, { language }).value
		: hljs.highlightAuto(code).value;

	highlightedCode.value = highlighted;
}

function copyCode() {
	const code = highlightedCode.value.replace(/<[^>]*>/g, ''); // Strip HTML tags
	navigator.clipboard.writeText(code).then(() => {
		isCopied.value = true;
		setTimeout(() => isCopied.value = false, 2000);
	});
}

onMounted(() => {
	loadCode();
});
</script>

<template lang="pug">
.LFM-code-preview
	//- Header with title and copy button
	.LFM-code-header
		.LFM-code-title {{ props.filename || props.title || 'Code File' }}
		button.LFM-code-copy(@click="copyCode" :title="isCopied ? 'Copied!' : 'Copy code'")
			component(:is="isCopied ? IconCheck : IconContentCopy" class="LFM-code-copy-icon")

	//- Code content
	.LFM-code-content
		.LFM-code-loading(v-if="isLoading")
			.LFM-code-spinner
			span Loading code...

		pre.LFM-code-block(v-else)
			code.LFM-code-text(v-html="formattedCode")

		.LFM-code-truncated(v-if="isTruncated")
			span ... and {{ highlightedCode.split('\n').length - 200 }} more lines
</template>

<style lang="sass" scoped>
@reference "tailwindcss"

// Import highlight.js themes
// Highlight.js themes are imported in the script block


.LFM-code-preview
	display: flex
	flex-direction: column
	height: 100%
	background: var(--LFM-panel)
	border-radius: 12px
	border: 1px solid var(--LFM-border)
	overflow: hidden

.LFM-code-header
	display: flex
	align-items: center
	justify-content: space-between
	padding: 12px 16px
	background: var(--LFM-panel)
	border-bottom: 1px solid var(--LFM-border)
	gap: 12px

.LFM-code-title
	font-size: 12px
	font-weight: 600
	color: var(--LFM-text-muted)
	text-overflow: ellipsis
	overflow: hidden
	white-space: nowrap
	flex: 1

.LFM-code-copy
	width: 28px
	height: 28px
	border-radius: 6px
	background: transparent
	border: 1px solid var(--LFM-border)
	color: var(--LFM-text-muted)
	cursor: pointer
	display: flex
	align-items: center
	justify-content: center
	transition: all 200ms ease
	flex-shrink: 0

	&:hover
		background: var(--LFM-hover)
		color: var(--LFM-text)

	&:active
		transform: scale(0.95)

.LFM-code-copy-icon
	width: 14px
	height: 14px

.LFM-code-content
	flex: 1
	overflow: auto
	position: relative

.LFM-code-loading
	display: flex
	flex-direction: column
	align-items: center
	justify-content: center
	height: 100%
	color: var(--LFM-text-muted)
	font-size: 12px
	gap: 8px

.LFM-code-spinner
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

.LFM-code-block
	margin: 0
	padding: 16px
	font-size: 11px
	line-height: 1.4
	font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace
	background: transparent
	border: none
	height: 100%
	overflow: auto

.LFM-code-text
	display: block
	white-space: pre
	font-family: inherit
	font-size: inherit
	line-height: inherit

	// Line number styling
	.line-number
		display: inline-block
		width: 32px
		margin-right: 12px
		color: var(--LFM-text-muted)
		text-align: right
		user-select: none
		opacity: 0.6

	.line-content
		display: inline-block

	// Highlight.js overrides
	:deep(.hljs)
		background: transparent
		color: var(--LFM-text)

	:deep(.hljs-keyword)
		color: #d73a49

	:deep(.hljs-string)
		color: #032f62

	:deep(.hljs-comment)
		color: #6a737d

	:deep(.hljs-number)
		color: #005cc5

	:deep(.hljs-function)
		color: #6f42c1

	:deep(.hljs-title)
		color: #6f42c1

	:deep(.hljs-built_in)
		color: #e36209

.LFM-code-truncated
	padding: 8px 16px
	background: var(--LFM-panel)
	border-top: 1px solid var(--LFM-border)
	font-size: 11px
	color: var(--LFM-text-muted)
	text-align: center
	font-style: italic
</style>
