<script setup lang="ts">
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';

import { navigationGroups, defaultPath } from '@/features/navigation/navigation';
import { useFileManagerStore } from '@/stores/file-manager';

const store = useFileManagerStore();
const { driveCards } = storeToRefs(store);
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
		<!-- Home -->
		<RouterLink :to="defaultPath" class="LFM-sbar-item LFM-sbar-item--home" :class="{ 'LFM-sbar-item--active': isActive(defaultPath) }">
			<span class="LFM-sbar-icon LFM-sbar-icon--home">
				<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
					<path d="M1.5 7.5L8 2L14.5 7.5V14H10.5V10H5.5V14H1.5V7.5Z" fill="#0067c0" stroke="#0067c0" stroke-width="0.5" stroke-linejoin="round"/>
				</svg>
			</span>
			<span class="LFM-sbar-label">Home</span>
		</RouterLink>

		<!-- Pinned Section -->
		<div class="LFM-sbar-section">
			<button class="LFM-sbar-section-header" :aria-expanded="!collapsed['pinned']" @click="toggleSection('pinned')">
				<span class="LFM-sbar-chevron" :class="{ 'LFM-sbar-chevron--collapsed': collapsed['pinned'] }">›</span>
				<span>Pinned</span>
			</button>

			<template v-if="!collapsed['pinned']">
				<RouterLink
					v-for="item in navigationGroups.flatMap(g => g.items)"
					:key="item.id"
					:to="item.path"
					class="LFM-sbar-item"
					:class="{ 'LFM-sbar-item--active': isActive(item.path) }"
				>
					<span class="LFM-sbar-icon">
						<svg width="16" height="16" viewBox="0 0 64 64" fill="none">
							<rect x="4" y="18" width="56" height="38" rx="4" fill="#E3A416"/>
							<rect x="4" y="24" width="56" height="32" rx="4" fill="#FFC83D"/>
							<path d="M4 22C4 19.8 5.8 18 8 18h12l4 6H4V22z" fill="#E3A416"/>
						</svg>
					</span>
					<span class="LFM-sbar-label">{{ item.label }}</span>
					<span class="LFM-sbar-pin">📌</span>
				</RouterLink>
			</template>
		</div>


		<!-- Drives Section -->
		<div class="LFM-sbar-section">
			<button class="LFM-sbar-section-header" :aria-expanded="!collapsed['drives']" @click="toggleSection('drives')">
				<span class="LFM-sbar-chevron" :class="{ 'LFM-sbar-chevron--collapsed': collapsed['drives'] }">›</span>
				<span>Drives</span>
			</button>
			<template v-if="!collapsed['drives']">
				<RouterLink
					v-for="drive in driveCards"
					:key="drive.id"
					:to="drive.id"
					class="LFM-sbar-item"
					:class="{ 'LFM-sbar-item--active': isActive(drive.id) }"
				>
					<span class="LFM-sbar-icon">
						<svg v-if="drive.id === '/'" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
							<rect x="1.5" y="3.5" width="13" height="9" rx="2" fill="#edf7ed" stroke="#107c10" stroke-width="1.2"/>
							<path d="M6.2 11.2L9.8 4.8" stroke="#107c10" stroke-width="1.4" stroke-linecap="round"/>
							<circle cx="12" cy="8.5" r="1" fill="#107c10"/>
							<rect x="3" y="11" width="3" height="1" rx="0.5" fill="#107c10"/>
						</svg>
						<svg v-else width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
							<rect x="1" y="4" width="14" height="9" rx="2" stroke="#5c5c5c" stroke-width="1.2"/>
							<circle cx="12" cy="8.5" r="1" fill="#5c5c5c"/>
							<rect x="3" y="11" width="4" height="1" rx="0.5" fill="#5c5c5c"/>
						</svg>
					</span>
					<span class="LFM-sbar-label">{{ drive.label }}</span>
				</RouterLink>
			</template>
		</div>

		<!-- Cloud Storage Section -->
		<div class="LFM-sbar-section">
			<button class="LFM-sbar-section-header" :aria-expanded="!collapsed['cloud']" @click="toggleSection('cloud')">
				<span class="LFM-sbar-chevron" :class="{ 'LFM-sbar-chevron--collapsed': collapsed['cloud'] }">›</span>
				<span>Cloud Storage</span>
			</button>
			<template v-if="!collapsed['cloud']">
				<div v-for="cloud in cloudItems" :key="cloud.id" class="LFM-sbar-item">
					<span class="LFM-sbar-icon">
						<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
							<path d="M12 10H4a3 3 0 1 1 .52-5.95A4 4 0 1 1 12 10z" :stroke="cloud.iconColor" stroke-width="1.3" fill="none"/>
						</svg>
					</span>
					<span class="LFM-sbar-label">{{ cloud.label }}</span>
				</div>
			</template>
		</div>

		<!-- Network Section -->
		<div class="LFM-sbar-section">
			<button class="LFM-sbar-section-header" :aria-expanded="!collapsed['network']" @click="toggleSection('network')">
				<span class="LFM-sbar-chevron" :class="{ 'LFM-sbar-chevron--collapsed': collapsed['network'] }">›</span>
				<span>Network</span>
			</button>
		</div>

		<!-- WSL Section -->
		<div class="LFM-sbar-section">
			<button class="LFM-sbar-section-header" :aria-expanded="!collapsed['wsl']" @click="toggleSection('wsl')">
				<span class="LFM-sbar-chevron" :class="{ 'LFM-sbar-chevron--collapsed': collapsed['wsl'] }">›</span>
				<span>WSL</span>
			</button>
		</div>

		<!-- Tags Section -->
		<div class="LFM-sbar-section">
			<button class="LFM-sbar-section-header" :aria-expanded="!collapsed['tags']" @click="toggleSection('tags')">
				<span class="LFM-sbar-chevron" :class="{ 'LFM-sbar-chevron--collapsed': collapsed['tags'] }">›</span>
				<span>Tags</span>
			</button>
		</div>

		<!-- Settings at bottom -->
		<div class="LFM-sbar-settings">
			<button class="LFM-sbar-item LFM-sbar-item--settings">
				<span class="LFM-sbar-icon">
					<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
						<circle cx="8" cy="8" r="2.5" stroke="currentColor" stroke-width="1.3"/>
						<path d="M8 1v2M8 13v2M1 8h2M13 8h2M2.93 2.93l1.41 1.41M11.66 11.66l1.41 1.41M2.93 13.07l1.41-1.41M11.66 4.34l1.41-1.41" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
					</svg>
				</span>
				<span class="LFM-sbar-label">Settings</span>
			</button>
		</div>
	</nav>
