<script setup lang="ts">
import { type Component } from 'vue';
import IconChevronRight from '~icons/material-symbols/chevron-right';

defineProps<{
	title: string;
	isCollapsed: boolean;
	icon?: Component;
}>();

defineEmits<{
	(e: 'toggle'): void;
}>();
</script>

<template lang="pug">
button.LFM-sbar-section-header(:aria-expanded="!isCollapsed" @click="$emit('toggle')")
	IconChevronRight.LFM-sbar-chevron(:class="{ 'LFM-sbar-chevron--collapsed': isCollapsed }")
	component.mr-2.text-xs(v-if="icon" :is="icon")
	span {{ title }}
</template>

<style scoped>
@reference "tailwindcss";
.LFM-sbar-section-header {
  display: flex;
  align-items: center;
  gap: 6px;
  width: calc(100% - 16px);
  height: 28px;
  padding: 0 8px;
  background: transparent;
  border: none;
  cursor: pointer;
  color: color-mix(in srgb, var(--color-base-content) 60%, transparent);
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  text-align: left;
  transition: all 150ms ease;
  border-radius: 6px;
  margin: 0 8px;
}
.LFM-sbar-section-header:hover {
  background: color-mix(in srgb, var(--color-base-content) 6%, transparent);
  color: var(--color-base-content);
}

.LFM-sbar-chevron {
  font-size: 14px;
  transition: transform 150ms ease;
  transform: rotate(90deg);
}
.LFM-sbar-chevron--collapsed {
  transform: rotate(0deg);
}
</style>
