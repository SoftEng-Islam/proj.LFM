<script setup lang="ts">
import type { Component } from "vue";
import IconTerminal from "~icons/material-symbols/terminal";
import IconArticle from "~icons/material-symbols/article";
import IconGitBranch from "~icons/material-symbols/alt-route";
import IconPendingActions from "~icons/material-symbols/pending-actions";
import type { StatusTab } from "../useStatusBar";

const props = defineProps<{ activeTab: StatusTab | null }>();
const emit = defineEmits<{ (event: "toggleTab", tab: StatusTab): void }>();

const statusActions: Array<{ tab: StatusTab; label: string; title: string; icon: Component }> = [
    { tab: "terminal", label: "Terminal", title: "Toggle terminal panel", icon: IconTerminal },
    { tab: "log", label: "Logs", title: "Toggle logs panel", icon: IconArticle },
    { tab: "git", label: "Git", title: "Toggle git panel", icon: IconGitBranch },
    { tab: "tasks", label: "Tasks", title: "Toggle running tasks panel", icon: IconPendingActions },
];

function handleToggle(tab: StatusTab) {
    emit("toggleTab", tab);
}
</script>

<template lang="pug">
div(class="flex items-center gap-0")
	button(
		v-for="action in statusActions"
		:key="action.tab"
		class="LFM-status-button"
		type="button"
		:class="{ active: props.activeTab === action.tab }"
		:aria-label="action.title"
		:aria-pressed="props.activeTab === action.tab"
		:title="action.title"
		@click="handleToggle(action.tab)"
	)
		component(:is="action.icon" class="w-4 h-4")
		span(class="hidden sm:inline") {{ action.label }}
</template>

<style scoped>
@reference "tailwindcss";

.LFM-status-button {
    @apply inline-flex items-center justify-center gap-1.5 px-2 py-1 text-slate-400 transition hover:text-slate-100 hover:bg-slate-700/50;
}

.LFM-status-button.active {
    @apply bg-slate-700/60 text-slate-100 border-b-2 border-blue-400;
}
</style>
