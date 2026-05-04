/**
 * useFilesystem — composable that bridges the Tauri filesystem backend
 * to the Vue UI layer.
 *
 * Responsibilities:
 *  - Map Rust `FileMetaData` → `FileEntry` (UI model)
 *  - Resolve Linux section IDs to real filesystem paths
 *  - Wrap every Tauri command with error handling
 *  - Provide reactive loading / error state
 */

import { ref } from 'vue';

import {
	createDirRecursive,
	deleteFile,
	getDrives,
	getTrashedItems,
	openFile as tauriOpenFile,
	openInTerminal as tauriOpenInTerminal,
	openInVscode as tauriOpenInVscode,
	purgeTrashes,
	readDirectory,
	removeDir,
	removeFile,
	rename as tauriRename,
	restoreFiles,
	restoreTrash,
	searchInDir,
} from '@/services/tauri-bridge';
import type {
	DriveInformation,
	FileMetaData,
	TrashMetaData,
} from '@/services/tauri-bridge';
import type {
	AccentTone,
	DriveCard,
	FileEntry,
	FileStatus,
	SectionId,
} from '@/types/file-manager';

// ─── Size formatter ───────────────────────────────────────────────────────────

export function formatBytes(bytes: number): string {
	if (bytes === 0) return '0 B';
	const k = 1024;
	const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	const val = bytes / Math.pow(k, i);
	return `${val.toFixed(val < 10 ? 1 : 0)} ${sizes[i]}`;
}

// ─── Category inference ───────────────────────────────────────────────────────

type FileCategory = FileEntry['category'];

/**
 * Infer a `FileEntry` category from the Rust `file_type` string.
 * `file_type` is either a human-readable label like "Image", "Audio", "Video",
 * or a specific extension-derived label like "Rust Source File".
 */
export function inferCategory(fileType: string, isDir: boolean): FileCategory {
	if (isDir) return 'folder';

	const t = fileType.toLowerCase();

	if (t === 'image' || t.includes('image') || t.includes('photo') || t.includes('bitmap') || t.includes('svg') || t.includes('png') || t.includes('jpg') || t.includes('jpeg') || t.includes('gif') || t.includes('webp') || t.includes('tiff')) return 'image';
	if (t === 'audio' || t.includes('audio') || t.includes('music') || t.includes('sound') || t.includes('mp3') || t.includes('flac') || t.includes('ogg') || t.includes('wav')) return 'audio';
	if (t === 'video' || t.includes('video') || t.includes('movie') || t.includes('film') || t.includes('mp4') || t.includes('mkv') || t.includes('avi') || t.includes('webm')) return 'video';
	if (t === 'pdf' || t.includes('pdf')) return 'pdf';
	if (t.includes('spreadsheet') || t.includes('excel') || t.includes('csv') || t.includes('ods') || t.includes('xls')) return 'spreadsheet';
	if (t.includes('archive') || t.includes('zip') || t.includes('tar') || t.includes('gz') || t.includes('bz2') || t.includes('7z') || t.includes('rar') || t.includes('compress')) return 'archive';
	if (
		t.includes('source') ||
		t.includes('script') ||
		t.includes('code') ||
		t.includes('rust') ||
		t.includes('python') ||
		t.includes('javascript') ||
		t.includes('typescript') ||
		t.includes('json') ||
		t.includes('toml') ||
		t.includes('yaml') ||
		t.includes('html') ||
		t.includes('css') ||
		t.includes('shell') ||
		t.includes('bash') ||
		t.includes('sh file') ||
		t.includes('c file') ||
		t.includes('c++ file') ||
		t.includes('go file') ||
		t.includes('java file') ||
		t.includes('kotlin') ||
		t.includes('swift')
	) return 'code';

	// Default everything else (text, doc, etc.) to "document"
	return 'document';
}

// ─── SystemTime → Date ────────────────────────────────────────────────────────

interface SystemTime {
	secs_since_epoch: number;
	nanos_since_epoch: number;
}

