/**
 * Navigation data — defines the sidebar navigation groups, default path, and
 * static drive card placeholders used before real drive data is fetched.
 *
 * Paths use `getHomeDir()` so they work for any Linux user, not just /home/user.
 */

import type { DriveCard, NavigationGroup, WindowTab } from '@/types/file-manager';
import { getHomeDir } from '@/composables/useFilesystem';

/**
 * Default fallback path.
 * NOTE: This is a static value used as a starting point.
 * The store will update currentPath once the real home dir is detected.
 */
export const defaultPath: string = '/';

/**
 * Generate navigation groups based on a specific home directory.
 *
 * Guards against producing `//Downloads` paths when `home` is `/` or empty
 * by normalising the home path before building XDG directory paths.
 */
export function createNavigationGroups(home: string): NavigationGroup[] {
	// Ensure we never concatenate an extra slash when home is bare root.
	const normalizedHome = home.endsWith('/') ? home.slice(0, -1) : home;

	return [
		{
			title: 'Quick Access',
			description: 'The spaces you use daily.',
			items: [
				{ id: 'home', label: 'Home', caption: 'Pinned directories and suggested work', path: normalizedHome || '/', accent: 'sky' },
				{ id: 'downloads', label: 'Downloads', caption: 'Recent packages and imports', path: `${normalizedHome}/Downloads`, accent: 'amber' },
			],
		},
		{
			title: 'Libraries',
			description: 'Structured content areas.',
			items: [
				{ id: 'documents', label: 'Documents', caption: 'Notes, contracts, and reports', path: `${normalizedHome}/Documents`, accent: 'violet' },
				{ id: 'videos', label: 'Videos', caption: 'videos, and motion assets', path: `${normalizedHome}/Videos`, accent: 'violet' },
				{ id: 'pictures', label: 'Pictures', caption: 'Photos, Images', path: `${normalizedHome}/Pictures`, accent: 'rose' },
				{ id: 'music', label: 'Music', caption: 'Music, and sound assets', path: `${normalizedHome}/Music`, accent: 'rose' },
				{ id: 'shared', label: 'Shared', caption: 'Design reviews and cross-team drops', path: `${normalizedHome}/Public`, accent: 'cyan' },
			],
		},
		{
			title: 'System',
			description: 'Maintenance and cleanup.',
			items: [{ id: 'trash', label: 'Trash', caption: 'Items waiting for purge or restore', path: '/trash', accent: 'slate' }],
		},
	];
}

/** Initial tab — replaced at runtime once the real home dir resolves. */
export function createInitialTabs(home: string): WindowTab[] {
	return [{ id: 'tab-home', label: 'Home', path: home, sectionId: home, subtitle: 'Recent workspace' }];
}

/**
 * Static drive card placeholders — shown before `fetchDrives()` resolves.
 */
export const driveCards: DriveCard[] = [
	{
		id: '/root',
		label: 'Root',
		usedLabel: '— used',
		freeLabel: '— free',
		usedPercent: 0,
		accent: 'sky',
		deviceLabel: 'System',
		mountPoint: '/',
		filesystem: 'detecting',
		driveType: 'root',
		capacityLabel: 'Detecting capacity',
		isMounted: true,
		isRemovable: false,
	},
];
