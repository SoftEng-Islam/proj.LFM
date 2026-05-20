<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
	width: number;
	kind: 'details' | 'ai';
	ariaLabel: string;
	resizerAriaLabel: string;
}>();

const emit = defineEmits<{
	(e: 'update:width', val: number): void;
	(e: 'reset'): void;
}>();

let startX = 0;
let startW = 0;

function onCapturedPointerMove(e: PointerEvent) {
	const dx = startX - e.clientX;
	emit('update:width', startW + dx);
}

function onCapturedPointerUp(e: PointerEvent) {
	const el = e.currentTarget as HTMLElement | null;
	if (el?.hasPointerCapture?.(e.pointerId)) {
		el.releasePointerCapture(e.pointerId);
	}
	el?.removeEventListener('pointermove', onCapturedPointerMove);
	el?.removeEventListener('pointerup', onCapturedPointerUp);
	el?.removeEventListener('pointercancel', onCapturedPointerUp);
	
	document.body.style.removeProperty('cursor');
	document.body.style.removeProperty('user-select');
}

function beginResize(e: PointerEvent) {
	if (!e.isPrimary || e.button !== 0) return;
	const el = e.currentTarget as HTMLElement;
	startX = e.clientX;
	startW = props.width;
	
	el.setPointerCapture(e.pointerId);
	el.addEventListener('pointermove', onCapturedPointerMove);
	el.addEventListener('pointerup', onCapturedPointerUp);
	el.addEventListener('pointercancel', onCapturedPointerUp);
	
	document.body.style.cursor = 'col-resize';
	document.body.style.userSelect = 'none';
	e.preventDefault();
}
</script>

<template lang="pug">
.LFM-right-panel(:style="{ width: `${width}px` }")
	.LFM-panel-resizer(
		role="separator"
		aria-orientation="vertical"
		:aria-label="resizerAriaLabel"
		title="Drag to resize · Double-click to reset"
		tabindex="0"
		@pointerdown="beginResize"
		@dblclick.prevent="emit('reset')"
		@keydown.left.prevent="emit('update:width', width + 16)"
		@keydown.right.prevent="emit('update:width', width - 16)"
	)
	aside.LFM-sidebar-panel(:aria-label="ariaLabel")
		slot
</template>

<style scoped lang="scss">
@reference "tailwindcss";

.LFM-right-panel {
	display: flex;
	flex-direction: row;
	flex-shrink: 0;
	height: 100%;
	min-height: 0;
	min-width: 260px;
	max-width: 720px;
}

.LFM-panel-resizer {
	flex: 0 0 8px;
	width: 8px;
	min-width: 8px;
	cursor: col-resize;
	touch-action: none;
	background: transparent;
	position: relative;
	z-index: 2;
	margin-left: -1px;
	border-left: 1px solid transparent;
	transition: background 120ms ease, border-color 120ms ease;

	&::after {
		content: '';
		position: absolute;
		left: 50%;
		top: 0;
		bottom: 0;
		width: 1px;
		transform: translateX(-50%);
		background: color-mix(in srgb, var(--color-base-content) 10%, transparent);
		opacity: 0.85;
		pointer-events: none;
	}

	&:hover,
	&:focus-visible {
		background: color-mix(in srgb, var(--color-primary) 12%, transparent);
		border-left-color: color-mix(in srgb, var(--color-primary) 35%, transparent);
	}

	&:focus-visible {
		outline: none;
	}

	&:active {
		background: color-mix(in srgb, var(--color-primary) 22%, color-mix(in srgb, var(--color-base-content) 10%, transparent));
	}
}

.LFM-sidebar-panel {
	flex: 1;
	min-width: 0;
	height: 100%;
	overflow: hidden;
	display: flex;
	flex-direction: column;
	background: transparent;
	border-left: 1px solid color-mix(in srgb, var(--color-base-content) 10%, transparent);
}
</style>
