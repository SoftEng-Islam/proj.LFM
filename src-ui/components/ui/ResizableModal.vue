<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
	width?: number;
	height?: number;
	direction: 'left' | 'top' | 'right' | 'bottom';
	kind: 'details' | 'ai' | 'NavigationSidebar' | 'StatusBar';
	ariaLabel: string;
	resizerAriaLabel: string;
}>();

const emit = defineEmits<{
	(e: 'update:width', val: number): void;
	(e: 'update:height', val: number): void;
	(e: 'reset'): void;
}>();

const ariaOrientation = (props.direction === 'left' || props.direction === 'right') ? 'vertical' : 'horizontal';

let startX = 0;
let startY = 0;

let startW = 0;
let startH = 0;

function onCapturedPointerMove(e: PointerEvent) {
	if (ariaOrientation === 'vertical') {
		const dx = e.clientX - startX;
		// For direction="left" (right-side panels), invert the delta
		const adjustedDx = props.direction === 'left' ? -dx : dx;
		emit('update:width', startW + adjustedDx);
	} else {
		const dy = e.clientY - startY;
		// For direction="top" (bottom panels), invert the delta
		const adjustedDy = props.direction === 'top' ? -dy : dy;
		emit('update:height', startH + adjustedDy);
	}
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
	startY = e.clientY;

	startW = props.width ?? 0;
	startH = props.height ?? 0;

	el.setPointerCapture(e.pointerId);
	el.addEventListener('pointermove', onCapturedPointerMove);
	el.addEventListener('pointerup', onCapturedPointerUp);
	el.addEventListener('pointercancel', onCapturedPointerUp);

	document.body.style.cursor = ariaOrientation === 'vertical' ? 'col-resize' : 'row-resize';
	document.body.style.userSelect = 'none';
	e.preventDefault();
}
</script>

<template lang="pug">
div(class="container" :data-orientation="ariaOrientation" :data-direction="direction" :style="[ariaOrientation === 'vertical' ? { width: `${width}px` } : { height: `${height ?? 40}px` }]")
	div.resizer(
		role="separator"
		:data-orientation="ariaOrientation"
		:data-direction="direction"
		:aria-orientation="ariaOrientation"
		:aria-label="resizerAriaLabel"
		title="Drag to resize · Double-click to reset"
		tabindex="0"
		@pointerdown="beginResize"
		@dblclick.prevent="emit('reset')"
	)
	div(class="content" :data-orientation="ariaOrientation" :data-direction="direction" :aria-label="ariaLabel")
		slot
</template>

<style scoped lang="scss">
@reference "tailwindcss";

.container {
	display: flex;
	flex-shrink: 0;
	min-height: 0;
	height: 100%;
	min-width: 260px;
	max-width: 720px;

	&[data-orientation="vertical"] {
		flex-direction: row;
	}

	&[data-orientation="horizontal"] {
		flex-direction: column;
		height: auto;
		min-height: 48px;
		max-height: 200px;
		min-width: 0;
		max-width: none;
		width: 100%;
	}
}

.resizer {
	flex: 0 0 8px;
	width: 8px;
	min-width: 8px;
	touch-action: none;
	background: transparent;
	position: relative;
	z-index: 2;
	transition: background 120ms ease, border-color 120ms ease;

	&[data-orientation="vertical"] {
		cursor: col-resize;

		&[data-direction="left"] {
			order: -1;
			margin-left: -1px;
			border-left: 1px solid transparent;

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
				border-left-color: color-mix(in srgb, var(--color-primary) 35%, transparent);
			}
		}

		&[data-direction="right"] {
			order: 1;
			margin-right: -1px;
			border-right: 1px solid transparent;

			&::after {
				content: '';
				position: absolute;
				right: 50%;
				top: 0;
				bottom: 0;
				width: 1px;
				transform: translateX(50%);
				background: color-mix(in srgb, var(--color-base-content) 10%, transparent);
				opacity: 0.85;
				pointer-events: none;
			}

			&:hover,
			&:focus-visible {
				border-right-color: color-mix(in srgb, var(--color-primary) 35%, transparent);
			}
		}
	}

	&[data-orientation="horizontal"] {
		cursor: row-resize;
		flex: 0 0 8px;
		height: 8px;
		min-height: 8px;
		width: 100%;

		&[data-direction="top"] {
			order: -1;
			border-bottom: 1px solid transparent;

			&::after {
				content: '';
				position: absolute;
				bottom: 0;
				left: 0;
				right: 0;
				height: 1px;
				background: color-mix(in srgb, var(--color-base-content) 10%, transparent);
				opacity: 0.85;
				pointer-events: none;
			}

			&:hover,
			&:focus-visible {
				border-bottom-color: color-mix(in srgb, var(--color-primary) 35%, transparent);
			}
		}

		&[data-direction="bottom"] {
			order: 1;
			border-top: 1px solid transparent;

			&::after {
				content: '';
				position: absolute;
				top: 0;
				left: 0;
				right: 0;
				height: 1px;
				background: color-mix(in srgb, var(--color-base-content) 10%, transparent);
				opacity: 0.85;
				pointer-events: none;
			}

			&:hover,
			&:focus-visible {
				border-top-color: color-mix(in srgb, var(--color-primary) 35%, transparent);
			}
		}
	}

	&:hover,
	&:focus-visible {
		background: color-mix(in srgb, var(--color-primary) 12%, transparent);
	}

	&:focus-visible {
		outline: none;
	}

	&:active {
		background: color-mix(in srgb, var(--color-primary) 22%, color-mix(in srgb, var(--color-base-content) 10%, transparent));
	}
}

div.content {
	flex: 1;
	min-width: 0;
	height: 100%;
	overflow: hidden;
	display: flex;
	flex-direction: column;
	background: transparent;

	&[data-orientation="vertical"] {
		&[data-direction="left"] {
			border-left: 1px solid color-mix(in srgb, var(--color-base-content) 10%, transparent);
		}

		&[data-direction="right"] {
			border-right: 1px solid color-mix(in srgb, var(--color-base-content) 10%, transparent);
		}
	}

	&[data-orientation="horizontal"] {
		&[data-direction="top"] {
			border-top: 1px solid color-mix(in srgb, var(--color-base-content) 10%, transparent);
		}

		&[data-direction="bottom"] {
			border-bottom: 1px solid color-mix(in srgb, var(--color-base-content) 10%, transparent);
		}
	}
}
</style>
