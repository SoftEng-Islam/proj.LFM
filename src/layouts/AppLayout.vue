<script setup lang="ts">
import StatusBar from '@/features/explorer/components/StatusBar.vue';
import SidebarNavigation from '@/features/navigation/components/SidebarNavigation.vue';
import { useFileManagerStore } from '@/stores/file-manager';
import AppTabStrip from './components/AppTabStrip.vue';
import AppNavigationBar from './components/AppNavigationBar.vue';
import AiChatSidebar from './components/AiChatSidebar.vue';
import PreviewPane from '@/features/explorer/components/PreviewPane.vue';

const store = useFileManagerStore();
</script>

<template>
    <div id="LFM-shell" class="LFM-shell">
        <!-- Tab Strip -->
        <AppTabStrip />

        <!-- Navigation Bar -->
        <AppNavigationBar />

        <!-- Body: Sidebar + Content -->
        <div class="LFM-body">
            <!-- Left Sidebar -->
            <aside class="LFM-sidebar" aria-label="Navigation pane">
                <SidebarNavigation />
            </aside>

            <!-- Main Content Area -->
            <main id="main-content" class="LFM-content">
                <slot />
            </main>

            <!-- Right Sidebars Container -->
            <div class="LFM-right-sidebars">
                <!-- File Details (Preview) Sidebar -->
                <aside v-if="store.detailsOpen" class="LFM-sidebar-panel LFM-details-panel" aria-label="File Details">
                    <PreviewPane />
                </aside>

                <!-- AI Chat Sidebar -->
                <aside v-if="store.aiChatOpen" class="LFM-sidebar-panel LFM-ai-panel" aria-label="AI Chat">
                    <AiChatSidebar />
                </aside>
            </div>
        </div>

        <!-- Status Bar -->
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

.LFM-body {
    display: flex;
    flex: 1;
    overflow: hidden;
}

.LFM-sidebar {
    width: 240px;
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

.LFM-right-sidebars {
    display: flex;
    flex-shrink: 0;
    height: 100%;
}

.LFM-sidebar-panel {
    height: 100%;
    border-left: 1px solid var(--LFM-border);
    background: var(--LFM-panel);
    overflow-y: auto;
}

.LFM-ai-panel {
    width: 320px;
}

.LFM-details-panel {
    width: 360px;
}

@media (max-width: 1200px) {
    .LFM-ai-panel, .LFM-details-panel {
        width: 280px;
    }
}
</style>
