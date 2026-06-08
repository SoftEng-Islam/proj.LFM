/**
 * Tauri Bridge — typed wrappers for every Rust command exposed by the backend.
 *
 * All frontend code should import from here instead of calling `invoke` directly.
 * This keeps the contract between the frontend and the Rust backend in one place.
 *
 * Import convention:
 *   import { readDirectory, getDrives } from '@/services/tauri-bridge';
 */

import { invoke, convertFileSrc } from "@tauri-apps/api/core";
export { convertFileSrc };

// ─── Shared Types ────────────────────────────────────────────────────────────

/**
 * Rust's std::time::SystemTime serialises via serde as:
 *   { secs_since_epoch: u64, nanos_since_epoch: u32 }
 */
export interface SystemTime {
    secs_since_epoch: number;
    nanos_since_epoch: number;
}

export interface FileMetaData {
    file_path: string;
    basename: string;
    file_type: string;
    is_dir: boolean;
    is_hidden: boolean;
    is_file: boolean;
    is_system: boolean;
    size: number;
    readonly: boolean;
    last_modified: SystemTime;
    last_accessed: SystemTime;
    created: SystemTime;
    is_trash: boolean;
}

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

export interface TrashMetaData {
    file_path: string;
    basename: string;
    file_type: string;
    original_parent: string;
    /** Unix timestamp (i64) — seconds since epoch */
    time_deleted: number;
    is_trash: boolean;
    is_dir: boolean;
    is_hidden: boolean;
    is_file: boolean;
    is_system: boolean;
    size: number;
    readonly: boolean;
    last_modified: SystemTime;
    last_accessed: SystemTime;
    created: SystemTime;
}

export interface LnkData {
    file_path: string;
    icon: string;
}

export interface FolderInformation {
    number_of_files: number;
    files: FileMetaData[];
    skipped_files: string[];
    lnk_files: LnkData[];
}

export interface TrashInformation {
    files: TrashMetaData[];
}

/**
 * Returned by restore_trash / restore_files.
 * NOTE: copy and rename return a plain bool in the current Rust implementation.
 */
export interface ReturnInformation {
    status: boolean;
    message: string;
    request_confirmation: boolean;
}

export interface DriveInformation {
    name: string;
    mount_point: string;
    total_space: number;
    available_space: number;
    is_removable: boolean;
    disk_type: string;
    file_system: string;
}

export interface Drives {
    array_of_drives: DriveInformation[];
}

export interface StorageData {
    data: unknown;
    status: boolean;
}

// Config types — re-exported from the canonical schema file
export type {
    LfmConfigAppearance,
    LfmConfigBehavior,
    LfmConfigExplorer,
    LfmConfigShortcuts,
    LfmConfigTerminal,
    LfmConfig,
} from "@/schemas/config.schema";
import type { LfmConfig } from "@/schemas/config.schema";

export interface CliArgs {
    dirs: string[];
    is_reveal: boolean;
    custom_style_sheet: unknown;
}

// ─── Directory & File Queries ────────────────────────────────────────────────

/** Read a directory and return its contents and metadata. */
export function readDirectory(path: string): Promise<FolderInformation> {
    return invoke("read_directory", { dir: path });
}

/** Return file metadata for a single path. */
export function getFileMetaData(filePath: string): Promise<FileMetaData> {
    return invoke("get_file_meta_data", { filePath });
}

/** Get detailed file properties (size, perms, timestamps). */
export function getFileProperties(filePath: string): Promise<FileMetaData> {
    return invoke("get_file_properties", { filePath });
}

/** Get detailed Unix file permissions (mode, owner, group). */
export function getFilePermissions(filePath: string): Promise<FilePermissions> {
    return invoke("get_file_permissions", { filePath });
}

export function setFilePermissions(filePath: string, mode: number): Promise<boolean> {
    return invoke("set_file_permissions", { filePath, mode });
}

/** Get technical media info (dimensions, duration, codecs). */
export function getMediaInfo(filePath: string): Promise<MediaInfo> {
    return invoke("get_media_info", { filePath });
}

/**
 * Return a flat array of file path strings inside a directory (non-recursive).
 * NOTE: The Rust command returns Vec<String>, not Vec<FileMetaData>.
 */
export function getFilesInDirectory(dir: string): Promise<string[]> {
    return invoke("get_files_in_directory", { dir });
}

/** Check whether a path points to a directory. */
export function isDir(path: string): Promise<boolean> {
    return invoke("is_dir", { path });
}

/** Check whether a file path exists on disk. */
export function fileExist(filePath: string): Promise<boolean> {
    return invoke("file_exist", { filePath });
}

