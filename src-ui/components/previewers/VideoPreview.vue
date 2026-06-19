<script setup lang="ts">
import IconVideo from '~icons/material-symbols/videocam';

interface Props {
	path: string;
	thumbnail?: string;
}

defineProps<Props>();
</script>

<template lang="pug">
div(class="w-full h-full min-h-65 overflow-hidden rounded-lg bg-black/20")
	img(v-if="thumbnail" class="h-full w-full object-cover" :src="thumbnail" alt="")
	div(v-else class="flex h-full min-h-65 w-full items-center justify-center text-white/35")
		IconVideo(class="text-7xl")
</template>
