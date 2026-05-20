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
div(class="LFM-breadcrumb-bar rounded-full" role="navigation" aria-label="Breadcrumb")
	RouterLink(to="/" class="LFM-breadcrumb-home" title="Home")
		IconHome

	IconChevronRight(class="LFM-breadcrumb-sep")

	div(class="flex items-center overflow-x-auto no-scrollbar")
		template(v-for="(crumb, i) in breadcrumbSegments" :key="crumb.label")
			RouterLink(v-if="i < breadcrumbSegments.length - 1 && crumb.path" :to="crumb.path" class="LFM-breadcrumb-crumb LFM-breadcrumb-crumb--link")
				| {{ crumb.label }}
			span(v-else class="LFM-breadcrumb-crumb LFM-breadcrumb-crumb--current")
				| {{ crumb.label }}

			IconChevronRight(v-if="i < breadcrumbSegments.length - 1" class="LFM-breadcrumb-sep")
</template>

<style lang="sass" scoped>
@reference "tailwindcss"

.LFM-breadcrumb-bar
  background: var(--color-base-100)
  border: 1px solid color-mix(in srgb, var(--color-base-content) 10%, transparent)
  @apply flex items-center flex-1 h-8 px-2.5 overflow-hidden mx-2 my-0 shadow-inner

.LFM-breadcrumb-home
  display: flex
  align-items: center
  color: var(--color-primary)
  flex-shrink: 0
  padding: 4px
  border-radius: 4px
  transition: background 150ms
  font-size: 18px

  &:hover
    background: color-mix(in srgb, var(--color-base-content) 6%, transparent)

.LFM-breadcrumb-sep
  color: var(--color-base-content)
  opacity: 0.3
  margin: 0 2px
  font-size: 16px
  flex-shrink: 0

.LFM-breadcrumb-crumb
  font-size: 12px
  white-space: nowrap
  padding: 2px 6px
  border-radius: 4px
  transition: background 150ms

.LFM-breadcrumb-crumb--link
  color: var(--color-base-content)
  text-decoration: none

  &:hover
    background: color-mix(in srgb, var(--color-base-content) 6%, transparent)
    color: var(--color-primary)

.LFM-breadcrumb-crumb--current
  color: var(--color-base-content)
  font-weight: 600

.no-scrollbar
  -ms-overflow-style: none
  scrollbar-width: none

  &::-webkit-scrollbar
    display: none
</style>
