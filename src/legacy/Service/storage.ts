import { writeData, readData, deleteStorageData, type StorageData } from '@/services/tauri-bridge';

export type { StorageData };

/**
 * Persist a JSON-serialisable value under the given key.
 * Values are stored on disk in the system local-data directory under `Files/<key>`.
 *
 * @param key   - Storage key (used as the filename on disk)
 * @param value - Any JSON-serialisable value
 */
export async function set(key: string, value: unknown): Promise<void> {
    return writeData(key, value);
}

/**
 * Read the value previously stored under the given key.
 *
 * Returns a `StorageData` object:
 *  - `data`   — The parsed JSON value, or `null` if the key does not exist
 *  - `status` — `true` if the key was found and read successfully, `false` otherwise
 *
 * @param key - Storage key to look up
 */
export async function get(key: string): Promise<StorageData> {
    return readData(key);
}

/**
 * Remove a previously stored key from disk.
 * Does nothing if the key does not exist.
 *
 * @param key - Storage key to delete
 */
export async function remove(key: string): Promise<void> {
    return deleteStorageData(key);
}

/**
 * Convenience helper — read a value and return it directly, or fall back to
 * a default if the key is missing or the read failed.
 *
 * @param key          - Storage key to look up
 * @param defaultValue - Value to return when the key is not found
 */
export async function getOrDefault<T>(key: string, defaultValue: T): Promise<T> {
    const result = await get(key);
    if (!result.status || result.data === null || result.data === undefined) {
        return defaultValue;
    }
    return result.data as T;
}

/**
 * Convenience helper — update an existing stored object by merging new fields
 * into it. If the key does not exist yet, the patch is written as a fresh entry.
 *
 * @param key   - Storage key to update
 * @param patch - Partial object whose properties will be merged into the stored value
 */
export async function patch(key: string, patch: Record<string, unknown>): Promise<void> {
    const existing = await get(key);
    const base = existing.status && existing.data && typeof existing.data === 'object' ? (existing.data as Record<string, unknown>) : {};
    return writeData(key, { ...base, ...patch });
}
