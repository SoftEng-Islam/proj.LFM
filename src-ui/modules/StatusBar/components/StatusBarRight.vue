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
div(class="flex items-center gap-0")
	button(class="LFM-status-button" type="button" :class="{ 'active': props.activeTab === 'terminal' }" @click="handleToggle('terminal')" aria-label="Open terminal panel")
		IconTerminal(class="w-4 h-4")

	button(class="LFM-status-button" type="button" :class="{ 'active': props.activeTab === 'log' }" @click="handleToggle('log')" aria-label="Open log panel")
		IconArticle(class="w-4 h-4")

	button(class="LFM-status-button" type="button" :class="{ 'active': props.activeTab === 'git' }" @click="handleToggle('git')" aria-label="Open git status panel")
		IconGitBranch(class="w-4 h-4")

	button(class="LFM-status-button" type="button" :class="{ 'active': props.activeTab === 'tasks' }" @click="handleToggle('tasks')" aria-label="Open running tasks panel")
		IconPendingActions(class="w-4 h-4")
</template>

<style scoped>
@reference "tailwindcss";

.LFM-status-button {
	@apply inline-flex items-center justify-center px-2 py-1 text-slate-400 transition hover:text-slate-100 hover:bg-slate-700/50;
}

.LFM-status-button.active {
	@apply text-blue-400 border-b-2 border-blue-400;
}
</style>
