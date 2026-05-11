/**
 * File Manager store — the primary store for the explorer UI.
 *
 * Responsibilities:
 *  - Current path and directory entries
 *  - Sorting, filtering, and search
 *  - File selection
 *  - Tab management
 *  - Drive list
 *  - Clipboard (copy/cut/paste)
 *  - File operations (delete, rename, open)
 *
 * Panel resize logic is delegated to the `usePanelResize` composable.
 * Drive/file mapping is delegated to `@/services/mappers`.
 */

import { computed, reactive, ref, watch } from 'vue';
import { useStorage } from '@vueuse/core';
import { acceptHMRUpdate, defineStore } from 'pinia';

import { defaultPath, navigationGroups } from '@/features/navigation/navigation';
import {
	convertFileSrc,
	copy as tauriCopy,
	deleteFile,
	getDrives,
	getImageThumbnail,
	getVideoThumbnail,
	isDir,
	openFile,
	openInTerminal as tauriOpenTerminal,
	readDirectory,
	rename as tauriMove,
} from '@/services/tauri-bridge';
import { usePanelResize } from '@/composables/usePanelResize';
import { formatBytes } from '@/utils/format';
import type {
	ActivityEntry,
	BreadcrumbSegment,
	DriveCard,
	FileEntry,
	NavigationGroup,
	SortMode,
	ViewMode,
	WindowTab,
	WorkspaceStat,
} from '@/types/file-manager';

