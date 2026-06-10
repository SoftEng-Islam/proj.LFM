<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import IconClose from "~icons/material-symbols/close";
import IconTerminal from "~icons/material-symbols/terminal";
import IconArticle from "~icons/material-symbols/article";
import IconGitBranch from "~icons/material-symbols/alt-route";
import IconPendingActions from "~icons/material-symbols/pending-actions";
import TerminalTab from "./TerminalTab.vue";
import LogTab from "./LogTab.vue";
import GitTab from "./GitTab.vue";
import TasksTab from "./TasksTab.vue";
import { MAX_PANEL_HEIGHT, MIN_PANEL_HEIGHT, type StatusTab } from "../useStatusBar.ts";

const props = defineProps<{ activeTab: StatusTab; cwd: string; height: number }>();
const emit = defineEmits<{
    (event: "changeTab", tab: StatusTab): void;
    (event: "update:height", height: number): void;
    (event: "close"): void;
}>();

const tabs = [
    { id: "terminal", label: "Terminal", icon: IconTerminal },
    { id: "log", label: "Logs", icon: IconArticle },
    { id: "git", label: "Git", icon: IconGitBranch },
    { id: "tasks", label: "Tasks", icon: IconPendingActions },
] as const;

const panelRoot = ref<HTMLElement | null>(null);
const panelStyle = computed(() => ({ height: `${props.height}px` }));
const activeTabLabel = computed(() => tabs.find((tab) => tab.id === props.activeTab)?.label ?? "Panel");

let startY = 0;
let startHeight = 0;
let activeResizer: HTMLElement | null = null;

function handleTabChange(tab: StatusTab) {
    emit("changeTab", tab);
}

function updateHeight(nextHeight: number) {
    emit("update:height", nextHeight);
}

function onPointerMove(event: PointerEvent) {
    updateHeight(startHeight + startY - event.clientY);
}

function stopResize(pointerId?: number) {
    if (pointerId !== undefined && activeResizer?.hasPointerCapture(pointerId)) {
        activeResizer.releasePointerCapture(pointerId);
    }

    activeResizer?.removeEventListener("pointermove", onPointerMove);
    activeResizer?.removeEventListener("pointerup", onPointerUp);
    activeResizer?.removeEventListener("pointercancel", onPointerUp);
    activeResizer = null;
    document.body.style.removeProperty("cursor");
    document.body.style.removeProperty("user-select");
}

function onPointerUp(event: PointerEvent) {
    stopResize(event.pointerId);
}

function beginResize(event: PointerEvent) {
    if (!event.isPrimary || event.button !== 0) return;

    activeResizer = event.currentTarget as HTMLElement;
    startY = event.clientY;
    startHeight = props.height;
    activeResizer.setPointerCapture(event.pointerId);
    activeResizer.addEventListener("pointermove", onPointerMove, { passive: true });
    activeResizer.addEventListener("pointerup", onPointerUp);
    activeResizer.addEventListener("pointercancel", onPointerUp);
    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";
    event.preventDefault();
}

function handleResizeKeydown(event: KeyboardEvent) {
    const step = event.shiftKey ? 48 : 16;

    if (event.key === "ArrowUp") {
        updateHeight(props.height + step);
    } else if (event.key === "ArrowDown") {
        updateHeight(props.height - step);
    } else if (event.key === "Home") {
        updateHeight(MIN_PANEL_HEIGHT);
    } else if (event.key === "End") {
        updateHeight(MAX_PANEL_HEIGHT);
    } else {
        return;
    }

    event.preventDefault();
}

onMounted(() => {
    void nextTick(() => panelRoot.value?.focus({ preventScroll: true }));
});

onBeforeUnmount(() => {
    stopResize();
});
</script>

<template lang="pug">
div(
    ref="panelRoot"
    class="LFM-status-panel absolute inset-x-0 bottom-full z-40 flex flex-col overflow-hidden border border-x-0 border-slate-700 bg-slate-900 shadow-2xl outline-none"
    :style="panelStyle"
    role="region"
    :aria-label="`${activeTabLabel} panel`"
    tabindex="-1"
    @keydown.esc.stop="emit('close')"
)
    div(
        class="LFM-status-panel-resizer group flex h-2 shrink-0 cursor-row-resize touch-none items-center justify-center bg-slate-950/80"
        role="separator"
        aria-orientation="horizontal"
        aria-label="Resize status panel. Use Up and Down arrow keys."
        :aria-valuemin="MIN_PANEL_HEIGHT"
        :aria-valuemax="MAX_PANEL_HEIGHT"
        :aria-valuenow="props.height"
        tabindex="0"
        title="Drag to resize the panel · Arrow keys resize"
        @pointerdown="beginResize"
        @keydown="handleResizeKeydown"
    )
        span(class="h-0.5 w-12 rounded-full bg-slate-600 transition-colors group-hover:bg-blue-400 group-focus-visible:bg-blue-400")

    div(class="flex min-h-0 shrink-0 items-center justify-between border-b border-slate-700 bg-slate-800/95")
        div(class="flex min-w-0 items-center overflow-x-auto" role="tablist" aria-label="Panel views")
            button(
                v-for="tab in tabs"
                :key="tab.id"
                type="button"
                role="tab"
                class="inline-flex min-h-10 items-center gap-2 border-b-2 px-4 text-xs font-medium text-slate-400 transition hover:bg-slate-700/40 hover:text-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-400"
                :class="props.activeTab === tab.id ? 'border-blue-400 bg-slate-700/45 text-slate-100' : 'border-transparent'"
                :aria-selected="props.activeTab === tab.id"
                @click="handleTabChange(tab.id)"
            )
                component(:is="tab.icon" class="h-4 w-4 shrink-0")
                span {{ tab.label }}

        button(class="mr-2 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded text-slate-400 transition hover:bg-slate-700/70 hover:text-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-400" type="button" @click="emit('close')" aria-label="Close status panel")
            IconClose(class="h-4 w-4")

    div(class="min-h-0 flex-1 overflow-hidden bg-slate-900")
        div(class="h-full overflow-auto p-4 text-slate-300")
            TerminalTab(v-if="props.activeTab === 'terminal'" :cwd="props.cwd")
            LogTab(v-else-if="props.activeTab === 'log'")
            GitTab(v-else-if="props.activeTab === 'git'" :cwd="props.cwd")
            TasksTab(v-else-if="props.activeTab === 'tasks'")
</template>

<style scoped>
@reference "tailwindcss";

.LFM-status-panel {
    min-height: 180px;
    max-height: min(560px, calc(100vh - 8rem));
}

.LFM-status-panel-resizer:focus-visible {
    @apply outline outline-2 outline-blue-400;
}
</style>
