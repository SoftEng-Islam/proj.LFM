<script setup lang="ts">
import { computed } from 'vue';
import IconPushPin from '~icons/material-symbols/push-pin';

const props = withDefaults(defineProps<{
	to?: string;
	active?: boolean;
	label: string;
	showPin?: boolean;
	isHomeOrTrash?: boolean;
}>(), {
	active: false,
	showPin: false,
	isHomeOrTrash: false,
});
</script>

<template lang="pug">
//- RouterLink if "to" path is provided
RouterLink.LFM-sbar-item(
	v-if="to"
	:to="to"
	:class="{ 'LFM-sbar-item--active': active, 'LFM-sbar-item--special': isHomeOrTrash }"
)
	span.LFM-sbar-icon
		slot(name="icon")
	span.LFM-sbar-label {{ label }}
	IconPushPin.LFM-sbar-pin(v-if="showPin")

//- Static div if no "to" path is provided
.LFM-sbar-item(
	v-else
	:class="{ 'LFM-sbar-item--active': active, 'LFM-sbar-item--special': isHomeOrTrash }"
)
	span.LFM-sbar-icon
		slot(name="icon")
	span.LFM-sbar-label {{ label }}
	IconPushPin.LFM-sbar-pin(v-if="showPin")
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

	&--special
		margin-bottom: 2px
		height: 38px

		.LFM-sbar-icon
			font-size: 20px

		.LFM-sbar-label
			font-size: 14px
			font-weight: 700

.LFM-sbar-icon
	display: flex
	align-items: center
	justify-content: center
	width: 20px
	flex-shrink: 0
	font-size: 18px

.LFM-sbar-label
	flex: 1
	white-space: nowrap
	overflow: hidden
	text-overflow: ellipsis

.LFM-sbar-pin
	opacity: 0
	font-size: 14px
	transition: opacity 150ms
	color: var(--color-base-content)

.LFM-sbar-item:hover .LFM-sbar-pin
	opacity: 0.4
</style>
