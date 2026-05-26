/**
 * Data mappers — convert Rust backend structs to LFM UI models.
 *
 * All mapping logic lives here so that:
 *  - The composable only handles reactive state and loading
 *  - The utils handle pure formatting/inference
 *  - This layer is the boundary between the backend contract and the UI model
 */

import { convertFileSrc } from '@/services/tauri-bridge';
import type { DriveInformation, FileMetaData, TrashMetaData } from '@/services/tauri-bridge';
import type { AccentTone, DriveCard, FileEntry, FileStatus } from '@/types/file-manager';
import { inferCategory } from '@/utils/file-category';
import { formatBytes } from '@/utils/format';
import { systemTimeToIso } from '@/utils/time';

// ─── Drive display helpers ───────────────────────────────────────────────────

function driveAccent(type: DriveCard['driveType']): AccentTone {
	if (type === 'root') return 'sky';
	if (type === 'usb' || type === 'removable' || type === 'sdcard') return 'amber';
	if (type === 'ssd') return 'emerald';
	if (type === 'network') return 'cyan';
	return 'slate';
}

function inferDriveType(drive: DriveInformation): DriveCard['driveType'] {
	const haystack = `${drive.name} ${drive.mount_point} ${drive.disk_type} ${drive.file_system}`.toLowerCase();

	if (drive.mount_point === '/') return 'root';
	if (haystack.includes('nfs') || haystack.includes('cifs') || haystack.includes('smb')) return 'network';
	if (haystack.includes('mmc') || haystack.includes('sd card') || haystack.includes('sdcard')) return 'sdcard';
	if (drive.is_removable && haystack.includes('ssd')) return 'ssd';
	if (drive.is_removable && haystack.includes('hdd')) return 'hdd';
	if (drive.is_removable || haystack.includes('usb')) return 'usb';
	if (haystack.includes('ssd') || haystack.includes('nvme')) return 'ssd';
	if (haystack.includes('hdd') || haystack.includes('sata')) return 'hdd';

	return 'internal';
}

function buildDriveLabel(drive: DriveInformation, index: number): string {
	if (drive.mount_point === '/') return 'Root';

	const mountParts = drive.mount_point.split('/').filter(Boolean);
	const lastMountPart = mountParts[mountParts.length - 1];
	if (lastMountPart) return lastMountPart.charAt(0).toUpperCase() + lastMountPart.slice(1);

	return `Drive ${index + 1}`;
}

// ─── Preview builder ──────────────────────────────────────────────────────────

function buildPreviewText(meta: FileMetaData): string {
	const parts: string[] = [];

	if (meta.is_dir) {
		parts.push('Directory');
	} else {
		parts.push(meta.file_type || 'File');
		if (meta.size > 0) parts.push(`· ${formatBytes(meta.size)}`);
	}

	if (meta.is_hidden) parts.push('· hidden');
	if (meta.readonly) parts.push('· read-only');

	return parts.join(' ');
}

// ─── Public mappers ───────────────────────────────────────────────────────────

/**
 * Convert a Rust `FileMetaData` struct to the UI `FileEntry` model.
 * The full `file_path` is used as the unique ID so we can always resolve
 * back to the real filesystem path.
 */
export function mapFileMetaToEntry(meta: FileMetaData, accent: AccentTone = 'sky'): FileEntry {
	const category = inferCategory(meta.file_type, meta.is_dir);
	const modifiedAt = systemTimeToIso(meta.last_modified);
	const createdAt = systemTimeToIso(meta.created);
	const accessedAt = systemTimeToIso(meta.last_accessed);
	const locationParts = meta.file_path.split('/').filter(Boolean);

	const tags: string[] = [];
	if (meta.is_hidden) tags.push('hidden');
	if (meta.readonly) tags.push('read-only');

	const status: FileStatus = 'local';

	// Use convertFileSrc for image previews so Tauri can serve the file
	let preview = buildPreviewText(meta);
	if (category === 'image') {
		preview = convertFileSrc(meta.file_path);
	}

	return {
		id: meta.file_path,
		name: meta.basename,
		kind: meta.is_dir ? 'folder' : 'file',
		category,
		typeLabel: meta.file_type || (meta.is_dir ? 'Directory' : 'File'),
		sizeLabel: meta.is_dir ? '—' : formatBytes(meta.size),
		sortSize: meta.size,
		modifiedAt,
		createdAt,
		accessedAt,
		readonly: meta.readonly,
		isHidden: meta.is_hidden,
		preview,
		status,
		accent,
		locationPath: locationParts,
		tags,
		collaborators: [],
		pinned: false,
	};
}

/**
 * Convert a `TrashMetaData` struct to a `FileEntry` for the Trash section.
 * The trash item path is used as the ID so restore/purge commands work correctly.
 */
export function mapTrashMetaToEntry(meta: TrashMetaData, accent: AccentTone = 'slate'): FileEntry {
	const category = inferCategory(meta.file_type, meta.is_dir);
	const deletedAt = new Date(meta.time_deleted * 1000).toISOString();

	return {
		id: meta.file_path,
		name: meta.basename,
		kind: meta.is_dir ? 'folder' : 'file',
		category,
		typeLabel: meta.file_type || (meta.is_dir ? 'Directory' : 'File'),
		sizeLabel: meta.is_dir ? '—' : formatBytes(meta.size),
		sortSize: meta.size,
		modifiedAt: deletedAt,
		isHidden: meta.is_hidden,
		preview: `Originally in ${meta.original_parent}`,
		status: 'local',
		accent,
		locationPath: [meta.original_parent, meta.basename],
		tags: ['trash'],
		collaborators: [],
		pinned: false,
	};
}

/**
 * Convert a Tauri `DriveInformation` struct to the UI `DriveCard` model.
 * Accent color cycles through the predefined palette based on drive index.
 */
export function mapDriveInfoToCard(drive: DriveInformation, index: number): DriveCard {
	const driveType = inferDriveType(drive);
	const accent = driveAccent(driveType);
	const usedBytes = drive.total_space - drive.available_space;
	const usedPercent = drive.total_space > 0 ? Math.round((usedBytes / drive.total_space) * 100) : 0;
	const totalLabel = formatBytes(drive.total_space);
	const filesystem = drive.file_system || 'unknown';
	const label = buildDriveLabel(drive, index);
	const deviceLabel = drive.mount_point === '/' ? 'Root filesystem' : drive.disk_type || `Drive ${index + 1}`;
	const pathId = drive.mount_point === '/' ? '/root' : drive.mount_point;
	const mountParts = drive.mount_point.split('/').filter(Boolean);
	const mountName = drive.mount_point === '/' ? 'Root' : mountParts[mountParts.length - 1] || 'Drive';
	const devicePath = drive.name ? `/dev/${drive.name}` : drive.disk_type || `Drive ${index + 1}`;

	return {
		id: pathId,
		label,
		usedLabel: `${formatBytes(usedBytes)} used`,
		freeLabel: `${formatBytes(drive.available_space)} free`,
		usedPercent,
		accent,
		deviceLabel,
		mountPoint: drive.mount_point,
		mountName,
		devicePath,
		filesystem,
		driveType,
		capacityLabel: `${totalLabel} ${filesystem}`,
		isMounted: true,
		isRemovable: drive.is_removable,
	};
}