export const useFileManagerStore = defineStore('file-manager', () => {
	// ── Panel resize (delegated) ──────────────────────────────────────────────
	const panels = usePanelResize();

	// ── Core navigation state ─────────────────────────────────────────────────
	const currentPath = ref<string>(defaultPath);
	const currentEntries = ref<FileEntry[]>([]);
	const searchQuery = ref('');
	const selectedItemId = ref<string | null>(null);
	const viewMode = useStorage<ViewMode>('lfm-view-mode', 'grid');
	const sortMode = useStorage<SortMode>('lfm-sort-mode', 'modified');

	// ── Clipboard ─────────────────────────────────────────────────────────────
	const clipboard = ref<{ paths: string[]; mode: 'copy' | 'cut' | null }>({
		paths: [],
		mode: null,
	});

	// ── Loading & data ────────────────────────────────────────────────────────
	const isLoading = ref(false);
	const driveCards = ref<DriveCard[]>([]);
	const windowTabs = ref<WindowTab[]>([
		{ id: 'tab-home', label: 'Home', path: defaultPath, sectionId: defaultPath, subtitle: 'Recent workspace' },
	]);
	const favoriteItems = ref<string[]>([]);

	// ── Computed: navigation groups with counts ───────────────────────────────
	const navigationGroupsWithCounts = computed<NavigationGroup[]>(() =>
		navigationGroups.map((group) => ({
			...group,
			items: group.items.map((item) => ({ ...item, count: 0 })),
		}))
	);

	// ── Computed: tabs with accent ────────────────────────────────────────────
	const tabsWithAccent = computed<WindowTab[]>(() =>
		windowTabs.value.map((tab) => ({ ...tab, accent: 'slate' as const }))
	);

	// ── Computed: sorted + filtered entries ───────────────────────────────────
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
			// Directories always sort before files
			if (left.kind === 'folder' && right.kind !== 'folder') return -1;
			if (left.kind !== 'folder' && right.kind === 'folder') return 1;

			switch (sortMode.value) {
				case 'name':     return left.name.localeCompare(right.name);
				case 'size':     return right.sortSize - left.sortSize;
				case 'kind':     return left.typeLabel.localeCompare(right.typeLabel);
				case 'modified':
				default:         return new Date(right.modifiedAt).getTime() - new Date(left.modifiedAt).getTime();
			}
		});
	});

	// ── Computed: selected item ───────────────────────────────────────────────
	const selectedItem = computed<FileEntry | null>(() => {
		if (selectedItemId.value) {
			const match = sortedAndFilteredEntries.value.find((e) => e.id === selectedItemId.value);
			if (match) return match;
		}
		return sortedAndFilteredEntries.value[0] ?? null;
	});

	// ── Computed: spotlight (top 3 directories or files) ─────────────────────
	const spotlightItems = computed(() => {
		const dirs = sortedAndFilteredEntries.value.filter((e) => e.kind === 'folder').slice(0, 3);
		return dirs.length ? dirs : sortedAndFilteredEntries.value.slice(0, 3);
	});

	// ── Computed: breadcrumbs ─────────────────────────────────────────────────
	const breadcrumbs = computed<BreadcrumbSegment[]>(() => {
		const parts = currentPath.value.split('/').filter(Boolean);
		let accPath = '';
		const base: BreadcrumbSegment[] = [{ label: 'Root', path: '/' }];

		for (const part of parts) {
			accPath += '/' + part;
			base.push({ label: part, path: accPath });
		}

		return base;
	});

	// ── Computed: workspace stats ─────────────────────────────────────────────
	const workspaceStats = computed<WorkspaceStat[]>(() => {
		const dirCount = currentEntries.value.filter((e) => e.kind === 'folder').length;
		const fileCount = currentEntries.value.filter((e) => e.kind === 'file').length;

		return [
			{ label: 'Directories', value: String(dirCount), helper: 'Total directories', accent: 'emerald' },
			{ label: 'Files',       value: String(fileCount), helper: 'Total files',       accent: 'cyan'    },
		];
	});

	// ── Computed: activity feed ───────────────────────────────────────────────
	const activityFeed = computed<ActivityEntry[]>(() => [
		{ id: 'fallback-1', title: 'Real FS Loaded', summary: 'Connected to Tauri backend.', timeLabel: 'Now', tone: 'success' },
	]);

	// ── Auto-select first item when entries change ────────────────────────────
	watch(
		sortedAndFilteredEntries,
		(nextEntries) => {
			if (!nextEntries.some((e) => e.id === selectedItemId.value)) {
				selectedItemId.value = nextEntries[0]?.id ?? null;
			}
		},
		{ immediate: true }
	);

	// ── Actions ───────────────────────────────────────────────────────────────

	async function fetchDirectory(path: string) {
		currentPath.value = path;
		searchQuery.value = '';
		isLoading.value = true;

		try {
			const res = await readDirectory(path);

			currentEntries.value = res.files.map((file) => {
				const parseTime = (t: unknown): string => {
					if (t && typeof (t as { secs_since_epoch?: number }).secs_since_epoch === 'number') {
						return new Date((t as { secs_since_epoch: number }).secs_since_epoch * 1000).toISOString();
					}
					if (typeof t === 'number') return new Date(t * 1000).toISOString();
					return new Date().toISOString();
				};

				const modifiedAt  = parseTime(file.last_modified);
				const createdAt   = parseTime(file.created);
				const accessedAt  = parseTime(file.last_accessed);
				const id          = file.file_path || `unknown-${Math.random()}`;
				const lowerName   = (file.basename || '').toLowerCase();
				const ext         = lowerName.split('.').pop() || '';

				let category = 'document';
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
					name:         file.basename || 'Unknown',
					kind:         file.is_dir ? 'folder' : 'file',
					category,
					typeLabel:    file.file_type || (file.is_dir ? 'Directory' : 'File'),
					sizeLabel:    file.is_dir ? '' : formatBytes(file.size || 0),
					sortSize:     file.size || 0,
					modifiedAt,
					createdAt,
					accessedAt,
					readonly:     file.readonly,
					preview:      category === 'image' ? convertFileSrc(id) : '',
					status:       'local',
					accent:       file.is_dir ? 'sky' : 'slate',
					locationPath: [path, file.basename || ''],
					tags:         [],
					collaborators: [],
					pinned:       false,
				});

				// Generate thumbnails asynchronously
				if (category === 'video') {
					getVideoThumbnail(id)
						.then((thumbPath) => { entry.preview = convertFileSrc(thumbPath); })
						.catch((err) => { console.error(`Video thumbnail failed for ${file.basename}:`, err); });
				} else if (category === 'image') {
					getImageThumbnail(id)
						.then((thumbPath) => { entry.preview = convertFileSrc(thumbPath); })
						.catch((err) => { console.error(`Image thumbnail failed for ${file.basename}:`, err); });
				}

				return entry;
			});
		} catch (error) {
			console.error('Failed to read directory:', error);
			import('vue-toastification').then((m) => m.useToast().error(`Read failed: ${error}`));
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

	function cycleSortMode() {
		const order: SortMode[] = ['modified', 'name', 'size', 'kind'];
		const currentIndex = order.indexOf(sortMode.value);
		sortMode.value = order[(currentIndex + 1) % order.length] ?? 'modified';
	}

	async function fetchDrives() {
		try {
			const res = await getDrives();
			driveCards.value = res.array_of_drives.map((drive) => {
				const used = drive.total_space - drive.available_space;
				const usedPercent = Math.round((used / drive.total_space) * 100);

				let label = drive.name;
				const mountParts = drive.mount_point.split('/').filter(Boolean);

				if (drive.mount_point === '/') {
					label = 'System';
				} else if (mountParts.length > 0) {
					const last = mountParts[mountParts.length - 1] || 'Disk';
					label = last.charAt(0).toUpperCase() + last.slice(1);
				}

				return {
					id:         drive.mount_point,
					label:      label || 'Disk',
					usedLabel:  formatBytes(used) + ' used',
					freeLabel:  formatBytes(drive.available_space) + ' free',
					usedPercent,
					accent:     drive.is_removable ? 'amber' : drive.mount_point === '/' ? 'sky' : 'emerald',
				} as DriveCard;
			});
		} catch (e) {
			console.error('Failed to fetch drives:', e);
		}
	}

	/** Create a placeholder directory entry (optimistic UI before backend call). */
	function createDirectory(): FileEntry {
		const entry: FileEntry = {
			id:           `directory-${Date.now()}`,
			name:         'New Directory',
			kind:         'folder',
			category:     'folder',
			typeLabel:    'Directory',
			sizeLabel:    '',
			sortSize:     0,
			modifiedAt:   new Date().toISOString(),
			preview:      '',
			status:       'draft',
			accent:       'sky',
			locationPath: [currentPath.value, 'New Directory'],
			tags:         [],
			collaborators: [],
			pinned:       false,
		};
		currentEntries.value = [entry, ...currentEntries.value];
		return entry;
	}

	function isPinned(itemId: string): boolean {
		return currentEntries.value.find((e) => e.id === itemId)?.pinned ?? false;
	}

	function togglePinnedForSelection() {
		if (!selectedItemId.value) return;
		const match = currentEntries.value.find((e) => e.id === selectedItemId.value);
		if (match) match.pinned = !match.pinned;
	}

	function addTab(path: string = defaultPath) {
		const id = `tab-${Date.now()}`;
		const label = path === defaultPath ? 'Home' : path.split('/').pop() || 'New Tab';
		windowTabs.value.push({ id, label, path, sectionId: path, subtitle: path });
		return id;
	}

	function closeTab(tabId: string) {
		if (windowTabs.value.length <= 1) return;
		const idx = windowTabs.value.findIndex((t) => t.id === tabId);
		if (idx !== -1) windowTabs.value.splice(idx, 1);
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
			if (success) await fetchDirectory(currentPath.value);
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
			if (success) await fetchDirectory(currentPath.value);
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
			if (clipboard.value.mode === 'cut') clipboard.value = { paths: [], mode: null };
			await fetchDirectory(currentPath.value);
		} catch (e) {
			console.error('Paste failed:', e);
		}
	}

	return {
		// Path & entries
		currentPath,
		currentEntries: sortedAndFilteredEntries,
		selectedItem,
		searchQuery,
		viewMode,
		sortMode,

		// Panel state (from usePanelResize)
		detailsOpen:          panels.detailsOpen,
		aiChatOpen:           panels.aiChatOpen,
		detailsPanelWidth:    panels.detailsPanelWidth,
		aiChatPanelWidth:     panels.aiChatPanelWidth,
		setDetailsPanelWidth: panels.setDetailsPanelWidth,
		setAiChatPanelWidth:  panels.setAiChatPanelWidth,
		reconcileRightPanelWidths: panels.reconcilePanelWidths,
		resetDetailsPanelWidth:    panels.resetDetailsPanelWidth,
		resetAiChatPanelWidth:     panels.resetAiChatPanelWidth,
		toggleDetails:             panels.toggleDetails,
		toggleAiChat:              panels.toggleAiChat,

		// Clipboard
		clipboard,

		// Lists & computed
		favoriteItems,
		spotlightItems,
		breadcrumbs,
		workspaceStats,
		activityFeed,
		navigationGroups: navigationGroupsWithCounts,
		windowTabs: tabsWithAccent,
		driveCards,

		// Actions
		fetchDirectory,
		fetchDrives,
		openSection,
		selectItem,
		setSearchQuery,
		setViewMode,
		cycleSortMode,
		createDirectory,
		isPinned,
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
