/**
 * Drive Icon Data
 * Contains SVG paths and color definitions for different drive types.
 */

export const DRIVE_COLORS = {
	// Internal drives - usually neutral/system colors
	system: '#5c5c5c',
	gray: '#6b6b6b',
	nvme: '#4a5568',
	sata: '#4a5568',
	
	// Root drive - distinct teal/cyan for root filesystem
	root: '#00979d',
	
	// External drives - colorful to distinguish from internal
	usb: '#3b82f6',
	external: '#8b5cf6',
	hdd: '#f59e0b',
	ssd: '#10b981',
	sdcard: '#ec4899',
	
	// Network drives
	network: '#06b6d4',
	
	// Custom color support
	blue: '#3b82f6',
	red: '#ef4444',
	green: '#22c55e',
	yellow: '#eab308',
	orange: '#f97316',
	purple: '#a855f7',
	pink: '#ec4899',
} as const;

export type DriveColor = keyof typeof DRIVE_COLORS | string;

/** Type of drive for determining icon style */
export type DriveType = 
	| 'root'      // Root filesystem /
	| 'internal' // Internal drive (HDD, SSD, NVMe)
	| 'usb'      // USB flash drive
	| 'external' // External HDD/SSD
	| 'sdcard'   // SD card
	| 'network'  // Network drive
	| 'removable'; // Removable media

/** Drive metadata */
export interface DriveInfo {
	/** Unique identifier for the drive */
	id: string;
	/** Display name */
	name: string;
	/** Drive type for icon selection */
	type: DriveType;
	/** Mount point path */
	mountPoint: string;
	/** Total size in bytes */
	totalSize?: number;
	/** Available size in bytes */
	availableSize?: number;
	/** Filesystem type (e.g., ext4, ntfs, vfat) */
	filesystem?: string;
	/** Whether the drive is mounted */
	isMounted?: boolean;
}

/** SVG paths for different drive states */
export const DRIVE_STATES = {
	/** Mounted (active) */
	mounted: {
		indicator: '#22c55e',
		indicatorOpacity: '1',
	},
	/** Unmounted (inactive) */
	unmounted: {
		indicator: '#6b7280',
		indicatorOpacity: '0.5',
	},
	/** Ejecting */
	ejecting: {
		indicator: '#f59e0b',
		indicatorOpacity: '0.8',
	},
	/** Error */
	error: {
		indicator: '#ef4444',
		indicatorOpacity: '1',
	},
};