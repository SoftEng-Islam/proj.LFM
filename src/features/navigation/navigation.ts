import type { DriveCard, NavigationGroup, SectionId, WindowTab } from '@/types/file-manager';

export const navigationGroups: NavigationGroup[] = [
	{
		title: 'Quick Access',
		description: 'The spaces you use daily.',
		items: [
			{ id: 'home', label: 'Home', caption: 'Pinned folders and suggested work', path: '/home', accent: 'sky' },
			{ id: 'projects', label: 'Projects', caption: 'Code, specs, and release folders', path: '/projects', accent: 'emerald' },
			{ id: 'downloads', label: 'Downloads', caption: 'Recent packages and imports', path: '/downloads', accent: 'amber' },
		],
	},
	{
		title: 'Libraries',
		description: 'Structured content areas.',
		items: [
			{ id: 'documents', label: 'Documents', caption: 'Notes, contracts, and reports', path: '/documents', accent: 'violet' },
			{ id: 'media', label: 'Media', caption: 'Photos, videos, and motion assets', path: '/media', accent: 'rose' },
			{ id: 'shared', label: 'Shared', caption: 'Design reviews and cross-team drops', path: '/shared', accent: 'cyan' },
		],
	},
	{
		title: 'System',
		description: 'Maintenance and cleanup.',
		items: [
			{ id: 'trash', label: 'Trash', caption: 'Items waiting for purge or restore', path: '/trash', accent: 'slate' },
		],
	},
];

export const routeSections = navigationGroups.flatMap((group) => group.items);

export const windowTabs: WindowTab[] = [
	{ id: 'tab-home', label: 'Home', path: '/home', sectionId: 'home', subtitle: 'Recent workspace' },
	{ id: 'tab-projects', label: 'Projects', path: '/projects', sectionId: 'projects', subtitle: 'Sprint 21 handoff' },
	{ id: 'tab-shared', label: 'Shared', path: '/shared', sectionId: 'shared', subtitle: 'Review session' },
];

export const driveCards: DriveCard[] = [
	{ id: 'root', label: 'Root', usedLabel: '214 GB used', freeLabel: '298 GB free', usedPercent: 42, accent: 'sky' },
	{ id: 'workspace', label: 'Workspace SSD', usedLabel: '781 GB used', freeLabel: '219 GB free', usedPercent: 78, accent: 'emerald' },
	{ id: 'vault', label: 'Vault NAS', usedLabel: '4.6 TB used', freeLabel: '1.4 TB free', usedPercent: 77, accent: 'violet' },
];

export const defaultSectionId: SectionId = 'home';
