<script setup lang="ts">
import IconFile from '~icons/material-symbols/description';

</script>
<template lang="pug">
div(class="flex flex-col items-center justify-center flex-1 h-full text-(--color-base-content) gap-6 py-12 px-6 text-center")
	IconFile(class="text-8xl opacity-20")
	h3(class="text-2xl font-semibold m-0 text-(--color-base-content)/20 text-shadow-2xs") No Selection
	p(class="text-sm m-0 text-(--color-base-content)") Select a file or directory to preview
</template>