<script setup lang="ts">
/**
 * FileIcon Component
 * Dynamically resolves and renders file icons.
 * If the file type is unknown (resolves to 'default'), it renders the inline vector SVG.
 */
import { computed, ref, watchEffect } from 'vue';
import { resolveFileIconName, resolveFileIconUrl } from '@/utils/file-icon-associations';

interface Props {
	name: string;
	path?: string;
	size?: number | string;
}

const props = withDefaults(defineProps<Props>(), {
	size: 48,
});

const iconName = computed(() => resolveFileIconName({ fileName: props.name, filePath: props.path }));
const iconUrl = ref('');

watchEffect(async (onCleanup) => {
	let isCurrent = true;
	onCleanup(() => {
		isCurrent = false;
	});

	if (iconName.value === 'default') {
		if (isCurrent) iconUrl.value = '';
		return;
	}

	const resolvedUrl = await resolveFileIconUrl({ fileName: props.name, filePath: props.path });
	if (isCurrent) iconUrl.value = resolvedUrl;
});
</script>

<template lang="pug">
img.LFM-file-icon(
	v-if="iconUrl"
	:src="iconUrl"
	:width="size"
	:height="size"
	:alt="`${iconName} file icon`"
	loading="lazy"
	decoding="async"
)
svg.LFM-file-icon.LFM-file-icon--fallback(
	v-else
	:width="size"
	:height="size"
	viewBox="0 0 56 56"
	fill="none"
	xmlns="http://www.w3.org/2000/svg"
	aria-label="file icon"
)
	path(fill="#e9e9e0" d="M36.985 0H7.963C7.155 0 6.5.655 6.5 1.926V55c0 .345.655 1 1.463 1h40.074c.808 0 1.463-.655 1.463-1V12.978c0-.696-.093-.92-.257-1.085L37.607.257C37.442.093 37.218 0 36.985 0Z")
	path(fill="#d9d7ca" d="M37.5.151V12h11.849L37.5.151Z")
	path(stroke="#c8bdb8" stroke-width="2" stroke-linecap="round" d="M13 22h6M13 27h12M13 32h30M13 37h18M36 37h7")
</template>

<style scoped>
.LFM-file-icon {
  display: inline-block;
  vertical-align: middle;
  transition: transform 0.2s ease-in-out, filter 0.2s ease-in-out;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}
.LFM-file-icon:hover {
  transform: scale(1.05);
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
}

.LFM-file-icon--fallback {
  color: #c8bdb8;
}
</style>
