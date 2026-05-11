/**
 * File category inference for the LFM UI layer.
 *
 * Maps a Rust `file_type` string (e.g. "Image", "Rust Source File") to one of
 * the known `FileEntry` category values used by the frontend.
 */

import type { FileEntry } from '@/types/file-manager';

type FileCategory = FileEntry['category'];

/** Known file extensions grouped by category. */
const IMAGE_HINTS = ['image', 'photo', 'bitmap', 'svg', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'tiff'];
const AUDIO_HINTS = ['audio', 'music', 'sound', 'mp3', 'flac', 'ogg', 'wav'];
const VIDEO_HINTS = ['video', 'movie', 'film', 'mp4', 'mkv', 'avi', 'webm'];
const ARCHIVE_HINTS = ['archive', 'zip', 'tar', 'gz', 'bz2', '7z', 'rar', 'compress'];
const SPREADSHEET_HINTS = ['spreadsheet', 'excel', 'csv', 'ods', 'xls'];
const CODE_HINTS = [
	'source', 'script', 'code', 'rust', 'python', 'javascript', 'typescript',
	'json', 'toml', 'yaml', 'html', 'css', 'shell', 'bash', 'sh file',
	'c file', 'c++ file', 'go file', 'java file', 'kotlin', 'swift',
];

function matchesAny(haystack: string, hints: string[]): boolean {
	return hints.some((hint) => haystack.includes(hint));
}

/**
 * Infer a `FileEntry` category from the Rust `file_type` string and `is_dir` flag.
 *
 * @param fileType - Human-readable label from the Rust backend (e.g. "Image", "Video")
 * @param isDir    - Whether the entry is a directory
 */
export function inferCategory(fileType: string, isDir: boolean): FileCategory {
	if (isDir) return 'folder';

	const t = fileType.toLowerCase();

	if (t === 'image' || matchesAny(t, IMAGE_HINTS)) return 'image';
	if (t === 'audio' || matchesAny(t, AUDIO_HINTS)) return 'audio';
	if (t === 'video' || matchesAny(t, VIDEO_HINTS)) return 'video';
	if (t === 'pdf' || t.includes('pdf')) return 'pdf';
	if (matchesAny(t, SPREADSHEET_HINTS)) return 'spreadsheet';
	if (matchesAny(t, ARCHIVE_HINTS)) return 'archive';
	if (matchesAny(t, CODE_HINTS)) return 'code';

	return 'document';
}
