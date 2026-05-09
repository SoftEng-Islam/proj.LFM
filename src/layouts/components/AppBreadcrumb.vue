<script setup lang="ts">
import { useFileManagerStore } from '@/stores/file-manager';
import IconHome from '~icons/material-symbols/home';
import IconChevronRight from '~icons/material-symbols/chevron-right';

const store = useFileManagerStore();
</script>

<template>
    <div class="LFM-breadcrumb-bar" role="navigation" aria-label="Breadcrumb">
        <RouterLink to="/" class="LFM-breadcrumb-home" title="Home">
            <IconHome />
        </RouterLink>
        
        <IconChevronRight class="LFM-breadcrumb-sep" />

        <div class="flex items-center overflow-x-auto no-scrollbar">
            <template v-for="(crumb, i) in store.breadcrumbs" :key="crumb.label">
                <RouterLink
                    v-if="i < store.breadcrumbs.length - 1 && crumb.path"
                    :to="crumb.path"
                    class="LFM-breadcrumb-crumb LFM-breadcrumb-crumb--link"
                >
                    {{ crumb.label }}
                </RouterLink>
                <span v-else class="LFM-breadcrumb-crumb LFM-breadcrumb-crumb--current">
                    {{ crumb.label }}
                </span>
                
                <IconChevronRight v-if="i < store.breadcrumbs.length - 1" class="LFM-breadcrumb-sep" />
            </template>
        </div>
    </div>
</template>

<style scoped lang="scss">
@reference "tailwindcss";
.LFM-breadcrumb-bar {
    display: flex;
    align-items: center;
    flex: 1;
    height: 32px;
    padding: 0 10px;
    background: var(--LFM-panel);
    border: 1px solid var(--LFM-border);
    border-radius: 8px;
    margin: 0 8px;
    overflow: hidden;
    @apply shadow-inner;
}

.LFM-breadcrumb-home {
    display: flex;
    align-items: center;
    color: var(--LFM-blue);
    flex-shrink: 0;
    padding: 4px;
    border-radius: 4px;
    transition: background 150ms;
    font-size: 18px;

    &:hover {
        background: var(--LFM-hover);
    }
}

.LFM-breadcrumb-sep {
    color: var(--LFM-text);
    opacity: 0.3;
    margin: 0 2px;
    font-size: 16px;
    flex-shrink: 0;
}

.LFM-breadcrumb-crumb {
    font-size: 12px;
    white-space: nowrap;
    padding: 2px 6px;
    border-radius: 4px;
    transition: background 150ms;
}

.LFM-breadcrumb-crumb--link {
    color: var(--LFM-text);
    text-decoration: none;

    &:hover {
        background: var(--LFM-hover);
        color: var(--LFM-blue);
    }
}

.LFM-breadcrumb-crumb--current {
    color: var(--LFM-text);
    font-weight: 600;
}

.no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
    &::-webkit-scrollbar {
        display: none;
    }
}
</style>
