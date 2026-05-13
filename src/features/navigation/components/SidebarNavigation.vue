<script setup lang="ts">
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';

import { useFileManagerStore } from '@/stores/file-manager';
import type { NavigationGroup } from '@/types/file-manager';

// Icons
import IconHome from '~icons/material-symbols/home';
import IconDelete from '~icons/material-symbols/delete';
import IconChevronRight from '~icons/material-symbols/chevron-right';
import IconFolder from '~icons/material-symbols/folder';
import IconPushPin from '~icons/material-symbols/push-pin';
import IconHardDrive from '~icons/material-symbols/hard-drive';
import IconCloud from '~icons/material-symbols/cloud';
import IconNetwork from '~icons/material-symbols/network-node';
import IconLabel from '~icons/material-symbols/label';
import IconSettings from '~icons/material-symbols/settings';
import IconLinux from '~icons/material-symbols/terminal';

const store = useFileManagerStore();
const { driveCards, navigationGroups, currentPath, homePath } = storeToRefs(store);
const route = useRoute();

// Collapsible section state
const collapsed = ref<Record<string, boolean>>({});
function toggleSection(key: string) {
	collapsed.value[key] = !collapsed.value[key];
}

function isActive(path: string) {
	return route.path === path;
}

const cloudItems = [
	{ id: 'onedrive', label: 'OneDrive', iconColor: '#0067c0' },
	{ id: 'icloud', label: 'iCloud', iconColor: '#4a90d9' },
	{ id: 'googledrive', label: 'Google Drive', iconColor: '#34a853' },
];
</script>

<template>
	<nav class="LFM-sidebar-nav" aria-label="Navigation pane">
		<!-- Main Shortcuts -->
		<div class="LFM-sbar-top">
			<RouterLink :to="homePath" class="LFM-sbar-item LFM-sbar-item--home" :class="{ 'LFM-sbar-item--active': isActive(homePath) }">
				<span class="LFM-sbar-icon">
					<IconHome class="text-blue-500" />
				</span>
				<span class="LFM-sbar-label">Home</span>
			</RouterLink>

			<RouterLink to="/trash" class="LFM-sbar-item LFM-sbar-item--trash" :class="{ 'LFM-sbar-item--active': isActive('/trash') }">
				<span class="LFM-sbar-icon">
					<IconDelete class="text-rose-500" />
				</span>
				<span class="LFM-sbar-label">Trash</span>
			</RouterLink>
		</div>

		<!-- Pinned Section -->
		<div class="LFM-sbar-section">
			<button class="LFM-sbar-section-header" :aria-expanded="!collapsed['pinned']" @click="toggleSection('pinned')">
				<IconChevronRight class="LFM-sbar-chevron" :class="{ 'LFM-sbar-chevron--collapsed': collapsed['pinned'] }" />
				<span>Pinned</span>
			</button>

			<template v-if="!collapsed['pinned']">
				<RouterLink v-for="item in navigationGroups.flatMap((g: NavigationGroup) => g.items).filter(i => i.id !== 'home' && i.id !== 'trash')" :key="item.id" :to="item.path" class="LFM-sbar-item" :class="{ 'LFM-sbar-item--active': isActive(item.path) }">
					<span class="LFM-sbar-icon">
						<IconFolder class="text-amber-500" />
					</span>
					<span class="LFM-sbar-label">{{ item.label }}</span>
					<IconPushPin class="LFM-sbar-pin" />
				</RouterLink>
			</template>
		</div>

		<!-- Drives Section -->
		<div class="LFM-sbar-section">
			<button class="LFM-sbar-section-header" :aria-expanded="!collapsed['drives']" @click="toggleSection('drives')">
				<IconChevronRight class="LFM-sbar-chevron" :class="{ 'LFM-sbar-chevron--collapsed': collapsed['drives'] }" />
				<span>Drives</span>
			</button>
			<template v-if="!collapsed['drives']">
				<RouterLink v-for="drive in driveCards" :key="drive.id" :to="drive.id" class="LFM-sbar-item" :class="{ 'LFM-sbar-item--active': isActive(drive.id) }">
					<span class="LFM-sbar-icon">
						<IconHardDrive :class="drive.id === '/' ? 'text-emerald-500' : 'text-slate-500'" />
					</span>
					<span class="LFM-sbar-label">{{ drive.label }}</span>
				</RouterLink>
			</template>
		</div>

		<!-- Cloud Storage Section -->
		<div class="LFM-sbar-section">
			<button class="LFM-sbar-section-header" :aria-expanded="!collapsed['cloud']" @click="toggleSection('cloud')">
				<IconChevronRight class="LFM-sbar-chevron" :class="{ 'LFM-sbar-chevron--collapsed': collapsed['cloud'] }" />
				<span>Cloud Storage</span>
			</button>
			<template v-if="!collapsed['cloud']">
				<div v-for="cloud in cloudItems" :key="cloud.id" class="LFM-sbar-item">
					<span class="LFM-sbar-icon">
						<IconCloud :style="{ color: cloud.iconColor }" />
					</span>
					<span class="LFM-sbar-label">{{ cloud.label }}</span>
				</div>
			</template>
		</div>

		<!-- Network Section -->
		<div class="LFM-sbar-section">
			<button class="LFM-sbar-section-header" :aria-expanded="!collapsed['network']" @click="toggleSection('network')">
				<IconChevronRight class="LFM-sbar-chevron" :class="{ 'LFM-sbar-chevron--collapsed': collapsed['network'] }" />
				<IconNetwork class="mr-2 text-xs" />
				<span>Network</span>
			</button>
		</div>

		<!-- WSL/Linux Section -->
		<div class="LFM-sbar-section">
			<button class="LFM-sbar-section-header" :aria-expanded="!collapsed['wsl']" @click="toggleSection('wsl')">
				<IconChevronRight class="LFM-sbar-chevron" :class="{ 'LFM-sbar-chevron--collapsed': collapsed['wsl'] }" />
				<IconLinux class="mr-2 text-xs" />
				<span>Linux Containers</span>
			</button>
		</div>

		<!-- Tags Section -->
		<div class="LFM-sbar-section">
			<button class="LFM-sbar-section-header" :aria-expanded="!collapsed['tags']" @click="toggleSection('tags')">
				<IconChevronRight class="LFM-sbar-chevron" :class="{ 'LFM-sbar-chevron--collapsed': collapsed['tags'] }" />
				<IconLabel class="mr-2 text-xs" />
				<span>Tags</span>
			</button>
		</div>

		<!-- Settings at bottom -->
		<div class="LFM-sbar-settings">
			<button class="LFM-sbar-item LFM-sbar-item--settings">
				<span class="LFM-sbar-icon">
					<IconSettings />
				</span>
				<span class="LFM-sbar-label">Settings</span>
			</button>
		</div>
	</nav>
