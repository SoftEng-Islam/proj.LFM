<script setup lang="ts">
import IconClose from "~icons/material-symbols/close";
import IconTerminal from "~icons/material-symbols/terminal";
import IconArticle from "~icons/material-symbols/article";
import IconGitBranch from "~icons/material-symbols/alt-route";
import IconPendingActions from "~icons/material-symbols/pending-actions";
import TerminalTab from "./TerminalTab.vue";
import LogTab from "./LogTab.vue";
import GitTab from "./GitTab.vue";
import TasksTab from "./TasksTab.vue";
import type { StatusTab } from "../useStatusBar";

const { activeTab, cwd } = defineProps<{ activeTab: StatusTab; cwd: string }>();
const emit = defineEmits<{
	(event: "changeTab", tab: StatusTab): void;
	(event: "close"): void;
}>();

const tabs = [
	{ id: "terminal", label: "Terminal", icon: IconTerminal },
	{ id: "log", label: "Logs", icon: IconArticle },
	{ id: "git", label: "Git", icon: IconGitBranch },
	{ id: "tasks", label: "Tasks", icon: IconPendingActions },
] as const;

function handleTabChange(tab: StatusTab) {
	emit("changeTab", tab);
}
</script>

<template lang="pug">
div(class="LFM-status-panel absolute inset-x-0 bottom-full z-40 bg-slate-900 border-t border-slate-700 shadow-2xl" role="region" aria-label="Panel" @keydown.esc.stop="emit('close')")
	div(class="flex items-center justify-between bg-slate-800 border-b border-slate-700")
		div(class="flex items-center" role="tablist" aria-label="Panel views")
			button(
				v-for="tab in tabs"
				:key="tab.id"
				type="button"
				role="tab"
				class="inline-flex items-center gap-2 px-4 py-3 text-xs font-medium transition border-b-2 whitespace-nowrap text-slate-400 hover:text-slate-200"
				:class="activeTab === tab.id ? 'border-blue-500 text-slate-100 bg-slate-700/30' : 'border-transparent'"
				:aria-selected="activeTab === tab.id"
				@click="handleTabChange(tab.id)"
			)
				component(:is="tab.icon" class="w-4 h-4")
				span {{ tab.label }}

		button(class="inline-flex h-8 w-8 items-center justify-center text-slate-400 hover:text-slate-100 transition mr-2" type="button" @click="emit('close')" aria-label="Close panel")
			IconClose(class="w-4 h-4")

	div(class="h-64 overflow-hidden bg-slate-900")
		div(class="h-full overflow-auto p-4 text-slate-300")
			TerminalTab(v-if="activeTab === 'terminal'" :cwd="cwd")
			LogTab(v-else-if="activeTab === 'log'")
			GitTab(v-else-if="activeTab === 'git'" :cwd="cwd")
			TasksTab(v-else-if="activeTab === 'tasks'")
</template>
