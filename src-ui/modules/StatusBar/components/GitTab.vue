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
div(class="flex h-full flex-col gap-4 text-sm text-base-content")
	div(class="rounded-md border border-base-content/10 bg-base-100 p-4")
		div(class="flex items-center justify-between gap-3")
			div
				p(class="text-sm font-semibold") Git status
				p(class="text-xs text-base-content/60") Current repository information for the opened directory.
			button(class="rounded-md border border-base-content/10 bg-base-200 px-3 py-2 text-xs font-medium transition hover:bg-base-100" type="button" @click="refreshStatus" :disabled="loading") Refresh

	div(class="rounded-md border border-base-content/10 bg-base-200 p-4")
		div(v-if="!gitStatus.is_repo" class="text-base-content/60") No git repository detected in this directory.
		div(v-else class="space-y-3")
			div(class="flex items-center justify-between gap-3 rounded-md bg-base-100 p-3")
				span(class="text-xs uppercase tracking-[0.18em] text-base-content/50") Branch
				span(class="font-medium") {{ gitStatus.branch || 'Unknown' }}

			div(class="grid grid-cols-3 gap-3")
				div(class="rounded-md bg-base-100 p-3 text-center")
					p(class="text-xs uppercase tracking-[0.12em] text-base-content/50") Staged
					p(class="mt-2 text-lg font-semibold") {{ gitStatus.staged_count }}
				div(class="rounded-md bg-base-100 p-3 text-center")
					p(class="text-xs uppercase tracking-[0.12em] text-base-content/50") Modified
					p(class="mt-2 text-lg font-semibold") {{ gitStatus.modified_count }}
				div(class="rounded-md bg-base-100 p-3 text-center")
					p(class="text-xs uppercase tracking-[0.12em] text-base-content/50") Untracked
					p(class="mt-2 text-lg font-semibold") {{ gitStatus.untracked_count }}
</template>
