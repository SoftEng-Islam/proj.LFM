import { computed, ref, watch, reactive } from 'vue';
import { useStorage } from '@vueuse/core';
import { acceptHMRUpdate, defineStore } from 'pinia';

import { defaultPath, driveCards as staticDrives, navigationGroups } from '@/features/navigation/navigation';
import { readDirectory, getVideoThumbnail, getImageThumbnail, convertFileSrc, getDrives, openFile, deleteFile, openInTerminal as tauriOpenTerminal, copy as tauriCopy, rename as tauriMove, isDir } from '@/services/tauri-bridge';
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
	const viewMode = ref<ViewMode>('grid');
	const sortMode = ref<SortMode>('modified');
	const detailsOpen = ref(true);
	const aiChatOpen = ref(false);

    watch([detailsOpen, aiChatOpen], () => {
        console.log('AppLayout: State changed', { details: detailsOpen.value, ai: aiChatOpen.value });
    });

	// Clipboard state
	const clipboard = ref<{
		paths: string[];
		mode: 'copy' | 'cut' | null;
	}>({ paths: [], mode: null });

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

	const favoriteItems = ref<string[]>([]);

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
				currentEntries.value = res.files.map((file: any) => {
					const parseTime = (t: any) => {
						if (t && typeof t.secs_since_epoch === 'number') return new Date(t.secs_since_epoch * 1000).toISOString();
						if (typeof t === 'number') return new Date(t * 1000).toISOString();
						return new Date().toISOString();
					};

					const modifiedAt = parseTime(file.last_modified);
					const createdAt = parseTime(file.created);
					const accessedAt = parseTime(file.last_accessed);

					const fileTypeStr = file.file_type || '';
					let category = 'document';
					const id = file.file_path || `unknown-${Math.random()}`;
					const lowerBasename = (file.basename || '').toLowerCase();
					const ext = lowerBasename.split('.').pop() || '';

					if (file.is_dir) {
						category = 'folder';
					} else if (['mp4', 'mkv', 'avi', 'mov', 'webm'].includes(ext)) {
						category = 'video';
					} else if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) {
						category = 'image';
					} else if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
						category = 'archive';
					} else if (['mp3', 'wav', 'ogg', 'flac', 'm4a'].includes(ext)) {
						category = 'audio';
					} else if (['pdf'].includes(ext)) {
						category = 'pdf';
					} else if (['js', 'ts', 'vue', 'py', 'rs', 'cpp', 'h', 'html', 'css', 'json', 'sh'].includes(ext)) {
						category = 'code';
					}

					const entry = reactive<FileEntry>({
						id,
						name: file.basename || 'Unknown',
						kind: file.is_dir ? 'folder' : 'file',
						category,
						typeLabel: fileTypeStr || (file.is_dir ? 'Directory' : 'File'),
						sizeLabel: file.is_dir ? '' : formatSize(file.size || 0),
						sortSize: file.size || 0,
						modifiedAt,
						createdAt,
						accessedAt,
						readonly: file.readonly,
						preview: category === 'image' ? convertFileSrc(id) : '',
						status: 'local',
						accent: file.is_dir ? 'sky' : 'slate',
						locationPath: [path, file.basename || ''],
						tags: [],
						collaborators: [],
						pinned: false,
					});

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
				
				let label = drive.name;
				const mountParts = drive.mount_point.split('/').filter(Boolean);
				
				if (drive.mount_point === '/') {
					label = 'System';
				} else if (mountParts.length > 0) {
					label = mountParts[mountParts.length - 1] || 'Disk';
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
		if (!selectedItemId.value) return;
		const match = currentEntries.value.find((entry) => entry.id === selectedItemId.value);
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
			if (await isDir(filePath)) {
				openSection(filePath);
			} else {
				await openFile(filePath);
			}
		} catch (e) {
			console.error('Failed to open item:', e);
		}
	}

	async function deleteSelection() {
		if (!selectedItemId.value) return false;
		try {
			const success = await deleteFile([selectedItemId.value]);
			if (success) {
				await fetchDirectory(currentPath.value);
			}
			return success;
		} catch (e) {
			console.error('Failed to delete selection:', e);
			return false;
		}
	}

	async function openInTerminal(path: string) {
		try {
			await tauriOpenTerminal(path);
		} catch (e) {
			console.error('Failed to open terminal:', e);
		}
	}

	async function renameItem(oldPath: string, newName: string) {
		try {
			const parentDir = oldPath.substring(0, oldPath.lastIndexOf('/') + 1);
			const newPath = parentDir + newName;
			const success = await tauriMove(oldPath, newPath);
			if (success) {
				await fetchDirectory(currentPath.value);
			}
			return success;
		} catch (e) {
			console.error('Failed to rename item:', e);
			return false;
		}
	}

	function setClipboard(paths: string[], mode: 'copy' | 'cut') {
		clipboard.value = { paths, mode };
	}

	async function paste() {
		if (!clipboard.value.paths.length || !clipboard.value.mode) return;
		try {
			for (const src of clipboard.value.paths) {
				const name = src.split('/').pop() || '';
				const dest = currentPath.value.endsWith('/') 
					? currentPath.value + name 
					: currentPath.value + '/' + name;
				
				if (clipboard.value.mode === 'copy') {
					await tauriCopy(src, dest);
				} else {
					await tauriMove(src, dest);
				}
			}
			if (clipboard.value.mode === 'cut') {
				clipboard.value = { paths: [], mode: null };
			}
			await fetchDirectory(currentPath.value);
		} catch (e) {
			console.error('Paste failed:', e);
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
		clipboard,
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
		renameItem,
		setClipboard,
		paste,
	};
});

if (import.meta.hot) {
	import.meta.hot.accept(acceptHMRUpdate(useFileManagerStore, import.meta.hot));
}
