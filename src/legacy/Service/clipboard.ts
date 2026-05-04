import { writeText, readText } from '@tauri-apps/plugin-clipboard-manager';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ClipboardOperation = 'copy' | 'cut';

export interface ClipboardEntry {
    paths: string[];
    operation: ClipboardOperation;
}

// ─── Internal state ───────────────────────────────────────────────────────────

let _internalClipboard: ClipboardEntry | null = null;

// ─── Text clipboard ───────────────────────────────────────────────────────────

/**
 * Write a plain-text string to the system clipboard.
 *
 * @param text - The string to copy to the clipboard
 */
export async function writeClipboardText(text: string): Promise<void> {
    return writeText(text);
}

/**
 * Read the current plain-text content from the system clipboard.
 * Returns `null` if the clipboard is empty or contains non-text data.
 */
export async function readClipboardText(): Promise<string | null> {
    try {
        return await readText();
    } catch {
        return null;
    }
}

// ─── File clipboard (copy / cut) ──────────────────────────────────────────────

/**
 * Stage a list of file/directory paths as a "copy" operation.
 * The paths are held in memory and written to the system clipboard as a
 * newline-separated list so other applications can also read them.
 *
 * @param paths - Absolute paths of the files/directories to copy
 */
export async function copyPaths(paths: string[]): Promise<void> {
    _internalClipboard = { paths, operation: 'copy' };
    await writeText(paths.join('\n'));
}

/**
 * Stage a list of file/directory paths as a "cut" operation.
 * The paths are held in memory until they are pasted or the clipboard is cleared.
 *
 * @param paths - Absolute paths of the files/directories to move
 */
export async function cutPaths(paths: string[]): Promise<void> {
    _internalClipboard = { paths, operation: 'cut' };
    await writeText(paths.join('\n'));
}

/**
 * Return the currently staged file clipboard entry, or `null` if nothing
 * has been copied/cut in this session.
 *
 * The entry contains:
 *  - `paths`     — The list of staged file/directory paths
 *  - `operation` — Either `"copy"` or `"cut"`
 */
export function getClipboard(): ClipboardEntry | null {
    return _internalClipboard;
}

/**
 * Check whether there are any file paths currently staged in the clipboard.
 */
export function hasClipboard(): boolean {
    return _internalClipboard !== null && _internalClipboard.paths.length > 0;
}

/**
 * Check whether the current clipboard operation is a "cut" (move).
 */
export function isCutOperation(): boolean {
    return _internalClipboard?.operation === 'cut';
}

/**
 * Check whether the current clipboard operation is a "copy".
 */
export function isCopyOperation(): boolean {
    return _internalClipboard?.operation === 'copy';
}

/**
 * Clear the in-memory file clipboard and optionally the system clipboard text.
 *
 * @param clearSystem - If `true` (default), also clears the system clipboard text
 */
export async function clearClipboard(clearSystem = true): Promise<void> {
    _internalClipboard = null;
    if (clearSystem) {
        await writeText('');
    }
}

/**
 * Consume the clipboard entry — return it and clear the cut-staged paths if the
 * operation was "cut". After a paste the cut buffer should be invalidated so a
 * second paste does not move the files again.
 *
 * For "copy" operations the clipboard is left intact so the user can paste
 * multiple times.
 *
 * @returns The clipboard entry at the time of the call, or `null` if empty
 */
export function consumeClipboard(): ClipboardEntry | null {
    const entry = _internalClipboard;
    if (entry?.operation === 'cut') {
        _internalClipboard = null;
    }
    return entry;
}
