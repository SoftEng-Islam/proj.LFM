<script setup lang="ts">
import SidebarNavigation from '@/modules/left-navigation/components/SidebarNavigation.vue';
import IconSettings from '~icons/material-symbols/settings';
import { useFileManagerStore } from '@/stores/file-manager';

const store = useFileManagerStore();
</script>

<template lang="pug">
aside.LFM-sidebar(aria-label="Navigation pane")
	SidebarNavigation
	//- Settings button
	button.LFM-sbar-settings.flex.items-center.justify-center.gap-4.p-3(
		type="button"
		:class="{ 'LFM-sbar-settings--active': store.settingsOpen }"
		@click="store.openSettings"
	)
		span.text-lg: IconSettings
		span.text-lg.text-nowrap.overflow-hidden.text-ellipsis Settings
</template>

<style scoped lang="scss">
@reference "tailwindcss";

.LFM-sidebar {
	width: 240px;
	flex-shrink: 0;
	display: flex;
	flex-direction: column;
	height: 100%;
	padding: 8px 0;
	overflow: hidden;
	border-right: 1px solid color-mix(in srgb, var(--color-base-content) 10%, transparent);
	background: var(--color-base-200);
}

.LFM-sbar-settings {
	min-height: 40px;
	border-radius: 10px;
	cursor: pointer;
	text-decoration: none;
	color: var(--color-base-content);
	background: color-mix(in srgb, var(--color-base-content) 4%, transparent);
	border: 1px solid color-mix(in srgb, var(--color-base-content) 8%, transparent);
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
	transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
	position: relative;
	margin: auto 8px 8px 8px;
	font-size: 13px;
	font-weight: 500;
	width: calc(100% - 16px);

	&:hover {
		background: color-mix(in srgb, var(--color-base-content) 8%, transparent);
		border-color: color-mix(in srgb, var(--color-base-content) 15%, transparent);
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
	}

	&:active {
		transform: translateY(0);
		background: color-mix(in srgb, var(--color-base-content) 12%, transparent);
	}

	&--active {
		background: color-mix(in srgb, var(--color-primary) 12%, transparent);
		border-color: color-mix(in srgb, var(--color-primary) 30%, transparent);
		color: var(--color-primary);
		font-weight: 600;
		box-shadow: 0 4px 12px color-mix(in srgb, var(--color-primary) 15%, transparent);

		&::before {
			content: '';
			position: absolute;
			left: -8px;
			top: 6px;
			bottom: 6px;
			width: 4px;
			background: var(--color-primary);
			border-radius: 0 4px 4px 0;
			box-shadow: 0 0 10px var(--color-primary);
		}
	}
}
</style>
