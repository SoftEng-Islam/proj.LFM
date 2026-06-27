<script setup lang="ts">
import { computed } from 'vue';
import { formatBytes } from '@/utils/format';

const props = defineProps<{
	filename: string;
	fileSize: number;
	fontType: string;
	fontFamily: string;
	metrics?: any;
}>();

const samples = [
	'ABCDEFGHIJKLM',
	'NOPQRSTUVWXYZ',
	'abcdefghijklm',
	'nopqrstuvwxyz',
	'1234567890',
	'!@#$%^&*()_+-=[]{}|;:\'",./<>?'
];

const formatFileSize = (size: number) => formatBytes(size);
</script>

<template lang="pug">
div(class="p-4")
	div(class="flex justify-between items-start mb-5")
		h3(class="m-0 text-lg font-semibold text-base-content") {{ filename }}
		div(class="flex flex-col items-end gap-1")
			span(class="text-xs text-base-content/60") {{ formatFileSize(fileSize) }}
			span(class="text-xs text-base-content/60") {{ fontType }}

	div(class="mb-5")
		div(class="p-5 border border-base-content/10 rounded-lg bg-base-300"
			:style="{ fontFamily: fontFamily }"
		)
			p(class="my-2 text-2xl leading-[1.4] text-base-content" v-for="sample in samples" :key="sample") {{ sample }}

	div(class="p-4 border border-base-content/10 rounded-lg bg-base-300" v-if="metrics")
		div(class="grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-3")
			div(class="flex flex-col gap-1")
				div(class="text-[11px] font-semibold text-base-content/60 uppercase tracking-[0.5px]") Family
				div(class="text-sm font-medium text-base-content font-mono") {{ metrics.family }}
			div(class="flex flex-col gap-1")
				div(class="text-[11px] font-semibold text-base-content/60 uppercase tracking-[0.5px]") Style
				div(class="text-sm font-medium text-base-content font-mono") {{ metrics.style }}
			div(class="flex flex-col gap-1")
				div(class="text-[11px] font-semibold text-base-content/60 uppercase tracking-[0.5px]") Weight
				div(class="text-sm font-medium text-base-content font-mono") {{ metrics.weight }}
			div(class="flex flex-col gap-1" v-if="metrics.ascent")
				div(class="text-[11px] font-semibold text-base-content/60 uppercase tracking-[0.5px]") Ascent
				div(class="text-sm font-medium text-base-content font-mono") {{ metrics.ascent }}
			div(class="flex flex-col gap-1" v-if="metrics.descent")
				div(class="text-[11px] font-semibold text-base-content/60 uppercase tracking-[0.5px]") Descent
				div(class="text-sm font-medium text-base-content font-mono") {{ metrics.descent }}
</template>