/** Get the total size (bytes) of a directory recursively. */
export function getDirSize(dir: string): Promise<number> {
    return invoke("get_dir_size", { dir });
}

export function getDirectoryCount(dir: string): Promise<number> {
    return invoke("get_directory_count", { dir });
}

/** Sum sizes of multiple files/directories. */
export function calculateFilesTotalSize(files: string[]): Promise<number> {
    return invoke("calculate_files_total_size", { files });
}

// ─── File Operations ─────────────────────────────────────────────────────────

/** Open a file with the system default application. Returns whether it succeeded. */
export function openFile(filePath: string): Promise<boolean> {
    return invoke("open_file", { filePath });
}

/** Create an empty file at the given path. Returns true on success. */
export function createFile(filePath: string): Promise<boolean> {
    return invoke("create_file", { filePath });
}

/** Create a directory and all its parents. Returns true on success. */
export function createDirRecursive(dirPath: string): Promise<boolean> {
    return invoke("create_dir_recursive", { dirPath });
}

/**
 * Rename / move a file or directory.
 * NOTE: The Rust command is `rename(path, new_path)` and returns bool (not ReturnInformation).
 */
export function rename(path: string, newPath: string): Promise<boolean> {
    return invoke("rename", { path, newPath });
}

/**
 * Copy a single file to a new location.
 * NOTE: The Rust command is `copy(src, dest)` and returns bool (not ReturnInformation).
 *       There is no overwrite flag — callers must handle conflicts manually.
 */
export function copy(src: string, dest: string): Promise<boolean> {
    return invoke("copy", { src, dest });
}

/**
 * Permanently delete a file (bypasses trash).
 * Returns true on success.
 */
export function removeFile(path: string): Promise<boolean> {
    return invoke("remove_file", { path });
}

/**
 * Permanently delete a directory tree (bypasses trash).
 * Returns true on success.
 */
export function removeDir(path: string): Promise<boolean> {
    return invoke("remove_dir", { path });
}

/**
 * Move one or more paths to the system trash.
 * NOTE: The Rust command accepts Vec<String>, so always pass an array.
 * Returns true on success.
 */
export function deleteFile(paths: string[]): Promise<boolean> {
    return invoke("delete_file", { paths });
}

/** Compress a list of files/directories into a single zip archive. */
export function compressToZip(files: string[]): Promise<void> {
    return invoke("compress_to_zip", { files });
}

export function readTextFile(filePath: string): Promise<string> {
    return invoke("read_text_file", { filePath });
}

/** Write content to a text file. */
export function writeTextFile(filePath: string, content: string): Promise<boolean> {
    return invoke("write_text_file", { filePath, content });
}

/** Extract a zip archive into a target directory. */
export function decompressFromZip(zipPath: string, targetDir: string): Promise<void> {
    return invoke("decompress_from_zip", { zipPath, targetDir });
}

// ─── Trash ───────────────────────────────────────────────────────────────────

/** Return all items currently in the system trash. */
export function getTrashedItems(): Promise<TrashInformation> {
    return invoke("get_trashed_items");
}

/**
 * Restore one or more trashed files to their original locations.
 * NOTE: Rust param is `paths: Vec<String>` and `force: bool`.
 */
export function restoreFiles(paths: string[], force: boolean): Promise<ReturnInformation> {
    return invoke("restore_files", { paths, force });
}

/**
 * Restore a single trashed item identified by its original parent and basename.
 * NOTE: Rust params are `original_parent: String` and `basename: String`.
 */
export function restoreTrash(originalParent: string, basename: string): Promise<ReturnInformation> {
    return invoke("restore_trash", { originalParent, basename });
}

/**
 * Permanently delete specific items from the system trash.
 * NOTE: The Rust command accepts Vec<String> of trash item paths.
 */
export function purgeTrashes(paths: string[]): Promise<boolean> {
    return invoke("purge_trashes", { paths });
}

// ─── Search ──────────────────────────────────────────────────────────────────

/**
 * Search for files matching a glob pattern inside a directory.
 * Results are streamed via the `search_partial_result` event; this resolves
 * with the final batch once the search completes.
 */
export function searchInDir(dirPath: string, pattern: string): Promise<FileMetaData[]> {
    return invoke("search_in_dir", { dirPath, pattern });
}

// ─── Directory Watching ───────────────────────────────────────────────────────

/**
 * Start watching a directory for filesystem changes.
 * Changes are emitted via the `changes` event (Event { path, event }).
 * Emit `unlisten_dir` to stop watching.
 */
export function listenDir(dir: string): Promise<string> {
    return invoke("listen_dir", { dir });
}

// ─── Drives ──────────────────────────────────────────────────────────────────

