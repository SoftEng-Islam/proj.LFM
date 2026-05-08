<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';

import StatusBar from '@/features/explorer/components/StatusBar.vue';
import PreviewPane from '@/features/explorer/components/PreviewPane.vue';
import SidebarNavigation from '@/features/navigation/components/SidebarNavigation.vue';
import { useFileManagerStore } from '@/stores/file-manager';

const store = useFileManagerStore();
const router = useRouter();

function closeTab(tabId: string) {
    if (store.windowTabs.length <= 1) return;
    const idx = store.windowTabs.findIndex((t) => t.id === tabId);
    if (idx === -1) return;
    const isActive = store.currentPath === store.windowTabs[idx]?.sectionId;
    if (!isActive) return;
    const next = store.windowTabs[idx === 0 ? 1 : idx - 1];
    if (next) router.push(next.path);
}

// Nav history simulation
const canGoBack = computed(() => false);
const canGoForward = computed(() => false);

function goBack() {
    router.go(-1);
}
function goForward() {
    router.go(1);
}
function goUp() {
    const segs = store.breadcrumbs;
    if (segs.length > 1) {
        const up = segs[segs.length - 2]?.path;
        if (up) router.push(up);
    }
}
function refresh() {
    location.reload();
}
</script>

<template>
    <div id="LFM-shell" class="LFM-shell">
        <!-- ─── Tab Strip + Nav Bar ───────────────────────────────────── -->
        <div class="LFM-tab-row" data-tauri-drag-region>
            <!-- Tab strip -->
            <div class="LFM-tab-strip pl-2" role="tablist">
                <RouterLink
                    v-for="tab in store.windowTabs"
                    :key="tab.id"
                    :to="tab.path"
                    class="LFM-tab"
                    :class="{ 'LFM-tab--active': store.currentPath === tab.sectionId }"
                    role="tab"
                    :aria-selected="store.currentPath === tab.sectionId"
                >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" class="LFM-tab-icon">
                        <rect x="1" y="4" width="14" height="10" rx="2" fill="#FFC83D" />
                        <path d="M1 6C1 4.9 1.9 4 3 4h4l2 2H1V6z" fill="#E3A416" />
                    </svg>
                    <span class="LFM-tab-label">{{ tab.label }}</span>
                    <button class="LFM-tab-close" title="Close tab" @click.prevent="closeTab(tab.id)">×</button>
                </RouterLink>
                <button
                    class="LFM-new-tab bg-zinc-500 dark:bg-zinc-500 rounded-full text-white mx-2 w-5 h-5 my-auto flex items-center justify-center border-none outline-none cursor-pointer text-2xl font-bold overflow-hidden"
                    title="New tab"
                    @click="router.push('/')"
                >
                    <svg id="Filled" class="fill-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                        <path d="M17,11H13V7a1,1,0,0,0-2,0v4H7a1,1,0,0,0,0,2h4v4a1,1,0,0,0,2,0V13h4a1,1,0,0,0,0-2Z" />
                    </svg>
                </button>
            </div>

            <!-- Drag region spacer -->
            <div class="LFM-tab-drag" data-tauri-drag-region />
        </div>

        <!-- ─── Navigation Bar ────────────────────────────────────────── -->
        <div class="LFM-nav-bar" aria-label="Navigation">
            <!-- Nav arrows -->
            <button class="LFM-nav-btn" :disabled="!canGoBack" title="Back" @click="goBack">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
            </button>
            <button class="LFM-nav-btn" :disabled="!canGoForward" title="Forward" @click="goForward">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M6 3L11 8L6 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
            </button>
            <button class="LFM-nav-btn" title="Up one level" @click="goUp">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 12V4M4 8L8 4L12 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
            </button>
            <button class="LFM-nav-btn" title="Refresh" @click="refresh">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                        d="M13.5 8A5.5 5.5 0 1 1 8 2.5V1M8 1L11 4M8 1L5 4"
                        stroke="currentColor"
                        stroke-width="1.4"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    />
                </svg>
            </button>

            <!-- Home icon + breadcrumb -->
            <div class="LFM-breadcrumb-bar" role="navigation" aria-label="Breadcrumb">
                <RouterLink to="/" class="LFM-breadcrumb-home" title="Home">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path
                            d="M1.5 7.5L8 2L14.5 7.5V14H10.5V10H5.5V14H1.5V7.5Z"
                            stroke="currentColor"
                            stroke-width="1.4"
                            stroke-linejoin="round"
                            fill="none"
                        />
                    </svg>
                </RouterLink>
                <span class="LFM-breadcrumb-sep">›</span>

                <template v-for="(crumb, i) in store.breadcrumbs" :key="crumb.label">
                    <RouterLink
                        v-if="i < store.breadcrumbs.length - 1 && crumb.path"
                        :to="crumb.path"
                        class="LFM-breadcrumb-crumb LFM-breadcrumb-crumb--link"
                        >{{ crumb.label }}</RouterLink
                    >
                    <span v-else class="LFM-breadcrumb-crumb LFM-breadcrumb-crumb--current">{{ crumb.label }}</span>
                    <span v-if="i < store.breadcrumbs.length - 1" class="LFM-breadcrumb-sep">›</span>
                </template>
            </div>

            <!-- Right side icons: expand, search, details -->
            <div class="LFM-nav-right">
                <button class="LFM-nav-btn" title="Expand address bar">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M2 5H12M2 9H12" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" />
                    </svg>
                </button>
                <button class="LFM-nav-btn" title="Search">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <circle cx="6.5" cy="6.5" r="4" stroke="currentColor" stroke-width="1.4" />
                        <path d="M10 10L14 14" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" />
                    </svg>
                </button>
                <!-- AI Chat Sidebar -->
                <!-- <button
                    class="LFM-nav-btn"
                    :class="{ 'LFM-nav-btn--active': store.chatOpen }"
                    title="AI Chat"
                    @click="store.togglePreviewPane"
                ></button> -->
            </div>
        </div>

        <!-- ─── Body: Sidebar + Content ──────────────────────────────── -->
        <div class="LFM-body">
            <aside class="LFM-sidebar" aria-label="Navigation pane">
                <SidebarNavigation />
            </aside>

            <main id="main-content" class="LFM-content">
                <slot />
            </main>

            <aside v-if="store.previewOpen" class="LFM-preview-sidebar" aria-label="Details pane">
                <PreviewPane />
            </aside>
        </div>

        <!-- ─── Status Bar ────────────────────────────────────────────── -->
        <StatusBar />
    </div>
