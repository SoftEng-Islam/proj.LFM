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
div(class="flex flex-col h-full bg-base-100 rounded-xl border border-base-content/10 overflow-hidden")
	//- Header with title and copy button
	div(class="flex items-center justify-between px-4 py-3 bg-base-100 border-b border-base-content/10 gap-3")
		div(class="text-xs font-semibold text-base-content/60 text-ellipsis overflow-hidden whitespace-nowrap flex-1") {{ props.filename || props.title || 'Code File' }}
		button(class="w-7 h-7 rounded-md bg-transparent border border-base-content/10 text-base-content/60 cursor-pointer flex items-center justify-center transition-all duration-200 shrink-0 hover:bg-base-content/5 hover:text-base-content active:scale-95" @click="copyCode" :title="isCopied ? 'Copied!' : 'Copy code'")
			component(:is="isCopied ? IconCheck : IconContentCopy" class="w-3.5 h-3.5")

	//- Code content
	div(class="flex-1 overflow-auto relative")
		div(class="flex flex-col items-center justify-center h-full text-base-content/60 text-xs gap-2" v-if="isLoading")
			div(class="w-5 h-5 border-2 border-base-content/10 border-t-primary rounded-full animate-spin")
			span Loading code...

		pre(class="m-0 p-4 text-[11px] leading-[1.4] font-mono bg-transparent border-none h-full overflow-auto" v-else)
			code(class="block whitespace-pre font-inherit text-inherit leading-inherit [&_.line-number]:inline-block [&_.line-number]:w-8 [&_.line-number]:mr-3 [&_.line-number]:text-base-content/60 [&_.line-number]:text-right [&_.line-number]:select-none [&_.line-number]:opacity-60 [&_.line-content]:inline-block [&_.hljs]:bg-transparent [&_.hljs]:text-base-content [&_.hljs-keyword]:text-[#d73a49] [&_.hljs-string]:text-[#032f62] [&_.hljs-comment]:text-[#6a737d] [&_.hljs-number]:text-[#005cc5] [&_.hljs-function]:text-[#6f42c1] [&_.hljs-title]:text-[#6f42c1] [&_.hljs-built_in]:text-[#e36209]" v-html="formattedCode")

		div(class="px-4 py-2 bg-base-100 border-t border-base-content/10 text-[11px] text-base-content/60 text-center italic" v-if="isTruncated")
			span ... and {{ highlightedCode.split('\\n').length - 200 }} more lines
</template>