/** Return information about all mounted drives/disks. */
export function getDrives(): Promise<Drives> {
    return invoke("get_drives");
}

// ─── Storage (key-value persistence) ─────────────────────────────────────────

/** Persist a JSON-serialisable value under the given key. */
export function writeData(key: string, value: unknown): Promise<void> {
    return invoke("write_data", { key, value });
}

/** Read the value previously stored under the given key. */
export function readData(key: string): Promise<StorageData> {
    return invoke("read_data", { key });
}

/** Remove a stored key from disk. */
export function deleteStorageData(key: string): Promise<void> {
    return invoke("delete_storage_data", { key });
}
export function getConfig(): Promise<LfmConfig> {
    return invoke("get_config");
}

export function saveConfig(config: LfmConfig): Promise<boolean> {
    return invoke("save_config", { config });
}

/**
 * Start watching `~/.config/LFM/config.toml` for external changes.
 * When the file changes, the backend emits a `config_file_changed` event
 * with the freshly-parsed config as payload.
 */
export function watchConfigFile(): Promise<void> {
    return invoke("watch_config_file");
}
// ─── System / Shell ──────────────────────────────────────────────────────────

/** Open a terminal emulator in the given directory. */
export function openInTerminal(folderPath: string): Promise<void> {
    return invoke("open_in_terminal", { folderPath });
}

export interface GitStatus {
    branch: string;
    is_repo: boolean;
    modified_count: number;
    staged_count: number;
    untracked_count: number;
}

export function getGitStatus(folderPath: string): Promise<GitStatus> {
    return invoke("get_git_status", { folderPath });
}

export interface TerminalCommandResponse {
    stdout: string;
    stderr: string;
    exit_code: number;
}

export function runTerminalCommand(cwd: string, command: string): Promise<TerminalCommandResponse> {
    return invoke("run_terminal_command", { cwd, command });
}

/** Open a path in Visual Studio Code. */
export function openInVscode(path: string): Promise<void> {
    return invoke("open_in_vscode", { path });
}

/** Check whether VS Code is available on the system PATH. */
export function checkVscodeInstalled(): Promise<boolean> {
    return invoke("check_vscode_installed");
}

/** Return a list of all font family names installed on the system. */
export function getAvailableFonts(): Promise<string[]> {
    return invoke("get_available_fonts");
}

/** Return the current user's home directory path. */
export function getHomeDir(): Promise<string> {
    return invoke("get_home_dir");
}

/**
 * Extract the icon embedded in a Windows executable (.exe).
 * Always returns an error string on Linux/macOS — callers should catch and ignore.
 */
export function extractIcon(filePath: string): Promise<string> {
    return invoke("extract_icon", { filePath });
}

/**
 * Generate or retrieve a cached thumbnail image for a video file.
 * Returns the absolute path to the generated .jpg thumbnail.
 */
export function getVideoThumbnail(videoPath: string): Promise<string> {
    return invoke("get_video_thumbnail", { videoPath });
}

/**
 * Generate or retrieve a cached thumbnail image for an image file using Rust.
 * Returns the absolute path to the generated .jpg thumbnail.
 */
export function getImageThumbnail(imagePath: string): Promise<string> {
    return invoke("get_image_thumbnail", { imagePath });
}

// ─── Window effects (Windows / macOS only — no-op on Linux) ──────────────────

/** Apply a transparency effect to the window. No-op on Linux. */
export function changeTransparentEffect(effect: string): Promise<void> {
    return invoke("change_transparent_effect", { effect });
}

/** Enable or disable a drop shadow around the window. No-op on Linux. */
export function enableShadowEffect(effect: boolean): Promise<void> {
    return invoke("enable_shadow_effect", { effect });
}

// ─── Extensions / CLI ────────────────────────────────────────────────────────

import { getCurrentWindow } from "@tauri-apps/api/window";

/** Return the parsed CLI arguments passed when the app was launched. */
export function getCliArgs(): Promise<CliArgs> {
    return invoke("get_cli_args");
}

/**
 * Start watching a custom stylesheet file for changes.
 * Changes are emitted via the `stylesheet_changes` event.
 */
export function listenStylesheetChange(): Promise<void> {
    return invoke("listen_stylesheet_change");
}

// ─── Window Controls ────────────────────────────────────────────────────────

/** Minimize the current application window. */
export async function minimizeWindow(): Promise<void> {
    await getCurrentWindow().minimize();
}

/** Toggle between maximized and restored window states. */
export async function toggleMaximize(): Promise<void> {
    await getCurrentWindow().toggleMaximize();
}

/** Close the current application window. */
export async function closeWindow(): Promise<void> {
    await getCurrentWindow().close();
}
