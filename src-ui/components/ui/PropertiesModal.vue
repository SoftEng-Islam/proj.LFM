<script setup lang="ts">
import type { FileEntry } from '@/types/file-manager';

defineProps<{
	item: FileEntry | null;
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
Teleport(to="body")
	Transition(
		enter-active-class="transition-opacity duration-200 ease-out"
		leave-active-class="transition-opacity duration-200 ease-out"
		enter-from-class="opacity-0"
		leave-to-class="opacity-0"
	)
		div(v-if="show" class="fixed inset-0 z-10000 bg-black/40 backdrop-blur-xs flex items-center justify-center" @click.self="emit('close')")
			div(
				class="bg-base-100 border border-base-content/10 rounded-xl w-90 p-5 shadow-[0_20px_40px_rgba(0,0,0,0.5)]"
				v-motion
				:initial="{ opacity: 0, scale: 0.9, y: 20 }"
				:enter="{ opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 25 } }"
				:leave="{ opacity: 0, scale: 0.9, y: 20 }"
			)
				div(class="flex justify-between items-center mb-5")
					h3(class="text-base font-semibold text-base-content m-0") Properties
					button(class="bg-transparent border-none text-base-content text-2xl cursor-pointer opacity-50 hover:opacity-100 transition-opacity" @click="emit('close')") ×

				div(class="mb-5")
					div(class="flex mb-3 gap-3")
						span(class="w-20 text-base-content/60 text-[13px]") Name:
						span(class="flex-1 text-base-content text-[13px] break-all") {{ item?.name }}
					div(class="flex mb-3 gap-3")
						span(class="w-20 text-base-content/60 text-[13px]") Type:
						span(class="flex-1 text-base-content text-[13px] break-all") {{ item?.typeLabel }}
					div(class="flex mb-3 gap-3")
						span(class="w-20 text-base-content/60 text-[13px]") Location:
						span(class="flex-1 text-base-content text-xs opacity-70 break-all") {{ item?.id }}
					div(class="h-px bg-base-content/10 my-4 opacity-50")
					div(class="flex mb-3 gap-3")
						span(class="w-20 text-base-content/60 text-[13px]") Size:
						span(class="flex-1 text-base-content text-[13px] break-all") {{ item?.sizeLabel || 'N/A' }}
					div(class="flex mb-3 gap-3")
						span(class="w-20 text-base-content/60 text-[13px]") Modified:
						span(class="flex-1 text-base-content text-[13px] break-all") {{ formatDate(item?.modifiedAt || '') }}

				div(class="flex justify-end mt-6")
					button(class="px-6 py-2 rounded-md text-[13px] font-medium cursor-pointer transition-all duration-150 border-none bg-primary text-white hover:opacity-90" @click="emit('close')") OK
</template>
