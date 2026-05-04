import {
    getTrashedItems,
    restoreFiles,
    restoreTrash,
    purgeTrashes,
    type TrashMetaData,
    type TrashInformation,
    type ReturnInformation,
} from '@/services/tauri-bridge';

export type { TrashMetaData, TrashInformation, ReturnInformation };

/**
 * Return all items currently sitting in the system trash.
 *
 * Each entry includes the original parent path, the time it was deleted,
 * and standard file metadata (size, type, hidden flag, etc.).
 */
export async function listTrash(): Promise<TrashMetaData[]> {
    const result = await getTrashedItems();
    return result.files;
}

/**
 * Restore a list of trashed files back to their original locations.
 *
 * @param srcList - Absolute paths of the trashed items to restore
 */
export async function restoreTrashedFiles(srcList: string[]): Promise<ReturnInformation> {
    return restoreFiles(srcList);
}

/**
 * Restore a single trashed item to a specific destination path.
 * Use this when you want to restore to a different location than the original.
 *
 * @param src  - Absolute path of the trashed item
 * @param dest - Absolute destination path to restore to
 */
export async function restoreSingleItem(src: string, dest: string): Promise<ReturnInformation> {
    return restoreTrash(src, dest);
}

/**
 * Permanently delete all items in the system trash.
 * This action is irreversible.
 */
export async function emptyTrash(): Promise<void> {
    return purgeTrashes();
}

/**
 * Calculate the total size (in bytes) of all items currently in the trash.
 *
 * @param items - Array of TrashMetaData entries returned by `listTrash`
 */
export function trashTotalSize(items: TrashMetaData[]): number {
    return items.reduce((acc, item) => acc + item.size, 0);
}

/**
 * Filter trashed items by their original parent directory.
 *
 * @param items     - Array of TrashMetaData entries returned by `listTrash`
 * @param parentDir - Absolute path of the original parent directory to filter by
 */
export function filterByOriginalParent(items: TrashMetaData[], parentDir: string): TrashMetaData[] {
    return items.filter((item) => item.original_parent === parentDir);
}

/**
 * Sort trashed items by the time they were deleted, newest first.
 *
 * @param items - Array of TrashMetaData entries returned by `listTrash`
 */
export function sortByDeletedAt(items: TrashMetaData[]): TrashMetaData[] {
    return [...items].sort((a, b) => new Date(b.time_deleted).getTime() - new Date(a.time_deleted).getTime());
}
