/**
 * Formatting utilities for the LFM UI layer.
 * These are pure functions with no side effects.
 */

/**
 * Convert a raw byte count into a human-readable string.
 * Examples: 0 → "0 B", 1536 → "1.5 KB", 1073741824 → "1 GB"
 */
export function formatBytes(bytes: number): string {
	if (bytes === 0) return '0 B';
	const k = 1024;
	const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	const val = bytes / Math.pow(k, i);
	return `${val.toFixed(val < 10 ? 1 : 0)} ${sizes[i]}`;
}
