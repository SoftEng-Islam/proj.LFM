<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Premium Preview Pane — Glassmorphic & Contextual (Modular Refactored)
 *
 * This component acts as the main container for the file preview system.
 * It is split into focused modular sub-components:
 *   1. PreviewCanvas - File / media rendering canvas
 *   2. GeneralInfoSection - Basic properties card
 *   3. MediaInfoSection - Deep ffprobe technical metadata
 *   4. PermissionsSection - Interactive Unix rwx permissions editor
 *
 * Path formatting, date conversions and bitwise math are delegated to the
 * global OOP utility FileInfoService.
 */
import { computed, ref, watch } from 'vue';
import { useToast } from 'vue-toastification';
import { storeToRefs } from 'pinia';

import IconFile from '~icons/material-symbols/description';
import IconEdit from '~icons/material-symbols/edit';

import { useFileManagerStore } from '@/stores/file-manager';

// Sub-components
import PreviewCanvas from './components/PreviewCanvas.vue';
import GeneralInfoSection from './components/GeneralInfoSection.vue';
import MediaInfoSection from './components/MediaInfoSection.vue';
import PermissionsSection from './components/PermissionsSection.vue';

const store = useFileManagerStore();
const { selectedItem, selectedItemMediaInfo, selectedItemPermissions } = storeToRefs(store);
const toast = useToast();

// ── Computed category flags ─────────────────────────────────────────────────

const isVideo = computed(() => selectedItem.value?.category?.toLowerCase() === 'video');
const isAudio = computed(() => selectedItem.value?.category?.toLowerCase() === 'audio');

// ── Renaming logic ──────────────────────────────────────────────────────────

const isEditingName = ref(false);
const editedName = ref('');

function startRenaming() {
	if (!selectedItem.value) return;
	editedName.value = selectedItem.value.name;
	isEditingName.value = true;
}

function cancelRenaming() {
	isEditingName.value = false;
}

async function handleRename() {
	if (!selectedItem.value) return;
	const oldPath = selectedItem.value.id;
	const success = await store.renameItem(oldPath, editedName.value);
	if (success) {
		toast.success('File renamed successfully');
		isEditingName.value = false;
	} else {
		toast.error('Failed to rename file');
	}
}

function resetRename() {
	if (selectedItem.value) editedName.value = selectedItem.value.name;
}

// Watch for selection change to cancel renaming automatically
watch(selectedItem, () => {
	isEditingName.value = false;
});
</script>

<template lang="pug">
div(class="LFM-preview-pane w-full h-full p-5 flex flex-col gap-y-8 overflow-y-auto bg-(--color-base-200)/80 backdrop-blur-xl border-l border-white/5")
	div(v-if="!selectedItem" class="LFM-preview-empty")
		IconFile.LFM-empty-icon
		h3 No Selection
		p Select a file or directory to preview

	div(v-else class="flex flex-col gap-y-8")
		//- Section 1: File Preview & Immersive Canvas
		section.LFM-preview-section
			//- Modular media/fallback canvas
			PreviewCanvas(
				:item="selectedItem"
				@expand="store.setExpandedPreviewId(selectedItem.id)"
			)

			//- Contextual name editor below canvas
			div(class="mt-5 p-5 rounded-2xl bg-(--color-base-100)/40 backdrop-blur-md shadow-lg border border-white/10")
				div(v-if="!isEditingName" @dblclick="startRenaming" class="group flex items-center justify-between cursor-pointer")
					h2(class="text-base font-bold truncate pr-4 text-(--color-base-content)") {{ selectedItem.name }}
					button(@click="startRenaming" class="opacity-0 group-hover:opacity-100 p-2 transition-opacity hover:text-(--color-primary)")
						IconEdit
				div(v-else class="flex flex-col gap-4")
					input(
						type="text"
						v-model="editedName"
						class="input input-bordered bg-(--color-base-100)/60 w-full font-bold focus:ring-2 focus:ring-(--color-primary)/50"
						@keyup.enter="handleRename"
						@keyup.esc="cancelRenaming"
					)
					div(class="flex justify-end gap-2")
						button(class="btn btn-sm rounded-lg btn-success text-white px-4" @click="handleRename") Save
						button(class="btn btn-sm rounded-lg btn-ghost bg-white/5" @click="resetRename") Reset
						button(class="btn btn-sm rounded-lg btn-error text-white px-4" @click="cancelRenaming") Close

		//- Section 2: General Information
		GeneralInfoSection(
			:item="selectedItem"
			:media-info="selectedItemMediaInfo"
		)

		//- Section 3: Advanced Media Information (ffprobe)
		MediaInfoSection(
			v-if="isVideo || isAudio"
			:is-video="isVideo"
			:is-audio="isAudio"
			:media-info="selectedItemMediaInfo"
		)

		//- Section 4: Linux Permissions
		PermissionsSection(
			:permissions="selectedItemPermissions"
		)
</template>

<style scoped lang="sass">
@reference 'tailwindcss'

.LFM-preview-empty
	display: flex
	flex-direction: column
	align-items: center
	justify-content: center
	flex: 1
	height: 100%
	color: hsl(var(--bc) / 0.4)
	gap: 1.5rem
	padding: 3rem 1.5rem
	text-align: center
	.LFM-empty-icon
		font-size: 5rem
		opacity: 0.2
		filter: blur(1px)
	h3
		font-size: 1.25rem
		font-weight: 600
		margin: 0
		color: hsl(var(--bc) / 0.8)
		text-shadow: 0 2px 8px hsl(var(--n) / 0.3)
	p
		font-size: 0.875rem
		margin: 0
		color: hsl(var(--bc) / 0.5)
		line-height: 1.5

.LFM-preview-section
	display: flex
	flex-direction: column
</style>
