<script setup lang="ts">
import { ref, computed, type Component } from 'vue';
import { useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';

import { useFileManagerStore } from '@/stores/file-manager';
import { shouldShowDriveCard } from '@/utils/mount-points';
import type { DriveCard, NavigationGroup } from '@/types/file-manager';

// Subcomponents
import SidebarSectionHeader from './SidebarSectionHeader.vue';
import SidebarNavItem from './SidebarNavItem.vue';
import SidebarDriveItem from './SidebarDriveItem.vue';

// Icons
import IconHome from '~icons/material-symbols/home';
import IconDelete from '~icons/material-symbols/delete';
import FolderIcon from '@/components/VueIcons/Folder/FolderIcon.vue';

import IconHardDrive from '~icons/material-symbols/hard-drive';
import IconHardDisk from '~icons/material-symbols/hard-disk';
import IconSdCard from '~icons/material-symbols/sd-card';
import IconStorage from '~icons/material-symbols/storage';
import IconUsb from '~icons/material-symbols/usb';
import IconHomeStorage from '~icons/material-symbols/home-storage';

import IconCloud from '~icons/material-symbols/cloud';
import IconNetwork from '~icons/material-symbols/network-node';
import IconDns from '~icons/material-symbols/dns';
import IconLabel from '~icons/material-symbols/label';
import IconLinux from '~icons/material-symbols/terminal';

const store = useFileManagerStore();
const { driveCards, navigationGroups, homePath } = storeToRefs(store);
const route = useRoute();

const visibleDrives = computed(() =>
	driveCards.value.filter((drive) => shouldShowDriveCard(drive, store.showMountPoints))
);

// Collapsible section state
const collapsed = ref<Record<string, boolean>>({});
function toggleSection(key: string) {
	collapsed.value[key] = !collapsed.value[key];
}

function normalizeRoutePath(path: string) {
	if (path === '/drives' || path === '/@drives' || path === '/locations' || path === '/@locations') {
		return '/drives';
	}
	if (path === '/settings' || path === '/@settings') {
		return '/settings';
	}
	return path;
}

function isActive(path: string) {
	return normalizeRoutePath(route.path) === normalizeRoutePath(path);
}

type SidebarDriveType = DriveCard['driveType'];

const driveIconComponents: Record<SidebarDriveType, Component> = {
	root: IconHomeStorage,
	internal: IconHardDrive,
	hdd: IconHardDisk,
	ssd: IconStorage,
	usb: IconUsb,
	external: IconHardDrive,
	sdcard: IconSdCard,
	network: IconDns,
	removable: IconUsb,
};

const driveIconClasses: Record<SidebarDriveType, string> = {
	root: 'text-teal-500',
	internal: 'text-slate-500',
	hdd: 'text-amber-600',
	ssd: 'text-emerald-500',
	usb: 'text-blue-500',
	external: 'text-violet-500',
	sdcard: 'text-pink-500',
	network: 'text-cyan-500',
	removable: 'text-blue-500',
};

function getDriveIcon(type: SidebarDriveType): Component {
	return driveIconComponents[type] ?? IconHardDrive;
}

function getDriveIconClass(type: SidebarDriveType): string {
	return driveIconClasses[type] ?? 'text-slate-500';
}

const cloudItems = [
	{ id: 'onedrive', label: 'OneDrive', iconColor: '#0067c0' },
	{ id: 'icloud', label: 'iCloud', iconColor: '#4a90d9' },
	{ id: 'googledrive', label: 'Google Drive', iconColor: '#34a853' },
];
</script>

<template lang="pug">
nav.LFM-sidebar-nav(aria-label="Navigation pane")
	.LFM-sbar-top
		SidebarNavItem(
			:to="homePath"
			:active="isActive(homePath)"
			label="Home"
			:isHomeOrTrash="true"
		)
			template(#icon)
				IconHome.text-blue-500

		SidebarNavItem(
			to="/trash"
			:active="isActive('/trash')"
			label="Trash"
			:isHomeOrTrash="true"
		)
			template(#icon)
				IconDelete.text-rose-500

	.LFM-sbar-section
		SidebarSectionHeader(
			title="Pinned"
			:isCollapsed="!!collapsed['pinned']"
			@toggle="toggleSection('pinned')"
		)

		template(v-if="!collapsed['pinned']")
			SidebarNavItem(
				v-for="item in navigationGroups.flatMap((g: NavigationGroup) => g.items).filter(i => i.id !== 'home' && i.id !== 'trash')"
				:key="item.id"
				:to="item.path"
				:active="isActive(item.path)"
				:label="item.label"
				:showPin="true"
			)
				template(#icon)
					FolderIcon(:color="'orange'")

	.LFM-sbar-section(class="flex flex-col gap-2")
		SidebarSectionHeader(
			title="Drives"
			:isCollapsed="!!collapsed['drives']"
			@toggle="toggleSection('drives')"
		)

		SidebarDriveItem(
			to="/@locations"
			:active="isActive('/@locations')"
			label="Locations"
			meta="View all mounted drives"
		)
			template(#icon)
				IconStorage

		template(v-if="!collapsed['drives']")
			SidebarDriveItem(
				v-for="drive in visibleDrives"
				:key="drive.id"
				:to="drive.id"
				:active="isActive(drive.id)"
				:label="drive.label"
				:meta="`${drive.deviceLabel} - ${drive.capacityLabel}`"
				:icon="getDriveIcon(drive.driveType)"
				:iconClass="getDriveIconClass(drive.driveType)"
			)

	.LFM-sbar-section
		SidebarSectionHeader(
			title="Cloud Storage"
			:isCollapsed="!!collapsed['cloud']"
			@toggle="toggleSection('cloud')"
		)

		template(v-if="!collapsed['cloud']")
			SidebarNavItem(
				v-for="cloud in cloudItems"
				:key="cloud.id"
				:label="cloud.label"
			)
				template(#icon)
					IconCloud(:style="{ color: cloud.iconColor }")

	.LFM-sbar-section
		SidebarSectionHeader(
			title="Network"
			:isCollapsed="!!collapsed['network']"
			:icon="IconNetwork"
			@toggle="toggleSection('network')"
		)

	.LFM-sbar-section
		SidebarSectionHeader(
			title="Linux Containers"
			:isCollapsed="!!collapsed['wsl']"
			:icon="IconLinux"
			@toggle="toggleSection('wsl')"
		)

	.LFM-sbar-section
		SidebarSectionHeader(
			title="Tags"
			:isCollapsed="!!collapsed['tags']"
			:icon="IconLabel"
			@toggle="toggleSection('tags')"
		)
</template>

<style scoped>
@reference "tailwindcss";

.LFM-sidebar-nav {
	display: flex;
	flex-direction: column;
	height: 90%;
	padding: 8px 0;
	font-size: 13px;
	color: var(--color-base-content);
	overflow-y: auto;
	overflow-x: hidden;
}

.LFM-sbar-top {
	padding-bottom: 8px;
	border-bottom: 1px solid color-mix(in srgb, var(--color-base-content) 10%, transparent);
	margin-bottom: 8px;
}

.LFM-sbar-section {
	margin-top: 8px;
}
</style>
