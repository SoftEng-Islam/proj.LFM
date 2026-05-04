import { writeData, readData, type StorageData } from '@/services/tauri-bridge';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FavoriteEntry {
    path: string;
    label: string;
    pinned_at: string;
}

export type FavoriteList = FavoriteEntry[];

// ─── Storage key ─────────────────────────────────────────────────────────────

const STORAGE_KEY = 'favorites';

// ─── Core ─────────────────────────────────────────────────────────────────────

/**
 * Return all currently pinned favourite entries from persistent storage.
 * Returns an empty array if no favourites have been saved yet.
 */
export async function listFavorites(): Promise<FavoriteList> {
    const result: StorageData = await readData(STORAGE_KEY);
    if (!result.status || !Array.isArray(result.data)) {
        return [];
    }
    return result.data as FavoriteList;
}

/**
 * Add a path to the favourites list.
 * If the path is already pinned this is a no-op (deduplication by path).
 *
 * @param path  - Absolute filesystem path to pin
 * @param label - Human-readable display label (defaults to the basename)
 */
export async function addFavorite(path: string, label?: string): Promise<void> {
    const current = await listFavorites();
    const alreadyPinned = current.some((entry) => entry.path === path);
    if (alreadyPinned) return;

    const displayLabel = label ?? path.split('/').filter(Boolean).pop() ?? path;
    const entry: FavoriteEntry = {
        path,
        label: displayLabel,
        pinned_at: new Date().toISOString(),
    };

    await writeData(STORAGE_KEY, [...current, entry]);
}

/**
 * Remove a path from the favourites list.
 * Does nothing if the path is not currently pinned.
 *
 * @param path - Absolute filesystem path to unpin
 */
export async function removeFavorite(path: string): Promise<void> {
    const current = await listFavorites();
    const updated = current.filter((entry) => entry.path !== path);
    if (updated.length === current.length) return; // nothing changed
    await writeData(STORAGE_KEY, updated);
}

/**
 * Toggle the pinned state of a path.
 * Adds it if not present; removes it if already pinned.
 *
 * @param path  - Absolute filesystem path to toggle
 * @param label - Display label used when adding (ignored on removal)
 */
export async function toggleFavorite(path: string, label?: string): Promise<void> {
    const current = await listFavorites();
    const isPinned = current.some((entry) => entry.path === path);
    if (isPinned) {
        await removeFavorite(path);
    } else {
        await addFavorite(path, label);
    }
}

/**
 * Check whether a given path is currently in the favourites list.
 *
 * @param path - Absolute filesystem path to check
 */
export async function isFavorite(path: string): Promise<boolean> {
    const current = await listFavorites();
    return current.some((entry) => entry.path === path);
}

/**
 * Rename the display label for a pinned favourite.
 * Does nothing if the path is not currently pinned.
 *
 * @param path     - Absolute filesystem path of the entry to rename
 * @param newLabel - New display label
 */
export async function renameFavorite(path: string, newLabel: string): Promise<void> {
    const current = await listFavorites();
    const updated = current.map((entry) => (entry.path === path ? { ...entry, label: newLabel } : entry));
    await writeData(STORAGE_KEY, updated);
}

/**
 * Reorder the favourites list by supplying the paths in the desired order.
 * Paths not present in the current list are ignored; any existing paths not
 * included in `orderedPaths` are appended at the end unchanged.
 *
 * @param orderedPaths - Paths in the desired display order
 */
export async function reorderFavorites(orderedPaths: string[]): Promise<void> {
    const current = await listFavorites();
    const byPath = new Map(current.map((e) => [e.path, e]));

    const reordered: FavoriteEntry[] = [];

    for (const path of orderedPaths) {
        const entry = byPath.get(path);
        if (entry) {
            reordered.push(entry);
            byPath.delete(path);
        }
    }

    // Append any entries that were not included in orderedPaths
    for (const remaining of byPath.values()) {
        reordered.push(remaining);
    }

    await writeData(STORAGE_KEY, reordered);
}

/**
 * Remove all favourites from persistent storage.
 */
export async function clearFavorites(): Promise<void> {
    await writeData(STORAGE_KEY, []);
}

/**
 * Return only the favourite paths as a plain string array.
 * Convenience wrapper around `listFavorites`.
 */
export async function getFavoritePaths(): Promise<string[]> {
    const entries = await listFavorites();
    return entries.map((e) => e.path);
}
