<script setup lang="ts">
import { computed } from 'vue';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'quiet';
type ButtonSize = 'sm' | 'md';

const props = withDefaults(
	defineProps<{
		variant?: ButtonVariant;
		size?: ButtonSize;
		type?: 'button' | 'submit' | 'reset';
		active?: boolean;
	}>(),
	{
		variant: 'primary',
		size: 'md',
		type: 'button',
		active: false,
	}
);

const variantClasses: Record<ButtonVariant, string> = {
	primary:
		'border border-emerald-400/30 bg-emerald-500 text-white shadow-[0_12px_26px_rgba(14,116,81,0.28)] hover:bg-emerald-400',
	secondary:
		'border border-slate-200 bg-white/85 text-slate-700 hover:border-slate-300 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-slate-100 dark:hover:bg-white/15',
	ghost:
		'border border-transparent bg-transparent text-slate-600 hover:bg-slate-900/5 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white',
	quiet:
		'border border-transparent bg-slate-900/[0.04] text-slate-600 hover:bg-slate-900/[0.08] hover:text-slate-900 dark:bg-white/[0.06] dark:text-slate-200 dark:hover:bg-white/[0.12]',
};

const sizeClasses: Record<ButtonSize, string> = {
	sm: 'gap-2 px-3 py-2 text-xs font-medium',
	md: 'gap-2.5 px-4 py-2.5 text-sm font-medium',
};

const classes = computed(() => [
	'inline-flex items-center justify-center rounded-2xl transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60',
	sizeClasses[props.size],
	variantClasses[props.variant],
	props.active ? 'ring-2 ring-emerald-300/60' : '',
]);
</script>

<template lang="pug">
button(:type="type" :class="classes")
	slot
</template>
