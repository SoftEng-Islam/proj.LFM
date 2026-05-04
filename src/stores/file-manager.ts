import { computed, ref, watch } from 'vue';
import { useStorage } from '@vueuse/core';
import { acceptHMRUpdate, defineStore } from 'pinia';

import { activityLibrary, seededEntries } from '@/features/explorer/workspace';
import { defaultSectionId, driveCards, navigationGroups, windowTabs } from '@/features/navigation/navigation';
import type {
	ActivityEntry,
	BreadcrumbSegment,
	DriveCard,
	FileEntry,
	NavigationGroup,
	SectionId,
	SortMode,
	ViewMode,
	WindowTab,
	WorkspaceStat
} from '@/types/file-manager';

const viewModeKey = 'lfm-view-mode';
const sortModeKey = 'lfm-sort-mode';
const previewPaneKey = 'lfm-preview-pane';

function cloneSeedEntries(): Record<SectionId, FileEntry[]> {
	return structuredClone(seededEntries);
}

export const useFileManagerStore = defineStore('file-manager', () => {
	const currentSectionId = ref<SectionId>(defaultSectionId);
	const entriesBySection = ref<Record<SectionId, FileEntry[]>>(cloneSeedEntries());
	const searchQuery = ref('');
	const selectedItemId = ref<string | null>(null);
	const viewMode = useStorage<ViewMode>(viewModeKey, 'grid');
	const sortMode = useStorage<SortMode>(sortModeKey, 'modified');
	const previewOpen = useStorage(previewPaneKey, true);

	const currentSection = computed(() => {
		for (const group of navigationGroups) {
			const match = group.items.find((item) => item.id === currentSectionId.value);
			if (match) {
				return match;
			}
		}

		return navigationGroups[0]!.items[0]!;
	});

	const navigationGroupsWithCounts = computed<NavigationGroup[]>(() =>
		navigationGroups.map((group) => ({
			...group,
			items: group.items.map((item) => ({
				...item,
				count: entriesBySection.value[item.id]?.length ?? 0
			}))
		}))
	);

	const tabsWithAccent = computed<WindowTab[]>(() =>
		windowTabs.map((tab) => ({
			...tab,
			accent:
				navigationGroupsWithCounts.value
					.flatMap((group) => group.items)
					.find((item) => item.id === tab.sectionId)?.accent ?? 'slate'
		}))
	);

	const currentEntries = computed(() => {
		const source = [...(entriesBySection.value[currentSectionId.value] ?? [])];
		const query = searchQuery.value.trim().toLowerCase();
		const filtered = query
			? source.filter((entry) => {
					const haystack = [entry.name, entry.preview, entry.typeLabel, ...entry.tags].join(' ').toLowerCase();
					return haystack.includes(query);
				})
			: source;

		return filtered.sort((left, right) => {
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
			const match = currentEntries.value.find((entry) => entry.id === selectedItemId.value);
			if (match) {
				return match;
			}
		}

		return currentEntries.value[0] ?? null;
	});

	const favoriteItems = computed(() =>
		Object.values(entriesBySection.value)
			.flatMap((items) => items)
			.filter((entry) => entry.pinned)
			.slice(0, 4)
	);

	const spotlightItems = computed(() => {
		const spotlight = currentEntries.value.filter((entry) => entry.kind === 'folder' || entry.pinned).slice(0, 3);
		return spotlight.length ? spotlight : currentEntries.value.slice(0, 3);
	});

	const breadcrumbs = computed<BreadcrumbSegment[]>(() => {
		const base: BreadcrumbSegment[] = [
			{ label: 'LFM', path: '/home' },
			{ label: currentSection.value.label, path: currentSection.value.path }
		];

		if (selectedItem.value) {
			base.push({ label: selectedItem.value.name });
		}

		return base;
	});

	const workspaceStats = computed<WorkspaceStat[]>(() => {
		const current = entriesBySection.value[currentSectionId.value] ?? [];
		const folderCount = current.filter((entry) => entry.kind === 'folder').length;
		const sharedCount = current.filter((entry) => entry.status === 'shared').length;
		const pinnedCount = current.filter((entry) => entry.pinned).length;

		return [
			{ label: 'Folders', value: String(folderCount), helper: 'Structured work areas', accent: currentSection.value.accent },
			{ label: 'Shared', value: String(sharedCount), helper: 'Cross-team surfaces', accent: 'cyan' },
			{ label: 'Pinned', value: String(pinnedCount), helper: 'Always visible items', accent: 'rose' }
		];
	});

	const activityFeed = computed<ActivityEntry[]>(() => {
		if (selectedItem.value) {
			const activity = activityLibrary[selectedItem.value.id];
			if (activity) {
				return activity;
			}
		}

		return [
			{ id: 'fallback-1', title: 'Selection ready', summary: 'This item is staged for preview, sharing, or a native open action.', timeLabel: 'Now', tone: 'info' },
			{ id: 'fallback-2', title: 'Metadata indexed', summary: 'Name, tags, and timestamps are already surfaced in the inspector pane.', timeLabel: 'Today', tone: 'success' },
			{ id: 'fallback-3', title: 'Native action pending', summary: 'Hook this row up to Tauri commands when the filesystem bridge is connected.', timeLabel: 'Next', tone: 'attention' }
		];
	});

	watch(
		currentEntries,
		(nextEntries) => {
			if (!nextEntries.some((entry) => entry.id === selectedItemId.value)) {
				selectedItemId.value = nextEntries[0]?.id ?? null;
			}
		},
		{ immediate: true }
	);

	function openSection(sectionId: SectionId) {
		currentSectionId.value = sectionId;
		searchQuery.value = '';
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
		const targetSection = currentSectionId.value === 'trash' ? 'projects' : currentSectionId.value;
		const label = `New Folder ${entriesBySection.value[targetSection].length + 1}`;
		const createdAt = new Date().toISOString();
		const folder: FileEntry = {
			id: `folder-${Date.now()}`,
			name: label,
			kind: 'folder',
			category: 'folder',
			typeLabel: 'Fresh folder',
			sizeLabel: '0 items',
			sortSize: 0,
			modifiedAt: createdAt,
			preview: 'Freshly created folder ready for drag-and-drop grouping, tagging, and native open actions.',
			status: 'draft',
			accent: currentSection.value.accent,
			locationPath: ['LFM', currentSection.value.label, label],
			tags: ['new'],
			collaborators: ['You'],
			pinned: false
		};

		entriesBySection.value[targetSection] = [folder, ...entriesBySection.value[targetSection]];
		if (currentSectionId.value !== targetSection) {
			currentSectionId.value = targetSection;
		}
		selectedItemId.value = folder.id;
		return folder;
	}

	function togglePinnedForSelection() {
		if (!selectedItem.value) {
			return;
		}

		const collection = entriesBySection.value[currentSectionId.value];
		const match = collection.find((entry) => entry.id === selectedItem.value?.id);
		if (match) {
			match.pinned = !match.pinned;
			match.status = match.pinned ? 'favorite' : 'synced';
		}
	}

	function sectionCount(sectionId: SectionId) {
		return entriesBySection.value[sectionId]?.length ?? 0;
	}

	return {
		currentSectionId,
		currentSection,
		currentEntries,
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
		openSection,
		selectItem,
		setSearchQuery,
		setViewMode,
		togglePreviewPane,
		cycleSortMode,
		createFolder,
		togglePinnedForSelection,
		sectionCount
	};
});

if (import.meta.hot) {
	import.meta.hot.accept(acceptHMRUpdate(useFileManagerStore, import.meta.hot));
}