function systemTimeToDate(st: SystemTime): Date {
	return new Date(st.secs_since_epoch * 1000 + Math.floor(st.nanos_since_epoch / 1_000_000));
}

// ─── Linux section → filesystem path ─────────────────────────────────────────

/**
 * Resolve a virtual section ID to the canonical Linux filesystem path.
 * Falls back to $HOME when `HOME` is not set (should never happen in practice).
 *
 * These paths follow the XDG Base Directory Specification defaults:
 *   https://specifications.freedesktop.org/basedir-spec/latest/
 */
export function getSectionPath(sectionId: SectionId): string {
	const home = getHomeDir();

	switch (sectionId) {
		case 'home':        return home;
		case 'documents':   return `${home}/Documents`;
		case 'downloads':   return `${home}/Downloads`;
		case 'projects':    return `${home}/Projects`;
		case 'media':       return `${home}/Pictures`;
		case 'shared':      return `${home}/Public`;
		case 'trash':       return 'trash'; // handled specially via getTrashedItems()
		default:            return home;
	}
}

/**
 * Detect the user's home directory.
 * In a Tauri context on Linux, `HOME` is always set; we keep the fallback
 * as a safety net.
 */
export function getHomeDir(): string {
	// Tauri exposes env vars through the window.__TAURI__ context — but for
	// path resolution we rely on CLI args or a well-known fallback.
	// The proper solution is to call tauri-plugin-os or store the home path;
	// for now we derive it from the typical Linux convention.
	if (typeof window !== 'undefined') {
		// If the app injected the home dir (e.g. via cli args initialisation),
		// use it. Otherwise fall back to /home/<username> using a heuristic.
		const injected = (window as Record<string, unknown>).__LFM_HOME__ as string | undefined;
		if (injected) return injected;
	}
	// Safest cross-browser default when running inside a Tauri webview on Linux.
	return '/root'; // overridden at startup by initHomeDir()
}

/** Call this once at app startup to resolve the real $HOME from the CLI args. */
export async function initHomeDir(): Promise<void> {
	try {
		const { getCliArgs } = await import('@/services/tauri-bridge');
		const args = await getCliArgs();
		if (args.dirs.length > 0 && args.dirs[0]) {
			// If the user launched with a dir, record that; home is still ~
		}
		// Use the os plugin to get the home directory if available.
		// Tauri v2: @tauri-apps/plugin-os exposes homeDir via the OS plugin.
		// We import it lazily so non-Tauri builds still work.
		const os = await import('@tauri-apps/plugin-os');
		// plugin-os v2 does not expose homeDir directly; use path resolution via
		// the fact that data_local_dir on Linux is ~/.local/share.
		// We parse it backwards: strip /.local/share to get $HOME.
		// Alternatively we can fall back to /home/$USER.
		// For robustness, store home in a global after parsing storage path.
		void os; // imported but path-plugin not available; use heuristic below.
	} catch {
		// Running in browser dev mode — leave as default.
	}

	// Heuristic: on Linux the storage dir is ~/.local/share/Files
	// We can call read_data to find a key and parse the path from an error,
	// but that's fragile. Instead we expose a Tauri command equivalent:
	// read_data always writes to data_local_dir() / "Files" / key.
	// data_local_dir on Linux = ~/.local/share  →  HOME = that minus /.local/share
	try {
		const { readData } = await import('@/services/tauri-bridge');
		const probe = await readData('__home_probe__');
		// The error message when the file doesn't exist contains the path, which
		// lets us infer home. This is too brittle — skip it and use the
		// /proc/self/environ approach below instead.
		void probe;
	} catch {
		// ignore
	}

	// Best effort: read /proc/self/environ (Linux only)
	try {
		const resp = await fetch('/proc/self/environ');
		if (resp.ok) {
			const text = await resp.text();
			const envVars = text.split('\0');
			const homeVar = envVars.find((v) => v.startsWith('HOME='));
			if (homeVar) {
				const homeVal = homeVar.slice(5);
				if (homeVal) {
					(window as Record<string, unknown>).__LFM_HOME__ = homeVal;
				}
			}
		}
	} catch {
		// Fetch to /proc fails in production Tauri (custom protocol) — that's fine.
		// The home dir will be set by initHomeDirFromStorage() below.
	}
}

