<script setup lang="ts">
import type { FileEntry } from '@/types/file-manager';

defineProps<{
    item: FileEntry;
    show: boolean;
}>();

const emit = defineEmits<{
    close: [];
}>();

function formatDate(iso: string) {
    return new Date(iso).toLocaleString();
}
</script>

<template lang="pug">
div(v-if="show" class="LFM-modal-overlay" @click.self="emit('close')")
	div(class="LFM-modal")
		div(class="LFM-modal-header")
			h3(class="LFM-modal-title") Properties
			button(class="LFM-modal-close" @click="emit('close')") ×
		
		div(class="LFM-modal-body")
			div(class="LFM-prop-row")
				span(class="LFM-prop-label") Name:
				span(class="LFM-prop-value") {{ item.name }}
			div(class="LFM-prop-row")
				span(class="LFM-prop-label") Type:
				span(class="LFM-prop-value") {{ item.typeLabel }}
			div(class="LFM-prop-row")
				span(class="LFM-prop-label") Location:
				span(class="LFM-prop-value text-xs opacity-70") {{ item.id }}
			div(class="LFM-prop-divider")
			div(class="LFM-prop-row")
				span(class="LFM-prop-label") Size:
				span(class="LFM-prop-value") {{ item.sizeLabel || 'N/A' }}
			div(class="LFM-prop-row")
				span(class="LFM-prop-label") Modified:
				span(class="LFM-prop-value") {{ formatDate(item.modifiedAt) }}
		
		div(class="LFM-modal-actions")
			button(class="LFM-modal-btn LFM-modal-btn--primary" @click="emit('close')") OK
</template>

<style lang="sass" scoped>
@reference "tailwindcss"

.LFM-modal-overlay
  position: fixed
  inset: 0
  z-index: 10000
  background: rgba(0, 0, 0, 0.4)
  backdrop-filter: blur(4px)
  display: flex
  align-items: center
  justify-content: center
  animation: fade-in 200ms ease-out

.LFM-modal
  background: var(--color-base-100)
  border: 1px solid color-mix(in srgb, var(--color-base-content) 10%, transparent)
  border-radius: 12px
  width: 360px
  padding: 20px
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5)
  animation: modal-pop 250ms cubic-bezier(0.34, 1.56, 0.64, 1)

.LFM-modal-header
  display: flex
  justify-content: space-between
  align-items: center
  margin-bottom: 20px

.LFM-modal-title
  font-size: 16px
  font-weight: 600
  color: var(--color-base-content)

.LFM-modal-close
  background: transparent
  border: none
  color: var(--color-base-content)
  font-size: 24px
  cursor: pointer
  opacity: 0.5
  &:hover
    opacity: 1

.LFM-prop-row
  display: flex
  margin-bottom: 12px
  gap: 12px

.LFM-prop-label
  width: 80px
  color: var(--color-base-content)
  opacity: 0.6
  font-size: 13px

.LFM-prop-value
  flex: 1
  color: var(--color-base-content)
  font-size: 13px
  word-break: break-all

.LFM-prop-divider
  height: 1px
  background: color-mix(in srgb, var(--color-base-content) 10%, transparent)
  margin: 16px 0
  opacity: 0.5

.LFM-modal-actions
  display: flex
  justify-content: flex-end
  margin-top: 24px

.LFM-modal-btn
  padding: 8px 24px
  border-radius: 6px
  font-size: 13px
  font-weight: 500
  cursor: pointer
  transition: all 150ms ease
  border: none
  background: var(--color-primary)
  color: white
  &:hover
    opacity: 0.9

@keyframes fade-in
  from
    opacity: 0
  to
    opacity: 1

@keyframes modal-pop
  from
    transform: scale(0.9) translateY(20px)
    opacity: 0
  to
    transform: scale(1) translateY(0)
    opacity: 1
</style>
