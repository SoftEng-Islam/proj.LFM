<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';
import IconTerminal from '~icons/material-symbols/terminal';
import IconArticle from '~icons/material-symbols/article';
import IconGitBranch from '~icons/material-symbols/git-branch';
import IconPendingActions from '~icons/material-symbols/pending-actions';

const props = defineProps<{ activeTab: 'terminal' | 'log' | 'git' | 'tasks' | '' }>();
const emit = defineEmits<{ (event: 'toggleTab', tab: 'terminal' | 'log' | 'git' | 'tasks'): void }>();

function handleToggle(tab: 'terminal' | 'log' | 'git' | 'tasks') {
	emit('toggleTab', tab);
}
</script>

<template>
	<div class="flex items-center gap-1">
		<button type="button" class="LFM-status-button" :class="{ 'ring ring-primary/40': props.activeTab === 'terminal' }" @click="handleToggle('terminal')" aria-label="Open terminal panel">
			<IconTerminal class="w-5 h-5" />
		</button>

		<button type="button" class="LFM-status-button" :class="{ 'ring ring-primary/40': props.activeTab === 'log' }" @click="handleToggle('log')" aria-label="Open log panel">
			<IconArticle class="w-5 h-5" />
		</button>

		<button type="button" class="LFM-status-button" :class="{ 'ring ring-primary/40': props.activeTab === 'git' }" @click="handleToggle('git')" aria-label="Open git status panel">
			<IconGitBranch class="w-5 h-5" />
		</button>

		<button type="button" class="LFM-status-button" :class="{ 'ring ring-primary/40': props.activeTab === 'tasks' }" @click="handleToggle('tasks')" aria-label="Open running tasks panel">
			<IconPendingActions class="w-5 h-5" />
		</button>
	</div>
</template>

<style scoped>
.LFM-status-button {
	@apply inline-flex items-center justify-center rounded-md border border-transparent p-2 text-base-content transition hover:border-base-content/20 hover:bg-base-200;
}
</style>