</template>

<style scoped lang="scss">
@reference "tailwindcss";
.LFM-shell {
    display: flex;
    flex-direction: column;
    height: 100vh;
    overflow: hidden;
    background: var(--LFM-bg);
    color: var(--LFM-text);
    font-size: 12px;
}

/* ── Tab Row ──────────────────────────────────────── */
.LFM-tab-row {
    display: flex;
    align-items: stretch;
    height: 36px;
    background: var(--LFM-title-bar);
    border-bottom: 1px solid var(--LFM-border);
    flex-shrink: 0;
    user-select: none;
}

.LFM-tab-strip {
    display: flex;
    align-items: stretch;
    height: 100%;
    flex-shrink: 0;
    overflow: hidden;
}

.LFM-tab {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 0 10px;
    min-width: 120px;
    max-width: 200px;
    height: 100%;
    cursor: pointer;
    color: var(--LFM-text);
    border-right: 1px solid var(--LFM-border);
    transition: background 100ms;
    font-size: 12px;
    text-decoration: none;
    flex-shrink: 0;
    @apply rounded-t-xl;
}

.LFM-tab:hover {
    background: var(--LFM-hover);
}

.LFM-tab-drag {
    flex: 1;
    -webkit-app-region: drag;
    app-region: drag;
}

.LFM-tab--active {
    background: var(--LFM-panel);
    border-bottom: none;
    position: relative;
}

.LFM-tab--active::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: var(--LFM-blue);
}

