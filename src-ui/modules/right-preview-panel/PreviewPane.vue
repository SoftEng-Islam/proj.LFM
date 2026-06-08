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

import { storeToRefs } from 'pinia';

import IconFile from '~icons/material-symbols/description';
import IconEdit from '~icons/material-symbols/edit';

import { useFileManagerStore } from '@/stores/file-manager';

// Sub-components
import PreviewCanvas from './components/PreviewCanvas.vue';
import GeneralInfoSection from './components/GeneralInfoSection.vue';
import MediaInfoSection from './components/MediaInfoSection.vue';
import PermissionsSection from './components/PermissionsSection.vue';
import PreviewEmpty from './components/PreviewEmpty.vue';
import DrivesPreview from './components/DrivesPreview.vue';

import { useRoute } from 'vue-router';
const route = useRoute();
console.log(route.name);

const store = useFileManagerStore();
const { selectedItem, selectedItemMediaInfo, selectedItemPermissions } = storeToRefs(store);
const toast = { success: console.log, error: console.error, info: console.log, warning: console.warn };

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
div(class="LFM-preview-pane w-full h-full p-5 flex flex-col bg-(--color-base-200)/80 backdrop-blur-xl border-l border-white/5")
	div(v-if="selectedItem && route.name !== 'drives' && selectedItem.name !== ''" class="flex flex-col gap-y-8")
		//- Section 1: File Preview & Immersive Canvas
		section(class="LFM-preview-section flex flex-col gap-y-8")
			//- Modular media/fallback canvas
			PreviewCanvas(
				:item="selectedItem"
				@expand="store.setExpandedPreviewId(selectedItem.id)"
			)

			//- Contextual name editor below canvas
			div(class="rounded-2xl")
				div(v-if="!isEditingName" @dblclick="startRenaming" class="relative group flex items-center justify-between cursor-pointer")
					div(class="p-2 input rounded-xl bg-(--color-base-100)/60 w-full border border-dashed border-(--color-primary)/20 text-base text-wrap text-(--color-base-content)") {{ selectedItem.name }}
					button(@click="startRenaming" class="absolute right-2 group-hover:opacity-100 p-2 transition-opacity hover:text-(--color-primary) hover:bg-(--color-primary)/20 rounded-md cursor-pointer")
						IconEdit
				div(v-else class="flex flex-col gap-4")
					input(
						type="text"
						v-model="editedName"
						class="input rounded-xl bg-(--color-base-100)/60 w-full font-bold border border-dashed border-(--color-primary)/20"
						@keyup.enter="handleRename"
						@keyup.esc="cancelRenaming"
					)
					div(class="flex justify-end gap-2")
						button(class="btn btn-sm rounded-full btn-success text-white text-shadow text-shadow-accent-content px-4" @click="handleRename") Save
						button(class="btn btn-sm rounded-full btn-warning text-white text-shadow text-shadow-accent-content px-4" @click="resetRename") Reset
						button(class="btn btn-sm rounded-full btn-error text-white   text-shadow text-shadow-accent-content px-4" @click="cancelRenaming") Close

		hr(class="text-(--color-base-100)")

		div(class="overflow-y-auto h-full flex flex-col gap-y-8")
			//- Section 2: General Information
			GeneralInfoSection(
				:item="selectedItem"
				:media-info="selectedItemMediaInfo"
			)

			hr(class="text-(--color-base-100)")

			//- Section 3: Advanced Media Information (ffprobe)
			MediaInfoSection(
				v-if="isVideo || isAudio"
				:is-video="isVideo"
				:is-audio="isAudio"
				:media-info="selectedItemMediaInfo"
			)

			hr(v-if="isVideo || isAudio" class="text-(--color-base-100)")

			//- Section 4: Linux Permissions
			PermissionsSection(
				:permissions="selectedItemPermissions"
			)
	//- Drives Preview
	DrivesPreview(v-else-if="route.name == 'drives'")

	//- Preview Empty
	PreviewEmpty(v-else)
</template>