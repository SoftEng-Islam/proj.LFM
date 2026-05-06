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

// Sidebar sections: Pinned static items matching Win11 screenshot
const pinnedItems = [
	{ id: 'desktop', label: 'Desktop', iconColor: '#0067c0', iconShape: 'desktop' },
	{ id: 'downloads', label: 'Downloads', iconColor: '#0f7f0f', iconShape: 'download' },
	{ id: 'documents', label: 'Documents', iconColor: '#0067c0', iconShape: 'doc' },
	{ id: 'music', label: 'Music', iconColor: '#c50000', iconShape: 'music' },
	{ id: 'trash', label: 'Recycle Bin', iconColor: '#5c5c5c', iconShape: 'trash' },
];

const cloudItems = [
	{ id: 'onedrive', label: 'OneDrive', iconColor: '#0067c0' },
	{ id: 'icloud', label: 'iCloud', iconColor: '#4a90d9' },
	{ id: 'googledrive', label: 'Google Drive', iconColor: '#34a853' },
];
</script>

<template>
	<nav class="win-sidebar-nav" aria-label="Navigation pane">
		<!-- Home -->
		<RouterLink :to="defaultPath" class="win-sbar-item win-sbar-item--home" :class="{ 'win-sbar-item--active': isActive(defaultPath) }">
			<span class="win-sbar-icon win-sbar-icon--home">
				<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
					<path d="M1.5 7.5L8 2L14.5 7.5V14H10.5V10H5.5V14H1.5V7.5Z" fill="#0067c0" stroke="#0067c0" stroke-width="0.5" stroke-linejoin="round"/>
				</svg>
			</span>
			<span class="win-sbar-label">Home</span>
		</RouterLink>

		<!-- Pinned Section -->
		<div class="win-sbar-section">
			<button class="win-sbar-section-header" @click="toggleSection('pinned')" :aria-expanded="!collapsed['pinned']">
				<span class="win-sbar-chevron" :class="{ 'win-sbar-chevron--collapsed': collapsed['pinned'] }">›</span>
				<span>Pinned</span>
			</button>

			<template v-if="!collapsed['pinned']">
				<RouterLink
					v-for="item in navigationGroups.flatMap(g => g.items)"
					:key="item.id"
					:to="item.path"
					class="win-sbar-item"
					:class="{ 'win-sbar-item--active': isActive(item.path) }"
				>
					<span class="win-sbar-icon">
						<svg width="16" height="16" viewBox="0 0 64 64" fill="none">
							<rect x="4" y="18" width="56" height="38" rx="4" fill="#E3A416"/>
							<rect x="4" y="24" width="56" height="32" rx="4" fill="#FFC83D"/>
							<path d="M4 22C4 19.8 5.8 18 8 18h12l4 6H4V22z" fill="#E3A416"/>
						</svg>
					</span>
					<span class="win-sbar-label">{{ item.label }}</span>
					<span class="win-sbar-pin">📌</span>
				</RouterLink>
			</template>
		</div>


		<!-- Drives Section -->
		<div class="win-sbar-section">
			<button class="win-sbar-section-header" @click="toggleSection('drives')" :aria-expanded="!collapsed['drives']">
				<span class="win-sbar-chevron" :class="{ 'win-sbar-chevron--collapsed': collapsed['drives'] }">›</span>
				<span>Drives</span>
			</button>
			<template v-if="!collapsed['drives']">
				<div
					v-for="drive in driveCards"
					:key="drive.id"
					class="win-sbar-item"
				>
					<span class="win-sbar-icon">
						<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
							<rect x="1" y="4" width="14" height="9" rx="2" stroke="#5c5c5c" stroke-width="1.2"/>
							<circle cx="12" cy="8.5" r="1" fill="#5c5c5c"/>
							<rect x="3" y="11" width="4" height="1" rx="0.5" fill="#5c5c5c"/>
						</svg>
					</span>
					<span class="win-sbar-label">{{ drive.label }}</span>
				</div>
			</template>
		</div>

		<!-- Cloud Storage Section -->
		<div class="win-sbar-section">
			<button class="win-sbar-section-header" @click="toggleSection('cloud')" :aria-expanded="!collapsed['cloud']">
				<span class="win-sbar-chevron" :class="{ 'win-sbar-chevron--collapsed': collapsed['cloud'] }">›</span>
				<span>Cloud Storage</span>
			</button>
			<template v-if="!collapsed['cloud']">
				<div v-for="cloud in cloudItems" :key="cloud.id" class="win-sbar-item">
					<span class="win-sbar-icon">
						<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
							<path d="M12 10H4a3 3 0 1 1 .52-5.95A4 4 0 1 1 12 10z" :stroke="cloud.iconColor" stroke-width="1.3" fill="none"/>
						</svg>
					</span>
					<span class="win-sbar-label">{{ cloud.label }}</span>
				</div>
			</template>
		</div>

		<!-- Network Section -->
		<div class="win-sbar-section">
			<button class="win-sbar-section-header" @click="toggleSection('network')" :aria-expanded="!collapsed['network']">
				<span class="win-sbar-chevron" :class="{ 'win-sbar-chevron--collapsed': collapsed['network'] }">›</span>
				<span>Network</span>
			</button>
		</div>

		<!-- WSL Section -->
		<div class="win-sbar-section">
			<button class="win-sbar-section-header" @click="toggleSection('wsl')" :aria-expanded="!collapsed['wsl']">
				<span class="win-sbar-chevron" :class="{ 'win-sbar-chevron--collapsed': collapsed['wsl'] }">›</span>
				<span>WSL</span>
			</button>
		</div>

		<!-- Tags Section -->
		<div class="win-sbar-section">
			<button class="win-sbar-section-header" @click="toggleSection('tags')" :aria-expanded="!collapsed['tags']">
				<span class="win-sbar-chevron" :class="{ 'win-sbar-chevron--collapsed': collapsed['tags'] }">›</span>
				<span>Tags</span>
			</button>
		</div>

		<!-- Settings at bottom -->
		<div class="win-sbar-settings">
			<button class="win-sbar-item win-sbar-item--settings">
				<span class="win-sbar-icon">
					<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
						<circle cx="8" cy="8" r="2.5" stroke="currentColor" stroke-width="1.3"/>
						<path d="M8 1v2M8 13v2M1 8h2M13 8h2M2.93 2.93l1.41 1.41M11.66 11.66l1.41 1.41M2.93 13.07l1.41-1.41M11.66 4.34l1.41-1.41" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
					</svg>
				</span>
				<span class="win-sbar-label">Settings</span>
			</button>
		</div>
	</nav>
