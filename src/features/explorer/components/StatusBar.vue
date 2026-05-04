<script setup lang="ts">
import { computed } from 'vue';
import { useFileManagerStore } from '@/stores/file-manager';

const store = useFileManagerStore();

const itemCount = computed(() => store.currentEntries.length);
const selectedCount = computed(() => (store.selectedItem ? 1 : 0));
const selectedLabel = computed(() =>
	selectedCount.value > 0 ? `${selectedCount.value} item selected` : ''
);
</script>

<template>
	<footer class="win-status-bar" role="status" aria-label="Status bar">
		<span class="win-status-count">{{ itemCount }} items</span>
		<template v-if="selectedLabel">
			<span class="win-status-sep">|</span>
			<span class="win-status-selected">{{ selectedLabel }}</span>
		</template>
	</footer>
</template>

<style scoped>
.win-status-bar {
	display: flex;
	align-items: center;
	gap: 8px;
	height: 24px;
	padding: 0 12px;
	background: var(--win-status-bg);
	border-top: 1px solid var(--win-border);
	font-size: 11px;
	color: var(--win-text);
	flex-shrink: 0;
	user-select: none;
}

.win-status-sep {
	opacity: 0.35;
}

.win-status-selected {
	color: var(--win-text);
}
</style>
