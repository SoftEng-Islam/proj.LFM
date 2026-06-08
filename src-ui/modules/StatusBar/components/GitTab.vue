<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { getGitStatus } from '@/services/tauri-bridge';
import type { GitStatus } from '@/services/tauri-bridge';

const props = defineProps<{ cwd: string }>();
const gitStatus = ref<GitStatus>({
	branch: '',
	is_repo: false,
	modified_count: 0,
	staged_count: 0,
	untracked_count: 0,
});
const loading = ref(false);

async function refreshStatus() {
	loading.value = true;
	try {
		gitStatus.value = await getGitStatus(props.cwd);
	} catch {
		gitStatus.value = {
			branch: '',
			is_repo: false,
			modified_count: 0,
			staged_count: 0,
			untracked_count: 0,
		};
	} finally {
		loading.value = false;
	}
}

onMounted(refreshStatus);
watch(() => props.cwd, refreshStatus);
</script>

<template lang="pug">
div(class="flex h-full flex-col gap-3 text-xs text-slate-300")
	div(class="rounded-md border border-slate-700 bg-slate-800 p-3")
		div(class="flex items-center justify-between gap-2")
			div
				p(class="font-medium text-slate-200") Git
				p(class="text-slate-400 text-[11px]") Repository information
			button(class="rounded-md border border-slate-600 bg-slate-700 hover:bg-slate-600 px-2 py-1 text-xs font-medium transition" type="button" @click="refreshStatus" :disabled="loading") Refresh

	div(class="rounded-md border border-slate-700 bg-slate-950 p-3")
		div(v-if="!gitStatus.is_repo" class="text-slate-500") No git repository detected.
		div(v-else class="space-y-3")
			div(class="flex items-center justify-between gap-2 rounded-md bg-slate-800 p-2")
				span(class="text-slate-500") Branch
				span(class="font-medium text-slate-100") {{ gitStatus.branch || 'Unknown' }}

			div(class="grid grid-cols-3 gap-2")
				div(class="rounded-md bg-slate-800 p-2 text-center")
					p(class="text-slate-500") Staged
					p(class="text-slate-100 font-semibold") {{ gitStatus.staged_count }}
				div(class="rounded-md bg-slate-800 p-2 text-center")
					p(class="text-slate-500") Modified
					p(class="text-slate-100 font-semibold") {{ gitStatus.modified_count }}
				div(class="rounded-md bg-slate-800 p-2 text-center")
					p(class="text-slate-500") Untracked
					p(class="text-slate-100 font-semibold") {{ gitStatus.untracked_count }}
</template>
