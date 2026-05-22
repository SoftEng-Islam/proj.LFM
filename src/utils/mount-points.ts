import type { DriveCard } from '@/types/file-manager';

/**
 * Internal Linux mount points that are useful for power users but noisy for
 * the default file-manager view.
 */
const SYSTEM_MOUNT_POINTS = new Set([
	'/boot',
	'/boot/efi',
	'/store',
	'/nix/store',
	'/run',
	'/sys',
	'/proc',
	'/dev',
	'/snap',
]);

export function isSystemMountPoint(mountPoint: string): boolean {
	const mount = mountPoint.toLowerCase();
	return Array.from(SYSTEM_MOUNT_POINTS).some((systemMount) => {
		return mount === systemMount || mount.startsWith(systemMount + '/');
	});
}

export function shouldShowDriveCard(drive: DriveCard, showMountPoints: boolean): boolean {
	if (!showMountPoints && isSystemMountPoint(drive.mountPoint)) return false;
	return drive.filesystem !== 'none';
}
