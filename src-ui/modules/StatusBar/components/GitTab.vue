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
div(class="flex h-full flex-col gap-3 text-xs text-(--color-base-content)")
	div(class="rounded-md bg-(--color-base-200) p-3")
		div(class="flex items-center justify-between gap-2")
			div
				p(class="font-medium text-(--color-base-content)") Git
				p(class="text-(--color-base-content)/50 text-[11px]") Repository information
			button(class="rounded-md bg-(--color-primary)/50 hover:bg-(--color-primary) cursor-pointer px-2 py-1 text-xs font-medium transition" type="button" @click="refreshStatus" :disabled="loading") Refresh

	div(class="rounded-md bg-(--color-base-200) p-3")
		div(v-if="!gitStatus.is_repo" class="text-(--color-base-content)") No git repository detected.
		div(v-else class="space-y-3")
			div(class="flex items-center justify-between gap-2 rounded-md bg-(--color-base-100) p-2")
				span(class="text-(--color-base-content)/50") Branch
				span(class="font-medium text-(--color-base-content)") {{ gitStatus.branch || 'Unknown' }}

			div(class="grid grid-cols-3 gap-2")
				div(class="rounded-md bg-(--color-base-100) p-2 text-center")
					p(class="text-(--color-base-content)/50") Staged
					p(class="text-(--color-base-content) font-semibold") {{ gitStatus.staged_count }}
				div(class="rounded-md bg-(--color-base-100) p-2 text-center")
					p(class="text-(--color-base-content)/50") Modified
					p(class="text-(--color-base-content) font-semibold") {{ gitStatus.modified_count }}
				div(class="rounded-md bg-(--color-base-100) p-2 text-center")
					p(class="text-(--color-base-content)/50") Untracked
					p(class="text-(--color-base-content) font-semibold") {{ gitStatus.untracked_count }}
</template>
