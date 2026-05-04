<script setup lang="ts">
import type { BreadcrumbSegment } from '@/types/file-manager';

defineProps<{
	segments: BreadcrumbSegment[];
}>();
</script>

<template>
	<nav class="flex min-w-0 items-center gap-2 overflow-x-auto text-sm text-slate-500" aria-label="Breadcrumb">
		<template v-for="(segment, index) in segments" :key="`${segment.label}-${index}`">
			<RouterLink
				v-if="segment.path"
				:to="segment.path"
				class="rounded-full px-2.5 py-1 transition hover:bg-slate-900/5 hover:text-slate-900 dark:hover:bg-white/10 dark:hover:text-white"
			>
				{{ segment.label }}
			</RouterLink>
			<span
				v-else
				class="rounded-full bg-slate-900/5 px-2.5 py-1 font-medium text-slate-900 dark:bg-white/10 dark:text-white"
			>
				{{ segment.label }}
			</span>
			<span
				v-if="index < segments.length - 1"
				class="text-slate-300 dark:text-slate-600"
				aria-hidden="true"
			>
				/
			</span>
		</template>
	</nav>
</template>
