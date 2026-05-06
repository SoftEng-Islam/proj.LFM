import type { DriveCard, NavigationGroup, WindowTab } from '@/types/file-manager';

export const navigationGroups: NavigationGroup[] = [
	{
		title: 'Quick Access',
		description: 'The spaces you use daily.',
		items: [
			{ id: 'home', label: 'Home', caption: 'Pinned folders and suggested work', path: '/home/softeng', accent: 'sky' },
			{ id: 'projects', label: 'Projects', caption: 'Code, specs, and release folders', path: '/home/softeng/workspace', accent: 'emerald' },
			{ id: 'downloads', label: 'Downloads', caption: 'Recent packages and imports', path: '/home/softeng/Downloads', accent: 'amber' },
		],
	},
	{
		title: 'Libraries',
		description: 'Structured content areas.',
		items: [
			{ id: 'documents', label: 'Documents', caption: 'Notes, contracts, and reports', path: '/home/softeng/Documents', accent: 'violet' },
			{ id: 'media', label: 'Media', caption: 'Photos, videos, and motion assets', path: '/home/softeng/Pictures', accent: 'rose' },
			{ id: 'shared', label: 'Shared', caption: 'Design reviews and cross-team drops', path: '/home/softeng/Public', accent: 'cyan' },
		],
	},
	{
		title: 'System',
		description: 'Maintenance and cleanup.',
		items: [
			{ id: 'trash', label: 'Trash', caption: 'Items waiting for purge or restore', path: '/home/softeng/.local/share/Trash', accent: 'slate' },
		],
	},
];

export const windowTabs: WindowTab[] = [
	{ id: 'tab-home', label: 'Home', path: '/home/softeng', sectionId: '/home/softeng', subtitle: 'Recent workspace' },
];

export const driveCards: DriveCard[] = [
	{ id: 'root', label: 'Root', usedLabel: '214 GB used', freeLabel: '298 GB free', usedPercent: 42, accent: 'sky' },
	{ id: 'workspace', label: 'Workspace SSD', usedLabel: '781 GB used', freeLabel: '219 GB free', usedPercent: 78, accent: 'emerald' },
	{ id: 'vault', label: 'Vault NAS', usedLabel: '4.6 TB used', freeLabel: '1.4 TB free', usedPercent: 77, accent: 'violet' },
];

export const defaultPath: string = '/home/softeng';
