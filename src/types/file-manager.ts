export type UiTheme = 'light' | 'dark';
export type SectionId = string;
export type ViewMode = 'grid' | 'list';
export type SortMode = 'name' | 'modified' | 'size' | 'kind';
export type AccentTone = 'sky' | 'emerald' | 'amber' | 'violet' | 'rose' | 'cyan' | 'slate';
export type FileStatus = 'synced' | 'shared' | 'draft' | 'favorite' | 'local' | 'recent';
export type PreviewMode = 'automatic' | 'full' | 'compact' | 'sticky';
export type FileCategory =
	| 'image'
	| 'video'
	| 'audio'
	| 'code'
	| 'markdown'
	| 'pdf'
	| 'font'
	| 'document'
	| 'folder'
	| 'archive'
	| 'spreadsheet'
	| 'default';

export interface FilePermissions {
	mode: number;
	owner: string;
	group: string;
	readonly: boolean;
}

export interface MediaInfo {
	width: number | null;
	height: number | null;
	duration: number | null;
	container: string | null;
	video_codec: string | null;
	audio_codec: string | null;
	bitrate: number | null;
	video_bitrate: number | null;
	audio_bitrate: number | null;
	frame_rate: number | null;
	sample_rate: number | null;
	channels: number | null;
}

export interface BreadcrumbSegment {
	label: string;
	path?: string;
}

export interface NavigationItem {
	id: SectionId;
	label: string;
	caption: string;
	path: string;
	accent: AccentTone;
	count?: number;
}

export interface NavigationGroup {
	title: string;
	description: string;
	items: NavigationItem[];
}

export interface WindowTab {
	id: string;
	label: string;
	subtitle: string;
	path: string;
	sectionId: SectionId;
	accent?: AccentTone;
}

export interface DriveCard {
	id: string;
	label: string;
	usedLabel: string;
	freeLabel: string;
	usedPercent: number;
	accent: AccentTone;
	deviceLabel: string;
	mountPoint: string;
	mountName: string;
	devicePath: string;
	filesystem: string;
	driveType: 'root' | 'internal' | 'hdd' | 'ssd' | 'usb' | 'external' | 'sdcard' | 'network' | 'removable';
	capacityLabel: string;
	isMounted: boolean;
	isRemovable: boolean;
}

export interface FileEntry {
	id: string;
	name: string;
	kind: 'folder' | 'file';
	category: string;
	typeLabel: string;
	sizeLabel: string;
	sortSize: number;
	modifiedAt: string;
	createdAt?: string;
	accessedAt?: string;
	readonly?: boolean;
	preview: string;
	status: FileStatus;
	accent: AccentTone;
	locationPath: string[];
	tags: string[];
	collaborators: string[];
	pinned: boolean;
}

export interface ActivityEntry {
	id: string;
	title: string;
	summary: string;
	timeLabel: string;
	tone: 'success' | 'info' | 'attention';
}

export interface WorkspaceStat {
	label: string;
	value: string;
	helper: string;
	accent: AccentTone;
}
