<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useFileManagerStore } from '@/stores/file-manager';
import IconHome from '~icons/material-symbols/home';
import IconChevronRight from '~icons/material-symbols/chevron-right';
const store = useFileManagerStore();
const route = useRoute();

const appRouteAliasBreadcrumbs = computed(() => {
	const path = route.path;
	const aliasMap: Record<string, { label: string; path: string }> = {
		'/drives': { label: '@drives', path: '/@drives' },
		'/@drives': { label: '@drives', path: '/@drives' },
		'/locations': { label: '@locations', path: '/@locations' },
		'/@locations': { label: '@locations', path: '/@locations' },
		'/settings': { label: '@settings', path: '/@settings' },
		'/@settings': { label: '@settings', path: '/@settings' },
	};

	const alias = aliasMap[path];
	if (!alias) return null;

	return [
		{ label: alias.label, path: alias.path },
	];
});

const breadcrumbSegments = computed(() => appRouteAliasBreadcrumbs.value ?? store.breadcrumbs);
</script>

<template lang="pug">
div(class="flex items-center flex-1 h-8 px-2.5 overflow-hidden mx-2 my-0 shadow-inner rounded-full bg-base-100 border border-base-content/10" role="navigation" aria-label="Breadcrumb")
	RouterLink(to="/" class="flex items-center text-primary shrink-0 p-1 rounded transition-colors duration-150 hover:bg-base-content/5 text-[18px]" title="Home")
		IconHome

	IconChevronRight(class="text-base-content opacity-30 mx-0.5 text-[16px] shrink-0")

	div(class="flex items-center overflow-x-auto scrollbar-none [&::-webkit-scrollbar]:hidden")
		template(v-for="(crumb, i) in breadcrumbSegments" :key="crumb.label")
			RouterLink(v-if="i < breadcrumbSegments.length - 1 && crumb.path" :to="crumb.path" class="text-[12px] whitespace-nowrap px-1.5 py-0.5 rounded transition-colors duration-150 text-base-content no-underline hover:bg-base-content/5 hover:text-primary")
				| {{ crumb.label }}
			span(v-else class="text-[12px] whitespace-nowrap px-1.5 py-0.5 rounded transition-colors duration-150 text-base-content font-semibold")
				| {{ crumb.label }}

			IconChevronRight(v-if="i < breadcrumbSegments.length - 1" class="text-base-content opacity-30 mx-0.5 text-[16px] shrink-0")
</template>
