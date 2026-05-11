<script setup lang="ts">
// So we can enable/disable in cause someone uses Hyprland and don't need these options.
const appButtons = false;
</script>
<template lang="pug">
ul(v-if="appButtons" class="flex gap-2 font-bold")
	li(class="flex items-center justify-center w-5 h-5 rounded-full bg-amber-500") -
	li(class="flex items-center justify-center w-5 h-5 rounded-full bg-green-500") +
	li(class="flex items-center justify-center w-5 h-5 rounded-full bg-red-500") x
</template>