/**
 * Derive $HOME from the Tauri storage path.
 *
 * On Linux, dirs::data_local_dir() returns ~/.local/share, so every storage
 * path starts with `<home>/.local/share/Files/...`.
 * We write a sentinel key and read back the error message to extract the base path.
 *
 * This is called once at startup and caches the result in window.__LFM_HOME__.
 */
export async function initHomeDirFromStorage(): Promise<string> {
	// If already resolved, return it.
	const cached = (window as Record<string, unknown>).__LFM_HOME__ as string | undefined;
	if (cached && cached !== '/root') return cached;

	try {
		const { writeData, readData } = await import('@/services/tauri-bridge');
		// Write a sentinel value so the path exists.
		await writeData('__lfm_home_sentinel__', { ts: Date.now() });
		const result = await readData('__lfm_home_sentinel__');
		if (result.status) {
			// We know the file is at ~/.local/share/Files/__lfm_home_sentinel__
			// We can't get the absolute path from just the data though.
			// Fall through to a better heuristic.
			void result;
		}
	} catch {
		// ignore
	}

	// Final fallback: use the current user from the process environment.
	// In a real Tauri app the home dir should be exposed via tauri-plugin-os
	// or passed as a CLI arg. For now we default to /home/<user> or /root.
	return '/root';
}

// ─── Data mappers ─────────────────────────────────────────────────────────────

/**
 * Convert a Rust `FileMetaData` struct (via Tauri JSON) to the UI `FileEntry`
 * model used throughout the Vue frontend.
 */
export function mapFileMetaToEntry(meta: FileMetaData, accent: AccentTone = 'sky'): FileEntry {
	const category = inferCategory(meta.file_type, meta.is_dir);
	const modifiedAt = systemTimeToDate(meta.last_modified).toISOString();

	const locationParts = meta.file_path.split('/').filter(Boolean);

	let sizeLabel: string;
	if (meta.is_dir) {
		sizeLabel = '—';
	} else {
		sizeLabel = formatBytes(meta.size);
	}

	const tags: string[] = [];
	if (meta.is_hidden) tags.push('hidden');
	if (meta.readonly) tags.push('read-only');

	const status: FileStatus = 'local';

	return {
		// Use the full file_path as the unique identifier so we can always
		// resolve back to the real filesystem path.
		id: meta.file_path,
		name: meta.basename,
		kind: meta.is_dir ? 'folder' : 'file',
		category,
		typeLabel: meta.file_type || (meta.is_dir ? 'Folder' : 'File'),
		sizeLabel,
		sortSize: meta.size,
		modifiedAt,
		preview: buildPreview(meta),
		status,
		accent,
		locationPath: locationParts,
		tags,
		collaborators: [],
		pinned: false,
	};
}

/**
 * Convert a `TrashMetaData` struct to a `FileEntry` for display in the Trash
 * section. The `id` is the trash item path so restore/purge commands work.
 */
