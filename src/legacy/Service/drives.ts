import { getDrives, type DriveInformation, type Drives } from '@/services/tauri-bridge';

export type { DriveInformation, Drives };

/**
 * Return information about all mounted drives and disks on the system.
 *
 * Each entry includes:
 *  - `name`              — OS-assigned disk label
 *  - `mount_point`       — Where the drive is mounted (e.g. `/`, `/home`, `C:\`)
 *  - `total_space`       — Total capacity in bytes
 *  - `available_space`   — Free space in bytes
 *  - `is_removable`      — Whether this is a removable/external drive
 *  - `disk_type`         — `"SSD"`, `"HDD"`, or `"Removable Disk"`
 *  - `file_system`       — Filesystem type (e.g. `"ext4"`, `"ntfs"`, `"apfs"`)
 */
export async function listDrives(): Promise<DriveInformation[]> {
    const result = await getDrives();
    return result.array_of_drives;
}

/**
 * Return the root drive (the one mounted at `/` on Linux/macOS or the first
 * drive on Windows). Useful as a default starting location.
 */
export async function getRootDrive(): Promise<DriveInformation | undefined> {
    const drives = await listDrives();
    return drives.find((d) => d.mount_point === '/' || d.mount_point === 'C:\\') ?? drives[0];
}

/**
 * Return only removable / external drives (USB sticks, SD cards, etc.).
 */
export async function getRemovableDrives(): Promise<DriveInformation[]> {
    const drives = await listDrives();
    return drives.filter((d) => d.is_removable);
}

/**
 * Calculate the used space (in bytes) for a given drive.
 *
 * @param drive - A DriveInformation entry returned by `listDrives`
 */
export function usedSpace(drive: DriveInformation): number {
    return drive.total_space - drive.available_space;
}

/**
 * Calculate the used-space percentage (0–100) for a given drive.
 *
 * @param drive - A DriveInformation entry returned by `listDrives`
 */
export function usedSpacePercent(drive: DriveInformation): number {
    if (drive.total_space === 0) return 0;
    return Math.round((usedSpace(drive) / drive.total_space) * 100);
}
