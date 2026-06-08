<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";

const props = defineProps<{
    width?: number;
    height?: number;
    direction: "left" | "top" | "right" | "bottom";
    kind: "details" | "ai" | "NavigationSidebar" | "StatusBar";
    ariaLabel: string;
    resizerAriaLabel: string;
}>();

const emit = defineEmits<{
    (e: "update:width", val: number): void;
    (e: "update:height", val: number): void;
    (e: "reset"): void;
}>();

const ariaOrientation = props.direction === "left" || props.direction === "right" ? "vertical" : "horizontal";
const isVertical = ariaOrientation === "vertical";
const localWidth = ref(props.width);
const localHeight = ref(props.height);
const containerStyle = computed(() =>
    isVertical ? { width: `${localWidth.value ?? props.width}px` } : { height: `${localHeight.value ?? props.height ?? 40}px` },
);

let startX = 0;
let startY = 0;

let startW = 0;
let startH = 0;
let pendingSize = 0;
let rafId = 0;
let isResizing = false;

watch(
    () => props.width,
    (width) => {
        if (!isResizing) localWidth.value = width;
    },
);

watch(
    () => props.height,
    (height) => {
        if (!isResizing) localHeight.value = height;
    },
);

function flushResizeFrame() {
    rafId = 0;

    if (isVertical) {
        localWidth.value = pendingSize;
        emit("update:width", pendingSize);
    } else {
        localHeight.value = pendingSize;
        emit("update:height", pendingSize);
    }
}

function scheduleResize(size: number) {
    pendingSize = size;
    if (rafId) return;
    rafId = window.requestAnimationFrame(flushResizeFrame);
}

function onCapturedPointerMove(e: PointerEvent) {
    if (isVertical) {
        const dx = e.clientX - startX;
        // For direction="left" (right-side panels), invert the delta
        const adjustedDx = props.direction === "left" ? -dx : dx;
        scheduleResize(startW + adjustedDx);
    } else {
        const dy = e.clientY - startY;
        // For direction="top" (bottom panels), invert the delta
        const adjustedDy = props.direction === "top" ? -dy : dy;
        scheduleResize(startH + adjustedDy);
    }
}

function stopResize(el: HTMLElement | null, pointerId?: number) {
    if (pointerId !== undefined && el?.hasPointerCapture?.(pointerId)) {
        el.releasePointerCapture(pointerId);
    }
    el?.removeEventListener("pointermove", onCapturedPointerMove);
    el?.removeEventListener("pointerup", onCapturedPointerUp);
    el?.removeEventListener("pointercancel", onCapturedPointerUp);

    if (rafId) {
        window.cancelAnimationFrame(rafId);
        flushResizeFrame();
    }

    isResizing = false;
    void nextTick(() => {
        localWidth.value = props.width;
        localHeight.value = props.height;
    });
    document.body.style.removeProperty("cursor");
    document.body.style.removeProperty("user-select");
}

function onCapturedPointerUp(e: PointerEvent) {
    stopResize(e.currentTarget as HTMLElement | null, e.pointerId);
}

function beginResize(e: PointerEvent) {
    if (!e.isPrimary || e.button !== 0) return;
    const el = e.currentTarget as HTMLElement;
    isResizing = true;
    startX = e.clientX;
    startY = e.clientY;

    startW = localWidth.value ?? props.width ?? 0;
    startH = localHeight.value ?? props.height ?? 0;
    pendingSize = isVertical ? startW : startH;

    el.setPointerCapture(e.pointerId);
    el.addEventListener("pointermove", onCapturedPointerMove, { passive: true });
    el.addEventListener("pointerup", onCapturedPointerUp);
    el.addEventListener("pointercancel", onCapturedPointerUp);

    document.body.style.cursor = isVertical ? "col-resize" : "row-resize";
    document.body.style.userSelect = "none";
    e.preventDefault();
}

onBeforeUnmount(() => {
    stopResize(null);
});
</script>

<template lang="pug">
div(
    class="flex flex-shrink-0 min-h-0 h-full min-w-60 max-w-3xl"
    :class="{ 'flex-row': isVertical, 'flex-col h-auto min-h-12 max-h-52 w-full max-w-none': !isVertical }"
    :data-orientation="ariaOrientation"
    :data-direction="direction"
    :style="containerStyle"
)
    div(
        class="flex-shrink-0 touch-none bg-transparent relative z-20 transition-colors duration-120"
        :class="[isVertical ? 'w-2 min-w-2 cursor-col-resize' : 'h-2 min-h-2 w-full cursor-row-resize', (isVertical && direction === 'left') || (!isVertical && direction === 'top') ? 'order-first' : 'order-last',]"
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

    div(
        class="flex-1 min-w-0 h-full flex flex-col bg-transparent relative border border-slate-700"
        :class="[kind === 'StatusBar' ? 'overflow-visible' : 'overflow-hidden', isVertical && direction === 'left' ? 'border-l border-r-0 border-t-0 border-b-0' : '', isVertical && direction === 'right' ? 'border-r border-l-0 border-t-0 border-b-0' : '', !isVertical && direction === 'top' ? 'border-t border-l-0 border-r-0 border-b-0' : '', !isVertical && direction === 'bottom' ? 'border-b border-l-0 border-r-0 border-t-0' : '',]"
        :data-orientation="ariaOrientation"
        :data-direction="direction"
        :data-kind="kind"
        :aria-label="ariaLabel"
    )
        slot
</template>
