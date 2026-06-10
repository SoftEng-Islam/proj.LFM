<script setup lang="ts">
import { computed } from "vue";
import { useFileManagerStore } from "@/stores/file-manager";

const store = useFileManagerStore();
const itemCount = computed(() => store.currentEntries.length);
const selectedCount = computed(() => store.selectedItems.length);
const selectedLabel = computed(() => {
    if (selectedCount.value === 0) return "";
    return `${selectedCount.value} ${selectedCount.value === 1 ? "item" : "items"} selected`;
});
</script>

<template lang="pug">
div(class="flex items-center gap-3 px-3 py-1 text-xs text-slate-400")
	span {{ itemCount }} items
	template(v-if="selectedLabel")
		span(class="text-slate-500") •
		span(class="text-slate-300") {{ selectedLabel }}
</template>
