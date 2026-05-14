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
 */
export function createNavigationGroups(home: string): NavigationGroup[] {
	return [
		{
			title: 'Quick Access',
			description: 'The spaces you use daily.',
			items: [
				{ id: 'home', label: 'Home', caption: 'Pinned directories and suggested work', path: home, accent: 'sky' },
				{ id: 'downloads', label: 'Downloads', caption: 'Recent packages and imports', path: `${home}/Downloads`, accent: 'amber' },
			],
		},
		{
			title: 'Libraries',
			description: 'Structured content areas.',
			items: [
				{ id: 'documents', label: 'Documents', caption: 'Notes, contracts, and reports', path: `${home}/Documents`, accent: 'violet' },
				{ id: 'videos', label: 'Videos', caption: 'videos, and motion assets', path: `${home}/Videos`, accent: 'violet' },
				{ id: 'pictures', label: 'Pictures', caption: 'Photos, Images', path: `${home}/Pictures`, accent: 'rose' },
				{ id: 'music', label: 'Music', caption: 'Music, and sound assets', path: `${home}/Music`, accent: 'rose' },
				{ id: 'shared', label: 'Shared', caption: 'Design reviews and cross-team drops', path: `${home}/Public`, accent: 'cyan' },
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
	{ id: 'root', label: 'Root', usedLabel: '— used', freeLabel: '— free', usedPercent: 0, accent: 'sky' },
	{ id: 'workspace', label: 'Workspace SSD', usedLabel: '— used', freeLabel: '— free', usedPercent: 0, accent: 'emerald' },
];
