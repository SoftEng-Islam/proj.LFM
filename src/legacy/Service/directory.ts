import { listen } from '@tauri-apps/api/event';

import {
    readDirectory,
    getFilesInDirectory,
    getFileMetaData,
    getFileProperties,
    getDirSize,
    calculateFilesTotalSize,
    isDir,
    fileExist,
    createFile,
    createDirRecursive,
    searchInDir,
    type FileMetaData,
    type FolderInformation,
} from '@/services/tauri-bridge';

export type { FileMetaData, FolderInformation };

/**
 * Read a directory and return full folder information including all file entries.
 */
export async function openDirectory(path: string): Promise<FolderInformation> {
    return readDirectory(path);
}

/**
 * Return a flat list of file metadata entries inside a directory.
 */
export async function listDirectory(path: string): Promise<FileMetaData[]> {
    return getFilesInDirectory(path);
}

/**
 * Return metadata for a single file or directory path.
 */
export async function statPath(path: string): Promise<FileMetaData> {
    return getFileMetaData(path);
}

/**
 * Return detailed file properties (permissions, timestamps, size breakdown).
 */
export async function propertiesOf(filePath: string): Promise<FileMetaData> {
    return getFileProperties(filePath);
}

/**
 * Check whether the given path is a directory.
 */
export async function checkIsDir(path: string): Promise<boolean> {
    return isDir(path);
}

/**
 * Check whether the given file path exists on disk.
 */
export async function checkExists(filePath: string): Promise<boolean> {
    return fileExist(filePath);
}

/**
 * Get the total size (in bytes) of a directory and all its contents.
 */
export async function sizeOfDir(path: string): Promise<number> {
    return getDirSize(path);
}

/**
 * Calculate the combined size (in bytes) of multiple files or directories.
 */
export async function totalSizeOf(paths: string[]): Promise<number> {
    return calculateFilesTotalSize(paths);
}

/**
 * Create an empty file at the given path.
 */
export async function touchFile(filePath: string): Promise<void> {
    return createFile(filePath);
}

/**
 * Create a directory, creating all missing parent directories as needed.
 */
export async function mkdirAll(dirPath: string): Promise<void> {
    return createDirRecursive(dirPath);
}

/**
 * Search for files matching a glob pattern inside a directory.
 *
 * @param dirPath  - Root directory to search from (use "Files://Home" for global home search)
 * @param pattern  - Glob pattern to match against (e.g. "*.ts")
 * @param onPartial - Optional callback invoked with each batch of partial results as they stream in
 * @returns Final list of matching FileMetaData entries
 */
export async function searchDirectory(dirPath: string, pattern: string, onPartial?: (results: FileMetaData[]) => void): Promise<FileMetaData[]> {
    let unlisten: (() => void) | undefined;

    if (onPartial) {
        unlisten = await listen<FileMetaData[]>('search_partial_result', (event) => {
            onPartial(event.payload);
        });
    }

    try {
        return await searchInDir(dirPath, pattern);
    } finally {
        unlisten?.();
    }
}

/**
 * Watch a directory for filesystem changes.
 * Returns an unlisten function — call it to stop watching.
 *
 * @param onEvent - Callback invoked with `{ path, event }` on each change
 */
export async function watchDirectory(onEvent: (payload: { path: string; event: string }) => void): Promise<() => void> {
    return listen<{ path: string; event: string }>('changes', (event) => {
        onEvent(event.payload);
    });
}
