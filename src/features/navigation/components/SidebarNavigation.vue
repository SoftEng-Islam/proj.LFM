<script setup lang="ts">
import { ref, type Component } from 'vue';
import { useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';

import { useFileManagerStore } from '@/stores/file-manager';
import type { DriveCard, NavigationGroup } from '@/types/file-manager';

// Icons
import IconHome from '~icons/material-symbols/home';
import IconDelete from '~icons/material-symbols/delete';
import IconChevronRight from '~icons/material-symbols/chevron-right';
import FolderIcon from '@/components/VueIcons/Folder/FolderIcon.vue';
import IconPushPin from '~icons/material-symbols/push-pin';
import IconHardDrive from '~icons/material-symbols/hard-drive';
import IconHardDisk from '~icons/material-symbols/hard-disk';
import IconHomeStorage from '~icons/material-symbols/home-storage';
import IconSdCard from '~icons/material-symbols/sd-card';
import IconStorage from '~icons/material-symbols/storage';
import IconUsb from '~icons/material-symbols/usb';
import IconCloud from '~icons/material-symbols/cloud';
import IconNetwork from '~icons/material-symbols/network-node';
import IconDns from '~icons/material-symbols/dns';
import IconLabel from '~icons/material-symbols/label';
import IconSettings from '~icons/material-symbols/settings';
import IconLinux from '~icons/material-symbols/terminal';

const store = useFileManagerStore();
const { driveCards, navigationGroups, currentPath, homePath, settingsOpen } = storeToRefs(store);
const route = useRoute();

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
		RouterLink.LFM-sbar-item.LFM-sbar-item--home(:to="homePath" :class="{ 'LFM-sbar-item--active': isActive(homePath) }")
			span.LFM-sbar-icon
				IconHome.text-blue-500
			span.LFM-sbar-label Home

		RouterLink.LFM-sbar-item.LFM-sbar-item--trash(to="/trash" :class="{ 'LFM-sbar-item--active': isActive('/trash') }")
			span.LFM-sbar-icon
				IconDelete.text-rose-500
			span.LFM-sbar-label Trash

	.LFM-sbar-section
		button.LFM-sbar-section-header(:aria-expanded="!collapsed['pinned']" @click="toggleSection('pinned')")
			IconChevronRight.LFM-sbar-chevron(:class="{ 'LFM-sbar-chevron--collapsed': collapsed['pinned'] }")
			span Pinned

		template(v-if="!collapsed['pinned']")
			RouterLink.LFM-sbar-item(
				v-for="item in navigationGroups.flatMap((g: NavigationGroup) => g.items).filter(i => i.id !== 'home' && i.id !== 'trash')"
				:key="item.id"
				:to="item.path"
				:class="{ 'LFM-sbar-item--active': isActive(item.path) }"
			)
				span.LFM-sbar-icon
					FolderIcon(:color="'orange'")
				span.LFM-sbar-label {{ item.label }}
				IconPushPin.LFM-sbar-pin

	.LFM-sbar-section
		button.LFM-sbar-section-header(:aria-expanded="!collapsed['drives']" @click="toggleSection('drives')")
			IconChevronRight.LFM-sbar-chevron(:class="{ 'LFM-sbar-chevron--collapsed': collapsed['drives'] }")
			span Drives

		RouterLink.LFM-sbar-item.LFM-sbar-item--locations(to="/@locations" :class="{ 'LFM-sbar-item--active': isActive('/@locations') }")
			span.LFM-sbar-icon
				IconStorage
			span.LFM-sbar-drive-copy
				span.LFM-sbar-label Locations
				span.LFM-sbar-meta View all mounted drives

		template(v-if="!collapsed['drives']")
			RouterLink.LFM-sbar-item.LFM-sbar-item--drive(
				v-for="drive in driveCards"
				:key="drive.id"
				:to="drive.id"
				:class="{ 'LFM-sbar-item--active': isActive(drive.id) }"
			)
				span.LFM-sbar-icon
					component.LFM-material-drive-icon(:is="getDriveIcon(drive.driveType)" :class="getDriveIconClass(drive.driveType)" aria-hidden="true")
				span.LFM-sbar-drive-copy
					span.LFM-sbar-label {{ drive.label }}
					span.LFM-sbar-meta {{ drive.deviceLabel }} - {{ drive.capacityLabel }}

	.LFM-sbar-section
		button.LFM-sbar-section-header(:aria-expanded="!collapsed['cloud']" @click="toggleSection('cloud')")
			IconChevronRight.LFM-sbar-chevron(:class="{ 'LFM-sbar-chevron--collapsed': collapsed['cloud'] }")
			span Cloud Storage

		template(v-if="!collapsed['cloud']")
			.LFM-sbar-item(v-for="cloud in cloudItems" :key="cloud.id")
				span.LFM-sbar-icon
					IconCloud(:style="{ color: cloud.iconColor }")
				span.LFM-sbar-label {{ cloud.label }}

	.LFM-sbar-section
		button.LFM-sbar-section-header(:aria-expanded="!collapsed['network']" @click="toggleSection('network')")
			IconChevronRight.LFM-sbar-chevron(:class="{ 'LFM-sbar-chevron--collapsed': collapsed['network'] }")
			IconNetwork.mr-2.text-xs
			span Network

	.LFM-sbar-section
		button.LFM-sbar-section-header(:aria-expanded="!collapsed['wsl']" @click="toggleSection('wsl')")
			IconChevronRight.LFM-sbar-chevron(:class="{ 'LFM-sbar-chevron--collapsed': collapsed['wsl'] }")
			IconLinux.mr-2.text-xs
			span Linux Containers

	.LFM-sbar-section
		button.LFM-sbar-section-header(:aria-expanded="!collapsed['tags']" @click="toggleSection('tags')")
			IconChevronRight.LFM-sbar-chevron(:class="{ 'LFM-sbar-chevron--collapsed': collapsed['tags'] }")
			IconLabel.mr-2.text-xs
			span Tags

	.LFM-sbar-settings
		button.LFM-sbar-item.LFM-sbar-item--settings(type="button" @click="store.openSettings" :class="{ 'LFM-sbar-item--active': settingsOpen }")
			span.LFM-sbar-icon
				IconSettings
			span.LFM-sbar-label Settings
</template>

<style scoped lang="sass">
@reference "tailwindcss"

.LFM-sidebar-nav
	display: flex
	flex-direction: column
	height: 100%
	padding: 8px 0
	font-size: 13px
	color: var(--LFM-text)
	overflow-y: auto
	overflow-x: hidden

.LFM-sbar-item
	display: flex
	align-items: center
	gap: 12px
	min-height: 36px
	padding: 0 12px
	border-radius: 8px
	cursor: pointer
	text-decoration: none
	color: var(--LFM-text)
	transition: all 150ms ease
	position: relative
	margin: 1px 8px

	&:hover
		background: var(--LFM-hover)

	&--active
		background: var(--LFM-blue-subtle)
		color: var(--LFM-blue)
		font-weight: 600

		&::before
			content: ''
			position: absolute
			left: -8px
			top: 6px
			bottom: 6px
			width: 4px
			background: var(--LFM-blue)
			border-radius: 0 4px 4px 0
			box-shadow: 0 0 10px var(--LFM-blue)

	&--home,
	&--trash
		margin-bottom: 2px
		height: 38px

		.LFM-sbar-icon
			font-size: 20px

		.LFM-sbar-label
			font-size: 14px
			font-weight: 700

.LFM-sbar-item--drive,
.LFM-sbar-item--locations
	align-items: flex-start
	padding-block: 7px

.LFM-sbar-drive-copy
	display: grid
	gap: 2px
	min-width: 0
	flex: 1

.LFM-sbar-item--locations
	margin: 0 8px 4px
	padding-block: 10px

	.LFM-sbar-label
		font-weight: 600

	.LFM-sbar-meta
		color: var(--LFM-text-muted)
		font-size: 11px
		font-weight: 500
		line-height: 1.2
		text-overflow: ellipsis
		white-space: nowrap

.LFM-sbar-meta
	overflow: hidden
	color: var(--LFM-text-muted)
	font-size: 11px
	font-weight: 500
	line-height: 1.2
	text-overflow: ellipsis
	white-space: nowrap

.LFM-sbar-top
	padding-bottom: 8px
	border-bottom: 1px solid var(--LFM-border)
	margin-bottom: 8px

.LFM-sbar-icon
	display: flex
	align-items: center
	justify-content: center
	width: 20px
	flex-shrink: 0
	font-size: 18px

.LFM-material-drive-icon
	width: 20px
	height: 20px

.LFM-sbar-label
	flex: 1
	white-space: nowrap
	overflow: hidden
	text-overflow: ellipsis

.LFM-sbar-pin
	opacity: 0
	font-size: 14px
	transition: opacity 150ms
	color: var(--LFM-text)

.LFM-sbar-item:hover .LFM-sbar-pin
	opacity: 0.4

.LFM-sbar-section
	margin-top: 8px

.LFM-sbar-section-header
	display: flex
	align-items: center
	gap: 6px
	width: calc(100% - 16px)
	height: 28px
	padding: 0 8px
	background: transparent
	border: none
	cursor: pointer
	color: var(--LFM-text-muted)
	font-size: 11px
	font-weight: 700
	text-transform: uppercase
	letter-spacing: 0.5px
	text-align: left
	transition: all 150ms ease
	border-radius: 6px
	margin: 0 8px

	&:hover
		background: var(--LFM-hover)
		color: var(--LFM-text)

.LFM-sbar-chevron
	font-size: 14px
	transition: transform 150ms ease
	transform: rotate(90deg)

	&--collapsed
		transform: rotate(0deg)

.LFM-sbar-settings
	position: sticky
	bottom: 0
	margin-top: auto
	padding-top: 8px
	padding-bottom: 8px
	border-top: 1px solid var(--LFM-border)
	background: var(--LFM-panel)
	z-index: 10

.LFM-sbar-item--settings
	background: transparent
	border: none
	width: calc(100% - 16px)
</style>
