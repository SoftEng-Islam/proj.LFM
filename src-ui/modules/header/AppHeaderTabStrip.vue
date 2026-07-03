<script setup lang="ts">
import { computed, nextTick, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useFileManagerStore } from "@/stores/file-manager";
import IconAdd from "~icons/material-symbols/add";
import FolderIcon from "@/components/VueIcons/Folder/FolderIcon.vue";
import IconClose from "~icons/material-symbols/close";

const store = useFileManagerStore();
const router = useRouter();
const route = useRoute();
const tabStripRef = ref<HTMLElement | null>(null);
const draggedTabId = ref<string | null>(null);
const dropIndex = ref<number | null>(null);
const dragOverTabId = ref<string | null>(null);

const activeTabId = computed(() => {
    const tabId = route.query.tab;
    if (typeof tabId === "string" && tabId) return tabId;
    return store.activeTabId;
});

const isDragging = computed(() => draggedTabId.value !== null);
const dropIndicatorStyle = computed(() => {
    if (!isDragging.value || dropIndex.value === null) return { opacity: "0" };

    return {
        opacity: "1",
        transform: `translateX(${dropIndicatorLeft(dropIndex.value)}px)`,
    };
});

function resolveAppRoutePath(path: string) {
    if (path === "/drives") return "/@drives";
    if (path === "/@drives") return "/@drives";
    if (path === "/locations") return "/@locations";
    if (path === "/@locations") return "/@locations";
    if (path === "/settings") return "/@settings";
    if (path === "/@settings") return "/@settings";
    return path;
}

function handleCloseTab(tabId: string) {
    const idx = store.windowTabs.findIndex((t: any) => t.id === tabId);
    if (idx === -1) return;

    const activeId = typeof route.query.tab === "string" ? route.query.tab : "";
    const isActive = activeId ? activeId === tabId : route.path === store.windowTabs[idx]?.path;
    store.closeTab(tabId);

    if (isActive) {
        const next = store.windowTabs[Math.max(0, idx - 1)];
        if (next) router.push({ path: resolveAppRoutePath(next.path), query: { tab: next.id } });
    }
}

function handleNewTab() {
    // Always open a new tab that points to the Storage Overview alias '@drives'
    const id = store.addTab("@drives");
    const tab = store.windowTabs.find((t: any) => t.id === id);
    if (tab) {
        const navPath = tab.path && tab.path.startsWith("@") ? (tab.path === "@drives" ? "/@drives" : tab.path) : resolveAppRoutePath(tab.path);
        router.push({ path: navPath, query: { tab: id } });
    }
}

function tabElements() {
    return Array.from(tabStripRef.value?.querySelectorAll<HTMLElement>("[data-tab-id]") ?? []);
}

function visibleTabElements() {
    return tabElements().filter((el) => el.dataset.tabId !== draggedTabId.value);
}

function dropIndicatorLeft(index: number) {
    const strip = tabStripRef.value;
    if (!strip) return 0;

    const tabs = visibleTabElements();
    const stripRect = strip.getBoundingClientRect();
    const target = tabs[index];

    if (target) return target.getBoundingClientRect().left - stripRect.left;

    const lastTab = tabs.at(-1);
    if (!lastTab) return 0;

    const lastRect = lastTab.getBoundingClientRect();
    return lastRect.right - stripRect.left;
}

function getDropIndex(clientX: number) {
    const tabs = visibleTabElements();
    const fallbackIndex = tabs.length;

    for (const [index, tab] of tabs.entries()) {
        const rect = tab.getBoundingClientRect();
        if (clientX < rect.left + rect.width / 2) return index;
    }

    return fallbackIndex;
}

function getDragOverTabId(clientX: number) {
    const tabs = visibleTabElements();

    for (const tab of tabs) {
        const rect = tab.getBoundingClientRect();
        if (clientX >= rect.left && clientX <= rect.right) return tab.dataset.tabId ?? null;
    }

    return null;
}

