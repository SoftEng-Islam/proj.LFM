<script setup lang="ts">
import { computed } from 'vue';

import BaseButton from '@/components/ui/BaseButton.vue';
import { useUiStore } from '@/stores/ui';

const ui = useUiStore();

const icon = computed(() => (ui.isDark ? '◐' : '○'));
const label = computed(() => (ui.isDark ? 'Switch to light theme' : 'Switch to dark theme'));
</script>

<template>
	<BaseButton
		v-tooltip="label"
		variant="secondary"
		size="sm"
		class="min-w-[7.5rem] justify-center"
		@click="ui.toggleTheme()"
	>
		<span class="text-base leading-none">{{ icon }}</span>
		<span>{{ ui.themeToggleLabel }}</span>
	</BaseButton>
</template>
