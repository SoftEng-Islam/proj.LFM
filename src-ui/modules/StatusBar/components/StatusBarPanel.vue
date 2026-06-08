<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';
import IconClose from '~icons/material-symbols/close';
import IconTerminal from '~icons/material-symbols/terminal';
import IconArticle from '~icons/material-symbols/article';
import IconGitBranch from '~icons/material-symbols/git-branch';
import IconPendingActions from '~icons/material-symbols/pending-actions';
import TerminalTab from './TerminalTab.vue';
import LogTab from './LogTab.vue';
import GitTab from './GitTab.vue';
import TasksTab from './TasksTab.vue';

const props = defineProps<{ activeTab: 'terminal' | 'log' | 'git' | 'tasks'; cwd: string }>();
const emit = defineEmits<{
	(event: 'changeTab', tab: 'terminal' | 'log' | 'git' | 'tasks'): void;
	(event: 'close'): void;
}>();

const tabs = [
	{ id: 'terminal', label: 'Terminal', icon: IconTerminal },
	{ id: 'log', label: 'Logs', icon: IconArticle },
	{ id: 'git', label: 'Git', icon: IconGitBranch },
	{ id: 'tasks', label: 'Tasks', icon: IconPendingActions },
] as const;

function handleTabChange(tab: 'terminal' | 'log' | 'git' | 'tasks') {
	emit('changeTab', tab);
}
</script>

<template>
	<div class="LFM-status-panel absolute inset-x-0 bottom-full z-40 border-t border-base-content/10 bg-base-200 shadow-2xl">
		<div class="flex items-center justify-between border-b border-base-content/10 px-3 py-2">
			<div class="flex items-center gap-1">
				<button v-for="tab in tabs" :key="tab.id" type="button" class="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition hover:bg-base-100" :class="{ 'bg-base-100 shadow-sm': props.activeTab === tab.id }" @click="handleTabChange(tab.id)">
					<span>{{ tab.label }}</span>
				</button>
			</div>

			<button type="button" class="inline-flex h-9 w-9 items-center justify-center rounded-md border border-transparent transition hover:border-base-content/20 hover:bg-base-100" @click="emit('close')" aria-label="Close status panel">
				<IconClose class="w-5 h-5" />
			</button>
		</div>

		<div class="h-[280px] overflow-hidden bg-base-100">
			<div class="h-full overflow-auto p-3">
				<TerminalTab v-if="props.activeTab === 'terminal'" :cwd="props.cwd" />
				<LogTab v-else-if="props.activeTab === 'log'" />
				<GitTab v-else-if="props.activeTab === 'git'" :cwd="props.cwd" />
				<TasksTab v-else-if="props.activeTab === 'tasks'" />
			</div>
		</div>
	</div>
</template>