function setDragImage(event: DragEvent, tabId: string) {
    const tab = tabElements().find((el) => el.dataset.tabId === tabId);
    if (!tab || !event.dataTransfer) return;

    const rect = tab.getBoundingClientRect();
    event.dataTransfer.setDragImage(tab, Math.min(event.clientX - rect.left, rect.width), Math.max(event.clientY - rect.top, 0));
}

function handleDragStart(tabId: string, event: DragEvent) {
    draggedTabId.value = tabId;
    dropIndex.value = store.windowTabs.findIndex((t: any) => t.id === tabId);
    dragOverTabId.value = null;

    if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.dropEffect = "move";
        event.dataTransfer.setData("text/plain", tabId);
    }

    setDragImage(event, tabId);
}

function handleDragOver(event: DragEvent) {
    if (!draggedTabId.value) return;

    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = "move";

    const hoveredTabId = getDragOverTabId(event.clientX);
    const hoveredIndex = hoveredTabId ? store.windowTabs.findIndex((t: any) => t.id === hoveredTabId) : -1;

    dragOverTabId.value = hoveredTabId;
    dropIndex.value = hoveredIndex === -1 ? getDropIndex(event.clientX) : hoveredIndex;
}

function moveDraggedTab() {
    const fromIndex = store.windowTabs.findIndex((t: any) => t.id === draggedTabId.value);
    if (fromIndex === -1 || dropIndex.value === null) return;

    // When hovering a tab, `dropIndex` is that tab's current index. After
    // `reorderTabs` removes the dragged tab, that same index swaps adjacent tabs
    // in either direction, including first -> second.
    const toIndex = Math.max(0, Math.min(dropIndex.value, store.windowTabs.length - 1));

    if (fromIndex !== toIndex) store.reorderTabs(fromIndex, toIndex);
}

function handleDrop(event: DragEvent) {
    event.preventDefault();
    moveDraggedTab();
    resetDragState();
}

function handleDragLeave(event: DragEvent) {
    const relatedTarget = event.relatedTarget as Node | null;
    if (relatedTarget && tabStripRef.value?.contains(relatedTarget)) return;

    dragOverTabId.value = null;
}

function resetDragState() {
    draggedTabId.value = null;
    dropIndex.value = null;
    dragOverTabId.value = null;
}

function handleDragEnd() {
    resetDragState();
}

function handleTabKeydown(tabId: string, event: KeyboardEvent) {
    if (!event.altKey || (event.key !== "ArrowLeft" && event.key !== "ArrowRight")) return;

    const fromIndex = store.windowTabs.findIndex((t: any) => t.id === tabId);
    if (fromIndex === -1) return;

    const toIndex = event.key === "ArrowLeft" ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= store.windowTabs.length) return;

    event.preventDefault();
    store.reorderTabs(fromIndex, toIndex);
    void nextTick(() =>
        tabElements()
            .find((el) => el.dataset.tabId === tabId)
            ?.focus(),
    );
}

/**
 * Returns the dynamic classes for a tab pill.
 * Handles active, dragging, drop-target, and focus-visible states.
 */
function tabPillClass(tabId: string) {
    const isActive = activeTabId.value === tabId;
    const isBeingDragged = draggedTabId.value === tabId;
    const isDropTarget = dragOverTabId.value === tabId;

    return [
        // Base layout & shape
        'tab-pill relative flex items-center min-w-35 max-w-55 h-9.5 px-3',
        'cursor-pointer text-xs no-underline rounded-lg',
        'transition-all duration-150 outline-none will-change-[transform,opacity]',
        // Active vs idle background
        isActive
            ? 'bg-(--color-primary)/20 z-10 text-primary font-semibold shadow-sm ring-1 ring-primary/15'
            : 'bg-base-content/15 hover:bg-base-content/30',
        // Being dragged
        isBeingDragged ? 'opacity-40 scale-95 cursor-grabbing' : '',
        // Drop target highlight (only when not the tab being dragged)
        isDropTarget && !isBeingDragged
            ? '!bg-[color-mix(in_srgb,var(--color-primary)_18%,color-mix(in_srgb,var(--color-base-content)_12%,transparent))]'
            : '',
    ];
}
</script>

