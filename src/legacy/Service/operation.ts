import { listen, emit, type UnlistenFn } from '@tauri-apps/api/event';

import {
    copy,
    rename,
    removeFile,
    removeDir,
    deleteFile,
    compressToZip,
    decompressFromZip,
    calculateFilesTotalSize,
    type ReturnInformation,
} from '@/services/tauri-bridge';

// ─── Types ────────────────────────────────────────────────────────────────────

export type OperationType = 'copy' | 'move' | 'delete' | 'trash' | 'rename' | 'zip' | 'unzip';
export type OperationStatus = 'pending' | 'running' | 'done' | 'failed' | 'cancelled';

export interface FileOperation {
    id: string;
    type: OperationType;
    /** Source paths (multiple for batch ops) */
    sources: string[];
    /** Destination path (for copy / move / rename / unzip) */
    destination?: string;
    status: OperationStatus;
    /** Progress 0–100, or null if unknown */
    progress: number | null;
    /** Total bytes involved, if known */
    totalBytes: number | null;
    /** Human-readable error message on failure */
    error: string | null;
    createdAt: string;
    completedAt: string | null;
}

export type OperationEventHandler = (op: FileOperation) => void;

// ─── Internal state ───────────────────────────────────────────────────────────

const _queue = new Map<string, FileOperation>();
const _handlers = new Set<OperationEventHandler>();

let _opCounter = 0;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeId(): string {
    return `op-${Date.now()}-${++_opCounter}`;
}

function createOp(type: OperationType, sources: string[], destination?: string): FileOperation {
    return {
        id: makeId(),
        type,
        sources,
        destination,
        status: 'pending',
        progress: null,
        totalBytes: null,
        error: null,
        createdAt: new Date().toISOString(),
        completedAt: null,
    };
}

function update(op: FileOperation, patch: Partial<FileOperation>): FileOperation {
    const next = { ...op, ...patch };
    _queue.set(next.id, next);
    _handlers.forEach((h) => h(next));
    return next;
}

function finish(op: FileOperation, error?: string): FileOperation {
    return update(op, {
        status: error ? 'failed' : 'done',
        error: error ?? null,
        progress: error ? op.progress : 100,
        completedAt: new Date().toISOString(),
    });
}

// ─── Observer ────────────────────────────────────────────────────────────────

/**
 * Subscribe to operation lifecycle events (pending → running → done / failed).
 * The handler is called every time any operation changes state.
 *
 * @param handler - Called with the updated `FileOperation` on each state change
 * @returns An unsubscribe function
 *
 * @example
 * const stop = onOperationUpdate((op) => console.log(op.status));
 * // …later…
 * stop();
 */
export function onOperationUpdate(handler: OperationEventHandler): () => void {
    _handlers.add(handler);
    return () => _handlers.delete(handler);
}

/**
 * Return a snapshot of all operations (past and present) indexed by their ID.
 */
export function getQueue(): ReadonlyMap<string, FileOperation> {
    return _queue;
}

/**
 * Return only the operations currently in a given status.
 */
export function getByStatus(status: OperationStatus): FileOperation[] {
    return [..._queue.values()].filter((op) => op.status === status);
}

/**
 * Clear completed and failed operations from the in-memory queue.
 */
export function clearFinished(): void {
    for (const [id, op] of _queue) {
        if (op.status === 'done' || op.status === 'failed' || op.status === 'cancelled') {
            _queue.delete(id);
        }
    }
}

// ─── Copy ─────────────────────────────────────────────────────────────────────

/**
 * Copy one or more source paths into a destination directory.
 *
 * When multiple sources are given they are copied sequentially; progress is
 * reported as a percentage of items completed.
 *
 * @param sources     - Absolute paths of files / directories to copy
 * @param destination - Absolute path of the destination directory
 * @param overwrite   - If `true`, overwrite existing files at the destination
 * @returns The completed (or failed) `FileOperation`
 */
export async function copyFiles(sources: string[], destination: string, overwrite = false): Promise<FileOperation> {
    const op = createOp('copy', sources, destination);
    _queue.set(op.id, op);
    update(op, { status: 'running', totalBytes: await safeTotalSize(sources) });

    const errors: string[] = [];

    for (let i = 0; i < sources.length; i++) {
        const src = sources[i]!;
        const basename = src.replace(/\\/g, '/').split('/').pop() ?? src;
        const dest = `${destination}/${basename}`;

        try {
            const result: ReturnInformation = await copy(src, dest, overwrite);
            if (!result.status) {
                errors.push(result.message);
            }
        } catch (err) {
            errors.push(String(err));
        }

        update(op, { progress: Math.round(((i + 1) / sources.length) * 100) });
    }

    return finish(op, errors.length ? errors.join('; ') : undefined);
}

// ─── Move ─────────────────────────────────────────────────────────────────────

/**
 * Move one or more source paths into a destination directory (copy + delete).
 *
 * @param sources     - Absolute paths of files / directories to move
 * @param destination - Absolute path of the destination directory
 * @returns The completed (or failed) `FileOperation`
 */
export async function moveFiles(sources: string[], destination: string): Promise<FileOperation> {
    const op = createOp('move', sources, destination);
    _queue.set(op.id, op);
    update(op, { status: 'running', totalBytes: await safeTotalSize(sources) });

    const errors: string[] = [];

    for (let i = 0; i < sources.length; i++) {
        const src = sources[i]!;
        const basename = src.replace(/\\/g, '/').split('/').pop() ?? src;
        const dest = `${destination}/${basename}`;

        try {
            const result: ReturnInformation = await rename(src, dest);
            if (!result.status) {
                errors.push(result.message);
            }
        } catch (err) {
            errors.push(String(err));
        }

        update(op, { progress: Math.round(((i + 1) / sources.length) * 100) });
    }

    return finish(op, errors.length ? errors.join('; ') : undefined);
}

