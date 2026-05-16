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

import { defaultPath, createNavigationGroups, createInitialTabs, driveCards as initialDriveCards } from '@/features/navigation/navigation';
import { initHomeDirFromStorage } from '@/composables/useFilesystem';
import { mapDriveInfoToCard, mapTrashMetaToEntry } from '@/services/mappers';
import {
	convertFileSrc,
	copy as tauriCopy,
	deleteFile,
	getDrives,
	getFilePermissions,
	getMediaInfo,
	getImageThumbnail,
	getVideoThumbnail,
	getTrashedItems,
	isDir,
	openFile,
	openInTerminal as tauriOpenTerminal,
	readDirectory,
	rename as tauriMove,
	writeTextFile,
} from '@/services/tauri-bridge';
import { usePanelResize } from '@/composables/usePanelResize';
import { formatBytes } from '@/utils/format';
import type {
	ActivityEntry,
	BreadcrumbSegment,
	DriveCard,
	FileEntry,
	FilePermissions,
	MediaInfo,
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
	const homePath = ref<string>(defaultPath);
	const currentEntries = ref<FileEntry[]>([]);
	const searchQuery = ref('');
	const selectedItemIds = ref<Set<string>>(new Set());
	const viewMode = useStorage<ViewMode>('lfm-view-mode', 'grid');
	const sortMode = useStorage<SortMode>('lfm-sort-mode', 'modified');
	const settingsOpen = ref(false);

	// ── Clipboard ─────────────────────────────────────────────────────────────
	const clipboard = ref<{ paths: string[]; mode: 'copy' | 'cut' | null }>({
		paths: [],
		mode: null,
	});

	// ── Loading & data ────────────────────────────────────────────────────────
	const isLoading = ref(false);
	const isInitialized = ref(false);

	/**
	 * Structured navigation error — set when entering a directory fails.
	 * The UI should render an appropriate empty state based on `kind`.
	 */
	const navError = ref<{
		kind: 'permission' | 'not-found' | 'unknown';
		path: string;
		message: string;
	} | null>(null);

	const driveCards = ref<DriveCard[]>(initialDriveCards);
	const windowTabs = ref<WindowTab[]>(createInitialTabs(defaultPath));
	const activeTabId = ref<string>(windowTabs.value[0]?.id ?? '');
	const navigationGroups = ref<NavigationGroup[]>(createNavigationGroups(defaultPath));
	const favoriteItems = ref<string[]>([]);
	const selectedItemPermissions = ref<FilePermissions | null>(null);
	const selectedItemMediaInfo = ref<MediaInfo | null>(null);

	// ── Preview Pane State ────────────────────────────────────────────────────
	const previewMode = useStorage<'automatic' | 'full' | 'compact' | 'sticky'>('lfm-preview-mode', 'automatic');
	const categoryPreferredMode = useStorage<Record<string, 'automatic' | 'full' | 'compact' | 'sticky'>>('lfm-category-preview-modes', {});
	const expandedPreviewId = ref<string | null>(null);

	/**
	 * Initialize the home directory and update navigation state.
	 * This ensures sidebar links correctly point to /home/user instead of /root.
	 */
	async function initializeHomeDir() {
		const home = await initHomeDirFromStorage();
		homePath.value = home;
		windowTabs.value = createInitialTabs(home);
		activeTabId.value = windowTabs.value[0]?.id ?? '';
		navigationGroups.value = createNavigationGroups(home);

		// If we're currently at a generic root, jump to the real home
		if (currentPath.value === '/root' || currentPath.value === '/') {
			openSection(home);
		}
		isInitialized.value = true;
	}

	// ── Computed: navigation groups with counts ───────────────────────────────
	const navigationGroupsWithCounts = computed<NavigationGroup[]>(() =>
		navigationGroups.value.map((group) => ({
			...group,
			items: group.items.map((item) => ({ ...item, count: 0 })),
		}))
	);

	// ── Computed: tabs with accent ────────────────────────────────────────────
	const tabsWithAccent = computed<WindowTab[]>(() => windowTabs.value.map((tab) => ({ ...tab, accent: 'slate' as const })));

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

	// ── Computed: selected item (first selected for backward compatibility) ──
	const selectedItem = computed<FileEntry | null>(() => {
		const firstId = selectedItemIds.value.values().next().value;
		if (firstId) {
			const match = sortedAndFilteredEntries.value.find((e) => e.id === firstId);
			if (match) return match;
		}
		return sortedAndFilteredEntries.value[0] ?? null;
	});

	// ── Computed: selected items array ─────────────────────────────────────────
	const selectedItems = computed<FileEntry[]>(() => {
		return sortedAndFilteredEntries.value.filter((e) => selectedItemIds.value.has(e.id));
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
			{ label: 'Files', value: String(fileCount), helper: 'Total files', accent: 'cyan' },
		];
	});

	// ── Computed: activity feed ───────────────────────────────────────────────
	const activityFeed = computed<ActivityEntry[]>(() => [
		{ id: 'fallback-1', title: 'Real FS Loaded', summary: 'Connected to Tauri backend.', timeLabel: 'Now', tone: 'success' },
	]);

	// ── Auto-select first item when entries change ────────────────────────────
	watch(
		selectedItemIds,
		async (newIds) => {
			selectedItemPermissions.value = null;
			selectedItemMediaInfo.value = null;

			const firstId = newIds.values().next().value;
			if (firstId) {
				try {
					const [perms, media] = await Promise.all([
						getFilePermissions(firstId).catch(() => null),
						getMediaInfo(firstId).catch(() => null),
					]);
					selectedItemPermissions.value = perms;
					selectedItemMediaInfo.value = media;
				} catch (err) {
					console.error('[FileManagerStore] Failed to fetch extended info:', err);
				}
			}
		},
		{ immediate: true, deep: true }
	);

	async function updateSelectedItemMetadata() {
		const firstId = selectedItemIds.value.values().next().value;
		if (firstId) {
			try {
				const [perms, media] = await Promise.all([getFilePermissions(firstId).catch(() => null), getMediaInfo(firstId).catch(() => null)]);
				selectedItemPermissions.value = perms;
				selectedItemMediaInfo.value = media;
			} catch (err) {
				console.error('[FileManagerStore] Failed to update metadata:', err);
			}
		}
	}

	// ── Actions ───────────────────────────────────────────────────────────────

	async function fetchDirectory(path: string) {
		// Snapshot so we can roll back if the read fails
		const prevPath = currentPath.value;
		const prevEntries = currentEntries.value;
		const normalizedPath = path === '/root' ? '/' : path;

		currentPath.value = normalizedPath;
		searchQuery.value = '';
		isLoading.value = true;
		navError.value = null;

		try {
			if (path === '/trash') {
				const info = await getTrashedItems();
				currentEntries.value = info.files.map((meta) => mapTrashMetaToEntry(meta, 'slate'));
				return;
			}

			const res = await readDirectory(normalizedPath);

			currentEntries.value = res.files.map((file) => {
				const parseTime = (t: unknown): string => {
					if (t && typeof (t as { secs_since_epoch?: number }).secs_since_epoch === 'number') {
						return new Date((t as { secs_since_epoch: number }).secs_since_epoch * 1000).toISOString();
					}
					if (typeof t === 'number') return new Date(t * 1000).toISOString();
					return new Date().toISOString();
				};

				const modifiedAt = parseTime(file.last_modified);
				const createdAt = parseTime(file.created);
				const accessedAt = parseTime(file.last_accessed);
				const id = file.file_path || `unknown-${Math.random()}`;
				const lowerName = (file.basename || '').toLowerCase();
				const ext = lowerName.split('.').pop() || '';

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
					name: file.basename || 'Unknown',
					kind: file.is_dir ? 'folder' : 'file',
					category,
					typeLabel: file.file_type || (file.is_dir ? 'Directory' : 'File'),
					sizeLabel: file.is_dir ? '' : formatBytes(file.size || 0),
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

				// Generate thumbnails asynchronously
				if (category === 'video') {
					getVideoThumbnail(id)
						.then((thumbPath) => {
							entry.preview = convertFileSrc(thumbPath);
						})
						.catch((err) => {
							console.error(`Video thumbnail failed for ${file.basename}:`, err);
						});
				} else if (category === 'image') {
					getImageThumbnail(id)
						.then((thumbPath) => {
							entry.preview = convertFileSrc(thumbPath);
						})
						.catch((err) => {
							console.error(`Image thumbnail failed for ${file.basename}:`, err);
						});
				}

				return entry;
			});
		} catch (error) {
			console.error('Failed to read directory:', error);

			// Roll back to previous location so the user isn't stranded
			currentPath.value = prevPath;
			currentEntries.value = prevEntries;

			// Classify the error for the UI empty-state
			const msg = String(error);
			const isPermission = /permission denied|access denied|eacces/i.test(msg);
			const isNotFound = /no such file|not found|enoent/i.test(msg);

			navError.value = {
				kind: isPermission ? 'permission' : isNotFound ? 'not-found' : 'unknown',
				path,
				message: msg,
			};
		} finally {
			isLoading.value = false;
		}
	}

	function openSection(path: string) {
		currentPath.value = path;
		searchQuery.value = '';
		updateActiveTabPath(path);
		fetchDirectory(path);
	}

	function refresh() {
		fetchDirectory(currentPath.value);
	}

	function selectItem(itemId: string) {
		selectedItemIds.value.clear();
		selectedItemIds.value.add(itemId);
	}

	function toggleItemSelection(itemId: string) {
		if (selectedItemIds.value.has(itemId)) {
			selectedItemIds.value.delete(itemId);
		} else {
			selectedItemIds.value.add(itemId);
		}
	}

	function selectAllItems() {
		selectedItemIds.value = new Set(sortedAndFilteredEntries.value.map((e) => e.id));
	}

	function clearSelection() {
		selectedItemIds.value.clear();
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

	function openSettings() {
		settingsOpen.value = true;
	}

	function closeSettings() {
		settingsOpen.value = false;
	}

	function toggleSettings() {
		settingsOpen.value = !settingsOpen.value;
	}

	async function fetchDrives() {
		try {
			const res = await getDrives();
			driveCards.value = res.array_of_drives.map(mapDriveInfoToCard);
		} catch (e) {
			console.error('Failed to fetch drives:', e);
		}
	}

	/** Create a placeholder directory entry (optimistic UI before backend call). */
	function createDirectory(): FileEntry {
		const entry: FileEntry = {
			id: `directory-${Date.now()}`,
			name: 'New Directory',
			kind: 'folder',
			category: 'folder',
			typeLabel: 'Directory',
			sizeLabel: '',
			sortSize: 0,
			modifiedAt: new Date().toISOString(),
			preview: '',
			status: 'draft',
			accent: 'sky',
			locationPath: [currentPath.value, 'New Directory'],
			tags: [],
			collaborators: [],
			pinned: false,
		};
		currentEntries.value = [entry, ...currentEntries.value];
		return entry;
	}

	function isPinned(itemId: string): boolean {
		return currentEntries.value.find((e) => e.id === itemId)?.pinned ?? false;
	}

	function togglePinnedForSelection() {
		const firstId = selectedItemIds.value.values().next().value;
		if (!firstId) return;
		const match = currentEntries.value.find((e) => e.id === firstId);
		if (match) match.pinned = !match.pinned;
	}

	function getTabLabel(path: string) {
		if (path === defaultPath) return 'Home';
		if (path === homePath.value) return 'Home';
		if (path === '/trash') return 'Trash';
		if (path === '/drives' || path === '/@drives') return '@drives';
		if (path === '/locations' || path === '/@locations') return '@locations';
		if (path === '/settings' || path === '/@settings') return '@settings';
		return (path + '').split('/').filter(Boolean).pop() || 'New Tab';
	}

	function updateTabPath(tabId: string, path: string) {
		const idx = windowTabs.value.findIndex((t) => t.id === tabId);
		if (idx === -1) return;
		const resolvedPath = path && path.startsWith('@') ? (path === '@drives' ? '/drives' : path) : path;
		const tab = windowTabs.value[idx];
		if (tab) {
			tab.path = resolvedPath;
			tab.sectionId = resolvedPath;
			tab.subtitle = resolvedPath;
			tab.label = getTabLabel(path);
		}
	}

	function updateActiveTabPath(path: string) {
		if (!activeTabId.value) return;
		updateTabPath(activeTabId.value, path);
	}

	function setActiveTab(tabId: string) {
		if (!windowTabs.value.find((t) => t.id === tabId)) return;
		activeTabId.value = tabId;
	}

	function addTab(path: string = defaultPath) {
		const id = `tab-${Date.now()}`;
		// Resolve logical aliases for sectionId/path where applicable
		const resolvedPath = path && path.startsWith('@') ? (path === '@drives' ? '/drives' : path) : path;
		const label = getTabLabel(path);
		windowTabs.value.push({ id, label, path: resolvedPath, sectionId: resolvedPath, subtitle: resolvedPath });
		activeTabId.value = id;
		return id;
	}

	function closeTab(tabId: string) {
		if (windowTabs.value.length <= 1) return;
		const idx = windowTabs.value.findIndex((t) => t.id === tabId);
		if (idx === -1) return;
		const wasActive = activeTabId.value === tabId;
		windowTabs.value.splice(idx, 1);
		if (wasActive) {
			const next = windowTabs.value[Math.max(0, idx - 1)];
			if (next) activeTabId.value = next.id;
		}
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
		if (selectedItemIds.value.size === 0) return false;
		try {
			const paths = Array.from(selectedItemIds.value);
			const success = await deleteFile(paths);
			if (success) {
				selectedItemIds.value.clear();
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
			if (success) await fetchDirectory(currentPath.value);
			return success;
		} catch (e) {
			console.error('Failed to rename item:', e);
			return false;
		}
	}

	async function batchRename(renames: Array<{ oldPath: string; newName: string }>) {
		try {
			// Process renames sequentially to avoid conflicts
			for (const { oldPath, newName } of renames) {
				const parentDir = oldPath.substring(0, oldPath.lastIndexOf('/') + 1);
				const newPath = parentDir + newName;
				const success = await tauriMove(oldPath, newPath);
				if (!success) {
					console.error(`Failed to rename ${oldPath} to ${newName}`);
					return false;
				}
			}
			await fetchDirectory(currentPath.value);
			return true;
		} catch (e) {
			console.error('Failed to batch rename:', e);
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
				const dest = currentPath.value.endsWith('/') ? currentPath.value + name : currentPath.value + '/' + name;

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

	// ── Preview Mode Actions ──────────────────────────────────────────────────
	function setPreviewMode(mode: 'automatic' | 'full' | 'compact' | 'sticky') {
		previewMode.value = mode;
	}

	function setPreferredModeForCategory(category: string, mode: 'automatic' | 'full' | 'compact' | 'sticky') {
		categoryPreferredMode.value[category] = mode;
	}

	function getPreferredModeForCategory(category: string): 'automatic' | 'full' | 'compact' | 'sticky' {
		return categoryPreferredMode.value[category] ?? previewMode.value;
	}

	return {
		// Path & entries
		currentPath,
		currentEntries: sortedAndFilteredEntries,
		navError,
		selectedItem,
		selectedItems,
		selectedItemIds,
		searchQuery,
		viewMode,
		sortMode,
		isLoading,
		isInitialized,

		// Panel state (from usePanelResize)
		detailsOpen: panels.detailsOpen,
		aiChatOpen: panels.aiChatOpen,
		detailsPanelWidth: panels.detailsPanelWidth,
		aiChatPanelWidth: panels.aiChatPanelWidth,
		setDetailsPanelWidth: panels.setDetailsPanelWidth,
		setAiChatPanelWidth: panels.setAiChatPanelWidth,
		reconcileRightPanelWidths: panels.reconcilePanelWidths,
		resetDetailsPanelWidth: panels.resetDetailsPanelWidth,
		resetAiChatPanelWidth: panels.resetAiChatPanelWidth,
		toggleDetails: panels.toggleDetails,
		toggleAiChat: panels.toggleAiChat,

		// Clipboard
		clipboard,

		// Lists & computed
		favoriteItems,
		spotlightItems,
		breadcrumbs,
		workspaceStats,
		activityFeed,
		homePath,
		selectedItemPermissions,
		selectedItemMediaInfo,
		navigationGroups: navigationGroupsWithCounts,
		windowTabs: tabsWithAccent,
		activeTabId,
		setActiveTab,
		updateActiveTabPath,
		driveCards,
		openSettings,
		closeSettings,
		toggleSettings,
		settingsOpen,

		// Preview Mode State
		previewMode,
		categoryPreferredMode,

		// Actions
		initializeHomeDir,
		fetchDirectory,
		refresh,
		fetchDrives,
		openSection,
		selectItem,
		toggleItemSelection,
		selectAllItems,
		clearSelection,
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
		batchRename,
		setClipboard,
		paste,
		setPreviewMode,
		setPreferredModeForCategory,
		getPreferredModeForCategory,
		updateSelectedItemMetadata,
		expandedPreviewId,
		setExpandedPreviewId: (id: string | null) => {
			expandedPreviewId.value = id;
		},
		async saveFileContent(path: string, content: string) {
			try {
				const success = await writeTextFile(path, content);
				if (success) {
					// Refresh entries if needed, or just update the entry in state
					// For now, let's just return success
					return true;
				}
				return false;
			} catch (e) {
				console.error('Failed to save file content:', e);
				return false;
			}
		},
	};
});

if (import.meta.hot) {
	import.meta.hot.accept(acceptHMRUpdate(useFileManagerStore, import.meta.hot));
}