<template lang="pug">
div(class="flex items-center h-full bg-base-300 shrink-0 select-none" data-tauri-drag-region)
    //- Tab strip — isolate stacking context so z-index of drop-indicator stays local
    div(
        ref="tabStripRef"
        class="relative flex items-center h-full gap-2 overflow-hidden isolate [-webkit-app-region:no-drag]"
        role="tablist"
        aria-label="Open folders"
        @dragover="handleDragOver"
        @drop="handleDrop"
        @dragleave="handleDragLeave"
    )
        //- Drop position indicator bar
        span(
            class="absolute left-0 top-1.75 bottom-1.75 z-30 w-0.75 rounded-full bg-(--color-primary) pointer-events-none transition-[transform,opacity] duration-120 ease-out shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-primary)_35%,transparent),0_0_16px_color-mix(in_srgb,var(--color-primary)_55%,transparent)]"
            :style="dropIndicatorStyle"
            aria-hidden="true"
        )

        transition-group(name="tab-list" tag="div" class="flex items-center h-full gap-2")
            RouterLink(
                v-for="tab in store.windowTabs"
                :key="tab.id"
                :data-tab-id="tab.id"
                :to="{ path: resolveAppRoutePath(tab.path), query: { tab: tab.id } }"
                :class="tabPillClass(tab.id)"
                role="tab"
                :aria-selected="activeTabId === tab.id"
                :aria-grabbed="draggedTabId === tab.id"
                draggable="true"
                title="Drag to reorder · Alt+Left/Right to move"
                @click="store.setActiveTab(tab.id)"
                @dragstart="handleDragStart(tab.id, $event)"
                @dragend="handleDragEnd"
                @keydown="handleTabKeydown(tab.id, $event)"
            )
                div(class="flex items-center justify-center gap-x-2 w-full overflow-hidden pointer-events-none")
                    FolderIcon(:color="'var(--color-primary)'" :size="18" class="pb-1 shrink-0")
                    span(class="flex-1 overflow-hidden text-ellipsis whitespace-nowrap font-normal") {{ tab.label }}
                //- Close button — only visible when more than one tab is open
                button(
                    v-if="store.windowTabs.length > 1"
                    class="tab-close-btn flex items-center justify-center w-5 h-5 ml-2 rounded-md bg-base-100/80 border-none cursor-pointer text-base-content text-[12px] hover:text-error hover:bg-error/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error/40 [-webkit-app-region:no-drag]"
                    title="Close tab"
                    @click.prevent="handleCloseTab(tab.id)"
                    @dragstart.prevent
                )
                    IconClose

    //- New tab button
    button(
        class="flex items-center justify-center w-7 h-7 ml-1.5 rounded-md border-none cursor-pointer text-lg bg-base-content/10 hover:bg-(--color-primary)/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 [-webkit-app-region:no-drag]"
        title="New tab"
        @click="handleNewTab"
    )
        IconAdd

    div(class="flex-1 [-webkit-app-region:drag]" data-tauri-drag-region)
</template>

<style>
/*
 * Tab transition animations for <transition-group name="tab-list">.
 * These cannot be expressed as Tailwind utility classes — everything else
 * has been moved to inline classes above.
 */
.tab-list-move,
.tab-list-enter-active,
.tab-list-leave-active {
    transition:
        transform 180ms cubic-bezier(0.22, 1, 0.36, 1),
        opacity 140ms ease;
}

.tab-list-enter-from,
.tab-list-leave-to {
    opacity: 0;
    transform: translateY(4px) scale(0.96);
}

.tab-list-leave-active {
    position: absolute;
}

/* focus-visible ring on tab pills — expressed here because Tailwind's
   focus-visible: variant doesn't support box-shadow with CSS variables directly */
.tab-pill:focus-visible {
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-primary) 45%, transparent);
}
</style>