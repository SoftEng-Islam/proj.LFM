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

// ─── Accent cycle for drives ──────────────────────────────────────────────────

const DRIVE_ACCENTS: AccentTone[] = ['sky', 'emerald', 'violet', 'amber', 'rose', 'cyan', 'slate'];

function cycleAccent(index: number): AccentTone {
	return DRIVE_ACCENTS[index % DRIVE_ACCENTS.length] ?? 'sky';
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
	const accent = cycleAccent(index);
	const usedBytes = drive.total_space - drive.available_space;
	const usedPercent =
		drive.total_space > 0 ? Math.round((usedBytes / drive.total_space) * 100) : 0;

	return {
		id: drive.mount_point,
		label: drive.name || drive.mount_point,
		usedLabel: `${formatBytes(usedBytes)} used`,
		freeLabel: `${formatBytes(drive.available_space)} free`,
		usedPercent,
		accent,
	};
}
