<script setup lang="ts">
import IconTerminal from '~icons/material-symbols/terminal';
import IconArticle from '~icons/material-symbols/article';
import IconGitBranch from '~icons/material-symbols/alt-route';
import IconPendingActions from '~icons/material-symbols/pending-actions';

const props = defineProps<{ activeTab: 'terminal' | 'log' | 'git' | 'tasks' | '' }>();
const emit = defineEmits<{ (event: 'toggleTab', tab: 'terminal' | 'log' | 'git' | 'tasks'): void }>();

function handleToggle(tab: 'terminal' | 'log' | 'git' | 'tasks') {
	emit('toggleTab', tab);
}
</script>

<template lang="pug">
div(class="flex items-center gap-1")
	button(class="LFM-status-button" type="button" :class="{ 'ring ring-primary/40': props.activeTab === 'terminal' }" @click="handleToggle('terminal')" aria-label="Open terminal panel")
		IconTerminal(class="w-5 h-5")

	button(class="LFM-status-button" type="button" :class="{ 'ring ring-primary/40': props.activeTab === 'log' }" @click="handleToggle('log')" aria-label="Open log panel")
		IconArticle(class="w-5 h-5")

	button(class="LFM-status-button" type="button" :class="{ 'ring ring-primary/40': props.activeTab === 'git' }" @click="handleToggle('git')" aria-label="Open git status panel")
		IconGitBranch(class="w-5 h-5")

	button(class="LFM-status-button" type="button" :class="{ 'ring ring-primary/40': props.activeTab === 'tasks' }" @click="handleToggle('tasks')" aria-label="Open running tasks panel")
		IconPendingActions(class="w-5 h-5")
</template>

<style scoped>
@reference "tailwindcss";

.LFM-status-button {
	@apply inline-flex items-center justify-center rounded-md border border-transparent p-2 text-(--color-base-content) transition hover:border-(--color-base-content)/20 hover:bg-(--color-base-200);
}
</style>