// ─── Rename ───────────────────────────────────────────────────────────────────

/**
 * Rename a single file or directory.
 *
 * @param oldPath - Absolute path of the item to rename
 * @param newPath - Absolute path with the new name (must be in the same directory)
 * @returns The completed (or failed) `FileOperation`
 */
export async function renameFile(oldPath: string, newPath: string): Promise<FileOperation> {
    const op = createOp('rename', [oldPath], newPath);
    _queue.set(op.id, op);
    update(op, { status: 'running' });

    try {
        const result: ReturnInformation = await rename(oldPath, newPath);
        if (!result.status) {
            return finish(op, result.message);
        }
    } catch (err) {
        return finish(op, String(err));
    }

    return finish(op);
}

// ─── Delete (permanent) ───────────────────────────────────────────────────────

/**
 * Permanently delete one or more files and/or directories from disk.
 *
 * ⚠️  This bypasses the system trash — items cannot be recovered.
 * For recoverable deletions use `trashFiles` instead.
 *
 * @param paths - Absolute paths of items to permanently delete
 * @returns The completed (or failed) `FileOperation`
 */
export async function permanentlyDelete(paths: string[]): Promise<FileOperation> {
    const op = createOp('delete', paths);
    _queue.set(op.id, op);
    update(op, { status: 'running' });

    const errors: string[] = [];

    for (let i = 0; i < paths.length; i++) {
        const p = paths[i]!;
        try {
            // Try as file first; fall back to directory
            try {
                await removeFile(p);
            } catch {
                await removeDir(p);
            }
        } catch (err) {
            errors.push(`${p}: ${String(err)}`);
        }

        update(op, { progress: Math.round(((i + 1) / paths.length) * 100) });
    }

    return finish(op, errors.length ? errors.join('; ') : undefined);
}

// ─── Trash ────────────────────────────────────────────────────────────────────

/**
 * Move one or more files / directories to the system trash.
 *
 * Items can be recovered from the Trash section of the file manager.
 *
 * @param paths - Absolute paths of items to trash
 * @returns The completed (or failed) `FileOperation`
 */
export async function trashFiles(paths: string[]): Promise<FileOperation> {
    const op = createOp('trash', paths);
    _queue.set(op.id, op);
    update(op, { status: 'running' });

    const errors: string[] = [];

    for (let i = 0; i < paths.length; i++) {
        const p = paths[i]!;
        try {
            await deleteFile(p);
        } catch (err) {
            errors.push(`${p}: ${String(err)}`);
        }

        update(op, { progress: Math.round(((i + 1) / paths.length) * 100) });
    }

    return finish(op, errors.length ? errors.join('; ') : undefined);
}

// ─── Zip / Unzip ─────────────────────────────────────────────────────────────

/**
 * Compress a list of files / directories into a zip archive.
 *
 * The archive is created alongside the first item in `sources` with a `.zip`
 * extension appended.
 *
 * @param sources - Absolute paths of items to compress
 * @returns The completed (or failed) `FileOperation`
 */
export async function zipFiles(sources: string[]): Promise<FileOperation> {
    const op = createOp('zip', sources);
    _queue.set(op.id, op);
    update(op, { status: 'running', totalBytes: await safeTotalSize(sources) });

    try {
        await compressToZip(sources);
    } catch (err) {
        return finish(op, String(err));
    }

    return finish(op);
}

/**
 * Extract a zip archive into a target directory.
 *
 * @param zipPath   - Absolute path of the `.zip` file
 * @param targetDir - Absolute path of the directory to extract into
 * @returns The completed (or failed) `FileOperation`
 */
export async function unzipFile(zipPath: string, targetDir: string): Promise<FileOperation> {
    const op = createOp('unzip', [zipPath], targetDir);
    _queue.set(op.id, op);
    update(op, { status: 'running' });

    try {
        await decompressFromZip(zipPath, targetDir);
    } catch (err) {
        return finish(op, String(err));
    }

    return finish(op);
}

// ─── Tauri event bridge ───────────────────────────────────────────────────────

/**
 * Listen for `operation_progress` events emitted by the Tauri backend.
 *
 * The backend can emit these during long-running operations to report incremental
 * progress. The payload is expected to be `{ id: string; progress: number }`.
 *
 * Returns an unlisten function — call it when the app is shutting down.
 */
export async function startOperationProgressListener(): Promise<UnlistenFn> {
    return listen<{ id: string; progress: number }>('operation_progress', (event) => {
        const { id, progress } = event.payload;
        const op = _queue.get(id);
        if (op) {
            update(op, { progress });
        }
    });
}

/**
 * Emit a request to the backend to cancel an in-progress operation.
 * The backend must honour `cancel_operation` events for this to have effect.
 *
 * @param operationId - The `id` of the `FileOperation` to cancel
 */
export async function cancelOperation(operationId: string): Promise<void> {
    const op = _queue.get(operationId);
    if (!op || op.status !== 'running') return;

    update(op, { status: 'cancelled', completedAt: new Date().toISOString() });
    await emit('cancel_operation', { id: operationId });
}

// ─── Internal utils ───────────────────────────────────────────────────────────

async function safeTotalSize(paths: string[]): Promise<number | null> {
    try {
        return await calculateFilesTotalSize(paths);
    } catch {
        return null;
    }
}
