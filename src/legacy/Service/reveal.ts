import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';

import { fileExist, isDir, getFileMetaData, type FileMetaData } from '@/services/tauri-bridge';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RevealTarget {
    /** Absolute path of the file or directory to reveal */
    path: string;
    /** The parent directory that should be opened */
    parentDir: string;
    /** The basename of the item to highlight inside that directory */
    basename: string;
    /** Whether the target is a directory itself */
    isDirectory: boolean;
    /** Full file metadata, if available */
    meta: FileMetaData | null;
}

// ─── Internal state ───────────────────────────────────────────────────────────

/** Listeners registered via `onReveal` — notified when a reveal is requested */
const _handlers = new Set<(target: RevealTarget) => void>();

/** The most recent reveal target (used by late-joining components) */
let _pending: RevealTarget | null = null;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Derive a `RevealTarget` from an absolute file path.
 * Returns `null` if the path does not exist on disk.
 *
 * @param path - Absolute path to the file or directory to reveal
 */
export async function buildRevealTarget(path: string): Promise<RevealTarget | null> {
    const exists = await fileExist(path);
    if (!exists) return null;

    const directory = await isDir(path);

    // Split into parent + basename
    const normalised = path.replace(/\\/g, '/');
    const lastSlash = normalised.lastIndexOf('/');
    const parentDir = lastSlash > 0 ? normalised.slice(0, lastSlash) : '/';
    const basename = normalised.slice(lastSlash + 1);

    let meta: FileMetaData | null = null;
    try {
        meta = await getFileMetaData(path);
    } catch {
        // non-fatal — proceed without metadata
    }

    return {
        path,
        parentDir,
        basename,
        isDirectory: directory,
        meta,
    };
}

// ─── Reveal ───────────────────────────────────────────────────────────────────

/**
 * Reveal a file or directory in the file manager.
 *
 * This resolves the path into a `RevealTarget` and then notifies all registered
 * `onReveal` handlers so UI components (e.g. the sidebar and file grid) can:
 *   1. Navigate to the parent directory
 *   2. Scroll to and highlight the target item
 *
 * @param path - Absolute path of the file or directory to reveal
 * @returns `true` if the path exists and handlers were notified, `false` otherwise
 */
export async function revealPath(path: string): Promise<boolean> {
    const target = await buildRevealTarget(path);
    if (!target) return false;

    _pending = target;
    _handlers.forEach((handler) => handler(target));
    return true;
}

/**
 * Reveal a file in its containing directory.
 * Equivalent to "Show in folder" on most OSes.
 *
 * If the given path IS a directory, the directory itself is opened and selected.
 *
 * @param filePath - Absolute path of the file to reveal
 */
export async function showInFolder(filePath: string): Promise<boolean> {
    return revealPath(filePath);
}

// ─── Listener Registration ────────────────────────────────────────────────────

/**
 * Register a handler that is called whenever `revealPath` is invoked.
 *
 * If a reveal was already requested before this handler was registered,
 * the handler is immediately called with the pending target so late-joining
 * components (e.g. lazy-mounted panels) don't miss it.
 *
 * @param handler - Function called with the `RevealTarget` on each reveal
 * @returns An unlisten function — call it to remove the handler
 *
 * @example
 * const stop = onReveal((target) => {
 *     navigateTo(target.parentDir);
 *     highlightItem(target.basename);
 * });
 * // Later, when the component unmounts:
 * stop();
 */
export function onReveal(handler: (target: RevealTarget) => void): () => void {
    _handlers.add(handler);

    // Replay the most recent pending reveal for late-joining handlers
    if (_pending) {
        handler(_pending);
    }

    return () => {
        _handlers.delete(handler);
    };
}

/**
 * Clear the pending reveal target.
 * Call this after the UI has finished handling a reveal so it is not
 * replayed to future handlers.
 */
export function clearPendingReveal(): void {
    _pending = null;
}

/**
 * Return the most recent reveal target that has not yet been cleared,
 * or `null` if there is no pending reveal.
 */
export function getPendingReveal(): RevealTarget | null {
    return _pending;
}

// ─── Tauri event bridge ───────────────────────────────────────────────────────

/**
 * Start listening for `reveal_path` events emitted by the Tauri backend.
 *
 * The backend emits this event when the app is launched with the `--reveal`
 * CLI flag or when another process requests a reveal via IPC.
 *
 * Returns an unlisten function — call it when the app is shutting down.
 *
 * @example
 * // In main.ts
 * const stopRevealListener = await startRevealListener();
 */
export async function startRevealListener(): Promise<UnlistenFn> {
    return listen<string>('reveal_path', async (event) => {
        const path = event.payload;
        if (path) {
            await revealPath(path);
        }
    });
}

/**
 * Programmatically emit a `reveal_path` event on the current window.
 * Useful for triggering a reveal from within the frontend without going through
 * the Rust backend.
 *
 * @param path - Absolute path to reveal
 */
export async function emitRevealPath(path: string): Promise<void> {
    const { emit } = await import('@tauri-apps/api/event');
    await emit('reveal_path', path);
}
