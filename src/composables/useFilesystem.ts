/**
 * useFilesystem — composable that bridges the Tauri filesystem backend
 * to the Vue UI layer.
 *
 * Responsibilities:
 *  - Reactive loading / error state
 *  - Directory and trash loading (delegates mapping to `@/services/mappers`)
 *  - File operations (delete, rename, create, restore)
 *  - Shell integration (terminal, VS Code)
 *  - Search
 *
 * Data mapping:  @/services/mappers
 * Formatting:    @/utils/format
 * Path helpers:  getHomeDir, getSectionPath (exported below)
 */

import { ref } from 'vue';

import {
	createDirRecursive,
	deleteFile,
	getDrives,
	getHomeDir as tauriGetHomeDir,
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
import { mapDriveInfoToCard, mapFileMetaToEntry, mapTrashMetaToEntry } from '@/services/mappers';
import type { AccentTone, DriveCard, FileEntry, SectionId } from '@/types/file-manager';

// ─── Home directory resolution ────────────────────────────────────────────────

/**
 * Detect the user's home directory.
 *
 * In a Tauri context on Linux, the home dir is resolved at startup via
 * `initHomeDirFromStorage`. Until that resolves, this returns a safe fallback.
 */
export function getHomeDir(): string {
	if (typeof window !== 'undefined') {
		const injected = (window as { __LFM_HOME__?: string }).__LFM_HOME__;
		if (injected) return injected;
	}
	// Overridden at startup by initHomeDirFromStorage()
	return '/';
}

/**
 * Resolve a virtual section ID to the canonical Linux filesystem path.
 * Follows the XDG Base Directory Specification defaults.
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
 * Derive $HOME from the Tauri storage path and cache it in `window.__LFM_HOME__`.
 * Call once at app startup.
 */
export async function initHomeDirFromStorage(): Promise<string> {
	const cached = (window as { __LFM_HOME__?: string }).__LFM_HOME__;
	if (cached && cached !== '/') return cached;

	try {
		const homeVal = await tauriGetHomeDir();
		if (homeVal) {
			(window as { __LFM_HOME__?: string }).__LFM_HOME__ = homeVal;
			return homeVal;
		}
	} catch (err) {
		console.error('[useFilesystem] initHomeDirFromStorage failed:', err);
	}

	return '/';
}

// ─── Composable ───────────────────────────────────────────────────────────────

export function useFilesystem() {
	const isLoading = ref(false);
	const error = ref<string | null>(null);

	// ── Directory loading ───────────────────────────────────────────────────

	/**
	 * Load all entries for a given section.
	 * - For "trash": uses the Tauri trash API.
	 * - For all others: uses `read_directory` with the mapped path.
	 */
	async function loadSection(sectionId: SectionId, accent: AccentTone = 'sky'): Promise<FileEntry[]> {
		isLoading.value = true;
		error.value = null;

		try {
			if (sectionId === 'trash') return await loadTrash(accent);
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

	/** Load entries for an arbitrary filesystem path. */
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

	/** Open a file with the system default application. */
	async function openFile(filePath: string): Promise<boolean> {
		try {
			return await tauriOpenFile(filePath);
		} catch (err) {
			console.error('[useFilesystem] openFile() failed:', err);
			return false;
		}
	}

	/** Move one or more paths to the trash. */
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
	 * `newPath` must be the full absolute path including the new name.
	 */
	async function renameEntry(oldPath: string, newPath: string): Promise<boolean> {
		try {
			return await tauriRename(oldPath, newPath);
		} catch (err) {
			console.error('[useFilesystem] renameEntry() failed:', err);
			return false;
		}
	}

	/** Create a new directory (and all parents). */
	async function createDirectory(dirPath: string): Promise<boolean> {
		try {
			return await createDirRecursive(dirPath);
		} catch (err) {
			console.error('[useFilesystem] createDirectory() failed:', err);
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

	/** Permanently delete specific items from the system trash. */
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
	async function openInTerminal(dirPath: string): Promise<void> {
		try {
			await tauriOpenInTerminal(dirPath);
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
	async function search(dirPath: string, pattern: string, accent: AccentTone = 'sky'): Promise<FileEntry[]> {
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
		// State
		isLoading,
		error,

		// Data loading
		loadSection,
		loadDirectory,
		loadTrash,
		loadDrives,

		// File operations
		openFile,
		trashFiles,
		permanentlyRemoveFile,
		permanentlyRemoveDir,
		renameEntry,
		createDirectory,

		// Trash operations
		restoreTrashedFiles,
		restoreSingleTrash,
		purgeTrashItems,

		// Shell
		openInTerminal,
		openInVscode,

		// Search
		search,
	};
}
