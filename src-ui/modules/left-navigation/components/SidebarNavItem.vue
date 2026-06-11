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

<style scoped>
@reference "tailwindcss";

.LFM-sbar-item {
	@apply relative flex items-center justify-start gap-2.5 min-h-9 py-0 px-3 rounded-md cursor-pointer text-(--color-base-content) my-0.5 mx-2 hover:bg-(--color-base-100);
}

.LFM-sbar-item--active {
	background: color-mix(in srgb, var(--color-primary) 12%, transparent);
	color: var(--color-primary);
	font-weight: 600;
}

.LFM-sbar-item--active::before {
	content: "";
	position: absolute;
	left: -8px;
	top: 6px;
	bottom: 6px;
	width: 4px;
	background: var(--color-primary);
	border-radius: 0 4px 4px 0;
	box-shadow: 0 0 10px var(--color-primary);
}

.LFM-sbar-item--special {
	margin-bottom: 2px;
	height: 38px;
}

.LFM-sbar-item--special .LFM-sbar-icon {
	font-size: 20px;
}

.LFM-sbar-item--special .LFM-sbar-label {
	@apply text-base font-bold;
}

.LFM-sbar-icon {
	@apply pb-0.5 flex items-center justify-center w-5 shrink-0;
}

.LFM-sbar-label {
	@apply pt-0.5 text-base flex-1 whitespace-nowrap overflow-hidden text-ellipsis;
}

.LFM-sbar-pin {
	opacity: 0;
	font-size: 14px;
	transition: opacity 150ms;
	color: var(--color-base-content);
}

.LFM-sbar-item:hover .LFM-sbar-pin {
	opacity: 0.4;
}
</style>