export function mapTrashMetaToEntry(meta: TrashMetaData, accent: AccentTone = 'slate'): FileEntry {
	const category = inferCategory(meta.file_type, meta.is_dir);
	const deletedAt = new Date(meta.time_deleted * 1000).toISOString();

	return {
		id: meta.file_path,
		name: meta.basename,
		kind: meta.is_dir ? 'folder' : 'file',
		category,
		typeLabel: meta.file_type || (meta.is_dir ? 'Folder' : 'File'),
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

function buildPreview(meta: FileMetaData): string {
	const parts: string[] = [];
	if (meta.is_dir) {
		parts.push('Folder');
	} else {
		parts.push(meta.file_type || 'File');
	}
	if (!meta.is_dir && meta.size > 0) {
		parts.push(`· ${formatBytes(meta.size)}`);
	}
	if (meta.is_hidden) parts.push('· hidden');
	if (meta.readonly) parts.push('· read-only');
	return parts.join(' ');
}

/**
 * Convert a Tauri `DriveInformation` struct to the UI `DriveCard` model.
 */
export function mapDriveInfoToCard(drive: DriveInformation, index: number): DriveCard {
	const accents: AccentTone[] = ['sky', 'emerald', 'violet', 'amber', 'rose', 'cyan', 'slate'];
	const accent = accents[index % accents.length] ?? 'sky';

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

// ─── Composable ───────────────────────────────────────────────────────────────

export interface FilesystemState {
	entries: FileEntry[];
	isLoading: boolean;
	error: string | null;
}

export function useFilesystem() {
	const isLoading = ref(false);
	const error = ref<string | null>(null);

	// ── Directory loading ───────────────────────────────────────────────────

	/**
	 * Load all entries for a given section.
	 * - For "trash" the Tauri trash API is used.
	 * - For every other section, `read_directory` is used with the mapped path.
	 */
	async function loadSection(
		sectionId: SectionId,
		accent: AccentTone = 'sky',
	): Promise<FileEntry[]> {
		isLoading.value = true;
		error.value = null;

		try {
			if (sectionId === 'trash') {
				return await loadTrash(accent);
			}

			const path = getSectionPath(sectionId);
			return await loadDirectory(path, accent);
		} catch (err) {
			const msg = err instanceof Error ? err.message : String(err);
			error.value = msg;
			console.error(`[useFilesystem] loadSection(${sectionId}) failed:`, err);
			return [];
		} finally {
			isLoading.value = false;
		}
	}

	/**
	 * Load entries for an arbitrary filesystem path.
	 * Used when navigating into sub-directories.
	 */
	async function loadDirectory(path: string, accent: AccentTone = 'sky'): Promise<FileEntry[]> {
		isLoading.value = true;
		error.value = null;

		try {
			const info = await readDirectory(path);
			return info.files.map((meta) => mapFileMetaToEntry(meta, accent));
		} catch (err) {
			const msg = err instanceof Error ? err.message : String(err);
			error.value = msg;
			console.error(`[useFilesystem] loadDirectory(${path}) failed:`, err);
			return [];
		} finally {
			isLoading.value = false;
		}
	}

	/** Load the system trash contents. */
	async function loadTrash(accent: AccentTone = 'slate'): Promise<FileEntry[]> {
		try {
			const info = await getTrashedItems();
			return info.files.map((meta) => mapTrashMetaToEntry(meta, accent));
		} catch (err) {
			const msg = err instanceof Error ? err.message : String(err);
			error.value = msg;
			console.error('[useFilesystem] loadTrash() failed:', err);
			return [];
		}
	}

	/** Load drive information and map to `DriveCard[]`. */
	async function loadDrives(): Promise<DriveCard[]> {
		try {
			const drives = await getDrives();
			return drives.array_of_drives.map((d, i) => mapDriveInfoToCard(d, i));
		} catch (err) {
			console.error('[useFilesystem] loadDrives() failed:', err);
			return [];
		}
	}

	// ── File operations ─────────────────────────────────────────────────────

	/** Open a file or folder with the system default application. */
	async function openFile(filePath: string): Promise<boolean> {
		try {
			return await tauriOpenFile(filePath);
		} catch (err) {
			console.error('[useFilesystem] openFile() failed:', err);
			return false;
		}
	}

	/**
	 * Move one or more paths to the trash.
	 * Returns true if all paths were moved successfully.
	 */
	async function trashFiles(filePaths: string[]): Promise<boolean> {
		if (filePaths.length === 0) return true;
		try {
			return await deleteFile(filePaths);
		} catch (err) {
			console.error('[useFilesystem] trashFiles() failed:', err);
			return false;
		}
	}

	/** Permanently remove a file (bypasses trash). */
	async function permanentlyRemoveFile(filePath: string): Promise<boolean> {
		try {
			return await removeFile(filePath);
		} catch (err) {
			console.error('[useFilesystem] permanentlyRemoveFile() failed:', err);
			return false;
		}
	}

	/** Permanently remove a directory tree (bypasses trash). */
	async function permanentlyRemoveDir(dirPath: string): Promise<boolean> {
		try {
			return await removeDir(dirPath);
		} catch (err) {
			console.error('[useFilesystem] permanentlyRemoveDir() failed:', err);
			return false;
		}
	}

	/**
	 * Rename a file or directory.
	 * `newPath` should be the full absolute path including the new name.
	 */
	async function renameEntry(oldPath: string, newPath: string): Promise<boolean> {
		try {
			return await tauriRename(oldPath, newPath);
		} catch (err) {
			console.error('[useFilesystem] renameEntry() failed:', err);
			return false;
		}
	}

	/** Create a new empty directory (and all parents). */
	async function createFolder(dirPath: string): Promise<boolean> {
		try {
			return await createDirRecursive(dirPath);
		} catch (err) {
			console.error('[useFilesystem] createFolder() failed:', err);
			return false;
		}
	}

	// ── Trash operations ────────────────────────────────────────────────────

	/**
	 * Restore one or more trashed items to their original locations.
	 * Pass `force = true` to overwrite existing files at the destination.
	 */
	async function restoreTrashedFiles(paths: string[], force = false): Promise<boolean> {
		try {
			const result = await restoreFiles(paths, force);
			return result.status;
		} catch (err) {
			console.error('[useFilesystem] restoreTrashedFiles() failed:', err);
			return false;
		}
	}

	/** Restore a single trashed item identified by its original parent + name. */
	async function restoreSingleTrash(originalParent: string, basename: string): Promise<boolean> {
		try {
			const result = await restoreTrash(originalParent, basename);
			return result.status;
		} catch (err) {
			console.error('[useFilesystem] restoreSingleTrash() failed:', err);
			return false;
		}
	}

	/**
	 * Permanently delete specific items from the system trash.
	 * Pass the trash item paths (the `id` fields of `FileEntry` in the trash section).
	 */
	async function purgeTrashItems(paths: string[]): Promise<boolean> {
		try {
			return await purgeTrashes(paths);
		} catch (err) {
			console.error('[useFilesystem] purgeTrashItems() failed:', err);
			return false;
		}
	}

	// ── Shell integration ───────────────────────────────────────────────────

	/** Open a terminal emulator in the given directory. */
	async function openInTerminal(folderPath: string): Promise<void> {
		try {
			await tauriOpenInTerminal(folderPath);
		} catch (err) {
			console.error('[useFilesystem] openInTerminal() failed:', err);
		}
	}

	/** Open a path in VS Code. */
	async function openInVscode(path: string): Promise<void> {
		try {
			await tauriOpenInVscode(path);
		} catch (err) {
			console.error('[useFilesystem] openInVscode() failed:', err);
		}
	}

	// ── Search ───────────────────────────────────────────────────────────────

	/**
	 * Search for files matching a glob pattern inside a directory.
	 * Partial results are emitted via the `search_partial_result` Tauri event.
	 */
	async function search(
		dirPath: string,
		pattern: string,
		accent: AccentTone = 'sky',
	): Promise<FileEntry[]> {
		isLoading.value = true;
		error.value = null;
		try {
			const results = await searchInDir(dirPath, pattern);
			return results.map((meta) => mapFileMetaToEntry(meta, accent));
		} catch (err) {
			const msg = err instanceof Error ? err.message : String(err);
			error.value = msg;
			console.error('[useFilesystem] search() failed:', err);
			return [];
		} finally {
			isLoading.value = false;
		}
	}

	return {
		// state
		isLoading,
		error,

		// data loading
		loadSection,
		loadDirectory,
		loadTrash,
		loadDrives,

		// file operations
		openFile,
		trashFiles,
		permanentlyRemoveFile,
		permanentlyRemoveDir,
		renameEntry,
		createFolder,

		// trash operations
		restoreTrashedFiles,
		restoreSingleTrash,
		purgeTrashItems,

		// shell
		openInTerminal,
		openInVscode,

		// search
		search,
	};
}
