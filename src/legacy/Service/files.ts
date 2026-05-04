import {
    openFile,
    rename,
    copy,
    removeFile,
    removeDir,
    deleteFile,
    compressToZip,
    decompressFromZip,
    openInTerminal,
    openInVscode,
    extractIcon,
    type ReturnInformation,
} from '@/services/tauri-bridge';

export type { ReturnInformation };

/**
 * Open a file with the system default application.
 * If the file is a `.xtension`, a confirmation dialog is shown automatically by the backend.
 * Returns `true` if the file was opened successfully.
 */
export async function openWithDefault(filePath: string): Promise<boolean> {
    return openFile(filePath);
}

/**
 * Rename or move a file / directory.
 *
 * @param oldPath - Current absolute path
 * @param newPath - New absolute path (can be a different directory to effectively move)
 */
export async function renameFile(oldPath: string, newPath: string): Promise<ReturnInformation> {
    return rename(oldPath, newPath);
}

/**
 * Copy a file or directory to a new location.
 *
 * @param src       - Source absolute path
 * @param dest      - Destination absolute path
 * @param overwrite - If `true`, overwrite an existing file at the destination
 */
export async function copyFile(src: string, dest: string, overwrite = false): Promise<ReturnInformation> {
    return copy(src, dest, overwrite);
}

/**
 * Permanently delete a file, bypassing the system trash.
 * Prefer `trashFile` for user-initiated deletions.
 */
export async function permanentlyDeleteFile(filePath: string): Promise<void> {
    return removeFile(filePath);
}

/**
 * Permanently delete a directory and all its contents, bypassing the system trash.
 * Prefer `trashFile` for user-initiated deletions.
 */
export async function permanentlyDeleteDir(dirPath: string): Promise<void> {
    return removeDir(dirPath);
}

/**
 * Move a file or directory to the system trash.
 * Use this for user-initiated "Delete" actions — it is reversible.
 */
export async function trashFile(filePath: string): Promise<void> {
    return deleteFile(filePath);
}

/**
 * Compress a list of files and/or directories into a zip archive.
 * The archive is created at `files[0] + ".zip"`.
 *
 * @param files - Absolute paths of files/directories to include
 */
export async function zipFiles(files: string[]): Promise<void> {
    return compressToZip(files);
}

/**
 * Extract a zip archive into a target directory.
 *
 * @param zipPath   - Absolute path to the `.zip` file
 * @param targetDir - Absolute path to the directory to extract into
 */
export async function unzipFile(zipPath: string, targetDir: string): Promise<void> {
    return decompressFromZip(zipPath, targetDir);
}

/**
 * Open a terminal emulator rooted at the given directory.
 * On Linux this opens `gnome-terminal`; on macOS, Terminal.app; on Windows, cmd.
 */
export async function openTerminalAt(folderPath: string): Promise<void> {
    return openInTerminal(folderPath);
}

/**
 * Open a path (file or directory) in Visual Studio Code.
 */
export async function openInCode(path: string): Promise<void> {
    return openInVscode(path);
}

/**
 * Extract the embedded icon from a Windows executable.
 * Returns the local path to the extracted PNG.
 * On Linux / macOS this always rejects — guard with `isTauri` and platform checks.
 */
export async function getExeIcon(filePath: string): Promise<string> {
    return extractIcon(filePath);
}
