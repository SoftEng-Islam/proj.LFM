import { computed, ref, watch } from 'vue';
import { useStorage } from '@vueuse/core';
import { acceptHMRUpdate, defineStore } from 'pinia';

import { defaultPath, driveCards, navigationGroups, windowTabs } from '@/features/navigation/navigation';
import { readDirectory } from '@/services/tauri-bridge';
import type { FileMetaData } from '@/services/tauri-bridge';
import type {
	ActivityEntry,
	BreadcrumbSegment,
	DriveCard,
	FileEntry,
	NavigationGroup,
	SortMode,
	ViewMode,
	WindowTab,
	WorkspaceStat
} from '@/types/file-manager';

const viewModeKey = 'lfm-view-mode';
const sortModeKey = 'lfm-sort-mode';
const previewPaneKey = 'lfm-preview-pane';

function formatSize(bytes: number): string {
	if (bytes === 0) return '0 B';
	const k = 1024;
	const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export const useFileManagerStore = defineStore('file-manager', () => {
	const currentPath = ref<string>(defaultPath);
	const currentEntries = ref<FileEntry[]>([]);
	const searchQuery = ref('');
	const selectedItemId = ref<string | null>(null);
	const viewMode = useStorage<ViewMode>(viewModeKey, 'grid');
	const sortMode = useStorage<SortMode>(sortModeKey, 'modified');
	const previewOpen = useStorage(previewPaneKey, true);
	const isLoading = ref(false);

	const navigationGroupsWithCounts = computed<NavigationGroup[]>(() =>
		navigationGroups.map((group) => ({
			...group,
			items: group.items.map((item) => ({
				...item,
				count: 0
			}))
		}))
	);

	const tabsWithAccent = computed<WindowTab[]>(() =>
		windowTabs.map((tab) => ({
			...tab,
			accent: 'slate'
		}))
	);

	const sortedAndFilteredEntries = computed(() => {
		const source = [...currentEntries.value];
		const query = searchQuery.value.trim().toLowerCase();
		const filtered = query
			? source.filter((entry) => {
					const haystack = [entry.name, entry.typeLabel, ...entry.tags].join(' ').toLowerCase();
					return haystack.includes(query);
				})
			: source;

		return filtered.sort((left, right) => {
			if (left.kind === 'folder' && right.kind !== 'folder') return -1;
			if (left.kind !== 'folder' && right.kind === 'folder') return 1;

			switch (sortMode.value) {
				case 'name':
					return left.name.localeCompare(right.name);
				case 'size':
					return right.sortSize - left.sortSize;
				case 'kind':
					return left.typeLabel.localeCompare(right.typeLabel);
				case 'modified':
				default:
					return new Date(right.modifiedAt).getTime() - new Date(left.modifiedAt).getTime();
			}
		});
	});

	const selectedItem = computed<FileEntry | null>(() => {
		if (selectedItemId.value) {
			const match = sortedAndFilteredEntries.value.find((entry) => entry.id === selectedItemId.value);
			if (match) {
				return match;
			}
		}

		return sortedAndFilteredEntries.value[0] ?? null;
	});

	const favoriteItems = computed(() => []);

	const spotlightItems = computed(() => {
		const spotlight = sortedAndFilteredEntries.value.filter((entry) => entry.kind === 'folder').slice(0, 3);
		return spotlight.length ? spotlight : sortedAndFilteredEntries.value.slice(0, 3);
	});

	const breadcrumbs = computed<BreadcrumbSegment[]>(() => {
		const parts = currentPath.value.split('/').filter(Boolean);
		let accPath = '';
		const base: BreadcrumbSegment[] = [
			{ label: 'Root', path: '/' }
		];

		for (const part of parts) {
			accPath += '/' + part;
			base.push({ label: part, path: accPath });
		}

		return base;
	});

	const workspaceStats = computed<WorkspaceStat[]>(() => {
		const folderCount = currentEntries.value.filter((entry) => entry.kind === 'folder').length;
		const fileCount = currentEntries.value.filter((entry) => entry.kind === 'file').length;

		return [
			{ label: 'Folders', value: String(folderCount), helper: 'Total directories', accent: 'emerald' },
			{ label: 'Files', value: String(fileCount), helper: 'Total files', accent: 'cyan' },
		];
	});

	const activityFeed = computed<ActivityEntry[]>(() => {
		return [
			{ id: 'fallback-1', title: 'Real FS Loaded', summary: 'Connected to Tauri backend.', timeLabel: 'Now', tone: 'success' },
		];
	});

	watch(
		sortedAndFilteredEntries,
		(nextEntries) => {
			if (!nextEntries.some((entry) => entry.id === selectedItemId.value)) {
				selectedItemId.value = nextEntries[0]?.id ?? null;
			}
		},
		{ immediate: true }
	);

	async function fetchDirectory(path: string) {
		currentPath.value = path;
		searchQuery.value = '';
		isLoading.value = true;
		try {
			const res = await readDirectory(path);
			try {
				currentEntries.value = res.files.map((file: FileMetaData) => {
					// Safely parse the last_modified time, fallback to current time if missing
					let modifiedDate = new Date().toISOString();
					if (file.last_modified && typeof file.last_modified.secs_since_epoch === 'number') {
						modifiedDate = new Date(file.last_modified.secs_since_epoch * 1000).toISOString();
					} else if (typeof file.last_modified === 'number') {
						modifiedDate = new Date(file.last_modified * 1000).toISOString();
					} else if (file.last_modified && (file.last_modified as any).secs_since_epoch === undefined) {
						// Catch cases where SystemTime serialized differently
						console.warn('Unknown SystemTime format:', file.last_modified);
					}

					const fileTypeStr = file.file_type || '';
					return {
						id: file.file_path || `unknown-${Math.random()}`,
						name: file.basename || 'Unknown',
						kind: file.is_dir ? 'folder' : 'file',
						category: fileTypeStr.toLowerCase() || 'default',
						typeLabel: fileTypeStr || (file.is_dir ? 'Directory' : 'File'),
						sizeLabel: file.is_dir ? '' : formatSize(file.size || 0),
						sortSize: file.size || 0,
						modifiedAt: modifiedDate,
						preview: '',
						status: 'local',
						accent: file.is_dir ? 'sky' : 'slate',
						locationPath: [path, file.basename || ''],
						tags: [],
						collaborators: [],
						pinned: false,
					};
				});
			} catch (e) {
				import('vue-toastification').then(m => m.useToast().error(`Mapping failed: ${e}`));
				currentEntries.value = [];
			}
		} catch (error) {
			console.error('Failed to read directory:', error);
			import('vue-toastification').then(m => m.useToast().error(`Read failed: ${error}`));
			currentEntries.value = [];
		} finally {
			isLoading.value = false;
		}
	}

	function openSection(path: string) {
		currentPath.value = path;
		searchQuery.value = '';
		fetchDirectory(path);
	}

	function selectItem(itemId: string) {
		selectedItemId.value = itemId;
	}

	function setSearchQuery(value: string) {
		searchQuery.value = value;
	}

	function setViewMode(nextMode: ViewMode) {
		viewMode.value = nextMode;
	}

	function togglePreviewPane() {
		previewOpen.value = !previewOpen.value;
	}

	function cycleSortMode() {
		const order: SortMode[] = ['modified', 'name', 'size', 'kind'];
		const currentIndex = order.indexOf(sortMode.value);
		sortMode.value = order[(currentIndex + 1) % order.length] ?? 'modified';
	}

	function createFolder() {
		// Mock implementation, will need to be hooked to Tauri API
		const folder: FileEntry = {
			id: `folder-${Date.now()}`,
			name: 'New Folder',
			kind: 'folder',
			category: 'folder',
			typeLabel: 'Directory',
			sizeLabel: '',
			sortSize: 0,
			modifiedAt: new Date().toISOString(),
			preview: '',
			status: 'draft',
			accent: 'sky',
			locationPath: [currentPath.value, 'New Folder'],
			tags: [],
			collaborators: [],
			pinned: false
		};
		currentEntries.value = [folder, ...currentEntries.value];
		return folder;
	}

	function togglePinnedForSelection() {
		if (!selectedItem.value) return;
		const match = currentEntries.value.find((entry) => entry.id === selectedItem.value?.id);
		if (match) {
			match.pinned = !match.pinned;
		}
	}

	return {
		currentPath,
		currentEntries: sortedAndFilteredEntries,
		selectedItem,
		searchQuery,
		viewMode,
		sortMode,
		previewOpen,
		favoriteItems,
		spotlightItems,
		breadcrumbs,
		workspaceStats,
		activityFeed,
		navigationGroups: navigationGroupsWithCounts,
		windowTabs: tabsWithAccent,
		driveCards: computed<DriveCard[]>(() => driveCards),
		fetchDirectory,
		openSection,
		selectItem,
		setSearchQuery,
		setViewMode,
		togglePreviewPane,
		cycleSortMode,
		createFolder,
		togglePinnedForSelection,
	};
});

if (import.meta.hot) {
	import.meta.hot.accept(acceptHMRUpdate(useFileManagerStore, import.meta.hot));
}
