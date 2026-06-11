<script setup lang="ts">
import { type Component } from 'vue';

const props = withDefaults(defineProps<{
  to: string;
  active?: boolean;
  label: string;
  meta: string;
  icon?: Component;
  iconClass?: string;
}>(), {
  active: false,
  iconClass: 'text-slate-500',
});
</script>

<template lang="pug">
RouterLink(
  class="LFM-sbar-item LFM-sbar-item--drive h-12 flex items-center justify-center"
  :to="to"
  :class="{ 'LFM-sbar-item--active': active }"
)
  span(class="LFM-sbar-icon h-full")
    slot(name="icon")
      component.LFM-material-drive-icon(
        v-if="icon"
        :is="icon"
        :class="iconClass"
        aria-hidden="true"
      )
  span(class="LFM-sbar-drive-copy h-full")
    span.LFM-sbar-label {{ label }}
    span.LFM-sbar-meta {{ meta }}
</template>

<style scoped>
@reference "tailwindcss";

.LFM-sbar-item {
  @apply relative gap-3 min-h-9 py-0 px-3 rounded-md cursor-pointer text-(--color-base-content) my-0.5 mx-2 bg-(--color-base-300) transition-all duration-150 ease-in-out hover:bg-(--color-base-300)/50;
}

.LFM-sbar-item--active {
  background: color-mix(in srgb, var(--color-primary) 12%, transparent);
  color: var(--color-primary);
  font-weight: 600;
}

.LFM-sbar-item--active::before {
  content: "";
  position: absolute;
  left: -8px;
  top: 6px;
  bottom: 6px;
  width: 4px;
  background: var(--color-primary);
  border-radius: 0 4px 4px 0;
  box-shadow: 0 0 10px var(--color-primary);
}

.LFM-sbar-item--drive {
  align-items: flex-start;
  padding-block: 7px;
}

.LFM-sbar-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 100%;
  flex-shrink: 0;
  font-size: 18px;
}

.LFM-material-drive-icon {
  width: 20px;
  height: 20px;
}

.LFM-sbar-drive-copy {
  @apply grid gap-0.5 min-w-0 flex-1;
}

.LFM-sbar-label {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.LFM-sbar-meta {
  overflow: hidden;
  color: color-mix(in srgb, var(--color-base-content) 60%, transparent);
  font-size: 11px;
  font-weight: 500;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