</template>

<style scoped>
.win-sidebar-nav {
	display: flex;
	flex-direction: column;
	height: 100%;
	padding: 4px 0;
	font-size: 12px;
	color: var(--win-text);
	overflow-y: auto;
	overflow-x: hidden;
}

.win-sbar-item {
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
.win-sbar-item:hover {
	background: var(--win-hover);
}
.win-sbar-item--active {
	background: var(--win-selected);
}
.win-sbar-item--active::before {
	content: '';
	position: absolute;
	left: 0;
	top: 6px;
	bottom: 6px;
	width: 3px;
	background: var(--win-blue);
	border-radius: 0 2px 2px 0;
}

.win-sbar-item--home {
	margin-bottom: 4px;
}

.win-sbar-icon {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 16px;
	flex-shrink: 0;
}

.win-sbar-icon--home svg path {
	fill: var(--win-blue);
	stroke: var(--win-blue);
}

.win-sbar-label {
	flex: 1;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.win-sbar-pin {
	opacity: 0;
	font-size: 10px;
	transition: opacity 100ms;
}
.win-sbar-item:hover .win-sbar-pin {
	opacity: 0.5;
}

.win-sbar-section {
	margin-bottom: 2px;
}

.win-sbar-section-header {
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
.win-sbar-section-header:hover {
	background: var(--win-hover);
	color: var(--win-text);
}

.win-sbar-chevron {
	font-size: 14px;
	display: inline-block;
	transform: rotate(90deg);
	transition: transform 150ms;
	line-height: 1;
	flex-shrink: 0;
}
.win-sbar-chevron--collapsed {
	transform: rotate(0deg);
}

.win-sbar-settings {
	margin-top: auto;
	padding-top: 4px;
	border-top: 1px solid var(--win-border);
}

.win-sbar-item--settings {
	background: transparent;
	border: none;
	width: calc(100% - 8px);
	font-size: 12px;
}
</style>