</template>

<style scoped>
.LFM-sidebar-nav {
	display: flex;
	flex-direction: column;
	height: 100%;
	padding: 4px 0;
	font-size: 12px;
	color: var(--win-text);
	overflow-y: auto;
	overflow-x: hidden;
}

.LFM-sbar-item {
	display: flex;
	align-items: center;
	gap: 8px;
	height: 32px;
	padding: 0 6px 0 16px;
	border-radius: 4px;
	cursor: pointer;
	text-decoration: none;
	color: var(--win-text);
	transition: background 100ms;
	position: relative;
	margin: 0 4px;
}
.LFM-sbar-item:hover {
	background: var(--win-hover);
}
.LFM-sbar-item--active {
	background: var(--win-selected);
}
.LFM-sbar-item--active::before {
	content: '';
	position: absolute;
	left: 0;
	top: 6px;
	bottom: 6px;
	width: 3px;
	background: var(--win-blue);
	border-radius: 0 2px 2px 0;
}

.LFM-sbar-item--home {
	margin-bottom: 4px;
}

.LFM-sbar-icon {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 16px;
	flex-shrink: 0;
}

.LFM-sbar-icon--home svg path {
	fill: var(--win-blue);
	stroke: var(--win-blue);
}

.LFM-sbar-label {
	flex: 1;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.LFM-sbar-pin {
	opacity: 0;
	font-size: 10px;
	transition: opacity 100ms;
}
.LFM-sbar-item:hover .LFM-sbar-pin {
	opacity: 0.5;
}

.LFM-sbar-section {
	margin-bottom: 2px;
}

.LFM-sbar-section-header {
	display: flex;
	align-items: center;
	gap: 4px;
	width: 100%;
	height: 24px;
	padding: 0 6px 0 8px;
	background: transparent;
	border: none;
	cursor: pointer;
	color: var(--win-text-muted, #5c5c5c);
	font-size: 11px;
	font-weight: 600;
	text-align: left;
	transition: background 100ms;
	border-radius: 4px;
	margin: 0 4px;
	width: calc(100% - 8px);
}
.LFM-sbar-section-header:hover {
	background: var(--win-hover);
	color: var(--win-text);
}

.LFM-sbar-chevron {
	font-size: 14px;
	display: inline-block;
	transform: rotate(90deg);
	transition: transform 150ms;
	line-height: 1;
	flex-shrink: 0;
}
.LFM-sbar-chevron--collapsed {
	transform: rotate(0deg);
}

.LFM-sbar-settings {
	margin-top: auto;
	padding-top: 4px;
	border-top: 1px solid var(--win-border);
}

.LFM-sbar-item--settings {
	background: transparent;
	border: none;
	width: calc(100% - 8px);
	font-size: 12px;
}
</style>
