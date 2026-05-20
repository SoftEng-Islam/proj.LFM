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
div.LFM-modal-overlay(v-if="state.visible" @click.self="emit('close')")
	div.LFM-modal(:class="{ 'LFM-modal--advanced': state.mode === 'advanced' }")
		h3.LFM-modal-title {{ state.mode === 'simple' ? 'Rename Item' : `Advanced Rename (${state.items.length} items)` }}

		// Simple mode
		div.LFM-modal-body(v-if="state.mode === 'simple'")
			input(
				ref="simpleInputRef"
				v-model="simpleName"
				class="LFM-modal-input"
				type="text"
				@keydown.enter="handleSimpleSubmit"
				@keydown.esc="emit('close')"
			)

		// Advanced mode
		div.LFM-modal-body(v-else)
			// Operation selector
			div.LFM-rename-tabs
				button.LFM-rename-tab(
					:class="{ 'LFM-rename-tab--active': operation === 'find-replace' }"
					@click="operation = 'find-replace'"
				) Find & Replace
				button.LFM-rename-tab(
					:class="{ 'LFM-rename-tab--active': operation === 'template' }"
					@click="operation = 'template'"
				) Template

			// Find and replace
			div.LFM-rename-section(v-if="operation === 'find-replace'")
				div.LFM-form-group
					label.LFM-form-label Find
					input.LFM-modal-input(v-model="findText" type="text" placeholder="Text to find")
				div.LFM-form-group
					label.LFM-form-label Replace with
					input.LFM-modal-input(v-model="replaceText" type="text" placeholder="Replacement text")

			// Template
			div.LFM-rename-section(v-else)
				div.LFM-form-group
					label.LFM-form-label Template
					input.LFM-modal-input(v-model="template" type="text" placeholder="[Original file name]")
					small.LFM-form-hint Use [Original file name] as placeholder
				div.LFM-form-row
					div.LFM-form-group
						label.LFM-form-label Number format
						select.LFM-modal-select(v-model="numberFormat")
							option(value="1") 1, 2, 3...
							option(value="01") 01, 02, 03...
							option(value="001") 001, 002, 003...
					div.LFM-form-group
						label.LFM-form-label Position
						select.LFM-modal-select(v-model="numberPosition")
							option(value="prefix") Prefix
							option(value="suffix") Suffix
							option(value="custom") Custom
				div.LFM-form-group(v-if="numberPosition === 'custom'")
					label.LFM-form-label Custom position (index)
					input.LFM-modal-input(v-model="customNumberPosition" type="number" min="0")
				div.LFM-form-group
					label.LFM-form-label Start number
					input.LFM-modal-input(v-model="startNumber" type="number" min="1")

			// Preview
			div.LFM-preview-section
				h4.LFM-preview-title Preview
				div.LFM-preview-list
					div.LFM-preview-item(v-for="preview in previews" :key="preview.originalPath")
						div.LFM-preview-name.LFM-preview-name--old {{ preview.originalName }}
						div.LFM-preview-arrow →
						div.LFM-preview-name.LFM-preview-name--new(:class="{ 'LFM-preview-name--unchanged': preview.newName === preview.originalName }") {{ preview.newName }}

		div.LFM-modal-actions
			button.LFM-modal-btn.LFM-modal-btn--secondary(@click="emit('close')") Cancel
			button.LFM-modal-btn.LFM-modal-btn--primary(@click="state.mode === 'simple' ? handleSimpleSubmit() : handleAdvancedSubmit()") Rename
</template>

<style scoped lang="scss">
@reference 'tailwindcss';

.LFM-modal-overlay {
	position: fixed;
	inset: 0;
	z-index: 10000;
	background: rgba(0, 0, 0, 0.4);
	backdrop-filter: blur(4px);
	display: flex;
	align-items: center;
	justify-content: center;
	animation: fade-in 200ms ease-out;
}

.LFM-modal {
	background: var(--color-base-100);
	border: 1px solid color-mix(in srgb, var(--color-base-content) 10%, transparent);
	border-radius: 12px;
	width: 400px;
	padding: 20px;
	box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
	animation: modal-pop 250ms cubic-bezier(0.34, 1.56, 0.64, 1);

	&--advanced {
		width: 600px;
		max-height: 80vh;
		overflow-y: auto;
	}
}

.LFM-modal-title {
	font-size: 16px;
	font-weight: 600;
	margin-bottom: 16px;
	color: var(--color-base-content);
}

