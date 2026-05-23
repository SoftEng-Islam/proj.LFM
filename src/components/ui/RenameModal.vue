<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import type { RenameDialogState, RenamePreview, NumberFormat, RenameOperation } from '@/types/file-manager';

const props = defineProps<{
	state: RenameDialogState;
}>();

const emit = defineEmits<{
	close: [];
	submitSimple: [newName: string];
	submitAdvanced: [renames: Array<{ oldPath: string; newName: string }>];
}>();

// Simple mode state
const simpleName = ref(props.state.simpleName || '');
const simpleInputRef = ref<HTMLInputElement>();

// Advanced mode state
const operation = ref<RenameOperation>('find-replace');
const findText = ref('');
const replaceText = ref('');
const template = ref('[Original file name]');
const numberFormat = ref<NumberFormat>('1');
const numberPosition = ref<'prefix' | 'suffix' | 'custom'>('suffix');
const customNumberPosition = ref(0);
const startNumber = ref(1);

// Computed previews
const previews = computed<RenamePreview[]>(() => {
	if (props.state.mode === 'simple') return [];

	const items = props.state.items;
	const result: RenamePreview[] = [];

	items.forEach((item, index) => {
		let newName = item.currentName;

		if (operation.value === 'find-replace') {
			if (findText.value) {
				newName = newName.replaceAll(findText.value, replaceText.value);
			}
		} else if (operation.value === 'template') {
			const num = startNumber.value + index;
			const formattedNum = formatNumber(num, numberFormat.value);
			let processedTemplate = template.value;

			// Replace [Original file name] placeholder
			processedTemplate = processedTemplate.replace(/\[Original file name\]/gi, item.currentName);

			// Insert number based on position
			if (numberPosition.value === 'prefix') {
				newName = `${formattedNum} ${processedTemplate}`;
			} else if (numberPosition.value === 'suffix') {
				newName = `${processedTemplate} ${formattedNum}`;
			} else if (numberPosition.value === 'custom') {
				const pos = Math.min(Math.max(customNumberPosition.value, 0), processedTemplate.length);
				newName = processedTemplate.slice(0, pos) + formattedNum + processedTemplate.slice(pos);
			}
		}

		result.push({
			originalPath: item.path,
			originalName: item.currentName,
			newName: newName.trim(),
		});
	});

	return result;
});

function formatNumber(num: number, format: NumberFormat): string {
	if (format === '01') return num.toString().padStart(2, '0');
	if (format === '001') return num.toString().padStart(3, '0');
	return num.toString();
}

function handleSimpleSubmit() {
	if (simpleName.value.trim() && simpleName.value !== props.state.items[0]?.currentName) {
		emit('submitSimple', simpleName.value.trim());
	} else {
		emit('close');
	}
}

function handleAdvancedSubmit() {
	const renames = previews.value
		.filter((p) => p.newName !== p.originalName)
		.map((p) => ({ oldPath: p.originalPath, newName: p.newName }));

	if (renames.length > 0) {
		emit('submitAdvanced', renames);
	} else {
		emit('close');
	}
}

onMounted(() => {
	if (props.state.mode === 'simple' && simpleInputRef.value) {
		simpleInputRef.value.focus();
		const currentName = props.state.items[0]?.currentName || '';
		const lastDot = currentName.lastIndexOf('.');
		if (lastDot > 0) {
			simpleInputRef.value.setSelectionRange(0, lastDot);
		} else {
			simpleInputRef.value.select();
		}
	}
});

