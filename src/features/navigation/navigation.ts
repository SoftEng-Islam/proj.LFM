/**
 * Navigation data — defines the sidebar navigation groups, default path, and
 * static drive card placeholders used before real drive data is fetched.
 *
 * Paths use `getHomeDir()` so they work for any Linux user, not just /home/softeng.
 */

import type { DriveCard, NavigationGroup, WindowTab } from '@/types/file-manager';
import { getHomeDir } from '@/composables/useFilesystem';

const home = getHomeDir();

export const defaultPath: string = home;

export const navigationGroups: NavigationGroup[] = [
	{
		title: 'Quick Access',
		description: 'The spaces you use daily.',
		items: [
			{ id: 'home',      label: 'Home',      caption: 'Pinned directories and suggested work', path: home,                   accent: 'sky'     },
			{ id: 'projects',  label: 'Projects',  caption: 'Code, specs, and release directories',  path: `${home}/workspace`,    accent: 'emerald' },
			{ id: 'downloads', label: 'Downloads', caption: 'Recent packages and imports',           path: `${home}/Downloads`,    accent: 'amber'   },
		],
	},
	{
		title: 'Libraries',
		description: 'Structured content areas.',
		items: [
			{ id: 'documents', label: 'Documents', caption: 'Notes, contracts, and reports',         path: `${home}/Documents`,    accent: 'violet'  },
			{ id: 'media',     label: 'Media',     caption: 'Photos, videos, and motion assets',     path: `${home}/Pictures`,     accent: 'rose'    },
			{ id: 'shared',    label: 'Shared',    caption: 'Design reviews and cross-team drops',   path: `${home}/Public`,       accent: 'cyan'    },
		],
	},
	{
		title: 'System',
		description: 'Maintenance and cleanup.',
		items: [
			{ id: 'trash', label: 'Trash', caption: 'Items waiting for purge or restore', path: `${home}/.local/share/Trash`, accent: 'slate' },
		],
	},
];

/** Initial tab — replaced at runtime once the real home dir resolves. */
export const windowTabs: WindowTab[] = [
	{ id: 'tab-home', label: 'Home', path: home, sectionId: home, subtitle: 'Recent workspace' },
];

/**
 * Static drive card placeholders — shown before `fetchDrives()` resolves.
 * The real drive list is fetched from Tauri on mount and replaces these.
 */
export const driveCards: DriveCard[] = [
	{ id: 'root',      label: 'Root',         usedLabel: '— used',   freeLabel: '— free',   usedPercent: 0,  accent: 'sky'     },
	{ id: 'workspace', label: 'Workspace SSD', usedLabel: '— used',   freeLabel: '— free',   usedPercent: 0,  accent: 'emerald' },
];
