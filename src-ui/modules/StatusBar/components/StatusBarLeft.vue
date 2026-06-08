<script setup lang="ts">
import { computed } from 'vue';
import { useFileManagerStore } from '@/stores/file-manager';

const store = useFileManagerStore();
const itemCount = computed(() => store.currentEntries.length);
const selectedCount = computed(() => (store.selectedItem ? 1 : 0));
const selectedLabel = computed(() => (selectedCount.value > 0 ? `${selectedCount.value} item selected` : ''));
</script>

<template lang="pug">
div(class="flex items-center gap-2 text-sm text-base-content")
	span(class="font-medium") {{ itemCount }} items
	template(v-if="selectedLabel")
		span(class="opacity-70") | |
		span {{ selectedLabel }}
</template>