.LFM-modal-body {
	margin-bottom: 20px;
}

.LFM-modal-input {
	width: 100%;
	background: color-mix(in srgb, var(--color-base-content) 5%, transparent);
	border: 1px solid color-mix(in srgb, var(--color-base-content) 10%, transparent);
	border-radius: 6px;
	padding: 8px 12px;
	color: var(--color-base-content);
	font-size: 14px;
	outline: none;

	&:focus {
		border-color: var(--color-primary);
		box-shadow: 0 0 0 2px rgba(43, 124, 211, 0.2);
	}
}

.LFM-modal-select {
	width: 100%;
	background: color-mix(in srgb, var(--color-base-content) 5%, transparent);
	border: 1px solid color-mix(in srgb, var(--color-base-content) 10%, transparent);
	border-radius: 6px;
	padding: 8px 12px;
	color: var(--color-base-content);
	font-size: 14px;
	outline: none;

	&:focus {
		border-color: var(--color-primary);
		box-shadow: 0 0 0 2px rgba(43, 124, 211, 0.2);
	}
}

.LFM-rename-tabs {
	display: flex;
	gap: 8px;
	margin-bottom: 16px;
}

.LFM-rename-tab {
	flex: 1;
	padding: 8px 16px;
	border-radius: 6px;
	background: transparent;
	border: 1px solid color-mix(in srgb, var(--color-base-content) 10%, transparent);
	color: var(--color-base-content);
	font-size: 13px;
	font-weight: 500;
	cursor: pointer;
	transition: all 150ms ease;

	&--active {
		background: var(--color-primary);
		border-color: var(--color-primary);
		color: white;
	}

	&:hover:not(.LFM-rename-tab--active) {
		background: color-mix(in srgb, var(--color-base-content) 6%, transparent);
	}
}

.LFM-rename-section {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.LFM-form-group {
	display: flex;
	flex-direction: column;
	gap: 6px;
}

.LFM-form-row {
	display: flex;
	gap: 12px;

	.LFM-form-group {
		flex: 1;
	}
}

.LFM-form-label {
	font-size: 12px;
	font-weight: 500;
	color: var(--color-base-content);
	opacity: 0.8;
}

.LFM-form-hint {
	font-size: 11px;
	color: var(--color-base-content);
	opacity: 0.5;
	margin-top: 2px;
}

.LFM-preview-section {
	margin-top: 20px;
	padding-top: 20px;
	border-top: 1px solid color-mix(in srgb, var(--color-base-content) 10%, transparent);
}

.LFM-preview-title {
	font-size: 13px;
	font-weight: 600;
	margin-bottom: 12px;
	color: var(--color-base-content);
}

.LFM-preview-list {
	display: flex;
	flex-direction: column;
	gap: 8px;
	max-height: 200px;
	overflow-y: auto;
}

.LFM-preview-item {
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 8px;
	border-radius: 6px;
	background: color-mix(in srgb, var(--color-base-content) 6%, transparent);
}

.LFM-preview-name {
	flex: 1;
	font-size: 12px;
	color: var(--color-base-content);
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;

	&--old {
		opacity: 0.6;
	}

	&--new {
		font-weight: 500;

		&--unchanged {
			opacity: 0.4;
		}
	}
}

.LFM-preview-arrow {
	color: var(--color-base-content);
	opacity: 0.4;
	font-size: 14px;
}

.LFM-modal-actions {
	display: flex;
	justify-content: flex-end;
	gap: 12px;
	margin-top: 20px;
}

.LFM-modal-btn {
	padding: 8px 16px;
	border-radius: 6px;
	font-size: 13px;
	font-weight: 500;
	cursor: pointer;
	transition: all 150ms ease;
	border: none;

	&--secondary {
		background: transparent;
		color: var(--color-base-content);

		&:hover {
			background: color-mix(in srgb, var(--color-base-content) 6%, transparent);
		}
	}

	&--primary {
		background: var(--color-primary);
		color: white;

		&:hover {
			opacity: 0.9;
		}
	}
}

@keyframes fade-in {
	from {
		opacity: 0;
	}
	to {
		opacity: 1;
	}
}

@keyframes modal-pop {
	from {
		transform: scale(0.9) translateY(20px);
		opacity: 0;
	}
	to {
		transform: scale(1) translateY(0);
		opacity: 1;
	}
}
</style>
