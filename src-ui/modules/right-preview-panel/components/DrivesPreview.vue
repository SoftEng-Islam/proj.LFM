<script setup lang="ts">
import IconStorage from '~icons/material-symbols/storage';

</script>
<template lang="pug">
div(class="flex flex-col items-center justify-center flex-1 h-full text-(--color-base-content) gap-6 py-12 px-6 text-center")
	IconStorage(class="text-8xl opacity-20")
	h3(class="text-2xl font-semibold m-0 text-(--color-base-content)/20 text-shadow-2xs") Drives Preview
	p(class="text-sm m-0 text-(--color-base-content)") Select a Drive or Partition to preview
</template>