<script setup lang="ts">
/**
 * PermissionsSection — Section 4 of the Preview Pane.
 *
 * Displays and allows editing of Unix file permissions for the selected item.
 * Reads initial values from the store's `selectedItemPermissions`.
 * All bit-manipulation logic is delegated to `FileInfoService`.
 */
import { ref, watch } from 'vue';


import { FileInfoService } from '@/services/FileInfoService';
import type { FilePermissions } from '@/types/file-manager';

const props = defineProps<{
	permissions?: FilePermissions | null;
}>();

const toast = { success: console.log, error: console.error, info: console.log, warning: console.warn };

// ── Reactive permission state ───────────────────────────────────────────────

const octal = ref('755');
const ownerRead = ref(true);
const ownerWrite = ref(true);
const ownerExecute = ref(true);
const groupRead = ref(true);
const groupWrite = ref(false);
const groupExecute = ref(true);
const otherRead = ref(true);
const otherWrite = ref(false);
const otherExecute = ref(true);

// ── Helpers ─────────────────────────────────────────────────────────────────

function applyMode(mode: number) {
	const parsed = FileInfoService.parseMode(mode);
	octal.value = parsed.octal;
	ownerRead.value = parsed.owner.read;
	ownerWrite.value = parsed.owner.write;
	ownerExecute.value = parsed.owner.execute;
	groupRead.value = parsed.group.read;
	groupWrite.value = parsed.group.write;
	groupExecute.value = parsed.group.execute;
	otherRead.value = parsed.other.read;
	otherWrite.value = parsed.other.write;
	otherExecute.value = parsed.other.execute;
}

function updateOctal() {
	const mode = FileInfoService.buildMode(
		ownerRead.value,
		ownerWrite.value,
		ownerExecute.value,
		groupRead.value,
		groupWrite.value,
		groupExecute.value,
		otherRead.value,
		otherWrite.value,
		otherExecute.value
	);
	octal.value = mode.toString(8).padStart(3, '0');
}

function handleOctalInput(e: Event) {
	const value = (e.target as HTMLInputElement).value;
	octal.value = value;
	const parsed = FileInfoService.parseOctalString(value);
	if (!parsed) return;
	ownerRead.value = parsed.owner.read;
	ownerWrite.value = parsed.owner.write;
	ownerExecute.value = parsed.owner.execute;
	groupRead.value = parsed.group.read;
	groupWrite.value = parsed.group.write;
	groupExecute.value = parsed.group.execute;
	otherRead.value = parsed.other.read;
	otherWrite.value = parsed.other.write;
	otherExecute.value = parsed.other.execute;
}

function handleReset() {
	applyMode(props.permissions?.mode ?? 0o755);
}

function handleApply() {
	toast.success('Permissions applied');
}

// ── Sync from store ─────────────────────────────────────────────────────────

watch(
	() => props.permissions,
	(perms) => {
		if (perms) applyMode(perms.mode);
	},
	{ immediate: true }
);
</script>

<template lang="pug">
section.LFM-preview-section
	div(class="flex items-center justify-between mb-4")
		h4.LFM-section-title Permissions
		div(class="flex items-center gap-2")
			span(class="text-[10px] font-bold opacity-40 uppercase") Octal
			input(
				type="text"
				:value="octal"
				@input="handleOctalInput"
				class="input input-xs input-bordered w-14 text-center font-mono bg-white/5 border-white/10"
			)

	.LFM-permissions-grid(class="p-4 rounded-2xl bg-(--color-base-100)/30 border border-white/5 shadow-sm")
		.LFM-perm-header Group
		.LFM-perm-header(class="text-center") R
		.LFM-perm-header(class="text-center") W
		.LFM-perm-header(class="text-center") X

		span Owner
		input(type="checkbox" v-model="ownerRead" @change="updateOctal" class="checkbox checkbox-sm checkbox-primary")
		input(type="checkbox" v-model="ownerWrite" @change="updateOctal" class="checkbox checkbox-sm checkbox-primary")
		input(type="checkbox" v-model="ownerExecute" @change="updateOctal" class="checkbox checkbox-sm checkbox-primary")

		span Group
		input(type="checkbox" v-model="groupRead" @change="updateOctal" class="checkbox checkbox-sm")
		input(type="checkbox" v-model="groupWrite" @change="updateOctal" class="checkbox checkbox-sm")
		input(type="checkbox" v-model="groupExecute" @change="updateOctal" class="checkbox checkbox-sm")

		span Other
		input(type="checkbox" v-model="otherRead" @change="updateOctal" class="checkbox checkbox-sm")
		input(type="checkbox" v-model="otherWrite" @change="updateOctal" class="checkbox checkbox-sm")
		input(type="checkbox" v-model="otherExecute" @change="updateOctal" class="checkbox checkbox-sm")

	div(class="flex justify-end gap-2 mt-4")
		button(@click="handleReset" class="btn btn-xs btn-ghost hover:bg-white/5 rounded-lg") Reset
		button(@click="handleApply" class="btn btn-xs btn-primary rounded-lg px-4") Apply
</template>

<style scoped>
@reference "tailwindcss";

.LFM-preview-section {
	display: flex;
	flex-direction: column;
}

.LFM-section-title {
	font-size: 0.7rem;
	font-weight: 800;
	text-transform: uppercase;
	letter-spacing: 0.1em;
	color: var(--color-base-content);
	opacity: 0.4;
	margin-bottom: 0;
}

.LFM-permissions-grid {
	display: grid;
	grid-template-columns: 2fr 1fr 1fr 1fr;
	align-items: center;
	row-gap: 1rem;
	column-gap: 0.5rem;
	font-size: 0.875rem;
}

.LFM-permissions-grid span {
	font-weight: 600;
	opacity: 0.8;
}

.LFM-permissions-grid input[type=checkbox] {
	justify-self: center;
}

.LFM-perm-header {
	font-size: 0.65rem;
	font-weight: 900;
	opacity: 0.3;
	text-transform: uppercase;
}
</style>
