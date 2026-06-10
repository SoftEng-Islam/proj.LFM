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
div(class="flex min-w-0 items-center gap-2 overflow-hidden text-xs text-slate-400")
	span(class="shrink-0 rounded bg-slate-700/35 px-1.5 py-0.5 text-slate-300") {{ itemCount }} items
	template(v-if="selectedLabel")
		span(class="text-slate-500") •
		span(class="truncate text-slate-200") {{ selectedLabel }}
</template>
