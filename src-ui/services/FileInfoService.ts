/**
 * FileInfoService — centralised OOP service for file metadata helpers.
 *
 * All formatting and permission-parsing logic lives here so components and
 * composables never need to duplicate these calculations.
 */

/** Octal permission bits for a single rwx group (owner, group, other). */
export interface PermissionBits {
	read: boolean;
	write: boolean;
	execute: boolean;
}

/** Parsed representation of a Unix permission mode (e.g. 0o755). */
export interface ParsedPermissions {
	owner: PermissionBits;
	group: PermissionBits;
	other: PermissionBits;
	octal: string;
}

export class FileInfoService {
	// ── Formatting ─────────────────────────────────────────────────────────────

	/**
	 * Format a byte count into a human-readable size string.
	 * Returns `-` when the value is falsy.
	 */
	static formatSize(bytes?: number | null): string {
		if (!bytes) return '-';
		const units = ['B', 'KB', 'MB', 'GB', 'TB'];
		let value = bytes;
		let i = 0;
		while (value >= 1024 && i < units.length - 1) {
			value /= 1024;
			i++;
		}
		return `${value.toFixed(1)} ${units[i]}`;
	}

	/**
	 * Format an ISO date-string into a localised display string.
	 * Returns `-` when the value is falsy.
	 */
	static formatDate(dateStr?: string | null): string {
		if (!dateStr) return '-';
		return new Intl.DateTimeFormat('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		}).format(new Date(dateStr));
	}

	/**
	 * Format a duration in seconds to `[HH:]MM:SS`.
	 * Returns `-` when the value is falsy.
	 */
	static formatDuration(seconds?: number | null): string {
		if (!seconds) return '-';
		const h = Math.floor(seconds / 3600);
		const m = Math.floor((seconds % 3600) / 60);
		const s = Math.floor(seconds % 60);
		return [h, m, s]
			.map((v) => v.toString().padStart(2, '0'))
			.join(':')
			.replace(/^00:/, '');
	}

	/**
	 * Format a bitrate (bits per second) into a readable string.
	 * Returns `-` when the value is falsy.
	 */
	static formatBitrate(bitrate?: number | null): string {
		if (!bitrate) return '-';
		if (bitrate >= 1_000_000) return `${(bitrate / 1_000_000).toFixed(2)} Mbps`;
		if (bitrate >= 1_000) return `${(bitrate / 1_000).toFixed(2)} kbps`;
		return `${bitrate} bps`;
	}

	/**
	 * Format an audio sample rate (Hz) as kHz.
	 * Returns `-` when the value is falsy.
	 */
	static formatSampleRate(rate?: number | null): string {
		if (!rate) return '-';
		return `${(rate / 1000).toFixed(1)} kHz`;
	}

	// ── Permissions ────────────────────────────────────────────────────────────

	/**
	 * Parse a numeric Unix mode (e.g. from `fs::Permissions::mode()`) into
	 * a structured `ParsedPermissions` object including the octal string.
	 *
	 * Note: The Linux kernel stores the full mode including the file-type bits
	 * in the upper 16 bits. The lower 12 bits are the permission bits, and the
	 * lower 9 are the classic rwx rwx rwx triple.
	 */
	static parseMode(mode: number): ParsedPermissions {
		// Mask off file-type bits — keep only the lower 12 permission bits.
		const bits = mode & 0o7777;
		return {
			owner: {
				read: !!(bits & (4 << 6)),
				write: !!(bits & (2 << 6)),
				execute: !!(bits & (1 << 6)),
			},
			group: {
				read: !!(bits & (4 << 3)),
				write: !!(bits & (2 << 3)),
				execute: !!(bits & (1 << 3)),
			},
			other: {
				read: !!(bits & 4),
				write: !!(bits & 2),
				execute: !!(bits & 1),
			},
			octal: (bits & 0o777).toString(8).padStart(3, '0'),
		};
	}

	/**
	 * Build a numeric permission mode from individual rwx booleans.
	 */
	static buildMode(
		ownerRead: boolean,
		ownerWrite: boolean,
		ownerExecute: boolean,
		groupRead: boolean,
		groupWrite: boolean,
		groupExecute: boolean,
		otherRead: boolean,
		otherWrite: boolean,
		otherExecute: boolean
	): number {
		let mode = 0;
		if (ownerRead) mode |= 4 << 6;
		if (ownerWrite) mode |= 2 << 6;
		if (ownerExecute) mode |= 1 << 6;
		if (groupRead) mode |= 4 << 3;
		if (groupWrite) mode |= 2 << 3;
		if (groupExecute) mode |= 1 << 3;
		if (otherRead) mode |= 4;
		if (otherWrite) mode |= 2;
		if (otherExecute) mode |= 1;
		return mode;
	}

	/**
	 * Parse an octal string (e.g. "755") into individual rwx booleans.
	 * Returns `null` if the string is not a valid octal permission string.
	 */
	static parseOctalString(value: string): ParsedPermissions | null {
		const num = parseInt(value, 8);
		if (isNaN(num)) return null;
		return FileInfoService.parseMode(num);
	}
}