// Initialize from state when it changes
watch(
	() => props.state,
	(newState) => {
		if (newState.mode === 'simple') {
			simpleName.value = newState.simpleName || newState.items[0]?.currentName || '';
		} else if (newState.advancedConfig) {
			operation.value = newState.advancedConfig.operation;
			findText.value = newState.advancedConfig.findText || '';
			replaceText.value = newState.advancedConfig.replaceText || '';
			template.value = newState.advancedConfig.template || '[Original file name]';
			numberFormat.value = newState.advancedConfig.numberFormat || '1';
			numberPosition.value = newState.advancedConfig.numberPosition || 'suffix';
			customNumberPosition.value = newState.advancedConfig.customNumberPosition || 0;
			startNumber.value = newState.advancedConfig.startNumber || 1;
		}
	},
	{ immediate: true }
);
</script>

<template lang="pug">
Teleport(to="body")
	Transition(
		enter-active-class="transition-opacity duration-200 ease-out"
		leave-active-class="transition-opacity duration-200 ease-out"
		enter-from-class="opacity-0"
		leave-to-class="opacity-0"
	)
		div(class="fixed inset-0 z-[10000] bg-black/40 backdrop-blur-[4px] flex items-center justify-center" v-if="state.visible" @click.self="emit('close')")
			div(
				class="bg-base-100 border border-base-content/10 rounded-xl p-5 shadow-[0_20px_40px_rgba(0,0,0,0.5)]"
				:class="state.mode === 'advanced' ? 'w-[600px] max-h-[80vh] overflow-y-auto' : 'w-[400px]'"
				v-motion
				:initial="{ opacity: 0, scale: 0.9, y: 20 }"
				:enter="{ opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 25 } }"
				:leave="{ opacity: 0, scale: 0.9, y: 20 }"
			)
				h3(class="text-base font-semibold mb-4 color-base-content m-0") {{ state.mode === 'simple' ? 'Rename Item' : `Advanced Rename (${state.items.length} items)` }}

				// Simple mode
				div(class="mb-5" v-if="state.mode === 'simple'")
					input(
						ref="simpleInputRef"
						v-model="simpleName"
						class="w-full bg-base-content/5 border border-base-content/10 rounded-md px-3 py-2 text-base-content text-[14px] outline-none focus:border-primary focus:shadow-[0_0_0_2px_rgba(43,124,211,0.2)]"
						type="text"
						@keydown.enter="handleSimpleSubmit"
						@keydown.esc="emit('close')"
					)

				// Advanced mode
				div(class="mb-5" v-else)
					// Operation selector
					div(class="flex gap-2 mb-4")
						button(
							class="flex-1 px-4 py-2 rounded-md bg-transparent border border-base-content/10 text-base-content text-[13px] font-medium cursor-pointer transition-all duration-150"
							:class="operation === 'find-replace' ? 'bg-primary border-primary text-white hover:opacity-90' : 'hover:bg-base-content/5'"
							@click="operation = 'find-replace'"
						) Find & Replace
						button(
							class="flex-1 px-4 py-2 rounded-md bg-transparent border border-base-content/10 text-base-content text-[13px] font-medium cursor-pointer transition-all duration-150"
							:class="operation === 'template' ? 'bg-primary border-primary text-white hover:opacity-90' : 'hover:bg-base-content/5'"
							@click="operation = 'template'"
						) Template

					// Find and replace
					div(class="flex flex-col gap-4" v-if="operation === 'find-replace'")
						div(class="flex flex-col gap-1.5")
							label(class="text-[12px] font-medium text-base-content opacity-80") Find
							input(class="w-full bg-base-content/5 border border-base-content/10 rounded-md px-3 py-2 text-base-content text-[14px] outline-none focus:border-primary focus:shadow-[0_0_0_2px_rgba(43,124,211,0.2)]" v-model="findText" type="text" placeholder="Text to find")
						div(class="flex flex-col gap-1.5")
							label(class="text-[12px] font-medium text-base-content opacity-80") Replace with
							input(class="w-full bg-base-content/5 border border-base-content/10 rounded-md px-3 py-2 text-base-content text-[14px] outline-none focus:border-primary focus:shadow-[0_0_0_2px_rgba(43,124,211,0.2)]" v-model="replaceText" type="text" placeholder="Replacement text")

					// Template
					div(class="flex flex-col gap-4" v-else)
						div(class="flex flex-col gap-1.5")
							label(class="text-[12px] font-medium text-base-content opacity-80") Template
							input(class="w-full bg-base-content/5 border border-base-content/10 rounded-md px-3 py-2 text-base-content text-[14px] outline-none focus:border-primary focus:shadow-[0_0_0_2px_rgba(43,124,211,0.2)]" v-model="template" type="text" placeholder="[Original file name]")
							small(class="text-[11px] text-base-content/50 mt-0.5") Use [Original file name] as placeholder
						div(class="flex gap-3")
							div(class="flex flex-col gap-1.5 flex-1")
								label(class="text-[12px] font-medium text-base-content opacity-80") Number format
								select(class="w-full bg-base-content/5 border border-base-content/10 rounded-md px-3 py-2 text-base-content text-[14px] outline-none focus:border-primary focus:shadow-[0_0_0_2px_rgba(43,124,211,0.2)]" v-model="numberFormat")
									option(value="1") 1, 2, 3...
									option(value="01") 01, 02, 03...
									option(value="001") 001, 002, 003...
							div(class="flex flex-col gap-1.5 flex-1")
								label(class="text-[12px] font-medium text-base-content opacity-80") Position
								select(class="w-full bg-base-content/5 border border-base-content/10 rounded-md px-3 py-2 text-base-content text-[14px] outline-none focus:border-primary focus:shadow-[0_0_0_2px_rgba(43,124,211,0.2)]" v-model="numberPosition")
									option(value="prefix") Prefix
									option(value="suffix") Suffix
									option(value="custom") Custom
						div(class="flex flex-col gap-1.5" v-if="numberPosition === 'custom'")
							label(class="text-[12px] font-medium text-base-content opacity-80") Custom position (index)
							input(class="w-full bg-base-content/5 border border-base-content/10 rounded-md px-3 py-2 text-base-content text-[14px] outline-none focus:border-primary focus:shadow-[0_0_0_2px_rgba(43,124,211,0.2)]" v-model="customNumberPosition" type="number" min="0")
						div(class="flex flex-col gap-1.5")
							label(class="text-[12px] font-medium text-base-content opacity-80") Start number
							input(class="w-full bg-base-content/5 border border-base-content/10 rounded-md px-3 py-2 text-base-content text-[14px] outline-none focus:border-primary focus:shadow-[0_0_0_2px_rgba(43,124,211,0.2)]" v-model="startNumber" type="number" min="1")

					// Preview
					div(class="mt-5 pt-5 border-t border-base-content/10")
						h4(class="text-[13px] font-semibold mb-3 text-base-content") Preview
						div(class="flex flex-col gap-2 max-h-[200px] overflow-y-auto pr-1")
							div(class="flex items-center gap-3 p-2 rounded-md bg-base-content/5" v-for="preview in previews" :key="preview.originalPath")
								div(class="flex-1 text-[12px] text-base-content overflow-hidden text-ellipsis whitespace-nowrap opacity-60") {{ preview.originalName }}
								div(class="text-base-content/40 text-[14px]") →
								div(class="flex-1 text-[12px] text-base-content overflow-hidden text-ellipsis whitespace-nowrap font-medium" :class="{ 'opacity-40': preview.newName === preview.originalName }") {{ preview.newName }}

				div(class="flex justify-end gap-3 mt-5")
					button(class="px-4 py-2 rounded-md text-[13px] font-medium cursor-pointer transition-all duration-150 border-none bg-transparent text-base-content hover:bg-base-content/5" @click="emit('close')") Cancel
					button(class="px-4 py-2 rounded-md text-[13px] font-medium cursor-pointer transition-all duration-150 border-none bg-primary text-white hover:opacity-90" @click="state.mode === 'simple' ? handleSimpleSubmit() : handleAdvancedSubmit()") Rename
</template>
