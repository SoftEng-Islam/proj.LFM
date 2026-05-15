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

<template>
	<div class="LFM-breadcrumb-bar" role="navigation" aria-label="Breadcrumb">
		<RouterLink to="/" class="LFM-breadcrumb-home" title="Home">
			<IconHome />
		</RouterLink>

		<IconChevronRight class="LFM-breadcrumb-sep" />

		<div class="flex items-center overflow-x-auto no-scrollbar">
			<template v-for="(crumb, i) in breadcrumbSegments" :key="crumb.label">
				<RouterLink v-if="i < breadcrumbSegments.length - 1 && crumb.path" :to="crumb.path" class="LFM-breadcrumb-crumb LFM-breadcrumb-crumb--link">
					{{ crumb.label }}
				</RouterLink>
				<span v-else class="LFM-breadcrumb-crumb LFM-breadcrumb-crumb--current">
					{{ crumb.label }}
				</span>

				<IconChevronRight v-if="i < breadcrumbSegments.length - 1" class="LFM-breadcrumb-sep" />
			</template>
		</div>
	</div>
</template>

<style scoped lang="scss">
@reference "tailwindcss";

.LFM-breadcrumb-bar {
	display: flex;
	align-items: center;
	flex: 1;
	height: 32px;
	padding: 0 10px;
	background: var(--LFM-panel);
	border: 1px solid var(--LFM-border);
	border-radius: 8px;
	margin: 0 8px;
	overflow: hidden;
	@apply shadow-inner;
}

.LFM-breadcrumb-home {
	display: flex;
	align-items: center;
	color: var(--LFM-blue);
	flex-shrink: 0;
	padding: 4px;
	border-radius: 4px;
	transition: background 150ms;
	font-size: 18px;

	&:hover {
		background: var(--LFM-hover);
	}
}

.LFM-breadcrumb-sep {
	color: var(--LFM-text);
	opacity: 0.3;
	margin: 0 2px;
	font-size: 16px;
	flex-shrink: 0;
}

.LFM-breadcrumb-crumb {
	font-size: 12px;
	white-space: nowrap;
	padding: 2px 6px;
	border-radius: 4px;
	transition: background 150ms;
}

.LFM-breadcrumb-crumb--link {
	color: var(--LFM-text);
	text-decoration: none;

	&:hover {
		background: var(--LFM-hover);
		color: var(--LFM-blue);
	}
}

.LFM-breadcrumb-crumb--current {
	color: var(--LFM-text);
	font-weight: 600;
}

.no-scrollbar {
	-ms-overflow-style: none;
	scrollbar-width: none;

	&::-webkit-scrollbar {
		display: none;
	}
}
</style>