.LFM-tab-icon {
    flex-shrink: 0;
}

.LFM-tab-label {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.LFM-tab-close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    border-radius: 4px;
    background: transparent;
    border: none;
    cursor: pointer;
    color: var(--LFM-text);
    font-size: 13px;
    flex-shrink: 0;
    opacity: 0.7;
    transition:
        background 100ms,
        opacity 100ms;
}

.LFM-tab-close:hover {
    background: rgba(196, 43, 28, 0.9);
    color: white;
    opacity: 1;
}

.LFM-title-drag {
    -webkit-app-region: drag;
}

.LFM-window-controls {
    display: flex;
    align-items: stretch;
    height: 100%;
    flex-shrink: 0;
}

.LFM-wctrl {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 46px;
    height: 100%;
    background: transparent;
    border: none;
    cursor: pointer;
    color: var(--LFM-text);
    transition: background 100ms;
}

.LFM-wctrl:hover {
    background: var(--LFM-hover);
}

.LFM-wctrl--close:hover {
    background: #c42b1c;
    color: white;
}

/* ── Navigation Bar ───────────────────────────────── */
.LFM-nav-bar {
    display: flex;
    align-items: center;
    gap: 2px;
    height: 40px;
    padding: 0 6px;
    background: var(--LFM-toolbar);
    border-bottom: 1px solid var(--LFM-border);
    flex-shrink: 0;
}

.LFM-nav-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 28px;
    border-radius: 4px;
    background: transparent;
    border: none;
    cursor: pointer;
    color: var(--LFM-text);
    transition: background 100ms;
    flex-shrink: 0;
}

.LFM-nav-btn:hover {
    background: var(--LFM-hover);
}

.LFM-nav-btn:active {
    background: var(--LFM-active);
}

.LFM-nav-btn:disabled {
    opacity: 0.35;
    cursor: default;
}

.LFM-nav-btn:disabled:hover {
    background: transparent;
}

.LFM-breadcrumb-bar {
    display: flex;
    align-items: center;
    flex: 1;
    height: 28px;
    padding: 0 8px;
    background: var(--LFM-panel);
    border: 1px solid var(--LFM-border);
    border-radius: 4px;
    margin: 0 4px;
    overflow: hidden;
    @apply rounded-full;
}

.LFM-breadcrumb-home {
    display: flex;
    align-items: center;
    color: var(--LFM-blue);
    flex-shrink: 0;
    padding: 0 2px;
    border-radius: 2px;
    transition: background 100ms;
}

.LFM-breadcrumb-home:hover {
    background: var(--LFM-hover);
}

.LFM-breadcrumb-sep {
    color: var(--LFM-text);
    opacity: 0.4;
    margin: 0 3px;
    font-size: 13px;
}

.LFM-breadcrumb-crumb {
    font-size: 12px;
    white-space: nowrap;
}

.LFM-breadcrumb-crumb--link {
    color: var(--LFM-text);
    text-decoration: none;
    padding: 2px 4px;
    border-radius: 2px;
    transition: background 100ms;
}

.LFM-breadcrumb-crumb--link:hover {
    background: var(--LFM-hover);
}

.LFM-breadcrumb-crumb--current {
    color: var(--LFM-text);
    font-weight: 500;
}

.LFM-nav-right {
    display: flex;
    align-items: center;
    gap: 2px;
    flex-shrink: 0;
}

/* ── Body ─────────────────────────────────────────── */
.LFM-body {
    display: flex;
    flex: 1;
    overflow: hidden;
}

.LFM-sidebar {
    width: 220px;
    flex-shrink: 0;
    overflow-y: auto;
    border-right: 1px solid var(--LFM-border);
    background: var(--LFM-sidebar);
}

.LFM-content {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    background: var(--LFM-panel);
}

.LFM-preview-sidebar {
    width: 340px;
    flex-shrink: 0;
    overflow-y: auto;
    border-left: 1px solid var(--LFM-border);
    background: var(--LFM-panel);
}
</style>
