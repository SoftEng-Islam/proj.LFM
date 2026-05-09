import { computed, ref, watch, reactive } from 'vue';
import { useStorage } from '@vueuse/core';
import { acceptHMRUpdate, defineStore } from 'pinia';

import { defaultPath, driveCards as staticDrives, navigationGroups } from '@/features/navigation/navigation';
import { readDirectory, getVideoThumbnail, getImageThumbnail, convertFileSrc, getDrives } from '@/services/tauri-bridge';
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
	const detailsOpen = useStorage('lfm-details-pane', true);
	const aiChatOpen = useStorage('lfm-ai-chat-pane', false);
	const isLoading = ref(false);
	const driveCards = ref<DriveCard[]>([]);
	const windowTabs = ref<WindowTab[]>([
		{ id: 'tab-home', label: 'Home', path: defaultPath, sectionId: defaultPath, subtitle: 'Recent workspace' },
	]);

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
		windowTabs.value.map((tab) => ({
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
					}

					const fileTypeStr = file.file_type || '';
					let category = fileTypeStr.toLowerCase();
					const id = file.file_path || `unknown-${Math.random()}`;

					// Robust extension-based override
					const lowerBasename = (file.basename || '').toLowerCase();
					if (lowerBasename.endsWith('.mp4') || lowerBasename.endsWith('.mkv') || lowerBasename.endsWith('.avi') || lowerBasename.endsWith('.mov') || lowerBasename.endsWith('.webm')) {
						category = 'video';
					} else if (lowerBasename.endsWith('.jpg') || lowerBasename.endsWith('.jpeg') || lowerBasename.endsWith('.png') || lowerBasename.endsWith('.gif') || lowerBasename.endsWith('.webp')) {
						category = 'image';
					}

					const entry = reactive<FileEntry>({
						id,
						name: file.basename || 'Unknown',
						kind: file.is_dir ? 'folder' : 'file',
						category,
						typeLabel: fileTypeStr || (file.is_dir ? 'Directory' : 'File'),
						sizeLabel: file.is_dir ? '' : formatSize(file.size || 0),
						sortSize: file.size || 0,
						modifiedAt: modifiedDate,
						preview: category === 'image' ? convertFileSrc(id) : '',
						status: 'local',
						accent: file.is_dir ? 'sky' : 'slate',
						locationPath: [path, file.basename || ''],
						tags: [],
						collaborators: [],
						pinned: false,
					});

					// If video or image, fetch thumbnail in background
					if (category === 'video') {
						getVideoThumbnail(id).then(thumbPath => {
							entry.preview = convertFileSrc(thumbPath);
						}).catch((err) => {
							console.error(`Failed to generate video thumbnail for ${file.basename}:`, err);
						});
					} else if (category === 'image') {
						getImageThumbnail(id).then(thumbPath => {
							entry.preview = convertFileSrc(thumbPath);
						}).catch((err) => {
							console.error(`Failed to generate image thumbnail for ${file.basename}:`, err);
						});
					}

					return entry;
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



	async function fetchDrives() {
		try {
			const res = await getDrives();
			driveCards.value = res.array_of_drives.map(drive => {
				const used = drive.total_space - drive.available_space;
				const usedPercent = Math.round((used / drive.total_space) * 100);
				
				// Improve labels: use the last segment of the mount point
				let label = drive.name;
				const mountParts = drive.mount_point.split('/').filter(Boolean);
				
				if (drive.mount_point === '/') {
					label = 'System';
				} else if (mountParts.length > 0) {
					// Use the last part of the mount point (e.g. /mnt/data -> data)
					label = mountParts[mountParts.length - 1] || 'Disk';
					// Capitalize first letter for better UI
					label = label.charAt(0).toUpperCase() + label.slice(1);
				}

				return {
					id: drive.mount_point,
					label: label || 'Disk',
					usedLabel: formatSize(used) + ' used',
					freeLabel: formatSize(drive.available_space) + ' free',
					usedPercent,
					accent: drive.is_removable ? 'amber' : (drive.mount_point === '/' ? 'sky' : 'emerald')
				};
			});
		} catch (e) {
			console.error('Failed to fetch drives:', e);
		}
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

	function addTab(path: string = defaultPath) {
		const id = `tab-${Date.now()}`;
		const label = path === defaultPath ? 'Home' : path.split('/').pop() || 'New Tab';
		windowTabs.value.push({
			id,
			label,
			path,
			sectionId: path,
			subtitle: path
		});
		return id;
	}

	function closeTab(tabId: string) {
		if (windowTabs.value.length <= 1) return;
		const idx = windowTabs.value.findIndex(t => t.id === tabId);
		if (idx !== -1) {
			windowTabs.value.splice(idx, 1);
		}
	}

	function toggleDetails() {
		detailsOpen.value = !detailsOpen.value;
	}

	function toggleAiChat() {
		aiChatOpen.value = !aiChatOpen.value;
	}

	async function openItem(filePath: string) {
		try {
			const { openFile } = await import('@/services/tauri-bridge');
			await openFile(filePath);
		} catch (e) {
			console.error('Failed to open item:', e);
		}
	}

	async function deleteSelection() {
		if (!selectedItemId.value) return;
		try {
			const { deleteFile } = await import('@/services/tauri-bridge');
			const success = await deleteFile([selectedItemId.value]);
			if (success) {
				await fetchDirectory(currentPath.value);
			}
		} catch (e) {
			console.error('Failed to delete selection:', e);
		}
	}

	async function openInTerminal(path: string) {
		try {
			const { openInTerminal: tauriOpenTerminal } = await import('@/services/tauri-bridge');
			await tauriOpenTerminal(path);
		} catch (e) {
			console.error('Failed to open terminal:', e);
		}
	}

	return {
		currentPath,
		currentEntries: sortedAndFilteredEntries,
		selectedItem,
		searchQuery,
		viewMode,
		sortMode,
		detailsOpen,
		aiChatOpen,
		favoriteItems,
		spotlightItems,
		breadcrumbs,
		workspaceStats,
		activityFeed,
		navigationGroups: navigationGroupsWithCounts,
		windowTabs: tabsWithAccent,
		driveCards,
		fetchDirectory,
		fetchDrives,
		openSection,
		selectItem,
		setSearchQuery,
		setViewMode,
		toggleDetails,
		toggleAiChat,
		cycleSortMode,
		createFolder,
		togglePinnedForSelection,
		addTab,
		closeTab,
		openItem,
		deleteSelection,
		openInTerminal,
	};
});

if (import.meta.hot) {
	import.meta.hot.accept(acceptHMRUpdate(useFileManagerStore, import.meta.hot));
}
