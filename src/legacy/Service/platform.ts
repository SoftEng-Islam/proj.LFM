import { platform, arch, version, type, family } from '@tauri-apps/plugin-os';

// ─── Types ────────────────────────────────────────────────────────────────────

export type PlatformName = 'linux' | 'macos' | 'windows' | 'ios' | 'android' | 'unknown';
export type ArchName = 'x86' | 'x86_64' | 'arm' | 'aarch64' | 'unknown';
export type OsFamily = 'unix' | 'windows' | 'unknown';

export interface PlatformInfo {
    platform: PlatformName;
    arch: ArchName;
    version: string;
    type: string;
    family: OsFamily;
    isLinux: boolean;
    isMacOS: boolean;
    isWindows: boolean;
}

// ─── Cache ────────────────────────────────────────────────────────────────────

let _cache: PlatformInfo | null = null;

// ─── Core ─────────────────────────────────────────────────────────────────────

/**
 * Return full platform information for the current OS.
 * Results are cached after the first call so subsequent calls are synchronous-fast.
 *
 * @example
 * const info = await getPlatformInfo();
 * if (info.isLinux) { ... }
 */
export async function getPlatformInfo(): Promise<PlatformInfo> {
    if (_cache) return _cache;

    const [p, a, v, t, f] = await Promise.all([platform(), arch(), version(), type(), family()]);

    _cache = {
        platform: p as PlatformName,
        arch: a as ArchName,
        version: v,
        type: t,
        family: f as OsFamily,
        isLinux: p === 'linux',
        isMacOS: p === 'macos',
        isWindows: p === 'windows',
    };

    return _cache;
}

// ─── Convenience helpers ──────────────────────────────────────────────────────

/**
 * Returns `true` when running on Linux.
 */
export async function isLinux(): Promise<boolean> {
    return (await getPlatformInfo()).isLinux;
}

/**
 * Returns `true` when running on macOS.
 */
export async function isMacOS(): Promise<boolean> {
    return (await getPlatformInfo()).isMacOS;
}

/**
 * Returns `true` when running on Windows.
 */
export async function isWindows(): Promise<boolean> {
    return (await getPlatformInfo()).isWindows;
}

/**
 * Returns `true` when running on any Unix-like OS (Linux or macOS).
 */
export async function isUnix(): Promise<boolean> {
    const info = await getPlatformInfo();
    return info.isLinux || info.isMacOS;
}

/**
 * Return the raw platform string (e.g. `"linux"`, `"macos"`, `"windows"`).
 */
export async function getPlatform(): Promise<PlatformName> {
    return (await getPlatformInfo()).platform;
}

/**
 * Return the CPU architecture string (e.g. `"x86_64"`, `"aarch64"`).
 */
export async function getArch(): Promise<ArchName> {
    return (await getPlatformInfo()).arch;
}

/**
 * Return the OS version string (e.g. `"22.04"` on Ubuntu, `"10.0.19041"` on Windows).
 */
export async function getOsVersion(): Promise<string> {
    return (await getPlatformInfo()).version;
}

/**
 * Return the OS family: `"unix"` for Linux/macOS, `"windows"` for Windows.
 */
export async function getOsFamily(): Promise<OsFamily> {
    return (await getPlatformInfo()).family;
}

/**
 * Return a human-readable OS type string (e.g. `"Linux"`, `"Darwin"`, `"Windows_NT"`).
 */
export async function getOsType(): Promise<string> {
    return (await getPlatformInfo()).type;
}

/**
 * Return the path separator character for the current platform.
 * `/` on Linux/macOS, `\` on Windows.
 */
export async function pathSeparator(): Promise<string> {
    return (await isWindows()) ? '\\' : '/';
}

/**
 * Return the line-ending sequence for the current platform.
 * `\r\n` on Windows, `\n` everywhere else.
 */
export async function lineEnding(): Promise<string> {
    return (await isWindows()) ? '\r\n' : '\n';
}

/**
 * Invalidate the cached platform info. Useful in tests.
 */
export function clearPlatformCache(): void {
    _cache = null;
}
