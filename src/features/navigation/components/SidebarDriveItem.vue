<script setup lang="ts">
import { type Component } from 'vue';

const props = withDefaults(defineProps<{
	to: string;
	active?: boolean;
	label: string;
	meta: string;
	icon?: Component;
	iconClass?: string;
}>(), {
	active: false,
	iconClass: 'text-slate-500',
});
</script>

<template lang="pug">
RouterLink.LFM-sbar-item.LFM-sbar-item--drive(
	:to="to"
	:class="{ 'LFM-sbar-item--active': active }"
)
	span.LFM-sbar-icon
		slot(name="icon")
			component.LFM-material-drive-icon(
				v-if="icon"
				:is="icon"
				:class="iconClass"
				aria-hidden="true"
			)
	span.LFM-sbar-drive-copy
		span.LFM-sbar-label {{ label }}
		span.LFM-sbar-meta {{ meta }}
</template>

<style lang="sass" scoped>
@reference "tailwindcss"

.LFM-sbar-item
	display: flex
	align-items: center
	gap: 12px
	min-height: 36px
	padding: 0 12px
	border-radius: 8px
	cursor: pointer
	text-decoration: none
	color: var(--color-base-content)
	transition: all 150ms ease
	position: relative
	margin: 1px 8px

	&:hover
		background: color-mix(in srgb, var(--color-base-content) 6%, transparent)

	&--active
		background: color-mix(in srgb, var(--color-primary) 12%, transparent)
		color: var(--color-primary)
		font-weight: 600

		&::before
			content: ''
			position: absolute
			left: -8px
			top: 6px
			bottom: 6px
			width: 4px
			background: var(--color-primary)
			border-radius: 0 4px 4px 0
			box-shadow: 0 0 10px var(--color-primary)

.LFM-sbar-item--drive
	align-items: flex-start
	padding-block: 7px

.LFM-sbar-icon
	display: flex
	align-items: center
	justify-content: center
	width: 20px
	flex-shrink: 0
	font-size: 18px

.LFM-material-drive-icon
	width: 20px
	height: 20px

.LFM-sbar-drive-copy
	display: grid
	gap: 2px
	min-width: 0
	flex: 1

.LFM-sbar-label
	flex: 1
	white-space: nowrap
	overflow: hidden
	text-overflow: ellipsis

.LFM-sbar-meta
	overflow: hidden
	color: color-mix(in srgb, var(--color-base-content) 60%, transparent)
	font-size: 11px
	font-weight: 500
	line-height: 1.2
	text-overflow: ellipsis
	white-space: nowrap
</style>
