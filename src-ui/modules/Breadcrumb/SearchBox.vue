<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useFileManagerStore } from '@/stores/file-manager';
import IconSearch from '~icons/material-symbols/search';

const store = useFileManagerStore();
const searchRef = ref<HTMLInputElement>();

</script>
<template lang="pug">
div(class="bg-base-100 border border-base-content/10 rounded-lg h-8 mx-1 hidden md:flex items-center relative")
	IconSearch(class="ml-2 opacity-50")
	input(ref="searchRef" v-model="store.searchQuery" type="text" placeholder="Search files..." class="bg-transparent border-none outline-none px-2 py-1 w-32 focus:w-64 transition-all duration-300" @keydown.enter="searchRef?.blur()")
</template>