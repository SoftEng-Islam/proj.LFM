<script setup lang="ts">
import { ref, computed, type Component } from 'vue';
import { useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';

import { useFileManagerStore } from '@/stores/file-manager';


import { shouldShowDriveCard } from '@/utils/mount-points';
import type { DriveCard, NavigationGroup } from '@/types/file-manager';

// Subcomponents
import SidebarSectionHeader from './components/SidebarSectionHeader.vue';
import SidebarNavItem from './components/SidebarNavItem.vue';
import SidebarDriveItem from './components/SidebarDriveItem.vue';

// Icons
import IconHome from '~icons/material-symbols/home';
import IconDelete from '~icons/material-symbols/delete';
import IconRecent from '~icons/material-symbols/history';
import FolderIcon from '@/components/VueIcons/Folder/FolderIcon.vue';
import IconSettings from '~icons/material-symbols/settings';

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
aside(aria-label="Navigation pane" class="w-full h-full flex flex-col shrink-0 py-2 px-0 overflow-hidden bg-(--color-base-200)")
	nav(aria-label="Navigation pane" class="flex flex-col py-2 pb-5 px-0 text-base text-(--color-base-content) overflow-y-auto overflow-x-hidden gap-y-3")
		//- First Section [Home, Trash, Recent]
		div(class="flex flex-col")
			//- Home Link
			SidebarNavItem(
				:to="homePath"
				:active="isActive(homePath)"
				label="Home"
				:isHomeOrTrash="true"
			)
				template(#icon)
					IconHome.text-blue-500
			//- Trash Link
			SidebarNavItem(
				to="/trash"
				:active="isActive('/trash')"
				label="Trash"
				:isHomeOrTrash="true"
			)
				template(#icon)
					IconDelete.text-rose-500
			// TODO Add Recent Link
			SidebarNavItem(
				to="/recent"
				:active="isActive('/recent')"
				label="Recent"
			)
				template(#icon)
					IconRecent(class="text-yellow-500")

		hr(class="border-dashed border-2 border-(--color-base-100)")

		//- Pinned Section
		div(class="")
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

		hr(class="border-dashed border-2 border-(--color-base-100)")

		//- Drives Section
		div(class="flex flex-col gap-2")
			SidebarSectionHeader(
				title="Drives"
				:isCollapsed="!!collapsed['drives']"
				@toggle="toggleSection('drives')"
			)
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

		hr(class="border-dashed border-2 border-(--color-base-100)")

		//- Cloud Storage Section
		div(class="")
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

		hr(class="border-dashed border-2 border-(--color-base-100)")

		//- Network Section
		div(class="")
			SidebarSectionHeader(
				title="Network"
				:isCollapsed="!!collapsed['network']"
				:icon="IconNetwork"
				@toggle="toggleSection('network')"
			)

		hr(class="border-dashed border-2 border-(--color-base-100)")

		//- Linux Containers Section
		div(class="")
			SidebarSectionHeader(
				title="Linux Containers"
				:isCollapsed="!!collapsed['wsl']"
				:icon="IconLinux"
				@toggle="toggleSection('wsl')"
			)

		hr(class="border-dashed border-2 border-(--color-base-100)")

		//- Tags
		div(class="")
			SidebarSectionHeader(
				title="Tags"
				:isCollapsed="!!collapsed['tags']"
				:icon="IconLabel"
				@toggle="toggleSection('tags')"
			)

		div(class="flex flex-col gap-2")
			SidebarDriveItem(
				to="/@locations"
				:active="isActive('/@locations')"
				label="Locations"
				meta="View all mounted drives"
			)
				template(#icon)
					IconStorage

	//- Settings button
	div(class="flex px-2")
		button(
			class="w-full bg-(--color-base-100) text-(--color-base-content) hover:text-(--color-primary) hover:bg-(--color-primary)/20 cursor-pointer flex items-center justify-center gap-x-2 p-3 rounded-md"
			type="button"
			:class="{ 'text-(--color-primary) bg-(--color-primary)/20': store.settingsOpen }"
			@click="store.openSettings"
		)
			span(class="text-lg"): IconSettings
			span(class="text-lg text-nowrap overflow-hidden text-ellipsis") Settings
</template>