</template>

<style scoped lang="scss">
@reference "tailwindcss";

.LFM-sidebar-nav {
	display: flex;
	flex-direction: column;
	height: 100%;
	padding: 8px 0;
	font-size: 13px;
	color: var(--LFM-text);
	overflow-y: auto;
	overflow-x: hidden;
}

.LFM-sbar-item {
	display: flex;
	align-items: center;
	gap: 12px;
	height: 36px;
	padding: 0 12px;
	border-radius: 8px;
	cursor: pointer;
	text-decoration: none;
	color: var(--LFM-text);
	transition: all 150ms ease;
	position: relative;
	margin: 1px 8px;

	&:hover {
		background: var(--LFM-hover);
	}

	&--active {
		background: var(--LFM-blue-subtle);
		color: var(--LFM-blue);
		font-weight: 600;

		&::before {
			content: '';
			position: absolute;
			left: -8px;
			top: 6px;
			bottom: 6px;
			width: 4px;
			background: var(--LFM-blue);
			border-radius: 0 4px 4px 0;
			box-shadow: 0 0 10px var(--LFM-blue);
		}
	}

	&--home,
	&--trash {
		margin-bottom: 2px;
		height: 38px;

		.LFM-sbar-icon {
			font-size: 20px;
		}

		.LFM-sbar-label {
			font-size: 14px;
			font-weight: 700;
		}
	}
}

.LFM-sbar-top {
	padding-bottom: 8px;
	border-bottom: 1px solid var(--LFM-border);
	margin-bottom: 8px;
}

.LFM-sbar-icon {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 20px;
	flex-shrink: 0;
	font-size: 18px;
}

.LFM-sbar-label {
	flex: 1;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.LFM-sbar-pin {
	opacity: 0;
	font-size: 14px;
	transition: opacity 150ms;
	color: var(--LFM-text);
}

.LFM-sbar-item:hover .LFM-sbar-pin {
	opacity: 0.4;
}

.LFM-sbar-section {
	margin-top: 8px;
}

.LFM-sbar-section-header {
	display: flex;
	align-items: center;
	gap: 6px;
	width: calc(100% - 16px);
	height: 28px;
	padding: 0 8px;
	background: transparent;
	border: none;
	cursor: pointer;
	color: var(--LFM-text-muted);
	font-size: 11px;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.5px;
	text-align: left;
	transition: all 150ms ease;
	border-radius: 6px;
	margin: 0 8px;

	&:hover {
		background: var(--LFM-hover);
		color: var(--LFM-text);
	}
}

.LFM-sbar-chevron {
	font-size: 14px;
	transition: transform 150ms ease;
	transform: rotate(90deg);

	&--collapsed {
		transform: rotate(0deg);
	}
}

.LFM-sbar-settings {
	margin-top: auto;
	padding-top: 8px;
	border-top: 1px solid var(--LFM-border);
}

.LFM-sbar-item--settings {
	background: transparent;
	border: none;
	width: calc(100% - 16px);
}
</style>
